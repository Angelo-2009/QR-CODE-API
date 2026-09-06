# Frame, Text & Call-to-Action

Feature #8 implements frames and CTA text around the QR code. Available frame styles:
- banner (default): a bottom banner with CTA text
- speech: speech-bubble style (top-left)
- circle: circular frame around the QR center
- rounded: rounded rectangle frame around the QR

Frame options
- style: which preset to use
- text: CTA text (default: "Scan Me")
- fontFamily, fontSize, fontWeight, textColor
- backgroundColor, backgroundOpacity
- padding, borderColor, borderWidth, borderRadius

Rendering notes
- Frames are placed outside or around the QR modules and avoid overlapping the quiet zone by default.
- By default the banner is placed at the bottom and sized proportionally to the QR dimensions.
- Text is rendered as SVG <text>; for production you may prefer to embed font files or rasterize text for exact typographic control.

Examples
- Simple banner:
  {
    "frame": { "style": "banner", "text": "Scan to Follow", "backgroundColor": "#111827", "textColor": "#fff" }
  }
