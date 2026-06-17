import sharp = require('sharp');
import { BadRequestException } from '@nestjs/common';

const ALLOWED_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function hasValidMagicBytes(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return true;
  }

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
  maxWidthPx?: number;
  quality?: number;
}

export async function validateAndProcessImage(
  file: Express.Multer.File,
  options: ProcessImageOptions = {},
): Promise<Express.Multer.File> {
  const { maxWidthPx = 1920, quality = 88 } = options;

  if (!ALLOWED_MIMES.has(file.mimetype)) {
    throw new BadRequestException(
      'Formato no permitido. Solo se aceptan imágenes JPG, PNG o WebP.',
    );
  }

  const rawExt = file.originalname.split('.').pop() ?? '';
  const ext = '.' + rawExt.toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new BadRequestException(
      'Extensión no permitida. Solo se aceptan: .jpg, .jpeg, .png, .webp.',
    );
  }

  if (!hasValidMagicBytes(file.buffer)) {
    throw new BadRequestException(
      'El archivo no es una imagen válida o está dañado.',
    );
  }

  let processedBuffer: Buffer;
  try {
    processedBuffer = await sharp(file.buffer)
      .resize({ width: maxWidthPx, withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
  } catch {
    throw new BadRequestException(
      'No se pudo procesar la imagen. El archivo puede estar dañado.',
    );
  }

  const baseName = file.originalname.replace(/\.[^.]+$/, '');

  return {
    ...file,
    buffer: processedBuffer,
    mimetype: 'image/webp',
    size: processedBuffer.length,
    originalname: `${baseName}.webp`,
  };
}

export async function validateAndProcessImages<
  T extends Express.Multer.File[] | undefined,
>(files: T, options: ProcessImageOptions = {}): Promise<T> {
  if (!files || files.length === 0) return files;
  return (await Promise.all(
    files.map((file) => validateAndProcessImage(file, options)),
  )) as T;
}

export async function validateAndProcessImageFields<T extends object>(
  fields: T | undefined,
  options: ProcessImageOptions = {},
): Promise<T | undefined> {
  if (!fields) return fields;
  for (const key of Object.keys(fields)) {
    const arr = (fields as any)[key] as Express.Multer.File[] | undefined;
    if (Array.isArray(arr) && arr.length > 0) {
      (fields as any)[key] = await Promise.all(
        arr.map((file) => validateAndProcessImage(file, options)),
      );
    }
  }
  return fields;
}
