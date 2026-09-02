import { useEffect, useState } from "react"
import { Keyboard, SquareDashedMousePointer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { clampRectToPlan, type Rect } from "@/src/domain/decision"

type ConstraintControlsProps = {
  disabled: boolean
  label: string
  defaultGeometry: Rect
  hasConstraint: boolean
  onLabelChange: (label: string) => void
  onSubmit: (geometry: Rect) => void
}

export function ConstraintControls({
  disabled,
  label,
  defaultGeometry,
  hasConstraint,
  onLabelChange,
  onSubmit,
}: ConstraintControlsProps) {
  const [geometry, setGeometry] = useState(defaultGeometry)

  useEffect(() => {
    setGeometry(defaultGeometry)
  }, [defaultGeometry])

  function updateGeometry(field: keyof Rect, value: string) {
    const parsedValue = Number(value)

    if (!Number.isFinite(parsedValue)) {
      return
    }

    setGeometry((current) =>
      clampRectToPlan({
        ...current,
        [field]: parsedValue,
      }),
    )
  }

  return (
    <Card className="rounded-lg border-border/70 bg-card py-4 shadow-sm">
      <CardHeader className="gap-1 px-4">
        <div className="flex items-center gap-2">
          <SquareDashedMousePointer aria-hidden="true" className="size-4 text-primary" />
          <CardTitle className="text-base">Human Constraint</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 px-4">
        <div className="grid gap-2">
          <Label htmlFor="constraint-label">Label</Label>
          <Input
            id="constraint-label"
            value={label}
            disabled={disabled}
            maxLength={60}
            onChange={(event) => onLabelChange(event.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <NumberField label="X" value={geometry.x} disabled={disabled} onChange={(value) => updateGeometry("x", value)} />
          <NumberField label="Y" value={geometry.y} disabled={disabled} onChange={(value) => updateGeometry("y", value)} />
          <NumberField label="W" value={geometry.width} disabled={disabled} onChange={(value) => updateGeometry("width", value)} />
          <NumberField label="H" value={geometry.height} disabled={disabled} onChange={(value) => updateGeometry("height", value)} />
        </div>

        <Button
          type="button"
          className="w-fit rounded-lg"
          disabled={disabled}
          onClick={() => onSubmit(geometry)}
        >
          <Keyboard aria-hidden="true" />
          {hasConstraint ? "Replace CONSTRAINT-12" : "Create CONSTRAINT-12"}
        </Button>
      </CardContent>
    </Card>
  )
}

function NumberField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string
  value: number
  disabled: boolean
  onChange: (value: string) => void
}) {
  const id = `constraint-${label.toLowerCase()}`

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        value={value}
        disabled={disabled}
        min={0}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
