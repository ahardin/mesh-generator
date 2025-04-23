"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface CssCodeDisplayProps {
  cssCode: string
}

export function CssCodeDisplay({ cssCode }: CssCodeDisplayProps) {
  // Copy CSS to clipboard
  const copyCss = () => {
    navigator.clipboard.writeText(cssCode)
    toast({
      title: "Copied!",
      description: "CSS code copied to clipboard.",
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="relative">
          <pre className="bg-slate-950 dark:bg-slate-900 text-slate-50 p-4 rounded-md w-full overflow-x-auto whitespace-pre-wrap">
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
  )
} 