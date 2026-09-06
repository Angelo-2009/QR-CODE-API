# Timing & Alignment Patterns

Feature #4 implements timing lines and alignment pattern rendering, plus quiet-zone control.

Options
- timing: { style: "solid"|"dashed"|"dotted"|"gradient", color: "#000", thickness: number, gradientStops: ["#fff","#000"] }
- alignment: { shape: "square"|"circle"|"diamond"|"hexagon", color: "#000", size: number }
- quiet_zone: integer (modules) default 4

Notes
- Timing lines are drawn at the standard timing positions (row/col index 6) across the symbol between finders.
- Alignment centers are heuristically computed for now. For full QR-spec accuracy, a complete alignment-position lookup table per version should be implemented.
- The renderer places alignment and timing shapes between modules and finders and applies styles as requested. Low-contrast or oversized choices will be warned about by the scannability validator in a later feature.
