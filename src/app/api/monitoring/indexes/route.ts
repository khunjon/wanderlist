import { NextRequest, NextResponse } from 'next/server'
import { 
  analyzeIndexUsage,
  getUnusedIndexes,
  getMissingIndexSuggestions,
  getIndexSizeSummary,
  generateIndexMonitoringReport,
  checkIndexHealth
} from '@/lib/database/monitoring'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'report'

    switch (action) {
      case 'usage':
        const usageAnalysis = await analyzeIndexUsage()
        return NextResponse.json({ 
          success: true, 
          data: usageAnalysis 
        })

      case 'unused':
        const unusedIndexes = await getUnusedIndexes()
        return NextResponse.json({ 
          success: true, 
          data: unusedIndexes 
        })

      case 'missing':
        const missingIndexes = await getMissingIndexSuggestions()
        return NextResponse.json({ 
          success: true, 
          data: missingIndexes 
        })

      case 'size':
        const sizeSummary = await getIndexSizeSummary()
        return NextResponse.json({ 
          success: true, 
          data: sizeSummary 
        })

      case 'health':
        const healthCheck = await checkIndexHealth()
        return NextResponse.json({ 
          success: true, 
          data: healthCheck 
        })

      case 'report':
      default:
        const report = await generateIndexMonitoringReport()
        return NextResponse.json({ 
          success: true, 
          data: report 
        })
    }
  } catch (error) {
    console.error('Index monitoring API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
} 