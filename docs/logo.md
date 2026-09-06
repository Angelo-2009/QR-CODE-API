# Logo & Image Embedding

Feature #5 implements logo embedding into the vector (SVG) output. This starter implementation accepts logo data via data URLs (base64-encoded images) or preset names (`preset:facebook`). For security reasons it does not fetch remote URLs.

Supported logo options (logo)
- source: data URL (required to embed a custom image), or `preset:<name>` (built-in presets)
- size: fraction of QR size (0.01..0.8). Default 0.22 (22%).
- padding: fraction of logo size used as a background ring (default 0.05)
- shape: square | circle | rounded | hexagon (affects mask/clip)
- background: { color, opacity } — a background ring drawn under the image using the logo size
- opacity: image opacity (0..1)

Security & validation notes
- This starter accepts only data URLs for images to avoid SSRF risks. Supported mime types: image/png, image/jpeg, image/webp, image/svg+xml.
- SVG uploads are embedded as data URLs and clipped by the chosen shape. For production consider sanitizing SVGs or rasterizing them before embedding.
- The system estimates logo coverage and may suggest increasing error-correction if coverage is large.

Example payload (logo embedding)
{
  "data":"https://example.com",
  "modules":{"shape":"rounded"},
  "logo":{
    "source":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...",
    "size":0.22,
    "padding":0.05,
    "shape":"circle",
    "background":{"color":"#fff","opacity":1},
    "opacity":0.95
  }
}

Notes and next steps
- This implementation composes the logo into the SVG output only. For raster formats (PNG/WebP/AVIF) the image should be composited and rasterized; I'll add a raster pipeline and storage adapter in a later feature.
- Auto-boosting of error-correction (EC) is not yet enforced automatically; the generator will emit a warning in the scannability step when implemented.
