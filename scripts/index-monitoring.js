#!/usr/bin/env node

/**
 * Index Monitoring Script
 * 
 * Monitors database index usage, identifies unused indexes, suggests optimizations,
 * and provides alerts for index performance issues.
 * 
 * Usage:
 *   node scripts/index-monitoring.js [options]
 * 
 * Options:
 *   --report-only    Generate report without taking any actions
 *   --snapshot       Record index usage snapshot
 *   --cleanup        Drop unused indexes (requires --force)
 *   --force          Force execution of potentially destructive operations
 *   --verbose        Enable verbose logging
 *   --output <file>  Save report to file
 *   --format <type>  Output format: json, markdown, csv (default: markdown)
 * 
 * Environment Variables:
 *   SUPABASE_URL              - Supabase project URL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase service role key
 *   SLACK_WEBHOOK_URL         - Slack webhook for alerts (optional)
 *   LOG_LEVEL                 - Logging level (debug, info, warn, error)
 */

const fs = require('fs').promises
const path = require('path')

// Configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Thresholds for alerts
  thresholds: {
    unusedIndexCount: 10,        // Alert if more than 10 unused indexes
    wastedSpaceMB: 50,           // Alert if more than 50MB wasted space
    efficiencyThreshold: 50,     // Alert if overall efficiency < 50%
    highPriorityIssues: 5        // Alert if more than 5 high-priority issues
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
  reportOnly: args.includes('--report-only'),
  snapshot: args.includes('--snapshot'),
  cleanup: args.includes('--cleanup'),
  force: args.includes('--force'),
  verbose: args.includes('--verbose'),
  output: getArgValue('--output'),
  format: getArgValue('--format') || 'markdown'
}

function getArgValue(arg) {
  const index = args.indexOf(arg)
  return index !== -1 && index + 1 < args.length ? args[index + 1] : null
}

// Logging utility
const logger = {
  debug: (msg, ...args) => config.logLevel === 'debug' && console.log(`[DEBUG] ${msg}`, ...args),
  info: (msg, ...args) => ['debug', 'info'].includes(config.logLevel) && console.log(`[INFO] ${msg}`, ...args),
  warn: (msg, ...args) => ['debug', 'info', 'warn'].includes(config.logLevel) && console.warn(`[WARN] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  verbose: (msg, ...args) => options.verbose && console.log(`[VERBOSE] ${msg}`, ...args)
}

// Validate environment
function validateEnvironment() {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    logger.error(`Missing required environment variables: ${missing.join(', ')}`)
    logger.error('Please set the required environment variables and try again.')
    process.exit(1)
  }
  
  logger.debug('Environment validation passed')
}

// Supabase client setup
async function createSupabaseClient() {
  try {
    // Dynamic import for ES modules
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    logger.debug('Supabase client created successfully')
    return supabase
  } catch (error) {
    logger.error('Failed to create Supabase client:', error.message)
    throw error
  }
}

// Index monitoring functions
async function analyzeIndexUsage(supabase) {
  logger.verbose('Analyzing index usage patterns...')
  const { data, error } = await supabase.rpc('analyze_index_usage')
  
  if (error) {
    throw new Error(`Failed to analyze index usage: ${error.message}`)
  }
  
  logger.verbose(`Analyzed ${data?.length || 0} indexes`)
  return data || []
}

async function getUnusedIndexes(supabase) {
  logger.verbose('Fetching unused indexes...')
  const { data, error } = await supabase.rpc('get_unused_indexes')
  
  if (error) {
    throw new Error(`Failed to get unused indexes: ${error.message}`)
  }
  
  logger.verbose(`Found ${data?.length || 0} unused indexes`)
  return data || []
}

async function getMissingIndexSuggestions(supabase) {
  logger.verbose('Getting missing index suggestions...')
  const { data, error } = await supabase.rpc('suggest_missing_indexes')
  
  if (error) {
    throw new Error(`Failed to get missing index suggestions: ${error.message}`)
  }
  
  logger.verbose(`Found ${data?.length || 0} missing index suggestions`)
  return data || []
}

async function getIndexSizeSummary(supabase) {
  logger.verbose('Getting index size summary...')
  const { data, error } = await supabase.rpc('get_index_size_summary')
  
  if (error) {
    throw new Error(`Failed to get index size summary: ${error.message}`)
  }
  
  logger.verbose(`Retrieved size summary for ${data?.length || 0} tables`)
  return data || []
}

async function recordIndexSnapshot(supabase) {
  logger.verbose('Recording index usage snapshot...')
  const { data, error } = await supabase.rpc('record_index_usage_snapshot')
  
  if (error) {
    throw new Error(`Failed to record index snapshot: ${error.message}`)
  }
  
  logger.info(`Recorded usage statistics for ${data || 0} indexes`)
  return data || 0
}

// Generate comprehensive monitoring report
async function generateMonitoringReport(supabase) {
  logger.info('Generating comprehensive index monitoring report...')
  
  const [usageAnalysis, unusedIndexes, missingIndexes, sizeSummary] = await Promise.all([
    analyzeIndexUsage(supabase),
    getUnusedIndexes(supabase),
    getMissingIndexSuggestions(supabase),
    getIndexSizeSummary(supabase)
  ])
  
  // Calculate summary statistics
  const totalIndexes = sizeSummary.reduce((sum, table) => sum + table.total_indexes, 0)
  const unusedIndexCount = sizeSummary.reduce((sum, table) => sum + table.unused_indexes, 0)
  const overallEfficiency = totalIndexes > 0 ? Math.round(((totalIndexes - unusedIndexCount) / totalIndexes) * 100) : 100
  
  // Calculate wasted space
  const wastedSpaceBytes = unusedIndexes.reduce((sum, index) => {
    return sum + parseSizeToBytes(index.index_size)
  }, 0)
  
  const highPriorityIssues = usageAnalysis.filter(index => 
    index.priority === 'HIGH' || index.priority === 'CRITICAL'
  )
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total_indexes: totalIndexes,
      unused_indexes: unusedIndexCount,
      overall_efficiency: overallEfficiency,
      wasted_space_mb: Math.round(wastedSpaceBytes / (1024 * 1024) * 100) / 100,
      high_priority_issues: highPriorityIssues.length
    },
    usage_analysis: usageAnalysis,
    unused_indexes: unusedIndexes,
    missing_indexes: missingIndexes,
    size_summary: sizeSummary,
    high_priority_issues: highPriorityIssues,
    recommendations: generateRecommendations(usageAnalysis, unusedIndexes, missingIndexes, sizeSummary)
  }
  
  logger.info('Index monitoring report generated successfully')
  return report
}

// Generate recommendations
function generateRecommendations(usageAnalysis, unusedIndexes, missingIndexes, sizeSummary) {
  const recommendations = []
  
  if (unusedIndexes.length > 0) {
    const highWasteIndexes = unusedIndexes.filter(idx => idx.space_wasted === 'HIGH')
    if (highWasteIndexes.length > 0) {
      recommendations.push({
        type: 'critical',
        message: `Drop ${highWasteIndexes.length} high-waste unused indexes to reclaim significant disk space`,
        action: 'cleanup',
        indexes: highWasteIndexes.map(idx => idx.index_name)
      })
    }
    recommendations.push({
      type: 'warning',
      message: `Consider dropping ${unusedIndexes.length} unused indexes total`,
      action: 'review',
      count: unusedIndexes.length
    })
  }
  
  if (missingIndexes.length > 0) {
    const highPriorityMissing = missingIndexes.filter(idx => idx.priority === 'HIGH')
    if (highPriorityMissing.length > 0) {
      recommendations.push({
        type: 'performance',
        message: `Create ${highPriorityMissing.length} high-priority missing indexes for better performance`,
        action: 'create',
        indexes: highPriorityMissing
      })
    }
  }
  
  const lowEfficiencyTables = sizeSummary.filter(table => table.efficiency_score < 50)
  if (lowEfficiencyTables.length > 0) {
    recommendations.push({
      type: 'optimization',
      message: `Review index strategy for ${lowEfficiencyTables.length} tables with low efficiency scores`,
      action: 'optimize',
      tables: lowEfficiencyTables.map(t => t.table_name)
    })
  }
  
  return recommendations
}

// Check if alerts should be sent
function shouldSendAlert(report) {
  const { summary } = report
  
  return (
    summary.unused_indexes > config.thresholds.unusedIndexCount ||
    summary.wasted_space_mb > config.thresholds.wastedSpaceMB ||
    summary.overall_efficiency < config.thresholds.efficiencyThreshold ||
    summary.high_priority_issues > config.thresholds.highPriorityIssues
  )
}

// Send Slack alert
async function sendSlackAlert(report) {
  if (!config.slackWebhook) {
    logger.warn('Slack webhook not configured, skipping alert')
    return
  }
  
  try {
    const { summary, recommendations } = report
    const criticalRecommendations = recommendations.filter(r => r.type === 'critical')
    
    const message = {
      text: '⚠️ Index Performance Alert',
      attachments: [{
        color: summary.overall_efficiency < 30 ? 'danger' : 'warning',
        title: 'Index Monitoring Report',
        fields: [
          {
            title: 'Overall Efficiency',
            value: `${summary.overall_efficiency}%`,
            short: true
          },
          {
            title: 'Unused Indexes',
            value: summary.unused_indexes.toString(),
            short: true
          },
          {
            title: 'Wasted Space',
            value: `${summary.wasted_space_mb} MB`,
            short: true
          },
          {
            title: 'High Priority Issues',
            value: summary.high_priority_issues.toString(),
            short: true
          }
        ],
        text: criticalRecommendations.length > 0 
          ? `Critical actions needed:\n${criticalRecommendations.map(r => `• ${r.message}`).join('\n')}`
          : 'Review recommendations in the full report'
      }]
    }
    
    const response = await fetch(config.slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })
    
    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status}`)
    }
    
    logger.info('Slack alert sent successfully')
  } catch (error) {
    logger.error('Failed to send Slack alert:', error.message)
  }
}

// Format report for output
function formatReport(report, format) {
  switch (format.toLowerCase()) {
    case 'json':
      return JSON.stringify(report, null, 2)
    
    case 'csv':
      return formatReportAsCSV(report)
    
    case 'markdown':
    default:
      return formatReportAsMarkdown(report)
  }
}

function formatReportAsMarkdown(report) {
  const { summary, usage_analysis, unused_indexes, missing_indexes, recommendations } = report
  
  let markdown = `# Index Monitoring Report

**Generated:** ${report.timestamp}

## Summary

- **Total Indexes:** ${summary.total_indexes}
- **Unused Indexes:** ${summary.unused_indexes}
- **Overall Efficiency:** ${summary.overall_efficiency}%
- **Wasted Space:** ${summary.wasted_space_mb} MB
- **High Priority Issues:** ${summary.high_priority_issues}

## Recommendations

`
  
  recommendations.forEach(rec => {
    const icon = rec.type === 'critical' ? '🚨' : rec.type === 'warning' ? '⚠️' : '💡'
    markdown += `${icon} **${rec.type.toUpperCase()}:** ${rec.message}\n\n`
  })
  
  if (unused_indexes.length > 0) {
    markdown += `## Unused Indexes (${unused_indexes.length})

| Table | Index | Size | Space Wasted | Drop Command |
|-------|-------|------|--------------|--------------|
`
    unused_indexes.forEach(index => {
      markdown += `| ${index.table_name} | ${index.index_name} | ${index.index_size} | ${index.space_wasted} | \`${index.drop_command}\` |\n`
    })
    markdown += '\n'
  }
  
  if (missing_indexes.length > 0) {
    markdown += `## Missing Index Suggestions (${missing_indexes.length})

| Table | Columns | Priority | Reason | Create Command |
|-------|---------|----------|--------|----------------|
`
    missing_indexes.forEach(suggestion => {
      markdown += `| ${suggestion.table_name} | ${suggestion.suggested_columns} | ${suggestion.priority} | ${suggestion.reason} | \`${suggestion.create_command}\` |\n`
    })
    markdown += '\n'
  }
  
  if (usage_analysis.filter(idx => idx.priority === 'HIGH').length > 0) {
    markdown += `## High Priority Issues

| Table | Index | Usage | Recommendation | Priority |
|-------|-------|-------|----------------|----------|
`
    usage_analysis
      .filter(idx => idx.priority === 'HIGH')
      .forEach(index => {
        markdown += `| ${index.table_name} | ${index.index_name} | ${index.usage_category} | ${index.recommendation} | ${index.priority} |\n`
      })
  }
  
  return markdown
}

function formatReportAsCSV(report) {
  const { unused_indexes } = report
  
  let csv = 'Type,Table,Index,Size,Priority,Recommendation\n'
  
  unused_indexes.forEach(index => {
    csv += `Unused,${index.table_name},${index.index_name},${index.index_size},${index.space_wasted},"${index.drop_command}"\n`
  })
  
  return csv
}

// Utility function to parse size strings
function parseSizeToBytes(sizeStr) {
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(\w+)$/)
  if (!match) return 0

  const value = parseFloat(match[1])
  const unit = match[2].toLowerCase()

  const multipliers = {
    'bytes': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  }

  return Math.round(value * (multipliers[unit] || 1))
}

// Main execution function
async function main() {
  try {
    logger.info('Starting index monitoring script...')
    
    // Validate environment
    validateEnvironment()
    
    // Create Supabase client
    const supabase = await createSupabaseClient()
    
    // Record snapshot if requested
    if (options.snapshot) {
      await recordIndexSnapshot(supabase)
    }
    
    // Generate monitoring report
    const report = await generateMonitoringReport(supabase)
    
    // Check if alerts should be sent
    if (shouldSendAlert(report)) {
      logger.warn('Alert conditions met, sending notifications...')
      await sendSlackAlert(report)
    } else {
      logger.info('No alert conditions met')
    }
    
    // Print report to console
    console.log('\n' + formatReport(report, options.format))
    
    // Exit with appropriate code
    const hasIssues = shouldSendAlert(report)
    process.exit(hasIssues ? 1 : 0)
    
  } catch (error) {
    logger.error('Script execution failed:', error.message)
    if (options.verbose) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

// Handle script execution
if (require.main === module) {
  main()
}

module.exports = {
  generateMonitoringReport,
  formatReport,
  shouldSendAlert,
  config
} 