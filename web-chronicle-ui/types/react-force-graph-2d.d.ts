declare module 'react-force-graph-2d' {
  import { FC } from 'react'

  interface NodeObject {
    id: string
    name?: string
    val?: number
    x?: number
    y?: number
    vx?: number
    vy?: number
    fx?: number | null
    fy?: number | null
    [key: string]: any
  }

  interface LinkObject {
    source: string | NodeObject
    target: string | NodeObject
    value?: number
    [key: string]: any
  }

  interface GraphData {
    nodes: NodeObject[]
    links: LinkObject[]
  }

  interface ForceGraph2DProps {
    graphData: GraphData
    ref?: any
    width?: number
    height?: number
    backgroundColor?: string
    nodeRelSize?: number
    nodeLabel?: string | ((node: NodeObject) => string)
    nodeColor?: string | ((node: NodeObject) => string)
    nodeCanvasObject?: (node: NodeObject, ctx: CanvasRenderingContext2D, globalScale: number) => void
    nodeCanvasObjectMode?: string | ((node: NodeObject) => string)
    onNodeClick?: (node: NodeObject, event: MouseEvent) => void
    onNodeHover?: (node: NodeObject | null, previousNode: NodeObject | null) => void
    onNodeDragEnd?: (node: NodeObject, translate: { x: number; y: number }) => void
    linkColor?: string | ((link: LinkObject) => string)
    linkWidth?: number | string | ((link: LinkObject) => number)
    linkLabel?: string | ((link: LinkObject) => string)
    linkDirectionalArrowLength?: number | string | ((link: LinkObject) => number)
    linkDirectionalArrowRelPos?: number | string | ((link: LinkObject) => number)
    linkCurvature?: number | string | ((link: LinkObject) => number)
    linkCanvasObject?: (link: LinkObject, ctx: CanvasRenderingContext2D, globalScale: number) => void
    linkCanvasObjectMode?: string | ((link: LinkObject) => string)
    onLinkClick?: (link: LinkObject, event: MouseEvent) => void
    onLinkHover?: (link: LinkObject | null, previousLink: LinkObject | null) => void
    enableNodeDrag?: boolean
    enableZoomInteraction?: boolean
    enablePanInteraction?: boolean
    enablePointerInteraction?: boolean
    onZoom?: (transform: { k: number; x: number; y: number }) => void
    onZoomEnd?: (transform: { k: number; x: number; y: number }) => void
    cooldownTicks?: number
    cooldownTime?: number
    warmupTicks?: number
    onEngineStop?: () => void
    onEngineTick?: () => void
  }

  const ForceGraph2D: FC<ForceGraph2DProps>
  export default ForceGraph2D
}