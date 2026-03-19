import * as sharp from 'sharp';
import { BadRequestException } from '@nestjs/common';

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

/**
 * Verifica los primeros bytes del buffer para confirmar el tipo real del archivo.
 * Esto previene que un atacante cambie la extensión/mimetype del archivo.
 */
function hasValidMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }

  // WebP: RIFF????WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }

  return false;
}

export interface ProcessImageOptions {
  /** Ancho máximo en píxeles. La imagen se redimensiona si supera este valor. */
  maxWidthPx?: number;
  /** Calidad WebP (1-100). Default: 88 */
  quality?: number;
}

/**
 * Valida el formato de la imagen (MIME, extensión, magic bytes) y la procesa
 * con Sharp: redimensiona al ancho máximo si es necesario y convierte a WebP.
 *
 * @returns El objeto Multer.File con el buffer procesado y mimetype actualizado.
 */
export async function validateAndProcessImage(
  file: Express.Multer.File,
  options: ProcessImageOptions = {},
): Promise<Express.Multer.File> {
  const { maxWidthPx = 1920, quality = 88 } = options;

  // 1. Whitelist de MIME type
  if (!ALLOWED_MIMES.has(file.mimetype)) {
    throw new BadRequestException(
      'Formato no permitido. Solo se aceptan: JPG, PNG, WebP.',
    );
  }

  // 2. Whitelist de extensión
  const rawExt = file.originalname.split('.').pop() ?? '';
  const ext = '.' + rawExt.toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new BadRequestException(
      'Extensión no permitida. Solo se aceptan: .jpg, .jpeg, .png, .webp.',
    );
  }

  // 3. Validación de magic bytes (tipo real del archivo)
  if (!hasValidMagicBytes(file.buffer)) {
    throw new BadRequestException(
      'El archivo no es una imagen válida.',
    );
  }

  // 4. Procesar con Sharp: redimensionar + convertir a WebP
  const processedBuffer = await sharp(file.buffer)
    .resize({ width: maxWidthPx, withoutEnlargement: true })
    .webp({ quality })
    .toBuffer();

  const baseName = file.originalname.replace(/\.[^.]+$/, '');

  return {
    ...file,
    buffer: processedBuffer,
    mimetype: 'image/webp',
    size: processedBuffer.length,
    originalname: `${baseName}.webp`,
  };
}
