export type TimingConfig = {
  style?: "solid" | "dashed" | "dotted" | "gradient";
  color?: string;
  thickness?: number; // in px
  gradientStops?: string[]; // e.g., ["#000","#fff"]
};

export type AlignmentConfig = {
  shape?: string; // square|circle|diamond|hexagon
  color?: string;
  size?: number; // modules multiplier
};

export function versionFromMatrixSize(size: number): number {
  // QR size = 17 + 4 * version
  if (size < 21) return 1;
  const v = Math.round((size - 17) / 4);
  return Math.max(1, Math.min(40, v));
}

// Simple alignment center heuristic: for versions >=2 we place an alignment marker near the geometric centers
// This is not the full QR alignment table but provides useful visual anchors for many versions.
export function computeAlignmentCenters(version: number, size: number): Array<{x:number,y:number}> {
  const centers: Array<{x:number,y:number}> = [];
  if (version < 2) return centers;
  // Simple approach: place a center alignment near the middle, and between the middle and edges
  const mid = Math.floor(size / 2);
  centers.push({ x: mid, y: mid });

  // Additional heuristics: add quarter positions if version is larger
  if (version >= 4) {
    const q1 = Math.floor(size * 0.25);
    const q3 = Math.floor(size * 0.75);
    centers.push({ x: q1, y: q1 });
    centers.push({ x: q3, y: q1 });
    centers.push({ x: q1, y: q3 });
    centers.push({ x: q3, y: q3 });
  }
  return centers;
}

export function renderTimingSvg(cols: number, rows: number, moduleSize: number, margin: number, timingConfig?: TimingConfig) {
  timingConfig = timingConfig || {};
  const style = timingConfig.style || "solid";
  const color = timingConfig.color || "#000";
  const thickness = timingConfig.thickness || Math.max(1, Math.floor(moduleSize * 0.25));

  // Timing runs along row index 6 (0-based) and column index 6
  const tIndex = 6;
  const xStart = (0 + margin + 6) * moduleSize; // after left finder (7 modules) -> start at module index 6? use center line
  const xEnd = (cols - 1 - 6 + margin + 0.5) * moduleSize; // approximate

  const y = (tIndex + margin + 0.5) * moduleSize;
  const verticalX = (tIndex + margin + 0.5) * moduleSize;
  const yStart = (0 + margin + 6) * moduleSize;
  const yEnd = (rows - 1 - 6 + margin + 0.5) * moduleSize;

  let dash = "";
  if (style === "dashed") dash = "6,4";
  if (style === "dotted") dash = "1,5";

  // gradient handling: if gradient use stroke with url(#timingGradient)
  const id = "timingGradient";
  let defs = "";
  let stroke = color;
  if (style === "gradient" && timingConfig.gradientStops && timingConfig.gradientStops.length >= 2) {
    defs = `<defs><linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="0%">`;
    const stops = timingConfig.gradientStops;
    const step = 100 / (stops.length - 1);
    for (let i = 0; i < stops.length; i++) {
      defs += `<stop offset="${i * step}%" stop-color="${stops[i]}" stop-opacity="1"/>`;
    }
    defs += `</linearGradient></defs>`;
    stroke = `url(#${id})`;
  }

  const hLine = `<line x1="${(margin + 6) * moduleSize}" y1="${y}" x2="${(cols - 1 - 6 + margin + 0.5) * moduleSize}" y2="${y}" stroke="${stroke}" stroke-width="${thickness}" stroke-linecap="square" ${dash ? `stroke-dasharray="${dash}"` : ""} />`;

  const vLine = `<line x1="${verticalX}" y1="${(margin + 6) * moduleSize}" x2="${verticalX}" y2="${(rows - 1 - 6 + margin + 0.5) * moduleSize}" stroke="${stroke}" stroke-width="${thickness}" stroke-linecap="square" ${dash ? `stroke-dasharray="${dash}"` : ""} />`;

  return { defs, svg: hLine + '\n' + vLine };
}

export function renderAlignmentSvgs(centers: Array<{x:number,y:number}>, moduleSize: number, margin: number, alignmentConfig?: AlignmentConfig) {
  alignmentConfig = alignmentConfig || {};
  const shape = (alignmentConfig.shape || "square").toLowerCase();
  const color = alignmentConfig.color || "#000";
  const sizeMul = typeof alignmentConfig.size === "number" ? Math.max(0.5, Math.min(2, alignmentConfig.size)) : 1;
  const svgs: string[] = [];

  for (const c of centers) {
    const cx = (c.x + margin + 0.5) * moduleSize;
    const cy = (c.y + margin + 0.5) * moduleSize;
    const base = moduleSize * 3 * sizeMul; // alignment pattern typically 5 modules outer? we pick 3 modules as visual
    const half = base / 2;
    switch (shape) {
      case "circle":
        svgs.push(`<circle cx="${cx}" cy="${cy}" r="${half}" fill="${color}"/>`);
        break;
      case "diamond":
        svgs.push(`<rect x="${cx - half}" y="${cy - half}" width="${base}" height="${base}" transform="rotate(45 ${cx} ${cy})" fill="${color}"/>`);
        break;
      case "hexagon":
        const pts = (() => {
          const ptsArr: Array<[number,number]> = [];
          for (let i = 0; i < 6; i++) {
            const angle = Math.PI/6 + (i/6)*Math.PI*2;
            ptsArr.push([cx + Math.cos(angle)*half, cy + Math.sin(angle)*half]);
          }
          return ptsArr.map(p => p.join(',')).join(' ');
        })();
        svgs.push(`<polygon points="${pts}" fill="${color}"/>`);
        break;
      default:
        // square
        svgs.push(`<rect x="${cx - half}" y="${cy - half}" width="${base}" height="${base}" fill="${color}"/>`);
    }
  }

  return svgs.join('\n');
}
