export type FrameConfig = {
  style?: "banner" | "speech" | "circle" | "rounded";
  text?: string;
  fontFamily?: string;
  fontSize?: number; // px, optional; computed from QR size when absent
  fontWeight?: string | number;
  textColor?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  padding?: number; // px or fraction? we'll interpret as fraction of QR size if <=1
  borderColor?: string;
  borderWidth?: number; // px
  borderRadius?: number; // px
  height?: number; // px override for banners
};

export function renderFrameSvg(width: number, height: number, cfg?: FrameConfig, moduleSize?: number, margin?: number) {
  if (!cfg) return { defs: "", svg: "" };

  const style = cfg.style || "banner";
  const text = cfg.text || "Scan Me";
  const fontFamily = cfg.fontFamily || "Inter, Arial, Helvetica, sans-serif";
  const borderColor = cfg.borderColor || "#000";
  const borderWidth = typeof cfg.borderWidth === "number" ? cfg.borderWidth : 0;
  const textColor = cfg.textColor || "#fff";
  const bgColor = cfg.backgroundColor || "#111827";
  const bgOpacity = typeof cfg.backgroundOpacity === "number" ? Math.max(0, Math.min(1, cfg.backgroundOpacity)) : 1;

  const minDim = Math.min(width, height);
  const defaultFrameHeight = Math.max(24, Math.floor(minDim * 0.12));
  const frameHeight = typeof cfg.height === "number" ? cfg.height : defaultFrameHeight;
  const paddingPx = typeof cfg.padding === "number" ? (cfg.padding <= 1 ? Math.floor(minDim * cfg.padding) : cfg.padding) : Math.max(8, Math.floor(frameHeight * 0.25));

  // Simple banner at bottom
  if (style === "banner") {
    const bw = Math.floor(width * 0.9);
    const bx = Math.floor((width - bw) / 2);
    const by = Math.floor(height - frameHeight - (moduleSize ? moduleSize * 0.5 : 0));
    const rx = typeof cfg.borderRadius === "number" ? cfg.borderRadius : Math.max(4, Math.floor(frameHeight * 0.25));

    const fontSize = cfg.fontSize || Math.max(12, Math.floor(frameHeight * 0.45));
    const textY = by + Math.floor((frameHeight + fontSize) / 2) - 2;

    const rect = `<rect x="${bx}" y="${by}" width="${bw}" height="${frameHeight}" rx="${rx}" fill="${bgColor}" fill-opacity="${bgOpacity}" ${borderWidth ? `stroke="${borderColor}" stroke-width="${borderWidth}"` : ""} />`;
    const txt = `<text x="${width / 2}" y="${textY}" text-anchor="middle" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${cfg.fontWeight || "600"}" fill="${textColor}">${escapeXml(text)}</text>`;
    return { defs: "", svg: rect + "\n" + txt };
  }

  // Speech bubble top-left (simple)
  if (style === "speech") {
    const bw = Math.floor(width * 0.6);
    const bx = Math.floor(width * 0.05);
    const by = Math.floor(height * 0.05);
    const rx = typeof cfg.borderRadius === "number" ? cfg.borderRadius : 12;
    const fontSize = cfg.fontSize || Math.max(12, Math.floor(frameHeight * 0.4));
    const textY = by + Math.floor((frameHeight + fontSize) / 2) - 2;
    // triangle tail
    const tail = `M ${bx + 12} ${by + frameHeight} L ${bx + 28} ${by + frameHeight} L ${bx + 20} ${by + frameHeight + 12} Z`;
    const rect = `<rect x="${bx}" y="${by}" width="${bw}" height="${frameHeight}" rx="${rx}" fill="${bgColor}" fill-opacity="${bgOpacity}" ${borderWidth ? `stroke="${borderColor}" stroke-width="${borderWidth}"` : ""} />`;
    const path = `<path d="${tail}" fill="${bgColor}" fill-opacity="${bgOpacity}" />`;
    const txt = `<text x="${bx + bw / 2}" y="${textY}" text-anchor="middle" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${cfg.fontWeight || "600"}" fill="${textColor}">${escapeXml(text)}</text>`;
    return { defs: "", svg: rect + "\n" + path + "\n" + txt };
  }

  // Circle frame around center
  if (style === "circle") {
    const cx = Math.floor(width / 2);
    const cy = Math.floor(height / 2);
    const radius = Math.floor(Math.min(width, height) / 2) - (moduleSize ? moduleSize * 1 : 10);
    const circle = `<circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${bgColor}" stroke-width="${Math.max(2, borderWidth || 8)}" stroke-opacity="${bgOpacity}" />`;
    const fontSize = cfg.fontSize || Math.max(12, Math.floor(radius * 0.15));
    const txt = `<text x="${cx}" y="${cy + fontSize / 3}" text-anchor="middle" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${cfg.fontWeight || "600"}" fill="${textColor}">${escapeXml(text)}</text>`;
    return { defs: "", svg: circle + "\n" + txt };
  }

  // Rounded frame around QR area
  const pad = paddingPx + (moduleSize ? moduleSize * 0.5 : 0);
  const rx = typeof cfg.borderRadius === "number" ? cfg.borderRadius : Math.max(8, Math.floor(pad * 0.5));
  const rectW = width - pad * 2;
  const rectH = height - pad * 2;
  const rectX = pad;
  const rectY = pad;
  const rect = `<rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" rx="${rx}" fill="${bgColor}" fill-opacity="${bgOpacity}" ${borderWidth ? `stroke="${borderColor}" stroke-width="${borderWidth}"` : ""} />`;
  const fontSize = cfg.fontSize || Math.max(12, Math.floor(rectH * 0.06));
  const txtY = rectY + fontSize + 8;
  const txt = `<text x="${width / 2}" y="${txtY}" text-anchor="middle" font-family="${fontFamily}" font-size="${fontSize}" font-weight="${cfg.fontWeight || "600"}" fill="${textColor}">${escapeXml(text)}</text>`;

  return { defs: "", svg: rect + "\n" + txt };
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'\"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
