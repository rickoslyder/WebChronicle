import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const authToken = await getAuthToken()
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    
    // Parse export options
    const exportFormat = searchParams.get('format') || 'json'
    const includeContent = searchParams.get('includeContent') === 'true'
    const includeSummary = searchParams.get('includeSummary') === 'true'
    const includeTags = searchParams.get('includeTags') === 'true'
    const includeMetrics = searchParams.get('includeMetrics') === 'true'
    const dateRange = searchParams.get('dateRange') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build request to worker
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787'
    const exportParams = new URLSearchParams({
      format: exportFormat,
      includeContent: includeContent.toString(),
      includeSummary: includeSummary.toString(),
      includeTags: includeTags.toString(),
      includeMetrics: includeMetrics.toString(),
      dateRange,
    })
    
    if (startDate) exportParams.append('startDate', startDate)
    if (endDate) exportParams.append('endDate', endDate)

    const response = await fetch(`${workerUrl}/api/export?${exportParams}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`)
    }

    // Get the content type from worker response
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream'
    const data = await response.arrayBuffer()

    // Return the exported data
    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="webchronicle-export-${format(new Date(), 'yyyy-MM-dd')}.${exportFormat}"`,
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    )
  }
}