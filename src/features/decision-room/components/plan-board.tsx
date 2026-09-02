import { useRef, useState, type PointerEvent } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PLAN_VIEWBOX,
  normalizeRect,
  routeToSvgPoints,
  type Constraint,
  type DrawingElement,
  type Issue,
  type OptionId,
  type Point,
  type Rect,
  type ResolutionOption,
} from "@/src/domain/decision"

type PlanBoardProps = {
  issue: Issue
  elements: DrawingElement[]
  constraints: Constraint[]
  options: ResolutionOption[]
  previewOptionId: OptionId | null
  canCreateConstraint: boolean
  onCreateConstraint: (rect: Rect) => void
}

export function PlanBoard({
  issue,
  elements,
  constraints,
  options,
  previewOptionId,
  canCreateConstraint,
  onCreateConstraint,
}: PlanBoardProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const dragStartRef = useRef<Point | null>(null)
  const [draftRect, setDraftRect] = useState<Rect | null>(null)

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    if (!canCreateConstraint || event.button !== 0) {
      return
    }

    const point = getSvgPoint(event)
    dragStartRef.current = point
    setDraftRect({ x: point.x, y: point.y, width: 1, height: 1 })
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const start = dragStartRef.current

    if (!start) {
      return
    }

    setDraftRect(normalizeRect(start, getSvgPoint(event)))
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    const rect = draftRect
    dragStartRef.current = null
    setDraftRect(null)

    if (!rect || rect.width < 24 || rect.height < 24) {
      return
    }

    event.currentTarget.releasePointerCapture(event.pointerId)
    onCreateConstraint(rect)
  }

  function getSvgPoint(event: PointerEvent<SVGSVGElement>): Point {
    const bounds = svgRef.current?.getBoundingClientRect()

    if (!bounds) {
      return { x: 0, y: 0 }
    }

    return {
      x: Math.round(((event.clientX - bounds.left) / bounds.width) * PLAN_VIEWBOX.width),
      y: Math.round(((event.clientY - bounds.top) / bounds.height) * PLAN_VIEWBOX.height),
    }
  }

  return (
    <Card className="rounded-lg border-border/70 bg-card py-4 shadow-sm">
      <CardHeader className="gap-1 px-4">
        <CardTitle className="text-base">M-204 Mechanical Plan</CardTitle>
        <p className="text-sm text-muted-foreground">{issue.location}</p>
      </CardHeader>
      <CardContent className="px-4">
        <svg
          ref={svgRef}
          role="img"
          aria-label="Level 4 mechanical plan showing duct D22 intersecting beam B14 and any active constraint rectangle."
          viewBox={`0 0 ${PLAN_VIEWBOX.width} ${PLAN_VIEWBOX.height}`}
          className="aspect-[1.46] w-full touch-none rounded-lg border border-border bg-[#f8faf5] shadow-inner"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <defs>
            <pattern id="plan-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#dbe3d4" strokeWidth="1" />
            </pattern>
            <marker id="route-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#b45309" />
            </marker>
          </defs>

          <rect width={PLAN_VIEWBOX.width} height={PLAN_VIEWBOX.height} fill="url(#plan-grid)" />
          <g id="walls" fill="none" stroke="#54615a" strokeWidth="4">
            <rect x="72" y="72" width="620" height="338" />
            <path d="M378 72 V410" />
            <path d="M72 338 H692" />
            <path d="M482 338 V410" />
          </g>

          <text x="96" y="112" className="fill-muted-foreground text-[15px] font-medium">
            ROOM-M401
          </text>
          <text x="426" y="112" className="fill-muted-foreground text-[15px] font-medium">
            CORRIDOR-C3
          </text>

          {elements.map((element) => (
            <PlanElement key={element.id} element={element} />
          ))}

          <g id="resolution-overlays">
            {options.map((option) => {
              const isPreviewed = option.id === previewOptionId

              return (
                <polyline
                  key={option.routeOverlay.id}
                  points={routeToSvgPoints(option.routeOverlay)}
                  fill="none"
                  stroke={isPreviewed ? "#b45309" : "#94a38c"}
                  strokeDasharray={option.revision > 1 ? "0" : "10 8"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={isPreviewed ? 8 : 4}
                  opacity={isPreviewed ? 0.98 : 0.34}
                  markerEnd={isPreviewed ? "url(#route-arrow)" : undefined}
                >
                  <title>{option.routeOverlay.label}</title>
                </polyline>
              )
            })}
          </g>

          <g id="user-constraints">
            {constraints.map((constraint) => (
              <ConstraintRect key={constraint.id} rect={constraint.geometry} label={constraint.label} />
            ))}
            {draftRect ? <ConstraintRect rect={draftRect} label="Draft constraint" draft /> : null}
          </g>

          <g id="issue-pin">
            <circle cx="454" cy="250" r="22" fill="#dc2626" opacity="0.14" />
            <circle cx="454" cy="250" r="8" fill="#dc2626" />
            <text x="470" y="245" className="fill-red-800 text-[13px] font-semibold">
              Clash
            </text>
            <text x="470" y="264" className="fill-red-800 text-[12px]">
              D22 / B14
            </text>
          </g>
        </svg>
      </CardContent>
    </Card>
  )
}

function PlanElement({ element }: { element: DrawingElement }) {
  const rect = element.geometry

  if (element.id === "DUCT-D22") {
    return (
      <rect
        data-element-id={element.id}
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        rx="5"
        fill="#60a5fa"
        opacity="0.72"
      >
        <title>{element.label}</title>
      </rect>
    )
  }

  if (element.id === "BEAM-B14") {
    return (
      <rect
        data-element-id={element.id}
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        rx="3"
        fill="#334155"
        opacity="0.9"
      >
        <title>{element.label}</title>
      </rect>
    )
  }

  if (element.id === "RISER-E04") {
    return (
      <rect
        data-element-id={element.id}
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        rx="6"
        fill="#facc15"
        stroke="#854d0e"
        strokeWidth="2"
        opacity="0.78"
      >
        <title>{element.label}</title>
      </rect>
    )
  }

  return null
}

function ConstraintRect({
  rect,
  label,
  draft = false,
}: {
  rect: Rect
  label: string
  draft?: boolean
}) {
  return (
    <g>
      <rect
        x={rect.x}
        y={rect.y}
        width={rect.width}
        height={rect.height}
        rx="4"
        fill={draft ? "#fb923c" : "#f97316"}
        fillOpacity={draft ? 0.18 : 0.26}
        stroke={draft ? "#ea580c" : "#c2410c"}
        strokeDasharray={draft ? "8 6" : "0"}
        strokeWidth="3"
      />
      <text x={rect.x + 8} y={rect.y + 22} className="fill-orange-950 text-[13px] font-semibold">
        {label}
      </text>
    </g>
  )
}
