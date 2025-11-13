// Hugging Face Inference API service for AI image generation, editing, inpainting and outpainting
// This service uses Stable Diffusion models for all image generation tasks
// Grok API is used only for image analysis and description generation

// API key management
let userApiKey: string | null = null;

// Initialize from localStorage if available (browser environment)
if (typeof window !== 'undefined') {
  const storedKey = localStorage.getItem('hf_api_key');
  if (storedKey) {
    userApiKey = storedKey;
  }
}

export const setHFApiKey = (apiKey: string) => {
  userApiKey = apiKey;
  if (typeof window !== 'undefined') {
    localStorage.setItem('hf_api_key', apiKey);
  }
};

export const getHFApiKey = (): string | null => {
  if (typeof window !== 'undefined') {
    const storedKey = localStorage.getItem('hf_api_key');
    if (storedKey) {
      return storedKey;
    }
  }
  return userApiKey || process.env.HF_API_KEY || null;
};

// Helper to convert base64 to Blob
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

// Helper to convert Blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Inpaint an image using Hugging Face Stable Diffusion Inpainting model
 * This properly preserves the original image while only modifying masked areas
 * 
 * @param base64ImageData - The original image in base64 format
 * @param mimeType - The MIME type of the original image
 * @param base64MaskData - The mask image in base64 format (white = inpaint, black = preserve)
 * @param maskMimeType - The MIME type of the mask image
 * @param prompt - Description of what to generate in the masked area
 * @returns The inpainted image
 */
export const inpaintImage = async (
  base64ImageData: string,
  mimeType: string,
  base64MaskData: string,
  maskMimeType: string,
  prompt: string
): Promise<{ base64: string, mimeType: string }> => {
  const apiKey = getHFApiKey();
  if (!apiKey) {
    throw new Error("HF_API_KEY inte inställd. Ange din Hugging Face API-nyckel i inställningarna.");
  }

  try {
    console.log('[inpaintImage] Starting inpainting with Hugging Face...');
    console.log('[inpaintImage] Prompt:', prompt);

    // Convert base64 images to Blobs
    const imageBlob = base64ToBlob(base64ImageData, mimeType);
    const maskBlob = base64ToBlob(base64MaskData, maskMimeType);

    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('inputs', prompt);
    formData.append('image', imageBlob, 'image.png');
    formData.append('mask', maskBlob, 'mask.png');

    // Use Stable Diffusion Inpainting model
    const model = 'runwayml/stable-diffusion-inpainting';
    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[inpaintImage] API error:', response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('Ogiltig Hugging Face API-nyckel. Kontrollera din nyckel i inställningarna.');
      }
      if (response.status === 503) {
        throw new Error('Modellen laddas. Vänta några sekunder och försök igen.');
      }
      throw new Error(`Hugging Face API-fel (${response.status}): ${errorText}`);
    }

    // Response is image blob
    const resultBlob = await response.blob();
    const resultBase64 = await blobToBase64(resultBlob);

    console.log('[inpaintImage] Inpainting completed successfully');
    return {
      base64: resultBase64,
      mimeType: resultBlob.type || 'image/png'
    };

  } catch (error) {
    console.error("Error inpainting image with Hugging Face:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Kunde inte utföra inpainting. Ett okänt fel inträffade.");
  }
};

/**
 * Outpaint/expand an image using Hugging Face Stable Diffusion Inpainting
 * This extends the image beyond its original borders while preserving the center
 * 
 * @param base64ImageData - The original image in base64 format
 * @param mimeType - The MIME type of the original image
 * @param targetWidth - Target width for expanded image
 * @param targetHeight - Target height for expanded image
 * @param prompt - Description to guide the outpainting
 * @returns The outpainted image
 */
export const outpaintImage = async (
  base64ImageData: string,
  mimeType: string,
  targetWidth: number,
  targetHeight: number,
  prompt: string
): Promise<{ base64: string, mimeType: string }> => {
  const apiKey = getHFApiKey();
  if (!apiKey) {
    throw new Error("HF_API_KEY inte inställd. Ange din Hugging Face API-nyckel i inställningarna.");
  }

  try {
    console.log('[outpaintImage] Starting outpainting with Hugging Face...');
    console.log('[outpaintImage] Target dimensions:', targetWidth, 'x', targetHeight);
    console.log('[outpaintImage] Prompt:', prompt);

    // Load the original image to get its dimensions
    const img = new Image();
    img.src = `data:${mimeType};base64,${base64ImageData}`;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    });

    const origWidth = img.naturalWidth;
    const origHeight = img.naturalHeight;

    // Create canvas for the expanded image with original centered
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Kunde inte skapa canvas-kontext.');

    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Center the original image
    const offsetX = Math.floor((targetWidth - origWidth) / 2);
    const offsetY = Math.floor((targetHeight - origHeight) / 2);
    ctx.drawImage(img, offsetX, offsetY);

    // Create mask (black = preserve original, white = outpaint)
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = targetWidth;
    maskCanvas.height = targetHeight;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) throw new Error('Kunde inte skapa mask canvas-kontext.');

    // Fill with white (areas to outpaint)
    maskCtx.fillStyle = '#FFFFFF';
    maskCtx.fillRect(0, 0, targetWidth, targetHeight);

    // Black rectangle where original image is (areas to preserve)
    maskCtx.fillStyle = '#000000';
    maskCtx.fillRect(offsetX, offsetY, origWidth, origHeight);

    // Convert canvases to base64
    const expandedBase64 = canvas.toDataURL('image/png').split(',')[1];
    const maskBase64 = maskCanvas.toDataURL('image/png').split(',')[1];

    // Use inpainting to fill the masked (white) areas
    const result = await inpaintImage(
      expandedBase64,
      'image/png',
      maskBase64,
      'image/png',
      prompt
    );

    console.log('[outpaintImage] Outpainting completed successfully');
    return result;

  } catch (error) {
    console.error("Error outpainting image with Hugging Face:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Kunde inte utföra outpainting. Ett okänt fel inträffade.");
  }
};

/**
 * Generate an image from text using Hugging Face Stable Diffusion
 * 
 * @param prompt - Text description of the image to generate
 * @returns The generated image
 */
export const generateImageFromText = async (
  prompt: string
): Promise<{ base64: string, mimeType: string }> => {
  const apiKey = getHFApiKey();
  if (!apiKey) {
    throw new Error("HF_API_KEY inte inställd. Ange din Hugging Face API-nyckel i inställningarna.");
  }

  try {
    console.log('[generateImageFromText] Generating image from text...');
    console.log('[generateImageFromText] Prompt:', prompt);

    // Use Stable Diffusion XL for high-quality image generation
    const model = 'stabilityai/stable-diffusion-xl-base-1.0';
    const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generateImageFromText] API error:', response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('Ogiltig Hugging Face API-nyckel. Kontrollera din nyckel i inställningarna.');
      }
      if (response.status === 503) {
        throw new Error('Modellen laddas. Vänta några sekunder och försök igen.');
      }
      throw new Error(`Hugging Face API-fel (${response.status}): ${errorText}`);
    }

    // Response is image blob
    const resultBlob = await response.blob();
    const resultBase64 = await blobToBase64(resultBlob);

    console.log('[generateImageFromText] Image generation completed successfully');
    return {
      base64: resultBase64,
      mimeType: resultBlob.type || 'image/png'
    };

  } catch (error) {
    console.error("Error generating image from text with Hugging Face:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Kunde inte generera bild från text. Ett okänt fel inträffade.");
  }
};

/**
 * Edit an image using Hugging Face Stable Diffusion with image-to-image
 * This uses the original image as a starting point and applies modifications based on the prompt
 * 
 * @param base64ImageData - The original image in base64 format
 * @param mimeType - The MIME type of the original image
 * @param prompt - Description of the desired changes
 * @returns The edited image
 */
export const editImageWithPromptHF = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<{ base64: string, mimeType: string }> => {
  const apiKey = getHFApiKey();
  if (!apiKey) {
    throw new Error("HF_API_KEY inte inställd. Ange din Hugging Face API-nyckel i inställningarna.");
  }

  try {
    console.log('[editImageWithPromptHF] Starting image editing with Hugging Face...');
    console.log('[editImageWithPromptHF] Prompt:', prompt);

    // Create a mask that covers the entire image (all white = edit everything)
    // This allows the model to make changes while using the original as reference
    const img = new Image();
    img.src = `data:${mimeType};base64,${base64ImageData}`;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    });

    const width = img.naturalWidth;
    const height = img.naturalHeight;

    // Create a white mask (edit entire image)
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = width;
    maskCanvas.height = height;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) throw new Error('Kunde inte skapa mask canvas-kontext.');

    maskCtx.fillStyle = '#FFFFFF';
    maskCtx.fillRect(0, 0, width, height);

    const maskBase64 = maskCanvas.toDataURL('image/png').split(',')[1];

    // Use inpainting with full mask for image-to-image editing
    const result = await inpaintImage(
      base64ImageData,
      mimeType,
      maskBase64,
      'image/png',
      prompt
    );

    console.log('[editImageWithPromptHF] Image editing completed successfully');
    return result;

  } catch (error) {
    console.error("Error editing image with Hugging Face:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Kunde inte redigera bilden. Ett okänt fel inträffade.");
  }
};

/**
 * Create a new image by fusing multiple images using Hugging Face
 * First analyzes images with Grok, then generates fusion with Hugging Face
 * 
 * @param images - Array of images to fuse
 * @param analysisPrompt - The analysis/fusion description from Grok
 * @returns The fused image
 */
export const createImageFromMultiple = async (
  analysisPrompt: string
): Promise<{ base64: string, mimeType: string }> => {
  const apiKey = getHFApiKey();
  if (!apiKey) {
    throw new Error("HF_API_KEY inte inställd. Ange din Hugging Face API-nyckel i inställningarna.");
  }

  try {
    console.log('[createImageFromMultiple] Creating fused image...');
    console.log('[createImageFromMultiple] Fusion prompt:', analysisPrompt);

    // Generate the fused image using text-to-image
    const result = await generateImageFromText(analysisPrompt);

    console.log('[createImageFromMultiple] Image fusion completed successfully');
    return result;

  } catch (error) {
    console.error("Error creating fused image with Hugging Face:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Kunde inte skapa sammanslagen bild. Ett okänt fel inträffade.");
  }
};
