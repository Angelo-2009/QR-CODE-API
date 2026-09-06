import { renderFinderSvgAt, getFinderModulePositions, FinderConfig } from "./finder";
import { renderTimingSvg, computeAlignmentCenters, renderAlignmentSvgs, versionFromMatrixSize } from "./timing";
import { LogoConfig, parseLogoSource } from "./logo";
import { generateColorDefs, ColorConfig } from "./colors";
import { renderBackgroundSvg, BackgroundConfig } from "./background";
import { renderFrameSvg, FrameConfig } from "./frame";

export function renderSvgFromMatrix(matrix: number[][], opts: { moduleSize?: number; marginModules?: number; modulesConfig?: any; finderConfig?: FinderConfig; timingConfig?: any; alignmentConfig?: any; quietZone?: number; logoConfig?: LogoConfig; colors?: { modules?: ColorConfig; finder?: ColorConfig; timing?: ColorConfig; alignment?: ColorConfig; background?: ColorConfig }; background?: BackgroundConfig; frameConfig?: FrameConfig } ) {
  const moduleSize = opts.moduleSize || 8;
  const margin = typeof opts.quietZone === "number" ? opts.quietZone : (typeof opts.marginModules === "number" ? opts.marginModules : 4);
  const modulesConfig = opts.modulesConfig || {};
  const finderConfig = opts.finderConfig || {};
  const timingConfig = opts.timingConfig || {};
  const alignmentConfig = opts.alignmentConfig || {};
  const logoConfig = opts.logoConfig || null;
  const colorCfgs = opts.colors || {};
  const backgroundCfg = opts.background || null;
  const frameCfg = opts.frameConfig || null;

  const modulesColorCfg = colorCfgs.modules || { type: "solid", color: "#000" };
  const finderColorCfg = colorCfgs.finder || { type: "solid", color: "#000" };
  const timingColorCfg = colorCfgs.timing || { type: "solid", color: "#000" };
  const alignmentColorCfg = colorCfgs.alignment || { type: "solid", color: "#000" };
  const backgroundColorCfg = colorCfgs.background || { type: "solid", color: "#fff" };

  // Generate defs for all color zones
  const moduleDefs = generateColorDefs("modules", modulesColorCfg as any);
  const finderDefs = generateColorDefs("finder", finderColorCfg as any);
  const timingDefs = generateColorDefs("timing", timingColorCfg as any);
  const alignmentDefs = generateColorDefs("alignment", alignmentColorCfg as any);
  const backgroundColorDefs = generateColorDefs("background", backgroundColorCfg as any);

  const modulesFill = moduleDefs.fill;
  const finderFill = finderDefs.fill;
  const timingFill = timingDefs.fill;
  const alignmentFill = alignmentDefs.fill;
  const backgroundFill = backgroundColorDefs.fill;

  const shape = (modulesConfig.shape || "square").toLowerCase();
  const gap = Math.max(0, Math.min(0.5, Number(modulesConfig.gap || 0))); // 0..0.5
  const dotSize = Math.max(0.01, Number(modulesConfig.size || 1));
  const cornerRadius = Math.max(0, Math.min(1, Number(modulesConfig.corner_radius || 0.25)));
  const randomize = modulesConfig.randomize || { enabled: false };

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

  // Determine finder module areas to skip drawing modules inside them
  const finderModules = getFinderModulePositions(cols, rows);
  function isInFinderModule(x: number, y: number) {
    return finderModules.some(f => x >= f.x && x < f.x + f.w && y >= f.y && y < f.y + f.h);
  }

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

  // Mark modules as skipped if they overlap with alignment centers (avoid double-rendering)
  const alignmentCenters = computeAlignmentCenters(versionFromMatrixSize(cols), cols);
  function isInAlignmentModule(x: number, y: number) {
    // treat each alignment center as occupying a 3x3 block
    return alignmentCenters.some(c => x >= c.x - 1 && x <= c.x + 1 && y >= c.y - 1 && y <= c.y + 1);
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (!matrix[y][x]) continue;

      // Skip modules that are part of the finder pattern or alignment pattern; they'll be drawn separately
      if (isInFinderModule(x, y) || isInAlignmentModule(x, y)) continue;

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
          shapes.push(`<rect x="${x0}" y="${y0}" width="${inner}" height="${inner}" rx="${rx}" ry="${rx}" fill="${modulesFill}"/>`);
          break;
        }
        case "circle":
        case "dot": {
          shapes.push(`<circle cx="${cx}" cy="${cy}" r="${half}" fill="${modulesFill}"/>`);
          break;
        }
        case "diamond": {
          const pts = polygonPoints([
            [cx, cy - half],
            [cx + half, cy],
            [cx, cy + half],
            [cx - half, cy],
          ]);
          shapes.push(`<polygon points="${pts}" fill="${modulesFill}"/>`);
          break;
        }
        case "hexagon": {
          const pts = regularPolygon(cx, cy, half, 6, Math.PI / 6);
          shapes.push(`<polygon points="${pts}" fill="${modulesFill}"/>`);
          break;
        }
        case "triangle": {
          const pts = polygonPoints([
            [cx, cy - half],
            [cx + half, cy + half],
            [cx - half, cy + half],
          ]);
          shapes.push(`<polygon points="${pts}" fill="${modulesFill}"/>`);
          break;
        }
        case "star": {
          const path = starPath(cx, cy, half, half * 0.5, 5);
          shapes.push(`<path d="${path}" fill="${modulesFill}"/>`);
          break;
        }
        case "hbar":
        case "horizontal":
        case "horizontal-bars": {
          const w = inner * 1.2;
          const h = Math.max(1, inner * 0.35);
          shapes.push(`<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${modulesFill}"/>`);
          break;
        }
        case "vbar":
        case "vertical":
        case "vertical-bars": {
          const w = Math.max(1, inner * 0.35);
          const h = inner * 1.2;
          shapes.push(`<rect x="${cx - w / 2}" y="${cy - h / 2}" width="${w}" height="${h}" rx="${w / 2}" fill="${modulesFill}"/>`);
          break;
        }
        case "squircle":
        case "extra-rounded": {
          // approximate squircle using rect with high rx
          const rx = Math.min(half, inner * 0.45);
          const x0 = cx - half;
          const y0 = cy - half;
          shapes.push(`<rect x="${x0}" y="${y0}" width="${inner}" height="${inner}" rx="${rx}" ry="${rx}" fill="${modulesFill}"/>`);
          break;
        }
        default: {
          // fallback to square
          const x0 = cx - half;
          const y0 = cy - half;
          shapes.push(`<rect x="${x0}" y="${y0}" width="${inner}" height="${inner}" fill="${modulesFill}"/>`);
        }
      }
    }
  }

  // Background via background helper
  const bg = renderBackgroundSvg(width, height, backgroundCfg || undefined);

  // Timing lines (between modules and finders)
  const timing = renderTimingSvg(cols, rows, moduleSize, margin, timingConfig);

  // Alignment shapes
  const alignmentSvgs = renderAlignmentSvgs(alignmentCenters, moduleSize, margin, alignmentConfig);

  // After modules and alignment/timing, draw finders on top
  const finderSvgs: string[] = [];
  for (const f of finderModules) {
    const fx = f.x;
    const fy = f.y;
    const finderCenterX = (fx + margin + 3.5) * moduleSize; // center of 7-module finder
    const finderCenterY = (fy + margin + 3.5) * moduleSize;
    // Override default color in finder render by temporarily setting finderConfig colors if needed
    finderSvgs.push(renderFinderSvgAt(finderCenterX, finderCenterY, moduleSize, finderConfig));
  }

  // Compose logo if provided
  let logoDefs = "";
  let logoSvg = "";
  if (logoConfig && logoConfig.source) {
    const parsed = parseLogoSource(logoConfig.source);
    if (parsed.ok) {
      const dataUrl = parsed.dataUrl;
      // size relative to min(width,height)
      const minDim = Math.min(width, height);
      const logoSizeFraction = typeof logoConfig.size === "number" ? Math.max(0.01, Math.min(0.8, logoConfig.size)) : 0.22;
      const logoSizePx = minDim * logoSizeFraction;
      const paddingFraction = typeof logoConfig.padding === "number" ? Math.max(0, Math.min(0.5, logoConfig.padding)) : 0.05;
      const paddingPx = logoSizePx * paddingFraction;
      const imageInnerSize = Math.max(1, logoSizePx - paddingPx * 2);
      const cx = width / 2;
      const cy = height / 2;
      const x = cx - imageInnerSize / 2;
      const y = cy - imageInnerSize / 2;
      const opacity = typeof logoConfig.opacity === "number" ? Math.max(0, Math.min(1, logoConfig.opacity)) : 1;
      const bg = logoConfig.background || null;
      const shapeType = (logoConfig.shape || "circle").toLowerCase();
      const clipId = `logoClip-${Math.abs(Math.floor(cx+cy))}`;

      // background (padding ring)
      if (bg && bg.color) {
        const bgOpacity = typeof bg.opacity === "number" ? Math.max(0, Math.min(1, bg.opacity)) : 1;
        switch (shapeType) {
          case "circle":
            logoSvg += `<circle cx="${cx}" cy="${cy}" r="${logoSizePx/2}" fill="${bg.color}" fill-opacity="${bgOpacity}" />`;
            break;
          case "hexagon": {
            const half = logoSizePx / 2;
            const pts = (() => {
              const ptsArr: Array<[number,number]> = [];
              for (let i = 0; i < 6; i++) {
                const angle = Math.PI/6 + (i/6)*Math.PI*2;
                ptsArr.push([cx + Math.cos(angle)*half, cy + Math.sin(angle)*half]);
              }
              return ptsArr.map(p=>p.join(',')).join(' ');
            })();
            logoSvg += `<polygon points="${pts}" fill="${bg.color}" fill-opacity="${bgOpacity}"/>`;
            break;
          }
          default:
            // square/rounded
            const rx = shapeType === "rounded" ? Math.max(1, Math.min(logoSizePx*0.45, logoSizePx*0.25)) : 0;
            logoSvg += `<rect x="${cx - logoSizePx/2}" y="${cy - logoSizePx/2}" width="${logoSizePx}" height="${logoSizePx}" rx="${rx}" fill="${bg.color}" fill-opacity="${bgOpacity}"/>`;
        }
      }

      // Clip path for image
      switch (shapeType) {
        case "circle":
          logoDefs += `<clipPath id="${clipId}"><circle cx="${cx}" cy="${cy}" r="${imageInnerSize/2}"/></clipPath>`;
          break;
        case "hexagon": {
          const half = imageInnerSize / 2;
          const pts = (() => {
            const ptsArr: Array<[number,number]> = [];
            for (let i = 0; i < 6; i++) {
              const angle = Math.PI/6 + (i/6)*Math.PI*2;
              ptsArr.push([cx + Math.cos(angle)*half, cy + Math.sin(angle)*half]);
            }
            return ptsArr.map(p=>p.join(',')).join(' ');
          })();
          logoDefs += `<clipPath id="${clipId}"><polygon points="${pts}"/></clipPath>`;
          break;
        }
        case "rounded":
          const rx2 = Math.max(1, Math.min(imageInnerSize*0.5, imageInnerSize*0.2));
          logoDefs += `<clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${imageInnerSize}" height="${imageInnerSize}" rx="${rx2}"/></clipPath>`;
          break;
        default:
          logoDefs += `<clipPath id="${clipId}"><rect x="${x}" y="${y}" width="${imageInnerSize}" height="${imageInnerSize}"/></clipPath>`;
      }

      // Image element
      logoSvg += `<image href="${dataUrl}" x="${x}" y="${y}" width="${imageInnerSize}" height="${imageInnerSize}" clip-path="url(#${clipId})" opacity="${opacity}" preserveAspectRatio="xMidYMid meet"/>`;
    } else {
      // unable to parse logo source - include an XML comment
      logoSvg += `<!-- logo parse error: ${parsed.error} -->`;
    }
  }

  // Frame
  const frame = renderFrameSvg(width, height, frameCfg || undefined, moduleSize, margin);

  // Collect all defs
  const allDefs = [moduleDefs.defs, finderDefs.defs, timingDefs.defs, alignmentDefs.defs, backgroundColorDefs.defs, bg.defs, logoDefs, frame.defs].filter(Boolean).join("\n");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  <defs>\n    ${allDefs}\n  </defs>\n  ${bg.svg}\n  ${shapes.join("\n  ")}\n  ${timing.svg}\n  ${alignmentSvgs}\n  ${finderSvgs.join("\n  ")}\n  ${logoSvg}\n  ${frame.svg}\n</svg>`;
  return svg;
}
