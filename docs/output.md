# Output Formats & Print Files

Feature #9 implements the initial rasterization and output pipeline.

What this includes
- Vector: SVG returned as-is (preserveVector option)
- Raster: PNG, JPG, WebP, AVIF via resvg (SVG -> bitmap) then sharp for conversions and optimization
- PDF placeholder: rasterized image embedded in PDF for quick printing; high-fidelity PDF (embedding vector SVG) will be added later
- LocalStorage adapter (tmp/output) as the default storage target; adapter interface provided so you can implement S3/MinIO later
- Async threshold: requests >= 4096 px or DPI >= 300 are considered heavy and should be queued by a production job system; starter still processes them synchronously but marks them

How to use
- Call your existing generate endpoint with format and size_px (or call a render service directly with the SVG). Example:

POST /api/v1/qrcode/generate
{
  "data": "https://example.com",
  "format": "png",
  "size": 2048,
  "dpi": 300
}

Implementation notes & next steps
- I used resvg-js and sharp. For production deployments, ensure the environment has the necessary native libraries and binaries (sharp requires libvips).
- For very large raster jobs or print-ready PDFs, introduce a worker queue (BullMQ, RabbitMQ, or Celery) and an async job endpoint that returns a job id and a callback URL.
- Embed DPI/CMYK color profiles in PDF/EPS for print workflows.
- Add caching by config hash and ETag headers.
