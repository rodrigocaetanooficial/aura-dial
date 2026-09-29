/** Reads an image file into a data URL that is safe to keep in chrome.storage.local.
 *
 *  Base64 inflates a file by ~33% and the local quota is 10MB, so a single
 *  photo straight off a camera (5-10MB) blows the whole store and nothing
 *  saves. Anything past MAX_EDGE_BYTES is re-encoded down to MAX_EDGE on its
 *  long edge first; small files (SVG logos, little PNGs) are stored untouched
 *  so vector art keeps its quality.
 */
const MAX_EDGE = 2560;
const MAX_EDGE_BYTES = 300 * 1024;

export async function imageFileToDataUrl(
  file: File,
  { maxEdge = MAX_EDGE, maxBytes = MAX_EDGE_BYTES }: { maxEdge?: number; maxBytes?: number } = {},
): Promise<string> {
  if (file.size <= maxBytes) return readAsDataUrl(file);

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      bitmap.close();
      return readAsDataUrl(file);
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL('image/webp', 0.85);
  } catch {
    // Undecodable here (odd format) — let the browser try the raw bytes.
    return readAsDataUrl(file);
  }
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
