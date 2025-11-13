/**
 * Utility functions for image processing and resizing
 */

// Maximum dimensions for xAI Grok API
// Based on typical vision model limits, using 2048x2048 as safe maximum
const MAX_IMAGE_DIMENSION = 2048;

/**
 * Checks if an image exceeds maximum dimensions
 */
export const exceedsMaxDimensions = (width: number, height: number, maxDimension: number = MAX_IMAGE_DIMENSION): boolean => {
  return width > maxDimension || height > maxDimension;
};

/**
 * Calculate new dimensions that fit within max dimension while maintaining aspect ratio
 */
export const calculateDownscaledDimensions = (
  originalWidth: number,
  originalHeight: number,
  maxDimension: number = MAX_IMAGE_DIMENSION
): { width: number; height: number } => {
  if (!exceedsMaxDimensions(originalWidth, originalHeight, maxDimension)) {
    return { width: originalWidth, height: originalHeight };
  }

  const aspectRatio = originalWidth / originalHeight;
  
  if (originalWidth > originalHeight) {
    // Landscape or square
    return {
      width: maxDimension,
      height: Math.round(maxDimension / aspectRatio)
    };
  } else {
    // Portrait
    return {
      width: Math.round(maxDimension * aspectRatio),
      height: maxDimension
    };
  }
};

/**
 * Downscales an image to fit within maximum dimensions
 * Returns a promise with the downscaled image as base64 and mime type
 */
export const downscaleImage = (
  file: File,
  maxDimension: number = MAX_IMAGE_DIMENSION
): Promise<{ base64: string; mimeType: string; originalWidth: number; originalHeight: number; newWidth: number; newHeight: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      img.src = dataUrl;
    };

    reader.onerror = reject;

    img.onload = () => {
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;

      // Check if downscaling is needed
      if (!exceedsMaxDimensions(originalWidth, originalHeight, maxDimension)) {
        // No downscaling needed, return original
        const base64 = img.src.split(',')[1];
        resolve({
          base64,
          mimeType: file.type,
          originalWidth,
          originalHeight,
          newWidth: originalWidth,
          newHeight: originalHeight
        });
        return;
      }

      // Calculate new dimensions
      const { width: newWidth, height: newHeight } = calculateDownscaledDimensions(
        originalWidth,
        originalHeight,
        maxDimension
      );

      // Create canvas for downscaling
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context for image downscaling'));
        return;
      }

      // Use high-quality image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw the downscaled image
      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      // Convert to base64
      // Use original mime type, fallback to png if not supported
      const mimeType = file.type === 'image/jpeg' || file.type === 'image/png' ? file.type : 'image/png';
      const quality = file.type === 'image/jpeg' ? 0.92 : undefined;

      try {
        const dataUrl = canvas.toDataURL(mimeType, quality);
        const base64 = dataUrl.split(',')[1];

        resolve({
          base64,
          mimeType,
          originalWidth,
          originalHeight,
          newWidth,
          newHeight
        });
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image for downscaling'));

    reader.readAsDataURL(file);
  });
};
