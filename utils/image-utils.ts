// Centralized image utility functions

/**
 * Convert a base64 string to a data URI for display
 * Handles both raw base64 and already-formatted data URIs
 */
export function base64ToDataUri(base64: string): string {
  const raw = base64.trim();

  // Already a data URI
  if (raw.startsWith('data:')) {
    return raw;
  }

  // Clean up base64 string
  const cleaned = raw.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');

  // Detect image type from base64 signature
  const isPng = cleaned.startsWith('iVBOR');
  const isJpeg = cleaned.startsWith('/9j/');
  const mime = isPng ? 'image/png' : isJpeg ? 'image/jpeg' : 'image/jpeg';

  return `data:${mime};base64,${cleaned}`;
}

/**
 * Strip data URL prefix from base64 string if present
 */
export function stripBase64Prefix(base64: string): string {
  return base64.replace(/^data:image\/[a-z]+;base64,/, '');
}

/**
 * Validate that a base64 string appears to be a valid image
 */
export function isValidBase64Image(base64: string | undefined | null): boolean {
  if (!base64) return false;
  return base64.length > 1000;
}

/**
 * Convert stain type name to translation key format
 */
export function stainTypeToKey(stainType: string): string {
  return stainType
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/**
 * Get display name for a stain type, using translation if available
 */
export function getStainDisplayName(
  stainType: string | undefined,
  translator: (key: string) => string
): string {
  if (!stainType) return 'Unknown';

  const stainKey = stainTypeToKey(stainType);
  const translated = translator(`stainTypes.${stainKey}`);

  // If translation not found, format the original name
  if (translated.startsWith('stainTypes.') || translated.startsWith('missing.')) {
    return stainType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  return translated;
}

/**
 * Get display name for a category, using translation if available
 */
export function getCategoryDisplayName(
  category: string | undefined,
  translator: (key: string) => string
): string {
  if (!category) return '';

  const translated = translator(`categories.${category}`);

  if (translated.startsWith('categories.') || translated.startsWith('missing.')) {
    return category;
  }

  return translated;
}
