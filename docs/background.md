# Background Layer

Feature #7 implements a flexible background layer for QR renders. It supports:
- Solid color or transparent backgrounds
- Image backgrounds via data URLs or preset identifiers (no remote fetching in starter)
- Size modes: cover / contain / stretch
- Blur (SVG Gaussian blur filter, limited to small radii for vector output)
- Brightness approximation via filters (note: may vary between viewers)
- Overlay rectangle to improve contrast (default black @ 25%)

Usage example
{
  "data":"https://example.com",
  "background": {
    "type": "image",
    "image": "data:image/png;base64,...",
    "size": "cover",
    "blur": 4,
    "overlay": { "color": "#000000", "opacity": 0.25 }
  }
}

Notes
- For heavy blur or complex background processing, rasterization is recommended (Feature #9). The SVG-only blur implemented here is suitable for mild blur effects.
- Animated background support is not yet fully implemented for raster outputs; we accept animated image data URLs but raster pipeline will handle animation frames later.
- Security: only data URLs and preset identifiers are accepted in the starter to avoid SSRF attacks.
