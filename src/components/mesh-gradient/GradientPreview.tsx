"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import { ColorPoint, generateGradientCSS } from "./utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface GradientPreviewProps {
  colorPoints: ColorPoint[]
  draggedPointId: string | null
  setDraggedPointId: (id: string | null) => void
  dragPositionRef: React.MutableRefObject<{ x: number; y: number }>
  animationFrameRef: React.MutableRefObject<number | null>
  updatePointPosition: () => void
  handlePointMouseDown: (id: string, e: React.MouseEvent) => void
}

export function GradientPreview({
  colorPoints,
  draggedPointId,
  dragPositionRef,
  animationFrameRef,
  updatePointPosition,
  handlePointMouseDown,
}: GradientPreviewProps) {
  const previewRef = useRef<HTMLDivElement>(null)
  const [applyToBody, setApplyToBody] = useState(false)

  // Generate the gradient CSS
  const gradientCSS = generateGradientCSS(colorPoints)

  // Style for the preview
  const previewStyle = {
    backgroundImage: gradientCSS,
    backgroundSize: "100% 100%",
  }

  // Apply gradient to body when checkbox is checked
  useEffect(() => {
    if (applyToBody) {
      document.body.style.backgroundImage = gradientCSS;
      document.body.style.backgroundSize = "100% 100%";
      document.body.style.backgroundAttachment = "fixed";
    } else {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundAttachment = "";
    }
    
    return () => {
      document.body.style.backgroundImage = "";
      document.body.style.backgroundSize = "";
      document.body.style.backgroundAttachment = "";
    };
  }, [applyToBody, gradientCSS]);

  // Handle mouse move on the preview area
  const handlePreviewMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggedPointId || !previewRef.current) return

      const rect = previewRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))

      // Update the ref directly without causing a re-render
      dragPositionRef.current = { x, y }

      // Use requestAnimationFrame to throttle updates
      if (animationFrameRef.current === null) {
        animationFrameRef.current = requestAnimationFrame(() => {
          updatePointPosition()
          animationFrameRef.current = null
        })
      }
    },
    [draggedPointId, updatePointPosition, dragPositionRef, animationFrameRef]
  )

  return (
    <div className="relative">
      <div className="flex justify-center my-2 gap-4 items-center">
        <div className="flex items-center gap-2">
          <Checkbox
            id="apply-to-body"
            checked={applyToBody}
            onCheckedChange={(checked) => setApplyToBody(checked === true)}
          />
          <Label htmlFor="apply-to-body" className="cursor-pointer">
            Full-page preview
          </Label>
        </div>
      </div>
      {!applyToBody && (
        <div
          ref={previewRef}
          className="w-full rounded-lg shadow-md transition-all duration-500 relative cursor-move h-96 md:h-192"
          style={previewStyle}
          onMouseMove={handlePreviewMouseMove}
        >
          {/* Draggable points */}
          {colorPoints.map((point) => (
            <div
              key={point.id}
              className="absolute w-6 h-6 rounded-full border-2 border-white shadow-md cursor-move transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{
                backgroundColor: point.color,
                left: `${point.x}%`,
                top: `${point.y}%`,
                zIndex: draggedPointId === point.id ? 10 : 1,
              }}
              onMouseDown={(e) => handlePointMouseDown(point.id, e)}
            >
              <span className="text-xs text-white font-bold drop-shadow-md">
                {colorPoints.findIndex((p) => p.id === point.id) + 1}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 