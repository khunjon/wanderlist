// Database monitoring and maintenance utilities
import { supabase } from '@/lib/supabase/client'
import type { 
  IndexUsageAnalysis, 
  UnusedIndex, 
  MissingIndexSuggestion, 
  IndexSizeSummary,
  IndexMonitoringReport,
  IndexPerformanceMetrics,
  IndexOptimizationSuggestion
} from '@/types/supabase'

export interface TableBloatInfo {
  table_name: string
  live_rows: number
  dead_rows: number
  dead_row_percentage: number
  total_size: string
  maintenance_status: string
}

export interface MaintenanceRecommendation {
  table_name: string
  dead_row_percentage: number
  recommended_action: string
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
}

export interface DatabaseHealthReport {
  healthy: boolean
  timestamp: string
  urgentTables: MaintenanceRecommendation[]
  warningTables: MaintenanceRecommendation[]
  allTables: TableBloatInfo[]
  summary: {
    totalTables: number
    criticalTables: number
    highPriorityTables: number
    mediumPriorityTables: number
  }
}

/**
 * Check overall database health using MCP monitoring functions
 */
export async function checkDatabaseHealth(): Promise<DatabaseHealthReport> {
  try {
    // Get table bloat information
    const { data: bloatData, error: bloatError } = await supabase
      .rpc('check_table_bloat')

    if (bloatError) {
      console.error('Database health check failed:', bloatError)
      throw new Error(`Database health check failed: ${bloatError.message}`)
    }

    // Get maintenance recommendations
    const { data: maintenanceData, error: maintenanceError } = await supabase
      .rpc('get_urgent_maintenance_tables')

    if (maintenanceError) {
      console.error('Maintenance recommendations failed:', maintenanceError)
      throw new Error(`Maintenance recommendations failed: ${maintenanceError.message}`)
    }

    const allTables: TableBloatInfo[] = bloatData || []
    const recommendations: MaintenanceRecommendation[] = (maintenanceData || []).map(item => ({
      ...item,
      priority: item.priority as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    }))

    // Categorize tables by priority
    const urgentTables = recommendations.filter(table => 
      table.priority === 'CRITICAL'
    )
    
    const warningTables = recommendations.filter(table => 
      table.priority === 'HIGH' || table.priority === 'MEDIUM'
    )

    // Generate summary
    const summary = {
      totalTables: allTables.length,
      criticalTables: recommendations.filter(t => t.priority === 'CRITICAL').length,
      highPriorityTables: recommendations.filter(t => t.priority === 'HIGH').length,
      mediumPriorityTables: recommendations.filter(t => t.priority === 'MEDIUM').length
    }

    const healthy = urgentTables.length === 0

    // Send alerts if needed
    if (urgentTables.length > 0) {
      await sendUrgentAlert(urgentTables)
    }
    
    if (warningTables.length > 0) {
      await sendWarningAlert(warningTables)
    }

    return {
      healthy,
      timestamp: new Date().toISOString(),
      urgentTables,
      warningTables,
      allTables,
      summary
    }
  } catch (error) {
    console.error('Database health check error:', error)
    return {
      healthy: false,
      timestamp: new Date().toISOString(),
      urgentTables: [],
      warningTables: [],
      allTables: [],
      summary: {
        totalTables: 0,
        criticalTables: 0,
        highPriorityTables: 0,
        mediumPriorityTables: 0
      }
    }
  }
}

/**
 * Get autovacuum settings from the database
 */
export async function getAutovacuumSettings() {
  try {
    const { data, error } = await supabase.rpc('get_autovacuum_settings')
    
    if (error) {
      throw new Error(`Failed to get autovacuum settings: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Error getting autovacuum settings:', error)
    throw error
  }
}

/**
 * Log a maintenance operation
 */
export async function logMaintenanceOperation(
  operationType: string,
  tableName?: string,
  durationMs?: number,
  deadRowsBefore?: number,
  deadRowsAfter?: number,
  status: string = 'completed',
  notes?: string
) {
  try {
    const { error } = await supabase.rpc('log_maintenance_operation', {
      p_operation_type: operationType,
      p_table_name: tableName,
      p_duration_ms: durationMs,
      p_dead_rows_before: deadRowsBefore,
      p_dead_rows_after: deadRowsAfter,
      p_status: status,
      p_notes: notes
    })

    if (error) {
      console.error('Failed to log maintenance operation:', error)
    }
  } catch (error) {
    console.error('Error logging maintenance operation:', error)
  }
}

/**
 * Send urgent alert for critical database issues
 */
async function sendUrgentAlert(urgentTables: MaintenanceRecommendation[]) {
  try {
    console.error('🚨 URGENT DATABASE MAINTENANCE REQUIRED:', {
      tables: urgentTables.map(t => ({
        table: t.table_name,
        bloat: `${t.dead_row_percentage}%`,
        action: t.recommended_action
      })),
      timestamp: new Date().toISOString()
    })

    // In production, you would send this to your alerting system
    // Examples: Slack, Discord, email, PagerDuty, etc.
    
    // Example Slack webhook (uncomment and configure)
    /*
    if (process.env.SLACK_WEBHOOK_URL) {
      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 URGENT: Database maintenance required for ${urgentTables.length} tables`,
          attachments: [{
            color: 'danger',
            fields: urgentTables.map(table => ({
              title: table.table_name,
              value: `${table.dead_row_percentage}% dead rows - ${table.recommended_action}`,
              short: false
            }))
          }]
        })
      })
    }
    */

    // Log the alert
    await logMaintenanceOperation(
      'URGENT_ALERT',
      undefined,
      undefined,
      undefined,
      undefined,
      'sent',
      `Urgent alert sent for ${urgentTables.length} tables: ${urgentTables.map(t => t.table_name).join(', ')}`
    )
  } catch (error) {
    console.error('Failed to send urgent alert:', error)
  }
}

/**
 * Send warning alert for tables needing maintenance
 */
async function sendWarningAlert(warningTables: MaintenanceRecommendation[]) {
  try {
    console.warn('⚠️ DATABASE MAINTENANCE RECOMMENDED:', {
      tables: warningTables.map(t => ({
        table: t.table_name,
        bloat: `${t.dead_row_percentage}%`,
        priority: t.priority,
        action: t.recommended_action
      })),
      timestamp: new Date().toISOString()
    })

    // Log the warning
    await logMaintenanceOperation(
      'WARNING_ALERT',
      undefined,
      undefined,
      undefined,
      undefined,
      'sent',
      `Warning alert sent for ${warningTables.length} tables: ${warningTables.map(t => t.table_name).join(', ')}`
    )
  } catch (error) {
    console.error('Failed to send warning alert:', error)
  }
}

/**
 * Generate a maintenance report for manual review
 */
export async function generateMaintenanceReport(): Promise<string> {
  try {
    const health = await checkDatabaseHealth()
    const autovacuumSettings = await getAutovacuumSettings()

    let report = `# Database Maintenance Report
Generated: ${health.timestamp}
Status: ${health.healthy ? '✅ HEALTHY' : '⚠️ NEEDS ATTENTION'}

## Summary
- Total Tables: ${health.summary.totalTables}
- Critical Issues: ${health.summary.criticalTables}
- High Priority: ${health.summary.highPriorityTables}
- Medium Priority: ${health.summary.mediumPriorityTables}

`

    if (health.urgentTables.length > 0) {
      report += `## 🚨 URGENT ACTION REQUIRED\n\n`
      health.urgentTables.forEach(table => {
        report += `### ${table.table_name}
- Dead Row Percentage: ${table.dead_row_percentage}%
- Priority: ${table.priority}
- Action: \`${table.recommended_action}\`

`
      })
    }

    if (health.warningTables.length > 0) {
      report += `## ⚠️ MAINTENANCE RECOMMENDED\n\n`
      health.warningTables.forEach(table => {
        report += `### ${table.table_name}
- Dead Row Percentage: ${table.dead_row_percentage}%
- Priority: ${table.priority}
- Action: \`${table.recommended_action}\`

`
      })
    }

    report += `## All Tables Status\n\n`
    report += `| Table | Live Rows | Dead Rows | Bloat % | Size | Status |\n`
    report += `|-------|-----------|-----------|---------|------|--------|\n`
    
    health.allTables.forEach(table => {
      report += `| ${table.table_name} | ${table.live_rows} | ${table.dead_rows} | ${table.dead_row_percentage}% | ${table.total_size} | ${table.maintenance_status} |\n`
    })

    report += `\n## Autovacuum Settings\n\n`
    report += `| Setting | Value | Unit | Description |\n`
    report += `|---------|-------|------|-------------|\n`
    
    if (Array.isArray(autovacuumSettings)) {
      autovacuumSettings.forEach(setting => {
        report += `| ${setting.setting_name} | ${setting.current_value} | ${setting.unit} | ${setting.description} |\n`
      })
    }

    return report
  } catch (error) {
    console.error('Error generating maintenance report:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return `# Database Maintenance Report - ERROR\n\nFailed to generate report: ${errorMessage}\nTimestamp: ${new Date().toISOString()}`
  }
}

/**
 * Schedule automatic health checks
 */
export function startHealthCheckScheduler(intervalMinutes: number = 30) {
  console.log(`Starting database health check scheduler (every ${intervalMinutes} minutes)`)
  
  // Initial check
  checkDatabaseHealth()
  
  // Schedule recurring checks
  const interval = setInterval(async () => {
    try {
      await checkDatabaseHealth()
    } catch (error) {
      console.error('Scheduled health check failed:', error)
    }
  }, intervalMinutes * 60 * 1000)

  // Return cleanup function
  return () => {
    clearInterval(interval)
    console.log('Database health check scheduler stopped')
  }
}

/**
 * Utility to format maintenance recommendations for display
 */
export function formatMaintenanceRecommendations(recommendations: MaintenanceRecommendation[]): string {
  if (recommendations.length === 0) {
    return 'No maintenance actions required.'
  }

  return recommendations
    .map(rec => `${rec.priority}: ${rec.recommended_action}`)
    .join('\n')
} 

// ============================================================================
// INDEX MONITORING FUNCTIONS
// ============================================================================

/**
 * Analyze index usage patterns and efficiency
 */
export async function analyzeIndexUsage(): Promise<IndexUsageAnalysis[]> {
  try {
    const { data, error } = await supabase.rpc('analyze_index_usage')
    
    if (error) {
      throw new Error(`Failed to analyze index usage: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error analyzing index usage:', error)
    throw error
  }
}

/**
 * Get list of unused indexes that can be dropped
 */
export async function getUnusedIndexes(): Promise<UnusedIndex[]> {
  try {
    const { data, error } = await supabase.rpc('get_unused_indexes')
    
    if (error) {
      throw new Error(`Failed to get unused indexes: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error getting unused indexes:', error)
    throw error
  }
}

/**
 * Get suggestions for missing indexes
 */
export async function getMissingIndexSuggestions(): Promise<MissingIndexSuggestion[]> {
  try {
    const { data, error } = await supabase.rpc('suggest_missing_indexes')
    
    if (error) {
      throw new Error(`Failed to get missing index suggestions: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error getting missing index suggestions:', error)
    throw error
  }
}

/**
 * Get index size summary by table
 */
export async function getIndexSizeSummary(): Promise<IndexSizeSummary[]> {
  try {
    const { data, error } = await supabase.rpc('get_index_size_summary')
    
    if (error) {
      throw new Error(`Failed to get index size summary: ${error.message}`)
    }

    return data || []
  } catch (error) {
    console.error('Error getting index size summary:', error)
    throw error
  }
}

/**
 * Record a snapshot of current index usage statistics
 */
export async function recordIndexUsageSnapshot(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('record_index_usage_snapshot')
    
    if (error) {
      throw new Error(`Failed to record index usage snapshot: ${error.message}`)
    }

    return data || 0
  } catch (error) {
    console.error('Error recording index usage snapshot:', error)
    throw error
  }
}

/**
 * Generate comprehensive index monitoring report
 */
export async function generateIndexMonitoringReport(): Promise<IndexMonitoringReport> {
  try {
    // Fetch all index monitoring data in parallel
    const [
      usageAnalysis,
      unusedIndexes,
      missingIndexes,
      sizeSummary
    ] = await Promise.all([
      analyzeIndexUsage(),
      getUnusedIndexes(),
      getMissingIndexSuggestions(),
      getIndexSizeSummary()
    ])

    // Calculate summary statistics
    const totalIndexes = sizeSummary.reduce((sum, table) => sum + table.total_indexes, 0)
    const unusedIndexCount = sizeSummary.reduce((sum, table) => sum + table.unused_indexes, 0)
    
    // Calculate total sizes (convert to bytes for calculation)
    const totalSizeBytes = sizeSummary.reduce((sum, table) => {
      const sizeStr = table.total_index_size
      return sum + parseSizeToBytes(sizeStr)
    }, 0)
    
    const wastedSpaceBytes = sizeSummary.reduce((sum, table) => {
      const sizeStr = table.unused_index_size
      return sum + parseSizeToBytes(sizeStr)
    }, 0)

    const overallEfficiency = totalIndexes > 0 
      ? Math.round(((totalIndexes - unusedIndexCount) / totalIndexes) * 100)
      : 100

    // Get high priority issues
    const highPriorityIssues = usageAnalysis.filter(index => 
      index.priority === 'HIGH' || index.priority === 'CRITICAL'
    )

    // Generate recommendations
    const recommendations = generateIndexRecommendations(
      usageAnalysis,
      unusedIndexes,
      missingIndexes,
      sizeSummary
    )

    return {
      summary: {
        total_indexes: totalIndexes,
        unused_indexes: unusedIndexCount,
        total_size: formatBytes(totalSizeBytes),
        wasted_space: formatBytes(wastedSpaceBytes),
        overall_efficiency: overallEfficiency
      },
      high_priority_issues: highPriorityIssues,
      unused_indexes: unusedIndexes,
      missing_indexes: missingIndexes,
      size_summary: sizeSummary,
      recommendations
    }
  } catch (error) {
    console.error('Error generating index monitoring report:', error)
    throw error
  }
}

/**
 * Check index health and send alerts if needed
 */
export async function checkIndexHealth(): Promise<{
  healthy: boolean
  issues: string[]
  recommendations: string[]
}> {
  try {
    const report = await generateIndexMonitoringReport()
    const issues: string[] = []
    const recommendations: string[] = []

    // Check for critical issues
    if (report.summary.unused_indexes > 10) {
      issues.push(`${report.summary.unused_indexes} unused indexes found`)
      recommendations.push('Review and drop unused indexes to improve performance')
    }

    if (report.summary.overall_efficiency < 50) {
      issues.push(`Low index efficiency: ${report.summary.overall_efficiency}%`)
      recommendations.push('Optimize index usage patterns')
    }

    if (report.high_priority_issues.length > 0) {
      issues.push(`${report.high_priority_issues.length} high-priority index issues`)
      recommendations.push('Address high-priority index performance issues')
    }

    const wastedSpaceBytes = parseSizeToBytes(report.summary.wasted_space)
    if (wastedSpaceBytes > 1024 * 1024) { // > 1MB
      issues.push(`${report.summary.wasted_space} of wasted index space`)
      recommendations.push('Drop unused indexes to reclaim disk space')
    }

    // Send alerts for critical issues
    if (issues.length > 0) {
      await sendIndexAlert(issues, recommendations)
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations
    }
  } catch (error) {
    console.error('Error checking index health:', error)
    return {
      healthy: false,
      issues: ['Failed to check index health'],
      recommendations: ['Check database connectivity and permissions']
    }
  }
}

/**
 * Generate optimization suggestions based on index analysis
 */
export function generateIndexOptimizationSuggestions(
  usageAnalysis: IndexUsageAnalysis[],
  unusedIndexes: UnusedIndex[],
  missingIndexes: MissingIndexSuggestion[]
): IndexOptimizationSuggestion[] {
  const suggestions: IndexOptimizationSuggestion[] = []

  // Suggest dropping unused indexes
  unusedIndexes.forEach(index => {
    const sizeBytes = parseSizeToBytes(index.index_size)
    const riskLevel = sizeBytes > 1024 * 1024 ? 'low' : 'low' // Most unused indexes are safe to drop
    
    suggestions.push({
      type: 'drop',
      table_name: index.table_name,
      index_name: index.index_name,
      reason: 'Index is never used and consuming disk space',
      impact: `Reclaim ${index.index_size} of disk space`,
      sql_command: index.drop_command,
      estimated_benefit: `Space savings: ${index.index_size}`,
      risk_level: riskLevel
    })
  })

  // Suggest creating missing indexes
  missingIndexes.forEach(suggestion => {
    suggestions.push({
      type: 'create',
      table_name: suggestion.table_name,
      reason: suggestion.reason,
      impact: 'Improve query performance for common patterns',
      sql_command: suggestion.create_command,
      estimated_benefit: 'Faster query execution',
      risk_level: suggestion.priority === 'HIGH' ? 'low' : 'medium'
    })
  })

  // Suggest monitoring for low-usage indexes
  usageAnalysis
    .filter(index => index.usage_category === 'LOW_USAGE' && index.priority === 'MEDIUM')
    .forEach(index => {
      suggestions.push({
        type: 'monitor',
        table_name: index.table_name,
        index_name: index.index_name,
        reason: 'Low usage pattern detected',
        impact: 'Monitor for potential removal',
        sql_command: `-- Monitor usage: SELECT * FROM pg_stat_user_indexes WHERE indexrelname = '${index.index_name}';`,
        estimated_benefit: 'Identify truly unused indexes over time',
        risk_level: 'low'
      })
    })

  return suggestions.sort((a, b) => {
    const priorityOrder = { 'drop': 1, 'create': 2, 'modify': 3, 'monitor': 4 }
    return priorityOrder[a.type] - priorityOrder[b.type]
  })
}

/**
 * Helper function to generate recommendations text
 */
function generateIndexRecommendations(
  usageAnalysis: IndexUsageAnalysis[],
  unusedIndexes: UnusedIndex[],
  missingIndexes: MissingIndexSuggestion[],
  sizeSummary: IndexSizeSummary[]
): string[] {
  const recommendations: string[] = []

  if (unusedIndexes.length > 0) {
    const highWasteIndexes = unusedIndexes.filter(idx => idx.space_wasted === 'HIGH')
    if (highWasteIndexes.length > 0) {
      recommendations.push(`Drop ${highWasteIndexes.length} high-waste unused indexes to reclaim significant disk space`)
    }
    recommendations.push(`Consider dropping ${unusedIndexes.length} unused indexes total`)
  }

  if (missingIndexes.length > 0) {
    const highPriorityMissing = missingIndexes.filter(idx => idx.priority === 'HIGH')
    if (highPriorityMissing.length > 0) {
      recommendations.push(`Create ${highPriorityMissing.length} high-priority missing indexes for better performance`)
    }
  }

  const lowEfficiencyTables = sizeSummary.filter(table => table.efficiency_score < 50)
  if (lowEfficiencyTables.length > 0) {
    recommendations.push(`Review index strategy for ${lowEfficiencyTables.length} tables with low efficiency scores`)
  }

  const criticalIssues = usageAnalysis.filter(idx => idx.priority === 'HIGH')
  if (criticalIssues.length > 0) {
    recommendations.push(`Address ${criticalIssues.length} high-priority index performance issues`)
  }

  if (recommendations.length === 0) {
    recommendations.push('Index usage appears optimal - continue monitoring')
  }

  return recommendations
}

/**
 * Send alert for index issues
 */
async function sendIndexAlert(issues: string[], recommendations: string[]) {
  try {
    console.warn('⚠️ INDEX PERFORMANCE ALERT:', {
      issues,
      recommendations,
      timestamp: new Date().toISOString()
    })

    // Log the alert as a maintenance operation
    await logMaintenanceOperation(
      'INDEX_HEALTH_ALERT',
      undefined,
      undefined,
      undefined,
      undefined,
      'alert_sent',
      `Issues: ${issues.join(', ')}. Recommendations: ${recommendations.join(', ')}`
    )
  } catch (error) {
    console.error('Error sending index alert:', error)
  }
}

/**
 * Helper function to parse size strings to bytes
 */
function parseSizeToBytes(sizeStr: string): number {
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(\w+)$/)
  if (!match) return 0

  const value = parseFloat(match[1])
  const unit = match[2].toLowerCase()

  const multipliers: { [key: string]: number } = {
    'bytes': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  }

  return Math.round(value * (multipliers[unit] || 1))
}

/**
 * Helper function to format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 bytes'
  
  const k = 1024
  const sizes = ['bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}