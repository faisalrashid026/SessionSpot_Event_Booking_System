// Optional browser-local artwork; no uploads or external image URLs.
export const MAX_POSTER_BYTES = 1024 * 1024;
export function validatePoster(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > Math.ceil(MAX_POSTER_BYTES / 3) * 4 + 32)
    throw Error("Choose a PNG, JPEG or WebP poster no larger than 1 MB.");
  const match = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match || match[2].length % 4) throw Error("Choose a PNG, JPEG or WebP image, not an external URL or SVG.");
  let bytes;
  try { bytes = atob(match[2]); } catch { throw Error("The poster image is invalid."); }
  const valid = match[1] === "png" ? bytes.startsWith("\x89PNG\r\n\x1a\n")
    : match[1] === "jpeg" ? bytes.startsWith("\xff\xd8\xff")
    : bytes.startsWith("RIFF") && bytes.slice(8, 12) === "WEBP";
  if (!valid || bytes.length > MAX_POSTER_BYTES) throw Error("The poster format or size is invalid. Use PNG, JPEG or WebP up to 1 MB.");
  return value;
}
export async function readPoster(file) {
  if (!file || !["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > MAX_POSTER_BYTES)
    throw Error("Choose a PNG, JPEG or WebP poster no larger than 1 MB.");
  const value = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(Error("The poster could not be read. Choose it again."));
    reader.readAsDataURL(file);
  });
  validatePoster(value);
  const image = new Image(); image.src = value;
  try { await image.decode(); } catch { throw Error("The selected file is not a readable image."); }
  if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 20000000)
    throw Error("Choose an image with no more than 20 million pixels.");
  return value;
}
