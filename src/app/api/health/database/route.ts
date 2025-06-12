import { NextRequest, NextResponse } from 'next/server'
import { checkDatabaseHealth } from '@/lib/database/monitoring'
import { createNoCacheResponse } from '@/lib/utils/cache'

export async function GET(request: NextRequest) {
  try {
    const health = await checkDatabaseHealth()
    
    const responseData = {
      status: health.healthy ? 'healthy' : 'degraded',
      timestamp: health.timestamp,
      details: {
        urgentTables: health.urgentTables?.length || 0,
        warningTables: health.warningTables?.length || 0,
        totalTables: health.summary.totalTables,
        criticalTables: health.summary.criticalTables,
        highPriorityTables: health.summary.highPriorityTables,
        mediumPriorityTables: health.summary.mediumPriorityTables,
        recommendations: health.urgentTables?.map(table => 
          `VACUUM ${table.table_name} immediately (${table.dead_row_percentage}% dead rows)`
        ) || []
      },
      tables: health.allTables.map(table => ({
        name: table.table_name,
        liveRows: table.live_rows,
        deadRows: table.dead_rows,
        deadRowPercentage: table.dead_row_percentage,
        size: table.total_size,
        status: table.maintenance_status
      }))
    }
    
    // Use cache utility for consistent no-cache response with security headers
    return createNoCacheResponse(responseData)
  } catch (error) {
    console.error('Database health check API error:', error)
    
    const errorData = {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        urgentTables: 0,
        warningTables: 0,
        totalTables: 0,
        criticalTables: 0,
        highPriorityTables: 0,
        mediumPriorityTables: 0,
        recommendations: []
      },
      tables: []
    }
    
    // Use cache utility for error responses too
    return createNoCacheResponse(errorData, 500)
  }
} 