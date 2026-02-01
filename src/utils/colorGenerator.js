// Deterministic color generation from string
// Same string always produces same visually pleasing color

const GOLDEN_RATIO_CONJUGATE = 0.618033988749895;
const SATURATIONS = [0.55, 0.62, 0.70, 0.78, 0.85];
const LIGHTNESSES = [0.42, 0.48, 0.54, 0.60, 0.66];
const PRIMARY_COLOR = '#00FFFC';

/**
 * Cross-platform hash - works identically on Web, Android, iOS, Desktop
 * Uses only operations that stay within JavaScript's safe integer range
 */
function customHash(input, seed) {
  let hash = seed;
  for (let i = 0; i < input.length; i++) {
    // Classic DJB2-style hash with safe multiplier
    hash = ((hash << 5) - hash + input.charCodeAt(i)) & 0x7FFFFFFF;
  }
  // Simple mixing using only bit operations (no large multiplies)
  hash ^= (hash >> 11);
  hash = ((hash << 5) - hash) & 0x7FFFFFFF;
  hash ^= (hash >> 13);
  hash = ((hash << 5) - hash) & 0x7FFFFFFF;
  hash ^= (hash >> 7);
  return hash;
}

/**
 * Helper function for HSL to RGB conversion
 */
function hueToRgb(p, q, t) {
  let tNorm = t;
  if (tNorm < 0) tNorm += 1.0;
  if (tNorm > 1) tNorm -= 1.0;

  if (tNorm < 1.0 / 6.0) return p + (q - p) * 6.0 * tNorm;
  if (tNorm < 1.0 / 2.0) return q;
  if (tNorm < 2.0 / 3.0) return p + (q - p) * (2.0 / 3.0 - tNorm) * 6.0;
  return p;
}

/**
 * Convert HSL to hex color string
 */
function hslToHex(hue, saturation, lightness) {
  const h = hue / 360.0;
  const s = saturation;
  const l = lightness;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1.0 / 3.0);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1.0 / 3.0);
  }

  const toHex = (c) => {
    const hex = Math.round(Math.min(255, Math.max(0, c * 255))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate a deterministic color from any string
 * @param {string} input - The string to generate color from (e.g., tag name)
 * @returns {string} Hex color string (e.g., "#4ECDC4")
 */
export function generateColorFromString(input) {
  if (!input || input.length === 0) {
    return PRIMARY_COLOR;
  }

  const normalizedInput = input.toLowerCase().trim();

  const hash1 = customHash(normalizedInput, 1836311903);
  const hash2 = customHash(normalizedInput, 1952879633);

  const hueRaw = (hash1 * GOLDEN_RATIO_CONJUGATE) % 1.0;
  const hue = hueRaw * 360.0;

  const satIndex = hash2 % 5;
  const lightIndex = (hash2 >> 10) % 5;

  const saturation = SATURATIONS[satIndex];
  const lightness = LIGHTNESSES[lightIndex];

  return hslToHex(hue, saturation, lightness);
}

/**
 * Get topic's primary color based on its first tag
 * @param {Object} topic - Topic object with tags array
 * @returns {string} Hex color string
 */
export function getTopicColor(topic) {
  if (!topic?.tags || topic.tags.length === 0) {
    return PRIMARY_COLOR;
  }
  return generateColorFromString(topic.tags[0]);
}
