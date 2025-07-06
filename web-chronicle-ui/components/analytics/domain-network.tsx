'use client'

import { useMemo, useRef, useCallback, useState } from 'react'
import dynamic from 'next/dynamic'
import { Network, Globe, ArrowRight, Info } from 'lucide-react'
import { ActivityLogWithTags } from '@/types'
import { Button } from '@/components/ui/button'

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[600px] bg-muted rounded-lg">
      <div className="text-muted-foreground">Loading network visualization...</div>
    </div>
  ),
})

interface DomainNetworkProps {
  activities: ActivityLogWithTags[]
  onDomainClick?: (domain: string) => void
}

interface DomainNode {
  id: string
  name: string
  val: number
  color: string
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

interface DomainLink {
  source: string
  target: string
  value: number
}

export function DomainNetwork({ activities, onDomainClick }: DomainNetworkProps) {
  const fgRef = useRef<unknown>(null)
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [showLabels, setShowLabels] = useState(true)

  const graphData = useMemo(() => {
    // Sort activities by time
    const sortedActivities = [...activities].sort(
      (a, b) => new Date(a.visitedAt).getTime() - new Date(b.visitedAt).getTime()
    )

    // Track domain visits and transitions
    const domainVisits = new Map<string, number>()
    const transitions = new Map<string, number>()
    
    // Count visits and transitions
    for (let i = 0; i < sortedActivities.length; i++) {
      const activity = sortedActivities[i]
      const domain = activity.domain
      
      // Count domain visits
      domainVisits.set(domain, (domainVisits.get(domain) || 0) + 1)
      
      // Count transitions (if not the last activity)
      if (i < sortedActivities.length - 1) {
        const nextDomain = sortedActivities[i + 1].domain
        if (domain !== nextDomain) {
          const transitionKey = `${domain}->${nextDomain}`
          transitions.set(transitionKey, (transitions.get(transitionKey) || 0) + 1)
        }
      }
    }

    // Filter to top domains by visit count
    const topDomains = Array.from(domainVisits.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20) // Show top 20 domains
      .map(([domain]) => domain)
    
    const topDomainsSet = new Set(topDomains)

    // Create nodes
    const nodes: DomainNode[] = topDomains.map(domain => {
      const visits = domainVisits.get(domain) || 0
      return {
        id: domain,
        name: domain,
        val: Math.sqrt(visits) * 5, // Scale for visibility
        color: getColorForDomain(domain),
      }
    })

    // Create links (only between top domains)
    const links: DomainLink[] = []
    transitions.forEach((count, key) => {
      const [source, target] = key.split('->')
      if (topDomainsSet.has(source) && topDomainsSet.has(target)) {
        links.push({
          source,
          target,
          value: Math.sqrt(count) * 2, // Scale for visibility
        })
      }
    })

    return { nodes, links }
  }, [activities])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node.id)
    onDomainClick?.(node.id)
  }, [onDomainClick])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleNodeHover = useCallback((node: any) => {
    setHighlightedNode(node?.id || null)
  }, [])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    const domainNode = node as DomainNode
    const isHighlighted = highlightedNode === node.id
    const isSelected = selectedNode === node.id
    
    // Draw node circle
    ctx.beginPath()
    ctx.arc(domainNode.x || 0, domainNode.y || 0, domainNode.val || 5, 0, 2 * Math.PI)
    
    if (isSelected) {
      ctx.fillStyle = '#3b82f6' // Blue for selected
      ctx.strokeStyle = '#1e40af'
      ctx.lineWidth = 3
    } else if (isHighlighted) {
      ctx.fillStyle = domainNode.color || '#666'
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
    } else {
      ctx.fillStyle = domainNode.color || '#666'
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'
      ctx.lineWidth = 1
    }
    
    ctx.fill()
    ctx.stroke()

    // Draw label if enabled
    if (showLabels || isHighlighted || isSelected) {
      ctx.font = `${isHighlighted || isSelected ? 12 : 10}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillStyle = isHighlighted || isSelected ? '#000' : '#666'
      ctx.fillText(domainNode.name || '', domainNode.x || 0, (domainNode.y || 0) + (domainNode.val || 5) + 10)
    }
  }, [highlightedNode, selectedNode, showLabels])

  const getNodeStats = useCallback((nodeId: string) => {
    const nodeActivities = activities.filter(a => a.domain === nodeId)
    const totalTime = nodeActivities.reduce((sum, a) => sum + a.timeSpent, 0)
    const avgTime = totalTime / nodeActivities.length
    
    return {
      visits: nodeActivities.length,
      totalTime: Math.round(totalTime / 60), // Convert to minutes
      avgTime: Math.round(avgTime),
    }
  }, [activities])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Domain Relationships</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLabels(!showLabels)}
          >
            {showLabels ? 'Hide' : 'Show'} Labels
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (fgRef.current as any)?.zoomToFit(400)
            }}
          >
            Reset View
          </Button>
        </div>
      </div>

      <div className="relative">
        <div className="border rounded-lg overflow-hidden bg-background">
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeLabel={node => {
              const stats = getNodeStats(node.id as string)
              const domainNode = node as DomainNode
              return `${domainNode.name}\nVisits: ${stats.visits}\nTotal time: ${stats.totalTime}m\nAvg time: ${stats.avgTime}s`
            }}
            nodeCanvasObject={paintNode}
            nodeCanvasObjectMode={() => 'replace'}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            linkColor={() => 'rgba(100, 100, 100, 0.2)'}
            linkWidth={link => (link as DomainLink).value || 1}
            linkDirectionalArrowLength={3}
            linkDirectionalArrowRelPos={1}
            linkCurvature={0.1}
            width={800}
            height={600}
            backgroundColor="#fafafa"
            nodeRelSize={1}
            enableNodeDrag={true}
            enableZoomInteraction={true}
            enablePanInteraction={true}
          />
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur p-3 rounded-lg border text-sm">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Network Guide</span>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary" />
              <span>Node size = Visit frequency</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3" />
              <span>Arrow thickness = Transition frequency</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-3 w-3" />
              <span>Click a domain to filter</span>
            </div>
          </div>
        </div>

        {/* Selected Node Info */}
        {selectedNode && (
          <div className="absolute top-4 right-4 bg-background/90 backdrop-blur p-4 rounded-lg border max-w-xs">
            <h4 className="font-medium mb-2">{selectedNode}</h4>
            {(() => {
              const stats = getNodeStats(selectedNode)
              return (
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>Visits: {stats.visits}</div>
                  <div>Total time: {stats.totalTime} minutes</div>
                  <div>Average time: {stats.avgTime} seconds</div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        <p>
          This network shows your top 20 most visited domains and how you navigate between them.
          Larger nodes indicate more visits, and thicker arrows show frequent transitions.
        </p>
      </div>
    </div>
  )
}

function getColorForDomain(domain: string): string {
  // Assign colors based on domain categories
  if (domain.includes('github') || domain.includes('gitlab')) return '#24292e'
  if (domain.includes('google')) return '#4285f4'
  if (domain.includes('stackoverflow')) return '#f48024'
  if (domain.includes('youtube')) return '#ff0000'
  if (domain.includes('reddit')) return '#ff4500'
  if (domain.includes('twitter') || domain.includes('x.com')) return '#1da1f2'
  if (domain.includes('facebook')) return '#1877f2'
  if (domain.includes('amazon')) return '#ff9900'
  if (domain.includes('linkedin')) return '#0077b5'
  if (domain.includes('medium')) return '#00ab6c'
  
  // Default color based on domain hash
  let hash = 0
  for (let i = 0; i < domain.length; i++) {
    hash = domain.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 60%, 50%)`
}