export function renderSvgFromMatrix(matrix: number[][], opts: { moduleSize?: number; marginModules?: number; modulesConfig?: any } ) {
  const moduleSize = opts.moduleSize || 8;
  const margin = typeof opts.marginModules === "number" ? opts.marginModules : 4;
  const modulesConfig = opts.modulesConfig || {};
  const shape = (modulesConfig.shape || "square").toLowerCase();
  const gap = Math.max(0, Math.min(0.5, Number(modulesConfig.gap || 0))); // 0..0.5
  const dotSize = Math.max(0.01, Number(modulesConfig.size || 1));
  const cornerRadius = Math.max(0, Math.min(1, Number(modulesConfig.corner_radius || 0.25)));
  const randomize = modulesConfig.randomize || { enabled: false };
  const color = modulesConfig.color || "#000";

  // Seeded RNG (mulberry32) for deterministic randomization when seed provided
  function mulberry32(a: number) {
    return function() {
      a |= 0;
      a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  const seed = typeof randomize.seed === "number" ? randomize.seed : Math.floor(Math.random() * 2 ** 31);
  const rng = mulberry32(seed);
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;
  const width = (cols + margin * 2) * moduleSize;
  const height = (rows + margin * 2) * moduleSize;

  const shapes: string[] = [];

  // Helper to generate polygon points string
  function polygonPoints(points: Array<[number, number]>) {
    return points.map(p => `${p[0]},${p[1]}`).join(" ");
  }

  // Helper to create an n-gon centered at (cx,cy)
  function regularPolygon(cx: number, cy: number, radius: number, sides: number, rotation = 0) {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < sides; i++) {
      const angle = rotation + (i / sides) * Math.PI * 2;
      pts.push([cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius]);
    }
    return polygonPoints(pts);
  }

  // Star path (simple 5-point star)
  function starPath(cx: number, cy: number, outerR: number, innerR: number, points = 5) {
    const pts: Array<[number, number]> = [];
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? outerR : innerR;
      const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      pts.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
    }
    return `M ${pts.map(p => p.join(" ")).join(" L ")} Z`;
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!matrix[y][x]) continue;

      const cx = (x + margin + 0.5) * moduleSize;
      const cy = (y + margin + 0.5) * moduleSize;

      // base inner size
      let inner = moduleSize * dotSize * (1 - gap);

      // randomize
      if (randomize.enabled) {
        const r = rng();
        const min = Math.max(0.01, Number(randomize.min || 0.8));
        const max = Math.max(min, Number(randomize.max || 1.2));
        const scale = min + (max - min) * r;
        inner = inner * scale;
      }

      const half = inner / 2;

      switch (shape) {
        case "square":
        case "rounded":
        case "rounded-square": {
          const rx = shape === "square" ? 0 : Math.min(half, cornerRadius * inner);
          const x0 = cx - half;
          const y0 = cy - half;
          shapes.push(`<rect x="${x0}" y="${y0}" width="${inner}" height="${inner}" rx="${rx}" ry="${rx}" fill="${color}"/>`);
          break;
        }
        case "circle":
        case "dot": {
          shapes.push(`<circle cx="${cx}" cy="${cy}" r="${half}" fill="${color}"/>`);
          break;
        }
        case "diamond": {
          const pts = polygonPoints([
            [cx, cy - half],
            [cx + half, cy],
            [cx, cy + half],
            [cx - half, cy],
          ]);
          shapes.push(`<polygon points="${pts}" fill="${color}"/>`);
          break;
        }
        case "hexagon": {
          const pts = regularPolygon(cx, cy, half, 6, Math.PI / 6);
          shapes.push(`<polygon points="${pts}" fill="${color}"/>`);
          break;
        }
        case "triangle": {
          const pts = polygonPoints([
            [cx, cy - half],
            [cx + half, cy + half],
            [cx - half, cy + half],
          ]);
          shapes.push(`<polygon points="${pts}" fill="${color}"/>`);
          break;
        }
        case "star": {
          const path = starPath(cx, cy, half, half * 0.5, 5);
          shapes.push(`<path d="${path}" fill="${color}"/>`);
          break;
        }
        case "hbar":
        case "horizontal":
        case "horizontal-bars": {
          const w = inner * 1.2;
          const h = Math.max(1, inner * 0.35);
          shapes.push(`<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${color}"/>`);
          break;
        }
        case "vbar":
        case "vertical":
        case "vertical-bars": {
          const w = Math.max(1, inner * 0.35);
          const h = inner * 1.2;
          shapes.push(`<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${w / 2}" fill="${color}"/>`);
          break;
        }
        case "squircle":
        case "extra-rounded": {
          // approximate squircle using rect with high rx
          const rx = Math.min(half, inner * 0.45);
          const x0 = cx - half;
          const y0 = cy - half;
          shapes.push(`<rect x="${x0}" y="${y0}" width="${inner}" height="${inner}" rx="${rx}" ry="${rx}" fill="${color}"/>`);
          break;
        }
        default: {
          // fallback to square
          const x0 = cx - half;
          const y0 = cy - half;
          shapes.push(`<rect x="${x0}" y="${y0}" width="${inner}" height="${inner}" fill="${color}"/>`);
        }
      }
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  <rect width="100%" height="100%" fill="#fff"/>\n  ${shapes.join("\n  ")}\n</svg>`;
  return svg;
}
