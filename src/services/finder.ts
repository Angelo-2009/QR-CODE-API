export type FinderConfig = {
  shape?: string;
  size?: number; // relative to 7 modules
  corner_radius?: number;
  inner_dot?: { show?: boolean; size?: number } | boolean;
  color?: string;
  inner_color?: string;
  border_color?: string;
  border_width?: number; // in modules
};

export function getFinderModulePositions(cols: number, rows: number) {
  // Standard finder positions: top-left, top-right, bottom-left
  const size = 7;
  return [
    { x: 0, y: 0, w: size, h: size },
    { x: cols - size, y: 0, w: size, h: size },
    { x: 0, y: rows - size, w: size, h: size },
  ];
}

export function renderFinderSvgAt(
  centerX: number,
  centerY: number,
  moduleSize: number,
  finderConfig: FinderConfig = {}
): string {
  const shape = (finderConfig.shape || "square").toLowerCase();
  const scale = typeof finderConfig.size === "number" ? Math.max(0.5, Math.min(2, finderConfig.size)) : 1;
  const corner = typeof finderConfig.corner_radius === "number" ? Math.max(0, Math.min(1, finderConfig.corner_radius)) : 0.2;
  const color = finderConfig.color || "#000";
  const innerColor = finderConfig.inner_color || "#fff";
  const centerColor = (finderConfig.inner_dot && typeof finderConfig.inner_dot === "object" && finderConfig.inner_dot.size) ? color : (finderConfig.inner_dot === false ? null : color);
  const borderColor = finderConfig.border_color || "#000";
  const borderWidthModules = typeof finderConfig.border_width === "number" ? Math.max(0, finderConfig.border_width) : 0;

  // Standard sizes in modules (outer, inner white, center dark)
  const outerModules = 7 * scale;
  const innerWhiteModules = 5 * scale;
  const centerModules = 3 * scale;

  const outer = outerModules * moduleSize;
  const inner = innerWhiteModules * moduleSize;
  const center = centerModules * moduleSize;

  const outerX = centerX - outer / 2;
  const outerY = centerY - outer / 2;
  const innerX = centerX - inner / 2;
  const innerY = centerY - inner / 2;
  const centerXRect = centerX - center / 2;
  const centerYRect = centerY - center / 2;

  // Corner radius in px
  const rx = Math.min(outer / 2, corner * outer);

  // Build SVG fragments depending on shape
  let svg = "";

  switch (shape) {
    case "circle":
      svg += `<circle cx="${centerX}" cy="${centerY}" r="${outer / 2}" fill="${color}"/>`;
      svg += `<circle cx="${centerX}" cy="${centerY}" r="${inner / 2}" fill="${innerColor}"/>`;
      if (finderConfig.inner_dot !== false) {
        svg += `<circle cx="${centerX}" cy="${centerY}" r="${center / 2}" fill="${color}"/>`;
      }
      break;
    case "ring":
      // Outer ring stroke with inner cutout
      const strokeW = borderWidthModules > 0 ? borderWidthModules * moduleSize : Math.max(2, moduleSize * 0.6);
      svg += `<rect x="${outerX}" y="${outerY}" width="${outer}" height="${outer}" rx="${rx}" ry="${rx}" fill="none" stroke="${borderColor}" stroke-width="${strokeW}"/>`;
      svg += `<rect x="${innerX}" y="${innerY}" width="${inner}" height="${inner}" rx="${Math.max(0, rx - strokeW/2)}" ry="${Math.max(0, rx - strokeW/2)}" fill="${innerColor}"/>`;
      if (finderConfig.inner_dot !== false) {
        svg += `<rect x="${centerXRect}" y="${centerYRect}" width="${center}" height="${center}" rx="${(center/2) * 0.15}" fill="${color}"/>`;
      }
      break;
    case "diamond":
      // rotated square for outer/inner/center
      svg += `<rect x="${outerX}" y="${outerY}" width="${outer}" height="${outer}" transform="rotate(45 ${centerX} ${centerY})" fill="${color}" rx="${rx}"/>`;
      svg += `<rect x="${innerX}" y="${innerY}" width="${inner}" height="${inner}" transform="rotate(45 ${centerX} ${centerY})" fill="${innerColor}" rx="${Math.max(0, rx*0.6)}"/>`;
      if (finderConfig.inner_dot !== false) svg += `<rect x="${centerXRect}" y="${centerYRect}" width="${center}" height="${center}" transform="rotate(45 ${centerX} ${centerY})" fill="${color}"/>`;
      break;
    default:
      // square / rounded / square-in-square classic
      svg += `<rect x="${outerX}" y="${outerY}" width="${outer}" height="${outer}" rx="${rx}" ry="${rx}" fill="${color}"/>`;
      svg += `<rect x="${innerX}" y="${innerY}" width="${inner}" height="${inner}" rx="${Math.max(0, rx*0.6)}" ry="${Math.max(0, rx*0.6)}" fill="${innerColor}"/>`;
      if (finderConfig.inner_dot !== false) svg += `<rect x="${centerXRect}" y="${centerYRect}" width="${center}" height="${center}" rx="${(center/2) * 0.15}" fill="${color}"/>`;
  }

  return svg;
}
