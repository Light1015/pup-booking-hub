/**
 * Compress/resize image before upload to optimize storage and loading speed.
 * Max dimension: 2048px, quality: 0.85, output: JPEG or WebP
 */
export async function compressImage(
  file: File,
  maxDimension = 2048,
  quality = 0.85
): Promise<File> {
  // Skip non-image files
  if (!file.type.startsWith("image/")) return file;

  // Skip small files (< 500KB) - no need to compress
  if (file.size < 500 * 1024) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Only resize if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      } else if (file.size < 2 * 1024 * 1024) {
        // If dimensions are fine and file < 2MB, skip compression
        resolve(file);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Use webp if supported, fallback to jpeg
      const outputType = "image/webp";
      
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // If compressed is larger, use original
            resolve(file);
            return;
          }

          const ext = outputType === "image/webp" ? "webp" : "jpg";
          const newName = file.name.replace(/\.[^.]+$/, `.${ext}`);
          const compressed = new File([blob], newName, { type: outputType });
          resolve(compressed);
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file); // Fallback to original on error
    };

    img.src = url;
  });
}
