import { NextRequest, NextResponse } from 'next/server'
import { getAuthToken } from '@/lib/auth'

interface SearchMatch {
  field: string
  snippet: string
  position: number
}

interface SearchResult {
  id: string
  url: string
  title: string
  summary?: string
  tags?: string[]
  visitedAt: string
  timeSpent: number
  scrollDepth?: number
  wordCount?: number
  domain: string
  favicon?: string
  matches: SearchMatch[]
}

export async function GET(request: NextRequest) {
  try {
    const authToken = await getAuthToken()
    if (!authToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '20')
    
    // Search options
    const searchTitle = searchParams.get('searchTitle') === 'true'
    const searchUrl = searchParams.get('searchUrl') === 'true'
    const searchSummary = searchParams.get('searchSummary') === 'true'
    const searchTags = searchParams.get('searchTags') === 'true'
    const searchContent = searchParams.get('searchContent') === 'true'
    const caseSensitive = searchParams.get('caseSensitive') === 'true'
    const wholeWord = searchParams.get('wholeWord') === 'true'
    
    if (!query) {
      return NextResponse.json({ results: [], nextCursor: null })
    }

    // Construct the full-text search request
    const searchRequest = {
      query,
      options: {
        searchTitle,
        searchUrl,
        searchSummary,
        searchTags,
        searchContent,
        caseSensitive,
        wholeWord,
      },
      pagination: {
        page,
        limit,
      }
    }

    // Call the worker API
    const workerUrl = process.env.NEXT_PUBLIC_WORKER_URL || 'http://localhost:8787'
    const response = await fetch(`${workerUrl}/api/search/fulltext`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchRequest),
    })

    if (!response.ok) {
      throw new Error(`Worker responded with ${response.status}`)
    }

    const data = await response.json()
    
    // Transform the data to match our frontend expectations
    const results: SearchResult[] = data.results.map((item: SearchResult) => ({
      ...item,
      domain: new URL(item.url).hostname,
    }))

    return NextResponse.json({
      results,
      nextCursor: data.hasMore ? page + 1 : null,
    })
  } catch (error) {
    console.error('Full-text search error:', error)
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    )
  }
}