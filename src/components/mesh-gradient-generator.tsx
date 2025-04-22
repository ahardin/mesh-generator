"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy, Plus, Trash2, Shuffle, FileText, Import } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { Textarea } from "@/components/ui/textarea"
import { ModeToggle } from '@/components/ui/mode-toggle'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Type for a color point in our gradient
interface ColorPoint {
  id: string
  color: string
  x: number
  y: number
  blur: number
}

// Generate a random color in hex format
const getRandomColor = () => {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0")}`
}

// Generate a random position between 0 and 100
const getRandomPosition = () => {
  return Math.floor(Math.random() * 101)
}

// Generate a unique ID
const generateId = () => {
  return Math.random().toString(36).substring(2, 9)
}

export default function MeshGradientGenerator() {
  // State for our color points
  const [colorPoints, setColorPoints] = useState<ColorPoint[]>([])

  // State for the CSS code
  const [cssCode, setCssCode] = useState("")

  // State for the active tab
  const [activeTab, setActiveTab] = useState("preview")

  // State for tracking which point is being dragged
  const [draggedPointId, setDraggedPointId] = useState<string | null>(null)

  // State for color parsing dialog
  const [isParseDialogOpen, setIsParseDialogOpen] = useState(false)
  const [colorText, setColorText] = useState("")

  // State to track if component is mounted (client-side)
  const [isMounted, setIsMounted] = useState(false)

  // Temporary state for dragging to avoid re-renders
  const dragPositionRef = useRef({ x: 0, y: 0 })

  // Ref for animation frame
  const animationFrameRef = useRef<number | null>(null)

  // Ref for the preview area
  const previewRef = useRef<HTMLDivElement>(null)

  // Ref to store colorPoints for access in callbacks
  const colorPointsRef = useRef(colorPoints)

  // State for import dialog
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importText, setImportText] = useState("")

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
        { id: generateId(), color: "#ff5e62", x: 0, y: 0, blur: 50 },
        { id: generateId(), color: "#ff9966", x: 100, y: 0, blur: 50 },
        { id: generateId(), color: "#6a82fb", x: 100, y: 100, blur: 50 },
        { id: generateId(), color: "#fc5c7d", x: 0, y: 100, blur: 50 },
      ])
    }
  }, [isMounted, colorPoints.length])

  // Generate the CSS code for the gradient - memoized to avoid recalculation
  const generateGradientCSS = useCallback((points: ColorPoint[]) => {
    return points
      .map((point) => {
        return `radial-gradient(at ${point.x}% ${point.y}%, ${point.color} 0%, transparent ${point.blur}%)`
      })
      .join(", ")
  }, [])

  // Memoize the gradient CSS
  const gradientCSS = useMemo(() => {
    return generateGradientCSS(colorPoints)
  }, [colorPoints, generateGradientCSS])

  // Memoize the preview style to prevent unnecessary recalculations
  const previewStyle = useMemo(() => {
    return {
      backgroundImage: gradientCSS,
      backgroundAttachment: "fixed",
    }
  }, [gradientCSS])

  // Update CSS code when gradient changes
  useEffect(() => {
    const css = `background-image: ${gradientCSS};
background-attachment: fixed;
min-height: 100vh;`
    setCssCode(css)
  }, [gradientCSS])

  // Extract colors from text
  const extractColorsFromText = useCallback((text: string): string[] => {
    const colorFormats = [
      // Hex colors
      /#([0-9A-Fa-f]{3}){1,2}\b/g,
      // RGB/RGBA colors
      /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)/g,
      // HSL/HSLA colors
      /hsla?\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(?:,\s*[\d.]+\s*)?\)/g,
      // OKLCH colors
      /oklch\(\s*[\d.]+%\s+[\d.]+\s+[\d.]+(?:deg)?\s*\)/g,
    ]

    // Find CSS variables with color values
    const cssVarRegex = /--[\w-]+:\s*((?:#[0-9A-Fa-f]+|rgba?|hsla?|oklch)\([^)]+\)|#[0-9A-Fa-f]+);/g
    let matches = [...text.matchAll(cssVarRegex)].map((match) => match[1])

    // Add direct color matches
    colorFormats.forEach((format) => {
      const directMatches = text.match(format)
      if (directMatches) {
        matches = [...matches, ...directMatches]
      }
    })

    // Remove duplicates and return
    return [...new Set(matches)]
  }, [])

  // Add extracted colors to the gradient
  const addExtractedColors = useCallback((colors: string[]) => {
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
      blur: 50,
    }))

    setColorPoints((prevPoints) => [...prevPoints, ...newColorPoints])

    toast({
      title: "Colors added",
      description: `Added ${colors.length} colors to your gradient.`,
    })

    setIsParseDialogOpen(false)
    setColorText("")
  }, [])

  // Handle parse colors button click
  const handleParseColors = useCallback(() => {
    const colors = extractColorsFromText(colorText)
    addExtractedColors(colors)
  }, [colorText, extractColorsFromText, addExtractedColors])

  // Add a new color point
  const addColorPoint = useCallback(() => {
    setColorPoints((prevPoints) => [
      ...prevPoints,
      {
        id: generateId(),
        color: getRandomColor(),
        x: getRandomPosition(),
        y: getRandomPosition(),
        blur: 50,
      },
    ])
  }, [])

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

  // Copy CSS to clipboard
  const copyCss = useCallback(() => {
    navigator.clipboard.writeText(cssCode)
    toast({
      title: "Copied!",
      description: "CSS code copied to clipboard.",
    })
  }, [cssCode])

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

  // Handle mouse move on the preview area - optimized with throttling
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
    [draggedPointId, updatePointPosition],
  )

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
  const importGradient = useCallback(() => {
    try {
      // Log the exact input for debugging
      console.log("Raw import text:", JSON.stringify(importText));
      
      // Clean up the input text but preserve structure
      const cleanedText = importText.trim();
      
      // Extract just the gradient part if there's a background property
      let gradientCSS = cleanedText;
      const backgroundMatch = cleanedText.match(/background(?:-image)?\s*:\s*([^;]+)/i);
      if (backgroundMatch && backgroundMatch[1]) {
        gradientCSS = backgroundMatch[1].trim();
        console.log("Found background property:", gradientCSS);
      }
      
      // Simple parsing approach: find all radial gradients
      const results: Array<{x: number, y: number, color: string, blur: number}> = [];
      
      // First normalize the CSS by replacing newlines and excess spaces
      const normalizedCSS = gradientCSS.replace(/\n/g, ' ').replace(/\s+/g, ' ');
      console.log("Normalized CSS:", normalizedCSS);
      
      // Regex to extract radial gradients, handling nested parentheses properly
      // This is the key improvement for OKLCH colors
      const extractGradients = (css: string) => {
        const gradients: string[] = [];
        let depth = 0;
        let start = -1;
        
        // Find each radial-gradient with proper nesting of parentheses
        for (let i = 0; i < css.length; i++) {
          // Start of a gradient
          if (css.substring(i, i + 16) === 'radial-gradient(' && depth === 0) {
            start = i;
            depth++;
            i += 15; // Skip to after the opening parenthesis
            continue;
          }
          
          // Track parenthesis depth
          if (css[i] === '(' && start !== -1) {
            depth++;
          } else if (css[i] === ')' && start !== -1) {
            depth--;
            
            // End of the gradient when we get back to depth 0
            if (depth === 0) {
              gradients.push(css.substring(start, i + 1));
              start = -1;
            }
          }
        }
        
        return gradients;
      };
      
      const gradientDefinitions = extractGradients(normalizedCSS);
      console.log("Extracted gradient definitions:", gradientDefinitions);
      
      // Process each gradient definition
      for (const gradientDef of gradientDefinitions) {
        try {
          console.log("Processing gradient:", gradientDef);
          
          // Extract just the content inside the parentheses
          const contentMatch = gradientDef.match(/radial-gradient\s*\((.*)\)$/);
          if (!contentMatch) {
            console.log("Couldn't extract gradient content");
            continue;
          }
          
          const content = contentMatch[1].trim();
          console.log("Gradient content:", content);
          
          // Extract the position part
          const positionMatch = content.match(/at\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
          if (!positionMatch) {
            console.log("No position match found");
            continue;
          }
          
          const x = parseFloat(positionMatch[1]);
          const y = parseFloat(positionMatch[2]);
          console.log("Position extracted:", x, y);
          
          // Find where the position part ends
          const positionText = positionMatch[0];
          const posEndIndex = content.indexOf(positionText) + positionText.length;
          
          // The rest of the content after the position
          const afterPosition = content.substring(posEndIndex).trim();
          console.log("After position:", afterPosition);
          
          // The first part before the next comma should be our color and 0%
          const firstStop = afterPosition.startsWith(',') 
            ? afterPosition.substring(1).trim().split(',')[0].trim() 
            : afterPosition.split(',')[0].trim();
            
          console.log("First stop:", firstStop);
          
          // Extract the color (everything before 0%)
          const lastIndexOf0 = firstStop.lastIndexOf('0%');
          if (lastIndexOf0 === -1) {
            console.log("No 0% found in first stop");
            continue;
          }
          
          const color = firstStop.substring(0, lastIndexOf0).trim();
          console.log("Color extracted:", color);
          
          // Find the transparent stop
          const transparentMatch = content.match(/transparent\s+(\d+(?:\.\d+)?)%/);
          if (!transparentMatch) {
            console.log("No transparent stop found, using default 50%");
          }
          
          const blur = transparentMatch ? parseFloat(transparentMatch[1]) : 50;
          console.log("Blur value:", blur);
          
          // Add the result
          results.push({ x, y, color, blur });
          console.log("Added gradient:", { x, y, color, blur });
          
        } catch (error) {
          console.error("Error processing gradient:", error);
        }
      }
      
      // Fallback if needed
      if (results.length === 0) {
        console.warn("No gradients found with normal parsing. Using fallback...");
        
        // Last resort: try extremely loose parsing to find anything that might work
        const positionMatches = normalizedCSS.match(/at\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/g) || [];
        const colorMatches = normalizedCSS.match(/(?:oklch|rgb|rgba|hsl|hsla|#[0-9a-f]{3,8})[^,)]*?(?=\s+0%)/gi) || [];
        const blurMatches = normalizedCSS.match(/transparent\s+(\d+(?:\.\d+)?)%/g) || [];
        
        console.log("Fallback found:", {
          positions: positionMatches.length > 0 ? positionMatches : "none",
          colors: colorMatches.length > 0 ? colorMatches : "none",
          blurs: blurMatches.length > 0 ? blurMatches : "none"
        });
        
        // If we have positions but no colors, try more aggressive color extraction
        if (positionMatches.length > 0 && colorMatches.length === 0) {
          // Use a looser regex for OKLCH specifically
          const oklchMatches = normalizedCSS.match(/oklch\s*\([^)]+\)/g) || [];
          console.log("Found OKLCH colors with looser regex:", oklchMatches);
          
          // If we found OKLCH colors, use them
          if (oklchMatches.length > 0) {
            // Use these colors instead
            for (let i = 0; i < Math.min(positionMatches.length, oklchMatches.length); i++) {
              const posMatch = positionMatches[i].match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
              if (!posMatch) continue;
              
              // For blur, either use a match or default to 50%
              const blur = i < blurMatches.length 
                ? parseFloat(blurMatches[i].match(/(\d+(?:\.\d+)?)%/)?.[1] || "50") 
                : 50;
              
              results.push({
                x: parseFloat(posMatch[1]),
                y: parseFloat(posMatch[2]),
                color: oklchMatches[i].trim(),
                blur: blur
              });
              
              console.log("Added from OKLCH fallback:", {
                x: parseFloat(posMatch[1]),
                y: parseFloat(posMatch[2]),
                color: oklchMatches[i].trim(),
                blur: blur
              });
            }
          }
        } else if (positionMatches.length > 0 && colorMatches.length > 0) {
          // If we have both positions and colors, try to pair them
          const count = Math.min(positionMatches.length, colorMatches.length);
          
          for (let i = 0; i < count; i++) {
            const posMatch = positionMatches[i].match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
            if (!posMatch) continue;
            
            // For blur, either use a match or default to 50%
            const blur = i < blurMatches.length 
              ? parseFloat(blurMatches[i].match(/(\d+(?:\.\d+)?)%/)?.[1] || "50") 
              : 50;
            
            results.push({
              x: parseFloat(posMatch[1]),
              y: parseFloat(posMatch[2]),
              color: colorMatches[i].trim(),
              blur: blur
            });
            
            console.log("Added from standard fallback:", {
              x: parseFloat(posMatch[1]),
              y: parseFloat(posMatch[2]),
              color: colorMatches[i].trim(),
              blur: blur
            });
          }
        }
      }
      
      console.log("Final results:", results);
      
      if (results.length === 0) {
        throw new Error("No valid mesh gradients found. Make sure each gradient includes position, color and transparency values.");
      }
      
      // Create color points
      const newColorPoints = results.map(result => ({
        id: generateId(),
        x: result.x,
        y: result.y,
        color: result.color,
        blur: result.blur
      }));
      
      // Update the state
      setColorPoints(newColorPoints);
      setIsImportDialogOpen(false);
      setImportText("");
      
      toast({
        title: "Gradient imported",
        description: `Successfully imported ${newColorPoints.length} color points.`,
      });
    } catch (error) {
      console.error("Import failed:", error);
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Could not parse the gradient CSS.",
        variant: "destructive",
      });
    }
  }, [importText]);

  // Only render the full component on the client side
  if (!isMounted) {
    return <div className="w-full h-64 rounded-lg shadow-md bg-gray-100 dark:bg-gray-800"></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mesh Gradient Generator</h2>
        <ModeToggle />
      </div>
      <Tabs defaultValue="preview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">CSS Code</TabsTrigger>
        </TabsList>

        <TabsContent value="preview" className="space-y-4">
          <div
            ref={previewRef}
            className="w-full h-64 rounded-lg shadow-md transition-all duration-500 relative cursor-move"
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
        </TabsContent>

        <TabsContent value="code">
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <pre className="bg-slate-950 dark:bg-slate-900 text-slate-50 p-4 rounded-md overflow-x-auto">
                  <code>{cssCode}</code>
                </pre>
                <Button size="sm" variant="secondary" className="absolute top-2 right-2" onClick={copyCss}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Apply this CSS to your <code className="bg-secondary text-secondary-foreground px-1 py-0.5 rounded">body</code> element for a full-page gradient that extends beyond the viewport.</p>
                <p className="mt-1">The <code className="bg-secondary text-secondary-foreground px-1 py-0.5 rounded">background-attachment: fixed</code> property ensures the gradient stays in place when scrolling.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={addColorPoint}>
            <Plus className="h-4 w-4 mr-2" /> Add Color
          </Button>
          
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
                <Import className="h-4 w-4 mr-2" /> Import Gradient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Import Gradient</DialogTitle>
                <DialogDescription>Paste CSS code containing a mesh gradient previously generated by this tool.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="text-sm text-muted-foreground mb-2">
                  <p>You can paste:</p>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Complete CSS with <code className="bg-secondary text-secondary-foreground px-1 py-0.5 rounded">background:</code> property</li>
                    <li>Just the gradient part (multiple <code className="bg-secondary text-secondary-foreground px-1 py-0.5 rounded">radial-gradient()</code> definitions)</li>
                    <li>CSS with newlines and formatting is supported</li>
                  </ul>
                  <p className="mt-2">Each gradient must include:</p>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    <li>Position: <code className="bg-secondary text-secondary-foreground px-1 py-0.5 rounded">at X% Y%</code></li>
                    <li>Color: <code className="bg-secondary text-secondary-foreground px-1 py-0.5 rounded">COLOR 0%</code></li>
                    <li>Transparency: <code className="bg-secondary text-secondary-foreground px-1 py-0.5 rounded">transparent Z%</code></li>
                  </ul>
                  <Button 
                    variant="link" 
                    className="p-0 mt-2 h-auto text-xs" 
                    onClick={() => {
                      setImportText("background: radial-gradient(at 0% 0%, #ff5e62 0%, transparent 50%), radial-gradient(at 100% 0%, #ff9966 0%, transparent 50%), radial-gradient(at 100% 100%, #6a82fb 0%, transparent 50%), radial-gradient(at 0% 100%, #fc5c7d 0%, transparent 50%);");
                    }}
                  >
                    Use test gradient
                  </Button>
                  <Button 
                    variant="link" 
                    className="p-0 ml-3 mt-2 h-auto text-xs" 
                    onClick={() => {
                      setImportText(`background: 
	radial-gradient(at 69% 13%, oklch(95.81% 0.03 73.18deg) 0%, transparent 50%), 
	radial-gradient(at 14% 57%, oklch(91% 0.06 71.47deg) 0%, transparent 50%), 
	radial-gradient(at 83% 86%, oklch(81.9% 0.11 69.97deg) 0%, transparent 50%);`);
                    }}
                  >
                    Use OKLCH gradient
                  </Button>
                </div>
                <Textarea
                  placeholder="background: radial-gradient(at 0% 0%, #ff5e62 0%, transparent 50%), radial-gradient(at 100% 0%, #ff9966 0%, transparent 50%)..."
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={(e) => {
                    e.preventDefault();
                    if (importText.trim() === '') {
                      toast({
                        title: "Empty input",
                        description: "Please paste some CSS code to import.",
                        variant: "destructive",
                      });
                      return;
                    }
                    importGradient();
                  }}
                >
                  Import
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isParseDialogOpen} onOpenChange={setIsParseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" /> Parse Colors
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Parse Colors from Text</DialogTitle>
                <DialogDescription>Paste CSS variables or any text containing color values below.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Textarea
                  placeholder="--color-primary: #ff5e62;
--color-secondary: oklch(86.33% 0.08 69.86deg);
rgb(255, 153, 102)
#6a82fb"
                  value={colorText}
                  onChange={(e) => setColorText(e.target.value)}
                  className="min-h-[200px]"
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsParseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleParseColors}>Add Colors</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={randomizeColors}>
            <Shuffle className="h-4 w-4 mr-2" /> Randomize Colors
          </Button>
          <Button variant="outline" onClick={randomizePositions}>
            <Shuffle className="h-4 w-4 mr-2" /> Randomize Positions
          </Button>
          <Button variant="secondary" onClick={randomizeAll}>
            <Shuffle className="h-4 w-4 mr-2" /> Randomize All
          </Button>
        </div>

        <div className="space-y-6">
          {colorPoints.map((point, index) => (
            <Card
              key={point.id}
              className={cn("transition-all", activeTab === "preview" ? "border-2" : "")}
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
                      Blur/Smoothness: {point.blur}%
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
          ))}
        </div>
      </div>
      <Toaster />
    </div>
  )
}
