export function renderSvgFromMatrix(matrix: number[][], opts: { moduleSize?: number; marginModules?: number } ) {
  const moduleSize = opts.moduleSize || 8;
  const margin = typeof opts.marginModules === "number" ? opts.marginModules : 4;
  const rows = matrix.length;
  const cols = matrix[0]?.length || 0;
  const width = (cols + margin * 2) * moduleSize;
  const height = (rows + margin * 2) * moduleSize;

  const rects: string[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (matrix[y][x]) {
        const rx = (x + margin) * moduleSize;
        const ry = (y + margin) * moduleSize;
        rects.push(`<rect x="${rx}" y="${ry}" width="${moduleSize}" height="${moduleSize}" fill="#000"/>`);
      }
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">\n  <rect width="100%" height="100%" fill="#fff"/>\n  ${rects.join("\n  ")}\n</svg>`;
  return svg;
}
