// Validator skeleton: later we'll rasterize the SVG and run ZXing/Quirc decoders to compute a scannability score.
// For now this file exposes a placeholder function signature.

export type ScanResult = {
  success: boolean;
  score: number;
  warnings: string[];
  decodedText?: string | null;
};

export async function validateScannability(svgOrBuffer: string | Buffer, opts: any = {}): Promise<ScanResult> {
  // Implementation to rasterize and run decoder will be added in the next steps.
  return { success: false, score: 0, warnings: ["validator_not_implemented"], decodedText: null };
}
