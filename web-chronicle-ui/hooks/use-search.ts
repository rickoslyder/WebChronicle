import { useQuery } from '@tanstack/react-query'
import { useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'
import { QUERY_KEYS } from '@/lib/constants'
import { debounce } from '@/lib/utils'

export function useSearch(initialQuery: string = '') {
  const [query, setQuery] = useState(initialQuery)
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  // Debounce the query
  const debouncedSetQuery = useCallback(
    debounce((value: string) => {
      setDebouncedQuery(value)
    }, 300),
    []
  )

  useEffect(() => {
    debouncedSetQuery(query)
  }, [query, debouncedSetQuery])

  const searchResults = useQuery({
    queryKey: QUERY_KEYS.search(debouncedQuery),
    queryFn: () => api.search(debouncedQuery),
    enabled: debouncedQuery.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  return {
    query,
    setQuery,
    searchResults,
    isSearching: searchResults.isFetching,
  }
}