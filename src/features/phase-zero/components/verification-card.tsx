import type { ReactNode } from "react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type VerificationCardProps = {
  index: string
  title: string
  children: ReactNode
}

export function VerificationCard({
  index,
  title,
  children,
}: VerificationCardProps) {
  return (
    <Card className="h-full rounded-none border-0 bg-transparent py-8 shadow-none ring-0 md:px-2">
      <CardHeader>
        <p className="text-xs font-extrabold tracking-[0.13em] text-orange-700 uppercase">
          {index}
        </p>
        <CardTitle className="text-2xl font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm leading-7 text-muted-foreground">
        {children}
      </CardContent>
    </Card>
  )
}
