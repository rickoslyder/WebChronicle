'use client'

import { Globe } from 'lucide-react'
import { useDomainStats } from '@/hooks/use-activities'
import { useActivityStore } from '@/providers/activity-store-provider'

export function DomainFilter() {
  const { data: domains, isLoading } = useDomainStats()
  const filter = useActivityStore((state) => state.filter)
  const setFilter = useActivityStore((state) => state.setFilter)
  
  const selectedDomains = filter.domains || []

  const toggleDomain = (domain: string) => {
    const newDomains = selectedDomains.includes(domain)
      ? selectedDomains.filter(d => d !== domain)
      : [...selectedDomains, domain]
    
    setFilter({ domains: newDomains })
  }

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium mb-2">
        <Globe className="h-4 w-4" />
        Domains
      </label>
      
      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading domains...</div>
      ) : (
        <div className="max-h-32 overflow-y-auto space-y-1">
          {domains?.slice(0, 10).map((domain) => (
            <label
              key={domain.domain}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedDomains.includes(domain.domain)}
                onChange={() => toggleDomain(domain.domain)}
                className="rounded border-input"
              />
              <span>{domain.domain}</span>
              <span className="text-xs text-muted-foreground ml-auto">
                ({domain.count})
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}