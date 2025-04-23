"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { ModeToggle } from '@/components/ui/mode-toggle'
import { Slider } from "@/components/ui/slider"

// Import utility functions and types
import {
  ColorPoint,
  getRandomColor,
  getRandomPosition,
  generateId,
  generateGradientCSS,
  extractColorsFromText,
  extractGradients
} from "./utils"

// Import components
import { ColorPointCard } from "./ColorPointCard"
import { GradientPreview } from "./GradientPreview"
import { CssCodeDisplay } from "./CssCodeDisplay"
import { ImportDialog } from "./ImportDialog"
import { ParseColorsDialog } from "./ParseColorsDialog"

// Default blur value
const DEFAULT_BLUR = 75

export default function MeshGradientGenerator() {
  // State for our color points
  const [colorPoints, setColorPoints] = useState<ColorPoint[]>([])

  // State for the CSS code
  const [cssCode, setCssCode] = useState("")

  // State for the active tab
  const [activeTab, setActiveTab] = useState("preview")

  // State for tracking which point is being dragged
  const [draggedPointId, setDraggedPointId] = useState<string | null>(null)

  // State to track if component is mounted (client-side)
  const [isMounted, setIsMounted] = useState(false)

  // State for the global blur value
  const [globalBlur, setGlobalBlur] = useState(DEFAULT_BLUR)

  // Temporary state for dragging to avoid re-renders
  const dragPositionRef = useRef({ x: 0, y: 0 })

  // Ref for animation frame
  const animationFrameRef = useRef<number | null>(null)

  // Ref to store colorPoints for access in callbacks
  const colorPointsRef = useRef(colorPoints)

  // Update the ref when colorPoints changes
  useEffect(() => {
    colorPointsRef.current = colorPoints
  }, [colorPoints])

  // Set isMounted to true when component mounts (client-side only)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize color points on client-side only
  useEffect(() => {
    if (isMounted && colorPoints.length === 0) {
      setColorPoints([
        { id: generateId(), color: "#99d53d", x: 22.9, y: 17.1, blur: DEFAULT_BLUR },
        { id: generateId(), color: "#0a4daf", x: 82.7, y: 11.8, blur: DEFAULT_BLUR },
        { id: generateId(), color: "#233201", x: 84.6, y: 68.6, blur: DEFAULT_BLUR },
        { id: generateId(), color: "#cd26a6", x: 31.9, y: 66.1, blur: DEFAULT_BLUR },
      ])
    }
  }, [isMounted, colorPoints.length])

  // Update CSS code when color points change
  useEffect(() => {
    const gradientCSS = generateGradientCSS(colorPoints)
    const css = `background-image: ${gradientCSS};
background-attachment: fixed;
min-height: 100vh;`
    setCssCode(css)
  }, [colorPoints])

  // Apply global blur to all color points
  const applyGlobalBlur = useCallback((blur: number) => {
    setGlobalBlur(blur)
    setColorPoints((prevPoints) =>
      prevPoints.map((point) => ({
        ...point,
        blur,
      }))
    )
  }, [])

  // Add extracted colors to the gradient
  const handleParseColors = useCallback((colorText: string, replaceExisting: boolean) => {
    const colors = extractColorsFromText(colorText)

    if (colors.length === 0) {
      toast({
        title: "No colors found",
        description: "Couldn't find any valid colors in the text.",
        variant: "destructive",
      })
      return
    }

    const newColorPoints = colors.map((color) => ({
      id: generateId(),
      color,
      x: getRandomPosition(),
      y: getRandomPosition(),
      blur: DEFAULT_BLUR,
    }))

    if (replaceExisting) {
      setColorPoints(newColorPoints)
      toast({
        title: "Colors replaced",
        description: `Replaced with ${colors.length} new colors.`,
      })
    } else {
      setColorPoints((prevPoints) => [...prevPoints, ...newColorPoints])
      toast({
        title: "Colors added",
        description: `Added ${colors.length} colors to your gradient.`,
      })
    }
  }, [])

  // Add a new color point
  const addColorPoint = useCallback(() => {
    setColorPoints((prevPoints) => [
      ...prevPoints,
      {
        id: generateId(),
        color: getRandomColor(),
        x: getRandomPosition(),
        y: getRandomPosition(),
        blur: globalBlur,
      },
    ])
  }, [globalBlur])

  // Remove a color point
  const removeColorPoint = useCallback((id: string) => {
    setColorPoints((prevPoints) => {
      if (prevPoints.length <= 2) {
        toast({
          title: "Cannot remove",
          description: "You need at least 2 color points for a gradient.",
          variant: "destructive",
        })
        return prevPoints
      }
      return prevPoints.filter((point) => point.id !== id)
    })
  }, [])

  // Update a color point
  const updateColorPoint = useCallback((id: string, field: keyof ColorPoint, value: string | number) => {
    setColorPoints((prevPoints) =>
      prevPoints.map((point) => {
        if (point.id === id) {
          return { ...point, [field]: value }
        }
        return point
      }),
    )
  }, [])

  // Randomize all colors
  const randomizeColors = useCallback(() => {
    setColorPoints((prevPoints) =>
      prevPoints.map((point) => ({
        ...point,
        color: getRandomColor(),
      })),
    )
  }, [])

  // Randomize all positions
  const randomizePositions = useCallback(() => {
    setColorPoints((prevPoints) =>
      prevPoints.map((point) => ({
        ...point,
        x: getRandomPosition(),
        y: getRandomPosition(),
      })),
    )
  }, [])

  // Randomize everything
  const randomizeAll = useCallback(() => {
    randomizeColors()
    randomizePositions()
  }, [randomizeColors, randomizePositions])

  // Handle mouse down on a point
  const handlePointMouseDown = useCallback((id: string, e: React.MouseEvent) => {
    e.preventDefault()
    setDraggedPointId(id)

    // Find the initial position of the point
    const point = colorPointsRef.current.find((p) => p.id === id)
    if (point) {
      dragPositionRef.current = { x: point.x, y: point.y }
    }
  }, [])

  // Update point position with animation frame
  const updatePointPosition = useCallback(() => {
    if (!draggedPointId) return

    setColorPoints((prevPoints) =>
      prevPoints.map((point) => {
        if (point.id === draggedPointId) {
          return {
            ...point,
            x: dragPositionRef.current.x,
            y: dragPositionRef.current.y,
          }
        }
        return point
      }),
    )
  }, [draggedPointId])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (draggedPointId) {
      // Ensure final position is updated
      updatePointPosition()
      setDraggedPointId(null)

      // Cancel any pending animation frame
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [draggedPointId, updatePointPosition])

  // Add event listeners for mouse up
  useEffect(() => {
    if (draggedPointId) {
      window.addEventListener("mouseup", handleMouseUp)
      return () => {
        window.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [draggedPointId, handleMouseUp])

  // Clean up any animation frames on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  // Parse gradient CSS and update color points
  const importGradient = useCallback((importText: string) => {
    try {
      // Clean up the input text but preserve structure
      const cleanedText = importText.trim()

      // Extract just the gradient part if there's a background property
      let gradientCSS = cleanedText
      const backgroundMatch = cleanedText.match(/background(?:-image)?\s*:\s*([^;]+)/i)
      if (backgroundMatch && backgroundMatch[1]) {
        gradientCSS = backgroundMatch[1].trim()
      }

      // Simple parsing approach: find all radial gradients
      const results: Array<{ x: number, y: number, color: string, blur: number }> = []

      // First normalize the CSS by replacing newlines and excess spaces
      const normalizedCSS = gradientCSS.replace(/\n/g, ' ').replace(/\s+/g, ' ')

      // Extract all gradients
      const gradientDefinitions = extractGradients(normalizedCSS)

      // Process each gradient definition
      for (const gradientDef of gradientDefinitions) {
        try {
          // Extract just the content inside the parentheses
          const contentMatch = gradientDef.match(/radial-gradient\s*\((.*)\)$/)
          if (!contentMatch) {
            continue
          }

          const content = contentMatch[1].trim()

          // Extract the position part
          const positionMatch = content.match(/at\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/)
          if (!positionMatch) {
            continue
          }

          const x = parseFloat(positionMatch[1])
          const y = parseFloat(positionMatch[2])

          // Find where the position part ends
          const positionText = positionMatch[0]
          const posEndIndex = content.indexOf(positionText) + positionText.length

          // The rest of the content after the position
          const afterPosition = content.substring(posEndIndex).trim()

          // The first part before the next comma should be our color and 0%
          const firstStop = afterPosition.startsWith(',')
            ? afterPosition.substring(1).trim().split(',')[0].trim()
            : afterPosition.split(',')[0].trim()

          // Extract the color (everything before 0%)
          const lastIndexOf0 = firstStop.lastIndexOf('0%')
          if (lastIndexOf0 === -1) {
            continue
          }

          const color = firstStop.substring(0, lastIndexOf0).trim()

          // Find the transparent stop
          const transparentMatch = content.match(/transparent\s+(\d+(?:\.\d+)?)%/)

          const blur = transparentMatch ? parseFloat(transparentMatch[1]) : DEFAULT_BLUR

          // Add the result
          results.push({ x, y, color, blur })

        } catch (error) {
          console.error("Error processing gradient:", error)
        }
      }

      // Fallback if needed
      if (results.length === 0) {
        // Last resort: try extremely loose parsing to find anything that might work
        const positionMatches = normalizedCSS.match(/at\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/g) || []
        const colorMatches = normalizedCSS.match(/(?:oklch|rgb|rgba|hsl|hsla|#[0-9a-f]{3,8})[^,)]*?(?=\s+0%)/gi) || []
        const blurMatches = normalizedCSS.match(/transparent\s+(\d+(?:\.\d+)?)%/g) || []

        // If we have positions but no colors, try more aggressive color extraction
        if (positionMatches.length > 0 && colorMatches.length === 0) {
          // Use a looser regex for OKLCH specifically
          const oklchMatches = normalizedCSS.match(/oklch\s*\([^)]+\)/g) || []

          // If we found OKLCH colors, use them
          if (oklchMatches.length > 0) {
            // Use these colors instead
            for (let i = 0; i < Math.min(positionMatches.length, oklchMatches.length); i++) {
              const posMatch = positionMatches[i].match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/)
              if (!posMatch) continue

              // For blur, either use a match or default to default blur
              const blur = i < blurMatches.length
                ? parseFloat(blurMatches[i].match(/(\d+(?:\.\d+)?)%/)?.[1] || DEFAULT_BLUR.toString())
                : DEFAULT_BLUR

              results.push({
                x: parseFloat(posMatch[1]),
                y: parseFloat(posMatch[2]),
                color: oklchMatches[i].trim(),
                blur: blur
              })
            }
          }
        } else if (positionMatches.length > 0 && colorMatches.length > 0) {
          // If we have both positions and colors, try to pair them
          const count = Math.min(positionMatches.length, colorMatches.length)

          for (let i = 0; i < count; i++) {
            const posMatch = positionMatches[i].match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/)
            if (!posMatch) continue

            // For blur, either use a match or default to default blur
            const blur = i < blurMatches.length
              ? parseFloat(blurMatches[i].match(/(\d+(?:\.\d+)?)%/)?.[1] || DEFAULT_BLUR.toString())
              : DEFAULT_BLUR

            results.push({
              x: parseFloat(posMatch[1]),
              y: parseFloat(posMatch[2]),
              color: colorMatches[i].trim(),
              blur: blur
            })
          }
        }
      }

      if (results.length === 0) {
        throw new Error("No valid mesh gradients found. Make sure each gradient includes position, color and transparency values.")
      }

      // Create color points
      const newColorPoints = results.map(result => ({
        id: generateId(),
        x: result.x,
        y: result.y,
        color: result.color,
        blur: result.blur
      }))

      // Update the state
      setColorPoints(newColorPoints)

      toast({
        title: "Gradient imported",
        description: `Successfully imported ${newColorPoints.length} color points.`,
      })
    } catch (error) {
      console.error("Import failed:", error)
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Could not parse the gradient CSS.",
        variant: "destructive",
      })
    }
  }, [])

  // Only render the full component on the client side
  if (!isMounted) {
    return <div className="w-full h-64 rounded-lg shadow-md bg-gray-100 dark:bg-gray-800"></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <h1 className="text-2xl font-bold font-mono">CSS Mesh Gradient Generator</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <ImportDialog onImport={importGradient} />
          <ModeToggle />
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-3/4">
          <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">CSS Code</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="space-y-4">
              <GradientPreview
                colorPoints={colorPoints}
                draggedPointId={draggedPointId}
                setDraggedPointId={setDraggedPointId}
                dragPositionRef={dragPositionRef}
                animationFrameRef={animationFrameRef}
                updatePointPosition={updatePointPosition}
                handlePointMouseDown={handlePointMouseDown}
              />
            </TabsContent>

            <TabsContent value="code">
              <CssCodeDisplay cssCode={cssCode} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-between">
            <div className="flex flex-wrap gap-2 items-center">
              <h3 className="font-medium">Randomize</h3>
              <Button variant="outline" onClick={randomizeColors}>
                Colors
              </Button>
              <Button variant="outline" onClick={randomizePositions}>
                Positions
              </Button>
              <Button variant="outline" onClick={randomizeAll}>
                All
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 items-center my-4">
            <div className="font-medium">Global Blur:</div>
            <div className="grow">
              <Slider
                value={[globalBlur]}
                min={10}
                max={100}
                step={1}
                onValueChange={(values) => applyGlobalBlur(values[0])}
              />
            </div>
            <div className="text-sm">{globalBlur}%</div>
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            <div className="w-full md:w-3/4">
              <Button onClick={addColorPoint} className="w-full">
                <Plus className="h-4 w-4 mr-2" /> Add Color
              </Button>
            </div>
            <div className="w-full md:w-1/4">
              <ParseColorsDialog onParseColors={handleParseColors} />
            </div>
          </div>

          <div className="space-y-6">
            {colorPoints.map((point, index) => (
              <ColorPointCard
                key={point.id}
                point={point}
                index={index}
                updateColorPoint={updateColorPoint}
                removeColorPoint={removeColorPoint}
              />
            ))}
          </div>
        </div>
      </div>
      <Toaster />
    </div>
  )
} 