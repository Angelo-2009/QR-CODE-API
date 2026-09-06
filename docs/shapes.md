# Module & Shape Rendering

This document describes the module-level customization options supported by the renderer and how shapes are drawn. It matches Feature #2 from the blueprint.

Supported shapes (modules.shape)
- square (default)
- rounded, rounded-square (configurable `corner_radius` 0..1)
- circle, dot
- diamond
- hexagon
- triangle
- star (5-point)
- hbar, horizontal, horizontal-bars
- vbar, vertical, vertical-bars
- squircle, extra-rounded

Options
- modules.size (number): scale multiplier for module shapes (default 1.0)
- modules.gap (number 0..0.5): spacing between modules expressed as percentage of module cell (default 0)
- modules.corner_radius (0..1): used for rounded shapes; fraction of module size
- modules.color (CSS color): fill color for module shapes (default #000)
- modules.randomize: { enabled: boolean, min: number, max: number, seed?: number }
  - If enabled, modules will vary size slightly per-cell within [min, max] multiplier. Seed allows deterministic outputs.

Notes and scannability
- Novel module shapes may reduce scannability. The renderer intentionally keeps module shapes centered inside the module bounding box and respects a `gap` value to avoid bleeding into neighboring modules.
- Finder/timing/alignment patterns are not yet treated specially by the renderer in this version — Feature #3 will add finder-specific rendering rules (different colors, fixed shapes, etc.).

Examples
- Rounded dots, moderate gap:
  {
    "shape": "rounded",
    "size": 1.0,
    "gap": 0.05,
    "corner_radius": 0.25,
    "color": "#1F2937"
  }

- Randomized organic dots:
  {
    "shape": "circle",
    "size": 1.0,
    "gap": 0.08,
    "randomize": { "enabled": true, "min": 0.85, "max": 1.15, "seed": 42 }
  }
