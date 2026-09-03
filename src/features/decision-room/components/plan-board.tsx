import { useRef, useState, type PointerEvent } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PLAN_VIEWBOX,
  baseResolutionOptionsFixture,
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
  const previewedOption = options.find((option) => option.id === previewOptionId)
  const baselineRoute = previewedOption?.revision && previewedOption.revision > 1
    ? baseResolutionOptionsFixture.find((option) => option.id === previewedOption.id)?.routeOverlay
    : null

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

    releasePointerCapture(event)

    if (!rect || rect.width < 24 || rect.height < 24) {
      return
    }

    onCreateConstraint(rect)
  }

  function handlePointerCancel(event: PointerEvent<SVGSVGElement>) {
    dragStartRef.current = null
    setDraftRect(null)
    releasePointerCapture(event)
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
        <h2 className="text-base font-semibold">M-204 Mechanical Plan</h2>
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
          onPointerCancel={handlePointerCancel}
        >
          <defs>
            <pattern id="plan-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#dbe3d4" strokeWidth="1" />
            </pattern>
            <marker id="route-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#b45309" />
            </marker>
            <marker id="route-arrow-revised" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
              <path d="M0,0 L0,6 L8,3 z" fill="#15803d" />
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
            {baselineRoute ? (
              <polyline
                data-route-state="before"
                points={routeToSvgPoints(baselineRoute)}
                fill="none"
                stroke="#dc2626"
                strokeDasharray="10 8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="5"
                opacity="0.45"
              >
                <title>Before revision: {baselineRoute.label}</title>
              </polyline>
            ) : null}
            {options.map((option) => {
              const isPreviewed = option.id === previewOptionId
              const isRevisedPreview = isPreviewed && option.revision > 1

              return (
                <polyline
                  key={option.routeOverlay.id}
                  data-route-state={isRevisedPreview ? "after" : "candidate"}
                  points={routeToSvgPoints(option.routeOverlay)}
                  fill="none"
                  stroke={isRevisedPreview ? "#15803d" : isPreviewed ? "#b45309" : "#94a38c"}
                  strokeDasharray={option.revision > 1 ? "0" : "10 8"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={isPreviewed ? 8 : 4}
                  opacity={isPreviewed ? 0.98 : 0.34}
                  markerEnd={isPreviewed ? `url(#${isRevisedPreview ? "route-arrow-revised" : "route-arrow"})` : undefined}
                  className={isRevisedPreview ? "route-morph-after" : undefined}
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
        {baselineRoute && previewedOption ? (
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs" aria-label="Route comparison legend">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="w-8 border-t-2 border-dashed border-red-600/70" aria-hidden="true" />
              Before · field constraint conflict
            </span>
            <span className="flex items-center gap-2 font-medium text-emerald-800">
              <span className="w-8 border-t-[3px] border-emerald-700" aria-hidden="true" />
              After · {previewedOption.id} revision {previewedOption.revision} clears constraint
            </span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function releasePointerCapture(event: PointerEvent<SVGSVGElement>): void {
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId)
  }
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
