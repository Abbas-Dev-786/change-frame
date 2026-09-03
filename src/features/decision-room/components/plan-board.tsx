import { useRef, useState, type PointerEvent } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
  normalizeRect,
  routeToSvgPoints,
  type Constraint,
  type Drawing,
  type DrawingElement,
  type Issue,
  type OptionId,
  type PlanViewBox,
  type Point,
  type Rect,
  type ResolutionOption,
} from "@/src/domain/decision"

type PlanBoardProps = {
  issue: Issue
  drawing?: Drawing
  viewBox: PlanViewBox
  elements: DrawingElement[]
  constraints: Constraint[]
  options: ResolutionOption[]
  previewOptionId: OptionId | null
  canCreateConstraint: boolean
  onCreateConstraint: (rect: Rect) => void
}

export function PlanBoard({ issue, drawing, viewBox, elements, constraints, options, previewOptionId, canCreateConstraint, onCreateConstraint }: PlanBoardProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragStartRef = useRef<Point | null>(null)
  const [draftRect, setDraftRect] = useState<Rect | null>(null)
  const issuePin = getIssuePin(issue, elements, viewBox)

  function getSvgPoint(event: PointerEvent<SVGSVGElement>): Point {
    const bounds = svgRef.current?.getBoundingClientRect()
    if (!bounds) return { x: 0, y: 0 }
    return { x: Math.round(((event.clientX - bounds.left) / bounds.width) * viewBox.width), y: Math.round(((event.clientY - bounds.top) / bounds.height) * viewBox.height) }
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (!canCreateConstraint || event.button !== 0) return
    const point = getSvgPoint(event); dragStartRef.current = point
    setDraftRect({ x: point.x, y: point.y, width: 1, height: 1 }); event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (dragStartRef.current) setDraftRect(normalizeRect(dragStartRef.current, getSvgPoint(event), viewBox))
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    const rect = draftRect; dragStartRef.current = null; setDraftRect(null); releasePointerCapture(event)
    if (rect && rect.width >= 24 && rect.height >= 24) onCreateConstraint(rect)
  }

  function handlePointerCancel(event: PointerEvent<SVGSVGElement>) {
    dragStartRef.current = null; setDraftRect(null); releasePointerCapture(event)
  }

  return (
    <Card className="rounded-lg border-border/70 bg-card py-4 shadow-sm">
      <CardHeader className="gap-1 px-4">
        <h2 className="text-base font-semibold">{drawing?.id ?? issue.drawingId} · {drawing?.name ?? "Decision plan"}</h2>
        <p className="text-sm text-muted-foreground">{issue.location}</p>
      </CardHeader>
      <CardContent className="px-4">
        <svg ref={svgRef} role="img" aria-label={`${drawing?.name ?? "Decision plan"} for ${issue.title}, including live agent routes and human constraints.`} viewBox={`0 0 ${viewBox.width} ${viewBox.height}`} className="aspect-[1.46] w-full touch-none rounded-lg border border-border bg-[#f8faf5] shadow-inner" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel}>
          <defs>
            <pattern id="plan-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="#dbe3d4" strokeWidth="1" /></pattern>
            <marker id="route-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#7c3aed" /></marker>
          </defs>
          <rect width={viewBox.width} height={viewBox.height} fill="url(#plan-grid)" />
          {elements.map((element) => <PlanElement key={element.id} element={element} />)}
          <g id="agent-resolution-overlays">
            {options.filter((option) => option.routeOverlay).map((option) => {
              const route = option.routeOverlay!
              const previewed = option.id === previewOptionId
              return <polyline key={route.id} data-route-state={option.revision > 1 ? "revised" : "candidate"} points={routeToSvgPoints(route)} fill="none" stroke={option.revision > 1 ? "#15803d" : previewed ? "#7c3aed" : "#94a38c"} strokeDasharray={option.revision > 1 ? "0" : "10 8"} strokeLinecap="round" strokeLinejoin="round" strokeWidth={previewed ? 8 : 4} opacity={previewed ? 0.98 : 0.34} markerEnd={previewed ? "url(#route-arrow)" : undefined}><title>{route.label} · agent-authored</title></polyline>
            })}
          </g>
          <g id="user-constraints">{constraints.map((constraint) => <ConstraintRect key={constraint.id} rect={constraint.geometry} label={constraint.label} />)}{draftRect ? <ConstraintRect rect={draftRect} label="Draft constraint" draft /> : null}</g>
          <g id="issue-pin"><circle cx={issuePin.x} cy={issuePin.y} r="22" fill="#dc2626" opacity="0.14" /><circle cx={issuePin.x} cy={issuePin.y} r="8" fill="#dc2626" /><text x={issuePin.x + 16} y={issuePin.y - 5} className="fill-red-800 text-[13px] font-semibold">Issue</text><text x={issuePin.x + 16} y={issuePin.y + 14} className="fill-red-800 text-[12px]">{issue.id}</text></g>
        </svg>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span>Solid objects · supplied project context</span><span className="text-violet-800">Dashed routes · agent-authored alternatives</span><span className="text-orange-800">Orange regions · human constraints</span></div>
      </CardContent>
    </Card>
  )
}

function getIssuePin(issue: Issue, elements: DrawingElement[], viewBox: PlanViewBox): Point {
  const affected = issue.elementIds.map((id) => elements.find((element) => element.id === id)).filter((element): element is DrawingElement => Boolean(element))
  if (affected.length === 0) return { x: viewBox.width / 2, y: viewBox.height / 2 }
  return { x: affected.reduce((sum, element) => sum + element.geometry.x + element.geometry.width / 2, 0) / affected.length, y: affected.reduce((sum, element) => sum + element.geometry.y + element.geometry.height / 2, 0) / affected.length }
}

function releasePointerCapture(event: PointerEvent<SVGSVGElement>): void { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }

function PlanElement({ element }: { element: DrawingElement }) {
  const rect = element.geometry
  const palette: Record<DrawingElement["type"], { fill: string; stroke: string }> = {
    duct: { fill: "#60a5fa", stroke: "#1d4ed8" }, beam: { fill: "#334155", stroke: "#0f172a" }, riser: { fill: "#facc15", stroke: "#854d0e" }, corridor: { fill: "#dbeafe", stroke: "#64748b" }, room: { fill: "#dcfce7", stroke: "#64748b" }, wall: { fill: "#94a3b8", stroke: "#475569" }, pipe: { fill: "#22d3ee", stroke: "#0e7490" }, cable_tray: { fill: "#fbbf24", stroke: "#b45309" }, equipment: { fill: "#c4b5fd", stroke: "#6d28d9" }, generic: { fill: "#cbd5e1", stroke: "#475569" },
  }
  const color = palette[element.type]
  return <g><rect data-element-id={element.id} x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx="5" fill={color.fill} stroke={color.stroke} strokeWidth="2" opacity="0.78"><title>{element.label}</title></rect><text x={rect.x + 7} y={rect.y + 18} className="pointer-events-none fill-slate-900 text-[11px] font-medium">{element.id}</text></g>
}

function ConstraintRect({ rect, label, draft = false }: { rect: Rect; label: string; draft?: boolean }) {
  return <g><rect x={rect.x} y={rect.y} width={rect.width} height={rect.height} rx="4" fill={draft ? "#fb923c" : "#f97316"} fillOpacity={draft ? 0.18 : 0.26} stroke={draft ? "#ea580c" : "#c2410c"} strokeDasharray={draft ? "8 6" : "0"} strokeWidth="3" /><text x={rect.x + 8} y={rect.y + 22} className="fill-orange-950 text-[13px] font-semibold">{label}</text></g>
}
