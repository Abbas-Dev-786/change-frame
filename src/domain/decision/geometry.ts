import { PLAN_VIEWBOX } from "./initial-state"
import type { PlanViewBox, Point, Rect, RouteOverlay } from "./types"

export function clampRectToPlan(rect: Rect, viewBox: PlanViewBox = PLAN_VIEWBOX): Rect {
  const width = Math.max(24, Math.min(rect.width, viewBox.width))
  const height = Math.max(24, Math.min(rect.height, viewBox.height))
  const x = Math.max(0, Math.min(rect.x, viewBox.width - width))
  const y = Math.max(0, Math.min(rect.y, viewBox.height - height))

  return {
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(width),
    height: Math.round(height),
  }
}

export function normalizeRect(start: Point, end: Point, viewBox: PlanViewBox = PLAN_VIEWBOX): Rect {
  return clampRectToPlan({
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }, viewBox)
}

export function routeIntersectsRect(route: RouteOverlay, rect: Rect): boolean {
  return route.points.some((point, index) => {
    const nextPoint = route.points[index + 1]

    if (!nextPoint) {
      return false
    }

    return segmentIntersectsRect(point, nextPoint, rect)
  })
}

export function rectContainsPoint(rect: Rect, point: Point): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

export function routeToSvgPoints(route: RouteOverlay): string {
  return route.points.map((point) => `${point.x},${point.y}`).join(" ")
}

function segmentIntersectsRect(start: Point, end: Point, rect: Rect): boolean {
  if (rectContainsPoint(rect, start) || rectContainsPoint(rect, end)) {
    return true
  }

  const topLeft = { x: rect.x, y: rect.y }
  const topRight = { x: rect.x + rect.width, y: rect.y }
  const bottomRight = { x: rect.x + rect.width, y: rect.y + rect.height }
  const bottomLeft = { x: rect.x, y: rect.y + rect.height }

  return (
    segmentsIntersect(start, end, topLeft, topRight) ||
    segmentsIntersect(start, end, topRight, bottomRight) ||
    segmentsIntersect(start, end, bottomRight, bottomLeft) ||
    segmentsIntersect(start, end, bottomLeft, topLeft)
  )
}

function segmentsIntersect(a: Point, b: Point, c: Point, d: Point): boolean {
  const directionA = orientation(a, b, c)
  const directionB = orientation(a, b, d)
  const directionC = orientation(c, d, a)
  const directionD = orientation(c, d, b)

  if (directionA !== directionB && directionC !== directionD) {
    return true
  }

  return (
    (directionA === 0 && onSegment(a, c, b)) ||
    (directionB === 0 && onSegment(a, d, b)) ||
    (directionC === 0 && onSegment(c, a, d)) ||
    (directionD === 0 && onSegment(c, b, d))
  )
}

function orientation(a: Point, b: Point, c: Point): -1 | 0 | 1 {
  const value = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y)

  if (Math.abs(value) < Number.EPSILON) {
    return 0
  }

  return value > 0 ? 1 : -1
}

function onSegment(a: Point, b: Point, c: Point): boolean {
  return (
    b.x <= Math.max(a.x, c.x) &&
    b.x >= Math.min(a.x, c.x) &&
    b.y <= Math.max(a.y, c.y) &&
    b.y >= Math.min(a.y, c.y)
  )
}
