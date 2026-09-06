export type GradientStop = { offset?: number; color: string; opacity?: number };

export type ColorConfig =
  | { type: "solid"; color: string }
  | { type: "linear"; angle?: number; stops: GradientStop[] }
  | { type: "radial"; cx?: number; cy?: number; r?: number; stops: GradientStop[] };

// Generate SVG defs for a color configuration. Returns { defs, fill } where fill is either a plain color
// or a url(#id) reference to be used as fill/stroke.
export function generateColorDefs(idPrefix: string, cfg?: ColorConfig): { defs: string; fill: string } {
  if (!cfg) return { defs: "", fill: "#000" };

  if (cfg.type === "solid") {
    return { defs: "", fill: cfg.color };
  }

  const id = `${idPrefix}-${Math.abs(hashString(JSON.stringify(cfg))).toString(36)}`;

  if (cfg.type === "linear") {
    const angle = typeof cfg.angle === "number" ? cfg.angle : 0;
    // Convert angle to x1,y1,x2,y2 in percent
    const rad = ((angle % 360) * Math.PI) / 180;
    const x1 = 50 - Math.cos(rad) * 50;
    const y1 = 50 - Math.sin(rad) * 50;
    const x2 = 50 + Math.cos(rad) * 50;
    const y2 = 50 + Math.sin(rad) * 50;

    let stops = "";
    const s = cfg.stops || [];
    for (let i = 0; i < s.length; i++) {
      const stop = s[i];
      const offset = typeof stop.offset === "number" ? stop.offset : Math.round((i / (s.length - 1 || 1)) * 100);
      const opacity = typeof stop.opacity === "number" ? stop.opacity : 1;
      stops += `<stop offset="${offset}%" stop-color="${stop.color}" stop-opacity="${opacity}"/>`;
    }

    const defs = `<linearGradient id="${id}" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">${stops}</linearGradient>`;
    return { defs, fill: `url(#${id})` };
  }

  if (cfg.type === "radial") {
    const cx = typeof cfg.cx === "number" ? cfg.cx * 100 : 50;
    const cy = typeof cfg.cy === "number" ? cfg.cy * 100 : 50;
    const r = typeof cfg.r === "number" ? cfg.r * 100 : 50;
    let stops = "";
    const s = cfg.stops || [];
    for (let i = 0; i < s.length; i++) {
      const stop = s[i];
      const offset = typeof stop.offset === "number" ? stop.offset : Math.round((i / (s.length - 1 || 1)) * 100);
      const opacity = typeof stop.opacity === "number" ? stop.opacity : 1;
      stops += `<stop offset="${offset}%" stop-color="${stop.color}" stop-opacity="${opacity}"/>`;
    }
    const defs = `<radialGradient id="${id}" cx="${cx}%" cy="${cy}%" r="${r}%">${stops}</radialGradient>`;
    return { defs, fill: `url(#${id})` };
  }

  // Fallback
  return { defs: "", fill: "#000" };
}

// Simple string hash for deterministic ids
function hashString(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
