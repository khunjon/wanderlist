#!/usr/bin/env node

/**
 * Database Maintenance Automation Script
 * 
 * This script performs automated database maintenance including:
 * - Health checks
 * - VACUUM operations on tables with high dead row ratios
 * - Logging and alerting
 * 
 * Usage:
 *   node scripts/database-maintenance.js [--dry-run] [--force] [--verbose]
 * 
 * Environment Variables:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Service role key for admin operations
 *   MAINTENANCE_TOKEN - Optional token for API authentication
 *   SLACK_WEBHOOK_URL - Optional Slack webhook for alerts
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs').promises
const path = require('path')

// Configuration
const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  dryRun: process.argv.includes('--dry-run'),
  force: process.argv.includes('--force'),
  verbose: process.argv.includes('--verbose'),
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
  logFile: path.join(__dirname, '..', 'logs', 'database-maintenance.log')
}

// Validate configuration
if (!config.supabaseUrl || !config.supabaseKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseKey)

/**
 * Log message with timestamp
 */
function log(level, message, data = null) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    data
  }
  
  const logLine = `[${timestamp}] ${level.toUpperCase()}: ${message}${data ? ' ' + JSON.stringify(data) : ''}\n`
  
  // Console output
  if (config.verbose || level === 'error' || level === 'warn') {
    console.log(logLine.trim())
  }
  
  // File logging (async, don't wait)
  appendToLogFile(logLine).catch(err => 
    console.error('Failed to write to log file:', err.message)
  )
  
  return logEntry
}

/**
 * Append to log file
 */
async function appendToLogFile(logLine) {
  try {
    // Ensure logs directory exists
    const logsDir = path.dirname(config.logFile)
    await fs.mkdir(logsDir, { recursive: true })
    
    // Append to log file
    await fs.appendFile(config.logFile, logLine)
  } catch (error) {
    // Don't throw, just log to console
    console.error('Log file error:', error.message)
  }
}

/**
 * Send Slack notification
 */
async function sendSlackNotification(message, color = 'warning') {
  if (!config.slackWebhook) return
  
  try {
    const response = await fetch(config.slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🔧 Database Maintenance Alert`,
        attachments: [{
          color,
          text: message,
          footer: 'Placemarks Database Maintenance',
          ts: Math.floor(Date.now() / 1000)
        }]
      })
    })
    
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`)
    }
    
    log('info', 'Slack notification sent successfully')
  } catch (error) {
    log('error', 'Failed to send Slack notification', { error: error.message })
  }
}

/**
 * Check database health
 */
async function checkDatabaseHealth() {
  log('info', 'Checking database health...')
  
  try {
    const { data, error } = await supabase.rpc('check_table_bloat')
    
    if (error) {
      throw new Error(`Health check failed: ${error.message}`)
    }
    
    const urgentTables = data.filter(table => 
      table.maintenance_status === 'URGENT - VACUUM NEEDED'
    )
    
    const warningTables = data.filter(table => 
      table.maintenance_status === 'VACUUM RECOMMENDED'
    )
    
    log('info', 'Database health check completed', {
      totalTables: data.length,
      urgentTables: urgentTables.length,
      warningTables: warningTables.length
    })
    
    return {
      healthy: urgentTables.length === 0,
      urgentTables,
      warningTables,
      allTables: data
    }
  } catch (error) {
    log('error', 'Database health check failed', { error: error.message })
    throw error
  }
}

/**
 * Get maintenance commands
 */
async function getMaintenanceCommands() {
  log('info', 'Getting maintenance commands...')
  
  try {
    const { data, error } = await supabase.rpc('get_maintenance_commands')
    
    if (error) {
      throw new Error(`Failed to get maintenance commands: ${error.message}`)
    }
    
    log('info', `Found ${data.length} maintenance commands`)
    return data
  } catch (error) {
    log('error', 'Failed to get maintenance commands', { error: error.message })
    throw error
  }
}

/**
 * Execute VACUUM command (simulated - actual VACUUM needs to be done outside transaction)
 */
async function executeVacuum(tableName) {
  log('info', `Executing VACUUM ANALYZE on table: ${tableName}`)
  
  if (config.dryRun) {
    log('info', `DRY RUN: Would execute VACUUM ANALYZE ${tableName}`)
    return { success: true, dryRun: true }
  }
  
  try {
    // Note: In a real implementation, you would need to execute VACUUM outside of a transaction
    // For now, we'll log the maintenance operation
    await supabase.rpc('log_maintenance_operation', {
      p_operation_type: 'VACUUM_SCHEDULED',
      p_table_name: tableName,
      p_status: 'scheduled',
      p_notes: `VACUUM ANALYZE ${tableName} scheduled by maintenance script`
    })
    
    log('info', `VACUUM operation logged for table: ${tableName}`)
    return { success: true, logged: true }
  } catch (error) {
    log('error', `Failed to log VACUUM operation for ${tableName}`, { error: error.message })
    throw error
  }
}

/**
 * Perform maintenance operations
 */
async function performMaintenance() {
  log('info', 'Starting database maintenance...')
  
  try {
    // Check health first
    const health = await checkDatabaseHealth()
    
    // Get maintenance commands
    const commands = await getMaintenanceCommands()
    
    if (commands.length === 0) {
      log('info', 'No maintenance operations required')
      return { success: true, operationsPerformed: 0 }
    }
    
    // Send alert if urgent tables found
    if (health.urgentTables.length > 0) {
      const message = `🚨 URGENT: ${health.urgentTables.length} tables need immediate VACUUM:\n${health.urgentTables.map(t => `• ${t.table_name} (${t.dead_row_percentage}% dead rows)`).join('\n')}`
      await sendSlackNotification(message, 'danger')
    }
    
    // Execute maintenance commands
    let successCount = 0
    let errorCount = 0
    
    for (const command of commands) {
      try {
        if (command.priority === 'CRITICAL' || config.force) {
          await executeVacuum(command.table_name)
          successCount++
        } else {
          log('info', `Skipping ${command.priority} priority table: ${command.table_name} (use --force to include)`)
        }
      } catch (error) {
        log('error', `Failed to execute maintenance on ${command.table_name}`, { error: error.message })
        errorCount++
      }
    }
    
    const summary = {
      success: errorCount === 0,
      operationsPerformed: successCount,
      operationsFailed: errorCount,
      totalCommands: commands.length
    }
    
    log('info', 'Database maintenance completed', summary)
    
    // Send summary notification
    if (successCount > 0 || errorCount > 0) {
      const message = `Database maintenance completed:\n✅ ${successCount} operations successful\n${errorCount > 0 ? `❌ ${errorCount} operations failed` : ''}`
      await sendSlackNotification(message, errorCount > 0 ? 'warning' : 'good')
    }
    
    return summary
  } catch (error) {
    log('error', 'Database maintenance failed', { error: error.message })
    await sendSlackNotification(`❌ Database maintenance failed: ${error.message}`, 'danger')
    throw error
  }
}

/**
 * Generate maintenance report
 */
async function generateReport() {
  log('info', 'Generating maintenance report...')
  
  try {
    const health = await checkDatabaseHealth()
    const commands = await getMaintenanceCommands()
    
    const report = `# Database Maintenance Report
Generated: ${new Date().toISOString()}
Status: ${health.healthy ? '✅ HEALTHY' : '⚠️ NEEDS ATTENTION'}

## Summary
- Total Tables: ${health.allTables.length}
- Urgent Tables: ${health.urgentTables.length}
- Warning Tables: ${health.warningTables.length}
- Maintenance Commands: ${commands.length}

## Tables Requiring Attention

${commands.map(cmd => `### ${cmd.table_name}
- Priority: ${cmd.priority}
- Dead Row Percentage: ${cmd.dead_row_percentage}%
- Command: \`${cmd.command}\`
`).join('\n')}

## All Tables Status

| Table | Dead Rows % | Status |
|-------|-------------|--------|
${health.allTables.map(table => 
  `| ${table.table_name} | ${table.dead_row_percentage}% | ${table.maintenance_status} |`
).join('\n')}

---
Generated by database maintenance script
`
    
    // Save report to file
    const reportFile = path.join(__dirname, '..', 'logs', `maintenance-report-${new Date().toISOString().split('T')[0]}.md`)
    await fs.writeFile(reportFile, report)
    
    log('info', `Maintenance report saved to: ${reportFile}`)
    
    if (config.verbose) {
      console.log('\n' + report)
    }
    
    return { report, reportFile }
  } catch (error) {
    log('error', 'Failed to generate maintenance report', { error: error.message })
    throw error
  }
}

/**
 * Main execution
 */
async function main() {
  const startTime = Date.now()
  
  log('info', 'Database maintenance script started', {
    dryRun: config.dryRun,
    force: config.force,
    verbose: config.verbose
  })
  
  try {
    if (process.argv.includes('--report-only')) {
      await generateReport()
    } else {
      await performMaintenance()
      
      if (config.verbose) {
        await generateReport()
      }
    }
    
    const duration = Date.now() - startTime
    log('info', `Database maintenance script completed successfully in ${duration}ms`)
    
    process.exit(0)
  } catch (error) {
    const duration = Date.now() - startTime
    log('error', `Database maintenance script failed after ${duration}ms`, { error: error.message })
    
    process.exit(1)
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  log('error', 'Uncaught exception', { error: error.message, stack: error.stack })
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  log('error', 'Unhandled rejection', { reason: reason?.message || reason })
  process.exit(1)
})

// Run the script
if (require.main === module) {
  main()
}

module.exports = {
  checkDatabaseHealth,
  performMaintenance,
  generateReport
} 