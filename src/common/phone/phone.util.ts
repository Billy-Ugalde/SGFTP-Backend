import { parsePhoneNumberWithError, isValidPhoneNumber } from 'libphonenumber-js';

export function validatePhone(raw: string | undefined | null): boolean {
  if (!raw || !raw.trim()) return false;
  try {
    return isValidPhoneNumber(raw.trim());
  } catch {
    return false;
  }
}

export function normalizePhone(raw: string | undefined | null): string {
  if (!raw || !raw.trim()) {
    throw new Error('El número de teléfono no puede estar vacío');
  }
  const cleaned = raw.trim();
  try {
    const parsed = parsePhoneNumberWithError(cleaned);
    if (!parsed || !parsed.isValid()) {
      throw new Error('Número de teléfono inválido');
    }
    return parsed.format('E.164');
  } catch (e: any) {
    throw new Error(e?.message || 'Número de teléfono inválido');
  }
}

export function normalizePhoneOptional(raw: string | undefined | null): string | undefined {
  if (!raw || !raw.trim()) return undefined;
  return normalizePhone(raw);
}

export function formatPhoneForDisplay(e164: string | undefined | null): string {
  if (!e164) return '';
  try {
    const parsed = parsePhoneNumberWithError(e164);
    if (!parsed) return e164;
    return parsed.formatInternational();
  } catch {
    return e164;
  }
}

export function isE164Format(value: string): boolean {
  return /^\+\d{7,15}$/.test(value);
}
