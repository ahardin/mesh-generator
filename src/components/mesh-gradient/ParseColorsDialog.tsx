"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { FileText } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface ParseColorsDialogProps {
  onParseColors: (colorText: string, replaceExisting: boolean) => void
}

export function ParseColorsDialog({ onParseColors }: ParseColorsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [colorText, setColorText] = useState("")
  const [replaceExisting, setReplaceExisting] = useState(false)

  const handleParseColors = () => {
    onParseColors(colorText, replaceExisting)
    setIsOpen(false)
    setColorText("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" /> Paste Colors
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
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="replace-colors" 
              checked={replaceExisting}
              onCheckedChange={() => setReplaceExisting(prev => !prev)}
            />
            <label 
              htmlFor="replace-colors" 
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Replace existing colors (unchecked will add to existing colors)
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleParseColors}>Add Colors</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 