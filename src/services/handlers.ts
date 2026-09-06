import { Request, Response } from "express";
import { encodeToMatrix } from "./encoder";
import { renderSvgFromMatrix } from "./renderer";

export async function generateMatrixHandler(req: Request, res: Response) {
  try {
    const config = req.body;
    // Basic validation
    if (!config || !config.data) {
      return res.status(400).json({ error: "missing_data", message: "Request body must include 'data'" });
    }

    const matrixResult = await encodeToMatrix(config.data, config);

    // For initial core-encoding step return the module matrix and a simple SVG preview
    const svg = renderSvgFromMatrix(matrixResult.matrix, { moduleSize: config.size || 8, marginModules: config.margin || 4 });

    res.json({
      content_type: "image/svg+xml",
      matrix: matrixResult.matrix,
      version: matrixResult.version,
      error_correction: matrixResult.errorCorrection,
      svg_preview: svg,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", details: (err as Error).message });
  }
}

export async function getPresetsHandler(_req: Request, res: Response) {
  // Placeholder: return no presets yet
  res.json([]);
}
