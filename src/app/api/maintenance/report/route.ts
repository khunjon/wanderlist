import { NextRequest, NextResponse } from 'next/server'
import { generateMaintenanceReport } from '@/lib/database/monitoring'

export async function GET(request: NextRequest) {
  try {
    // Check for admin authorization (optional - implement based on your auth system)
    // const authHeader = request.headers.get('authorization')
    // if (!authHeader || !isAuthorized(authHeader)) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const report = await generateMaintenanceReport()
    
    // Return as markdown content
    return new NextResponse(report, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="database-maintenance-report-${new Date().toISOString().split('T')[0]}.md"`
      }
    })
  } catch (error) {
    console.error('Maintenance report API error:', error)
    
    return NextResponse.json({
      error: 'Failed to generate maintenance report',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // For JSON format requests
    const report = await generateMaintenanceReport()
    
    return NextResponse.json({
      success: true,
      report,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Maintenance report API error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 