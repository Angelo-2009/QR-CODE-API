export type LogoConfig = {
  source?: string | null; // data URL (data:<mime>;base64,...) or preset:<name>
  size?: number; // fraction of min(width,height), e.g., 0.22
  padding?: number; // fraction of logo size, e.g., 0.05
  shape?: "square" | "circle" | "rounded" | "hexagon";
  background?: { color?: string; opacity?: number } | null;
  opacity?: number; // 0..1
};

// Basic validation of data URL and mime types. Returns dataUrl if acceptable, otherwise null and error message.
export function parseLogoSource(source?: string | null): { ok: true; dataUrl: string; mime: string } | { ok: false; error: string } {
  if (!source) return { ok: false, error: "no_source" };
  if (source.startsWith("data:")) {
    // data URL format: data:[<mediatype>][;base64],<data>
    const m = source.match(/^data:([^;]+);base64,(.+)$/);
    if (!m) return { ok: false, error: "invalid_data_url" };
    const mime = m[1].toLowerCase();
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
    if (!allowed.includes(mime)) return { ok: false, error: `unsupported_mime:${mime}` };
    return { ok: true, dataUrl: source, mime };
  }

  if (source.startsWith("preset:")) {
    // presets handled in renderer as built-in SVG symbols; accept as-is
    return { ok: true, dataUrl: source, mime: "preset" };
  }

  // For security reasons we do not fetch remote URLs in this starter implementation.
  return { ok: false, error: "remote_urls_not_allowed_in_starter" };
}

// Compute approximate coverage ratio of a logo (size fraction squared). This is used to suggest EC boost.
export function logoCoverageFraction(logoSizeFraction: number) {
  // Rough estimate: area scales with square of size fraction
  return Math.max(0, Math.min(1, logoSizeFraction * logoSizeFraction));
}
