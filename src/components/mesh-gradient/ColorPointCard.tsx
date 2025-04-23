"use client"

import { ColorPoint } from "./utils"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

interface ColorPointCardProps {
  point: ColorPoint
  index: number
  updateColorPoint: (id: string, field: keyof ColorPoint, value: string | number) => void
  removeColorPoint: (id: string) => void
}

export function ColorPointCard({
  point,
  index,
  updateColorPoint,
  removeColorPoint,
}: ColorPointCardProps) {
  return (
    <Card
      className="border-2"
      style={{ borderColor: point.color }}
    >
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor={`color-${point.id}`} className="mb-2 block">
              Color {index + 1}
            </Label>
            <div className="flex gap-2">
              <Input
                id={`color-${point.id}`}
                type="text"
                value={point.color}
                onChange={(e) => updateColorPoint(point.id, "color", e.target.value)}
                className="flex-1"
              />
              <Input
                type="color"
                value={point.color.startsWith("#") ? point.color : "#ff0000"}
                onChange={(e) => updateColorPoint(point.id, "color", e.target.value)}
                className="w-12 p-1 h-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor={`blur-${point.id}`} className="mb-2 block">
              Blur: {point.blur}%
            </Label>
            <Slider
              id={`blur-${point.id}`}
              min={10}
              max={100}
              step={1}
              value={[point.blur]}
              onValueChange={(value) => updateColorPoint(point.id, "blur", value[0])}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          
        <div className="text-sm text-gray-500">
            Position: X: {point.x.toFixed(1)}%, Y: {point.y.toFixed(1)}%
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-700 hover:bg-red-100"
            onClick={() => removeColorPoint(point.id)}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Remove
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 