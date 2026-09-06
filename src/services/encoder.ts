import QRCode from "qrcode";

export type MatrixResult = {
  matrix: number[][];
  version: number | null;
  errorCorrection: string | null;
};

// Encode input data into a module matrix using the 'qrcode' package.
// Note: the 'qrcode' package exposes QRCode.create in some versions; if not available,
// this function falls back to using toDataURL and does not provide a matrix.
export async function encodeToMatrix(data: string, opts: any = {}): Promise<MatrixResult> {
  const ecLevel = (opts.error_correction || "M").toUpperCase();

  // The 'qrcode' package offers a "create" method that returns modules for low-level access.
  try {
    // @ts-ignore - some typings don't expose create
    const qr = QRCode.create ? (QRCode as any).create(data, { errorCorrectionLevel: ecLevel }) : null;

    if (qr && qr.modules) {
      const size = qr.modules.size;
      const modules: number[][] = [];
      for (let y = 0; y < size; y++) {
        const row: number[] = [];
        for (let x = 0; x < size; x++) {
          row.push(qr.modules.get(x, y) ? 1 : 0);
        }
        modules.push(row);
      }
      return { matrix: modules, version: qr.version || null, errorCorrection: ecLevel };
    }
  } catch (e) {
    console.warn("Low-level matrix extraction via QRCode.create() failed or not supported in this environment.", e);
  }

  // Fallback: generate an SVG via toString and attempt to parse it into a crude matrix by sampling - not implemented here.
  // For now, return an error indicating a dependency/version mismatch.
  throw new Error("Matrix extraction not available. Ensure 'qrcode' package version supports QRCode.create(), or replace with a low-level encoder like qrcodegen (Nayuki).");
}
