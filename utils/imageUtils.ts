/**
 * Utility functions for image processing and resizing
 */

// Maximum dimensions for xAI Grok API
// Based on API generation limits, the maximum supported dimension is 1536px
// This applies to both input images (for vision/analysis) and output generation
const MAX_IMAGE_DIMENSION = 1536;

// Supported image generation sizes for xAI Grok API
// Following OpenAI-compatible format
const SUPPORTED_GENERATION_SIZES = [
  { width: 1024, height: 1024 }, // 1:1 (square)
  { width: 1024, height: 1536 }, // 2:3 (portrait)
  { width: 1536, height: 1024 }, // 3:2 (landscape)
] as const;

type GenerationSize = '1024x1024' | '1024x1536' | '1536x1024';

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

/**
 * Determine the best image generation size based on input image dimensions
 * Returns a size string compatible with xAI Grok API (e.g., "1024x1024")
 */
export const determineGenerationSize = (width: number, height: number): GenerationSize => {
  const aspectRatio = width / height;
  
  // If image is roughly square (within 10% tolerance)
  if (aspectRatio >= 0.9 && aspectRatio <= 1.1) {
    return '1024x1024';
  }
  
  // If image is portrait (taller than wide)
  if (aspectRatio < 1.0) {
    return '1024x1536';
  }
  
  // If image is landscape (wider than tall)
  return '1536x1024';
};

/**
 * Check if an image aspect ratio is unsupported (too extreme for good quality generation)
 * Unsupported ratios would require significant distortion or letterboxing
 * 
 * Thresholds:
 * - Portrait: aspect ratio < 0.6 (e.g., 9:16 = 0.5625)
 * - Landscape: aspect ratio > 1.7 (e.g., 16:9 = 1.778)
 * - These are beyond reasonable mapping to API sizes (2:3 = 0.667, 3:2 = 1.5)
 */
export const isAspectRatioUnsupported = (width: number, height: number): boolean => {
  const aspectRatio = width / height;
  
  // Too tall (extreme portrait)
  if (aspectRatio < 0.6) {
    return true;
  }
  
  // Too wide (extreme landscape)
  if (aspectRatio > 1.7) {
    return true;
  }
  
  return false;
};

/**
 * Get a human-readable aspect ratio string
 */
export const getAspectRatioString = (width: number, height: number): string => {
  const aspectRatio = width / height;
  
  // Common aspect ratios
  if (Math.abs(aspectRatio - 1.0) < 0.01) return '1:1';
  if (Math.abs(aspectRatio - 16/9) < 0.01) return '16:9';
  if (Math.abs(aspectRatio - 9/16) < 0.01) return '9:16';
  if (Math.abs(aspectRatio - 4/3) < 0.01) return '4:3';
  if (Math.abs(aspectRatio - 3/4) < 0.01) return '3:4';
  if (Math.abs(aspectRatio - 3/2) < 0.01) return '3:2';
  if (Math.abs(aspectRatio - 2/3) < 0.01) return '2:3';
  
  // Default to width:height ratio
  return `${width}:${height}`;
};

/**
 * Get image dimensions from base64 data
 */
export const getImageDimensions = (base64Data: string, mimeType: string): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = reject;
    img.src = `data:${mimeType};base64,${base64Data}`;
  });
};

/**
 * Maximum dimensions for API generation
 * Based on xAI/OpenAI API limits for image generation
 */
const MAX_GENERATION_DIMENSION = 1536;

/**
 * Downscale canvas dimensions to fit within API generation limits
 * Returns new dimensions that fit within 1536x1536 while maintaining aspect ratio
 */
export const constrainToGenerationLimits = (width: number, height: number): { width: number; height: number } => {
  // If already within limits, return as-is
  if (width <= MAX_GENERATION_DIMENSION && height <= MAX_GENERATION_DIMENSION) {
    return { width, height };
  }

  const aspectRatio = width / height;
  
  if (width > height) {
    // Landscape: constrain width
    return {
      width: MAX_GENERATION_DIMENSION,
      height: Math.round(MAX_GENERATION_DIMENSION / aspectRatio)
    };
  } else {
    // Portrait or square: constrain height
    return {
      width: Math.round(MAX_GENERATION_DIMENSION * aspectRatio),
      height: MAX_GENERATION_DIMENSION
    };
  }
};

/**
 * Downscale a canvas to fit within API generation limits
 * Returns a new canvas with the image downscaled if necessary
 */
export const downscaleCanvasForAPI = (sourceCanvas: HTMLCanvasElement): HTMLCanvasElement => {
  const originalWidth = sourceCanvas.width;
  const originalHeight = sourceCanvas.height;
  
  // Check if downscaling is needed
  const constrainedDimensions = constrainToGenerationLimits(originalWidth, originalHeight);
  
  // If no downscaling needed, return original canvas
  if (constrainedDimensions.width === originalWidth && constrainedDimensions.height === originalHeight) {
    return sourceCanvas;
  }
  
  // Create new canvas with constrained dimensions
  const newCanvas = document.createElement('canvas');
  newCanvas.width = constrainedDimensions.width;
  newCanvas.height = constrainedDimensions.height;
  
  const ctx = newCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get canvas context for downscaling');
  }
  
  // Use high-quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Draw the downscaled image
  ctx.drawImage(sourceCanvas, 0, 0, constrainedDimensions.width, constrainedDimensions.height);
  
  return newCanvas;
};
