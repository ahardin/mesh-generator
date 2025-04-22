// Type for a color point in our gradient
export interface ColorPoint {
  id: string
  color: string
  x: number
  y: number
  blur: number
}

// Generate a random color in hex format
export const getRandomColor = () => {
  return `#${Math.floor(Math.random() * 16777215)
    .toString(16)
    .padStart(6, "0")}`
}

// Generate a random position between 0 and 100
export const getRandomPosition = () => {
  return Math.floor(Math.random() * 101)
}

// Generate a unique ID
export const generateId = () => {
  return Math.random().toString(36).substring(2, 9)
}

// Generate the CSS code for the gradient
export const generateGradientCSS = (points: ColorPoint[]) => {
  return points
    .map((point) => {
      return `radial-gradient(at ${point.x}% ${point.y}%, ${point.color} 0%, transparent ${point.blur}%)`
    })
    .join(", ")
}

// Extract colors from text
export const extractColorsFromText = (text: string): string[] => {
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
}

// Extract gradients from CSS
export const extractGradients = (css: string) => {
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
} 