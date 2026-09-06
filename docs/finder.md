# Finder Pattern Customization

This document describes Feature #3 — Finder Pattern Customization. Finder patterns (the three large squares in QR codes) are drawn separately from module cells so they can be styled safely while keeping scannability.

Options (finder)
- finder.shape: square | rounded | circle | diamond | hexagon | ring
- finder.size: scale multiplier for finder (default 1.0). Recommended range: 0.8..1.5
- finder.corner_radius: for rounded finder outer shape (0..1)
- finder.inner_dot: boolean | { show: boolean, size: number } — show the inner dark center
- finder.color: outer color (dark)
- finder.inner_color: inner white color (usually #fff)
- finder.border_color, finder.border_width

Rendering details
- The renderer computes the standard finder module locations (7×7 modules) and skips drawing regular module shapes inside those squares. It then draws the finder outer/inner/center shapes on top.
- Safe defaults: outer dark color = #000, inner white = #fff. If low contrast combinations are chosen, the API will warn; if strict_mode is enabled, the request can be rejected.

Examples
- Classic rounded finder:
  {
    "shape": "rounded",
    "size": 1.0,
    "corner_radius": 0.2,
    "color": "#0f172a"
  }

- Fancy ring finder:
  {
    "shape": "ring",
    "size": 1.1,
    "border_width": 0.6,
    "border_color": "#1f2937",
    "inner_color": "#fff"
  }
