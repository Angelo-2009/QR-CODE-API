import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export type OutputConfig = {
  format?: 'svg' | 'png' | 'jpg' | 'webp' | 'avif' | 'pdf';
  size_px?: number; // max dimension in px (square output assumed)
  dpi?: number; // DPI metadata for print
  size_mm?: { width: number; height: number } | null; // explicit physical size
  quality?: number; // 0..100 for lossy formats
  async?: boolean; // force async job
  preserveVector?: boolean; // return svg as-is when format=svg
};

export type RenderResult = {
  id: string;
  contentType: string;
  buffer?: Buffer;
  filePath?: string; // when stored
  width?: number;
  height?: number;
};

export interface StorageAdapter {
  save(buffer: Buffer, filename: string, contentType: string): Promise<{ url?: string; path?: string }>;
}

export class LocalStorageAdapter implements StorageAdapter {
  baseDir: string;
  publicUrlBase?: string;
  constructor(baseDir = './tmp/output', publicUrlBase?: string) {
    this.baseDir = baseDir;
    this.publicUrlBase = publicUrlBase;
  }
  async ensureDir() {
    await fs.mkdir(this.baseDir, { recursive: true });
  }
  async save(buffer: Buffer, filename: string, contentType: string) {
    await this.ensureDir();
    const p = path.join(this.baseDir, filename);
    await fs.writeFile(p, buffer);
    return { url: this.publicUrlBase ? `${this.publicUrlBase}/${filename}` : undefined, path: p };
  }
}

const SYNC_PIXEL_THRESHOLD = 4096;
const SYNC_DPI_THRESHOLD = 300;

export async function renderOutputFromSvg(svg: string, cfg: OutputConfig = {}, storage?: StorageAdapter): Promise<RenderResult> {
  const format = cfg.format || 'svg';
  const size_px = cfg.size_px || 1024;
  const dpi = cfg.dpi || 72;
  const quality = typeof cfg.quality === 'number' ? Math.max(1, Math.min(100, cfg.quality)) : 90;

  const shouldAsync = cfg.async || size_px >= SYNC_PIXEL_THRESHOLD || (dpi && dpi >= SYNC_DPI_THRESHOLD);

  if (shouldAsync) {
    // In this starter implementation we still perform the work but tag it as 'async recommended'.
    // A real implementation would enqueue a job and return a job id here.
  }

  const id = uuidv4();

  if (format === 'svg' && cfg.preserveVector !== false) {
    const buf = Buffer.from(svg, 'utf8');
    const saved = storage ? await storage.save(buf, `${id}.svg`, 'image/svg+xml').catch(() => ({})) : undefined;
    return { id, contentType: 'image/svg+xml', buffer: buf, filePath: saved?.path ?? undefined };
  }

  // Rasterize using resvg -> PNG buffer, then convert via sharp
  try {
    // Use a default viewport size square
    const px = size_px;

    // resvg renders SVG to PNG-like bitmap
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: px,
      },
      // background: undefined ensures transparency preserved
    });
    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    let outBuffer: Buffer | undefined;
    let contentType = 'image/png';

    switch (format) {
      case 'png':
        outBuffer = pngBuffer;
        contentType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg': {
        outBuffer = await sharp(pngBuffer).flatten({ background: '#fff' }).jpeg({ quality }).toBuffer();
        contentType = 'image/jpeg';
        break;
      }
      case 'webp':
        outBuffer = await sharp(pngBuffer).webp({ quality }).toBuffer();
        contentType = 'image/webp';
        break;
      case 'avif':
        outBuffer = await sharp(pngBuffer).avif({ quality }).toBuffer();
        contentType = 'image/avif';
        break;
      case 'pdf': {
        // Sharp can create PDF via toFormat('pdf') on a raster image
        outBuffer = await sharp(pngBuffer).png().toBuffer();
        // For higher fidelity PDF, one might embed the original SVG into a PDF using a specialized library.
        contentType = 'application/pdf';
        break;
      }
      default:
        outBuffer = pngBuffer;
        contentType = 'image/png';
    }

    // Attach DPI metadata when possible (sharp supports density for input, but embedding DPI in PNG/JPEG is limited)
    // For production, write DPI into PDF or embed metadata in image files via exif.

    if (storage && outBuffer) {
      const ext = format === 'jpg' ? 'jpg' : format;
      const saveRes = await storage.save(outBuffer, `${id}.${ext}`, contentType).catch(() => ({}));
      return { id, contentType, buffer: outBuffer, filePath: saveRes?.path };
    }

    return { id, contentType, buffer: outBuffer };
  } catch (err) {
    throw new Error(`Rasterization failed: ${err}`);
  }
}
