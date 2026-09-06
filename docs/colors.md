# Color & Gradient Engine

Feature #6 implements per-zone coloring and gradients for the QR renderer. It supports:
- Solid fills
- Linear gradients (angle + stops)
- Radial gradients (cx/cy/r + stops)

Usage notes
- Apply different color configs to modules, finder, timing, alignment, and background.
- The engine generates SVG <defs> for gradients and returns a fill reference (either a hex color or url(#id)) to use as a fill/stroke.
- Always validate contrast between foreground and background in the scannability step (not implemented yet).

Examples
- Solid color:
  { "type": "solid", "color": "#111827" }
- Linear gradient:
  { "type": "linear", "angle": 45, "stops": [{"color":"#7C3AED"},{"color":"#06B6D4"}] }
- Radial gradient:
  { "type": "radial", "cx":0.5, "cy":0.5, "r":0.6, "stops": [{"color":"#fff"},{"color":"#000"}] }
