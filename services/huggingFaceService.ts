// Hugging Face Inference API service for AI image generation, editing, inpainting and outpainting
// This service uses Stable Diffusion models for all image generation tasks
// Grok API is used only for image analysis and description generation

// API key management
let userApiKey: string | null = null;

// Custom inference endpoint management (optional)
// If set, this will be used instead of the public Inference API
// Format: https://your-endpoint.endpoints.huggingface.cloud
let customEndpoint: string | null = null;

// Initialize from localStorage if available (browser environment)
if (typeof window !== 'undefined') {
  const storedKey = localStorage.getItem('hf_api_key');
  if (storedKey) {
    userApiKey = storedKey;
  }
  const storedEndpoint = localStorage.getItem('hf_custom_endpoint');
  if (storedEndpoint) {
    customEndpoint = storedEndpoint;
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
      return storedKey.trim();
    }
  }
  return userApiKey ? userApiKey.trim() : (process.env.HF_API_KEY || null);
};

/**
 * Set a custom Hugging Face Inference Endpoint URL
 * This allows using dedicated endpoints with higher quality models like NSFW XL
 * @param endpoint - Full URL of your custom endpoint (e.g., 'https://xxxxx.endpoints.huggingface.cloud')
 */
export const setHFCustomEndpoint = (endpoint: string) => {
  customEndpoint = endpoint;
  if (typeof window !== 'undefined') {
    localStorage.setItem('hf_custom_endpoint', endpoint);
  }
};

/**
 * Get the custom Hugging Face Inference Endpoint URL if set
 * @returns The custom endpoint URL or null if using public API
 */
export const getHFCustomEndpoint = (): string | null => {
  if (typeof window !== 'undefined') {
    const storedEndpoint = localStorage.getItem('hf_custom_endpoint');
    if (storedEndpoint) {
      return storedEndpoint.trim();
    }
  }
  return customEndpoint;
};

/**
 * Clear the custom endpoint and revert to public Inference API
 */
export const clearHFCustomEndpoint = () => {
  customEndpoint = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('hf_custom_endpoint');
  }
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

/**
 * Test Hugging Face API connectivity and authentication
 * This function can be called from the browser console for debugging
 */
export const testHFConnection = async (): Promise<{success: boolean, message: string, details?: any}> => {
  const apiKey = getHFApiKey();
  if (!apiKey) {
    return {
      success: false,
      message: 'No API key configured. Please set your HF API key in settings.'
    };
  }

  try {
    console.log('[testHFConnection] Testing connection to Hugging Face API...');
    console.log('[testHFConnection] API key present:', !!apiKey);
    console.log('[testHFConnection] API key format valid:', apiKey.startsWith('hf_'));
    
    // Test with a simple, well-known model that's always available
    const testUrl = 'https://api-inference.huggingface.co/models/bert-base-uncased';
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      mode: 'cors',
      credentials: 'omit'
    });

    console.log('[testHFConnection] Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: 'Connection successful! Hugging Face API is accessible.',
        details: {
          status: response.status,
          modelInfo: data
        }
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        message: `API returned error status ${response.status}`,
        details: {
          status: response.status,
          error: errorText
        }
      };
    }
  } catch (error) {
    console.error('[testHFConnection] Error:', error);
    if (error instanceof Error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        details: {
          errorName: error.name,
          errorMessage: error.message,
          errorType: error.name === 'TypeError' ? 'Likely CORS or network issue' : 'Unknown error'
        }
      };
    }
    return {
      success: false,
      message: 'Unknown error occurred',
      details: error
    };
  }
};

// Make testHFConnection available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).testHFConnection = testHFConnection;
  console.log('[HF Service] testHFConnection() is available in console for debugging');
}

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

  // Validate API key format (should start with 'hf_')
  if (!apiKey.startsWith('hf_')) {
    console.warn('[inpaintImage] API key does not start with hf_ - this might be incorrect');
    throw new Error("Ogiltig Hugging Face API-nyckel format. Nyckeln ska börja med 'hf_'.");
  }

  try {
    console.log('[inpaintImage] Starting inpainting with Hugging Face...');
    console.log('[inpaintImage] Prompt:', prompt);

    // Load the image to check dimensions
    const img = new Image();
    img.src = `data:${mimeType};base64,${base64ImageData}`;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    });

    let processedImageData = base64ImageData;
    let processedMimeType = mimeType;
    let processedMaskData = base64MaskData;
    let width = img.naturalWidth;
    let height = img.naturalHeight;

    // NSFW XL models have a 1024x1024 pixel limit
    // Downscale if image exceeds this limit while preserving aspect ratio
    const MAX_DIMENSION = 1024;
    
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      console.log(`[inpaintImage] Image exceeds max dimension (${MAX_DIMENSION}px), downscaling...`);
      console.log(`[inpaintImage] Original dimensions: ${width}x${height}`);
      
      // Calculate new dimensions while preserving aspect ratio
      const aspectRatio = width / height;
      if (width > height) {
        width = MAX_DIMENSION;
        height = Math.round(MAX_DIMENSION / aspectRatio);
      } else {
        height = MAX_DIMENSION;
        width = Math.round(MAX_DIMENSION * aspectRatio);
      }

      // Downscale the image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Kunde inte skapa canvas-kontext för nedskalning.');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      processedImageData = canvas.toDataURL('image/png').split(',')[1];
      processedMimeType = 'image/png';

      // Also downscale the mask to match
      const maskImg = new Image();
      maskImg.src = `data:${maskMimeType};base64,${base64MaskData}`;
      await new Promise<void>((resolve, reject) => {
        maskImg.onload = () => resolve();
        maskImg.onerror = reject;
      });

      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = width;
      maskCanvas.height = height;
      const maskCtx = maskCanvas.getContext('2d');
      if (!maskCtx) throw new Error('Kunde inte skapa mask canvas-kontext.');

      maskCtx.imageSmoothingEnabled = true;
      maskCtx.imageSmoothingQuality = 'high';
      maskCtx.drawImage(maskImg, 0, 0, width, height);

      processedMaskData = maskCanvas.toDataURL('image/png').split(',')[1];
      
      console.log(`[inpaintImage] Downscaled to ${width}x${height}`);
    }

    // Use custom endpoint if configured, otherwise use public API
    // Both use FormData format for inpainting models
    // For NSFW inpainting on custom endpoint, deploy: diffusers/stable-diffusion-xl-1.0-inpainting-0.1
    const customEndpoint = getHFCustomEndpoint();
    const apiUrl = customEndpoint || `https://api-inference.huggingface.co/models/runwayml/stable-diffusion-inpainting`;
    
    console.log('[inpaintImage] Using custom endpoint:', !!customEndpoint);
    console.log('[inpaintImage] API URL:', customEndpoint ? 'Custom Endpoint' : apiUrl);

    // The Hugging Face Inference API for inpainting expects binary data as FormData
    // This works for both public API and custom endpoints with inpainting models deployed
    const imageBlob = base64ToBlob(processedImageData, processedMimeType);
    const maskBlob = base64ToBlob(processedMaskData, 'image/png');
    
    const formData = new FormData();
    formData.append('image', imageBlob, 'image.png');
    formData.append('mask', maskBlob, 'mask.png');
    formData.append('prompt', prompt);

    console.log('[inpaintImage] Sending request to Hugging Face API...');
    console.log('[inpaintImage] Image blob size:', imageBlob.size, 'bytes');
    console.log('[inpaintImage] Mask blob size:', maskBlob.size, 'bytes');
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        // Don't set Content-Type - let the browser set it with boundary for multipart/form-data
      },
      body: formData,
      mode: 'cors',
      credentials: 'omit'
    });

    console.log('[inpaintImage] Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[inpaintImage] API error:', response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('Ogiltig Hugging Face API-nyckel. Kontrollera din nyckel i inställningarna.');
      }
      if (response.status === 503) {
        // Model is loading - especially common for custom endpoints on first request
        if (customEndpoint) {
          throw new Error('Modellen laddas (detta kan ta 30-60 sekunder vid första användningen). Vänta och försök igen.');
        }
        throw new Error('Modellen laddas. Vänta några sekunder och försök igen.');
      }
      throw new Error(`Hugging Face API-fel (${response.status}): ${errorText}`);
    }

    // Response is image blob
    const resultBlob = await response.blob();
    console.log('[inpaintImage] Result blob size:', resultBlob.size, 'bytes');
    console.log('[inpaintImage] Result blob type:', resultBlob.type);
    
    // Validate that we got actual image data
    if (resultBlob.size === 0) {
      console.error('[inpaintImage] Received empty blob (0 bytes)');
      throw new Error('Hugging Face API returnerade en tom bild. Detta kan bero på fel format eller modellproblem.');
    }
    
    const resultBase64 = await blobToBase64(resultBlob);

    console.log('[inpaintImage] Inpainting completed successfully');
    return {
      base64: resultBase64,
      mimeType: resultBlob.type || 'image/png'
    };

  } catch (error) {
    console.error("[inpaintImage] Error inpainting image with Hugging Face:", error);
    // Log detailed error information for debugging
    if (error && typeof error === 'object') {
      console.error("[inpaintImage] Error details:", JSON.stringify(error, null, 2));
      console.error("[inpaintImage] Error name:", (error as any).name);
      console.error("[inpaintImage] Error message:", (error as any).message);
    }
    if (error instanceof Error) {
      // Check for CORS-specific errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error("[inpaintImage] CORS or network error detected");
        throw new Error('Kunde inte ansluta till Hugging Face API. Detta kan bero på:\n1. CORS-begränsningar i webbläsaren\n2. Nätverksproblem\n3. Ogiltig API-nyckel\n\nFörsök:\n- Kontrollera din internetanslutning\n- Verifiera din HF API-nyckel i inställningarna\n- Försök igen om några sekunder');
      }
      // Check for network/fetch errors
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Kunde inte ansluta till Hugging Face API. Kontrollera din internetanslutning och API-nyckel.');
      }
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
    console.log('[outpaintImage] Requested target dimensions:', targetWidth, 'x', targetHeight);
    console.log('[outpaintImage] Prompt:', prompt);

    // Constrain target dimensions to 1024x1024 max (NSFW XL model limit)
    const MAX_DIMENSION = 1024;
    let constrainedWidth = targetWidth;
    let constrainedHeight = targetHeight;
    
    if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
      const aspectRatio = targetWidth / targetHeight;
      if (targetWidth > targetHeight) {
        constrainedWidth = MAX_DIMENSION;
        constrainedHeight = Math.round(MAX_DIMENSION / aspectRatio);
      } else {
        constrainedHeight = MAX_DIMENSION;
        constrainedWidth = Math.round(MAX_DIMENSION * aspectRatio);
      }
      console.log(`[outpaintImage] Target dimensions exceed limit, constrained to ${constrainedWidth}x${constrainedHeight}`);
    }

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
    canvas.width = constrainedWidth;
    canvas.height = constrainedHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Kunde inte skapa canvas-kontext.');

    // Fill with white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, constrainedWidth, constrainedHeight);

    // Center the original image
    const offsetX = Math.floor((constrainedWidth - origWidth) / 2);
    const offsetY = Math.floor((constrainedHeight - origHeight) / 2);
    ctx.drawImage(img, offsetX, offsetY);

    // Create mask (black = preserve original, white = outpaint)
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = constrainedWidth;
    maskCanvas.height = constrainedHeight;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) throw new Error('Kunde inte skapa mask canvas-kontext.');

    // Fill with white (areas to outpaint)
    maskCtx.fillStyle = '#FFFFFF';
    maskCtx.fillRect(0, 0, constrainedWidth, constrainedHeight);

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
      // Check for network/fetch errors
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Kunde inte ansluta till Hugging Face API. Kontrollera din internetanslutning och API-nyckel.');
      }
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

  // Validate API key format (should start with 'hf_')
  if (!apiKey.startsWith('hf_')) {
    console.warn('[generateImageFromText] API key does not start with hf_ - this might be incorrect');
    throw new Error("Ogiltig Hugging Face API-nyckel format. Nyckeln ska börja med 'hf_'.");
  }

  try {
    console.log('[generateImageFromText] Generating image from text...');
    console.log('[generateImageFromText] Prompt:', prompt);

    // Use Stable Diffusion model for text-to-image generation
    // When using custom endpoint, use SDXL for 1024x1024 resolution and NSFW support
    // Default to SD 1.5 for public API (most reliable)
    const customEndpoint = getHFCustomEndpoint();
    const model = customEndpoint 
      ? 'stabilityai/stable-diffusion-xl-base-1.0'  // SDXL for custom endpoint (1024x1024, NSFW)
      : 'runwayml/stable-diffusion-v1-5';            // SD 1.5 for public API (512x512)
    
    // Alternative models for custom endpoint:
    // const model = 'stablediffusionapi/omnigenxl-nsfw-sfw';  // NSFW XL (if available)
    // const model = 'stabilityai/stable-diffusion-2-1';        // SD 2.1
    
    // Check if custom endpoint is configured
    const apiUrl = customEndpoint 
      ? customEndpoint  // Use custom endpoint directly
      : `https://api-inference.huggingface.co/models/${model}`;  // Use public API with model
    
    console.log('[generateImageFromText] Model:', model);
    console.log('[generateImageFromText] API URL:', customEndpoint ? 'Custom Endpoint' : apiUrl);

    console.log('[generateImageFromText] Sending request to Hugging Face API...');
    console.log('[generateImageFromText] API URL:', apiUrl);
    console.log('[generateImageFromText] API Key present:', !!apiKey);
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
      }),
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'omit' // Don't send cookies
    });

    console.log('[generateImageFromText] Response status:', response.status);
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[generateImageFromText] API error:', response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('Ogiltig Hugging Face API-nyckel. Kontrollera din nyckel i inställningarna.');
      }
      if (response.status === 503) {
        // Model is loading - especially common for custom endpoints on first request
        if (customEndpoint) {
          throw new Error('Modellen laddas (detta kan ta 30-60 sekunder vid första användningen). Vänta och försök igen.');
        }
        throw new Error('Modellen laddas. Vänta några sekunder och försök igen.');
      }
      throw new Error(`Hugging Face API-fel (${response.status}): ${errorText}`);
    }

    // Response is image blob
    const resultBlob = await response.blob();
    console.log('[generateImageFromText] Result blob size:', resultBlob.size, 'bytes');
    console.log('[generateImageFromText] Result blob type:', resultBlob.type);
    
    // Validate that we got actual image data
    if (resultBlob.size === 0) {
      console.error('[generateImageFromText] Received empty blob (0 bytes)');
      throw new Error('Hugging Face API returnerade en tom bild. Detta kan bero på fel format eller modellproblem.');
    }
    
    const resultBase64 = await blobToBase64(resultBlob);

    console.log('[generateImageFromText] Image generation completed successfully');
    return {
      base64: resultBase64,
      mimeType: resultBlob.type || 'image/png'
    };

  } catch (error) {
    console.error("Error generating image from text with Hugging Face:", error);
    if (error && typeof error === 'object') {
      console.error("[generateImageFromText] Error details:", JSON.stringify(error, null, 2));
      console.error("[generateImageFromText] Error name:", (error as any).name);
      console.error("[generateImageFromText] Error message:", (error as any).message);
    }
    if (error instanceof Error) {
      // Check for CORS-specific errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.error("[generateImageFromText] CORS or network error detected");
        throw new Error('Kunde inte ansluta till Hugging Face API. Detta kan bero på:\n1. CORS-begränsningar i webbläsaren\n2. Nätverksproblem\n3. Ogiltig API-nyckel\n\nFörsök:\n- Kontrollera din internetanslutning\n- Verifiera din HF API-nyckel i inställningarna\n- Försök igen om några sekunder');
      }
      // Check for network/fetch errors
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Kunde inte ansluta till Hugging Face API. Kontrollera din internetanslutning och API-nyckel.');
      }
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

    // Load and check image dimensions
    const img = new Image();
    img.src = `data:${mimeType};base64,${base64ImageData}`;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    });

    let width = img.naturalWidth;
    let height = img.naturalHeight;
    let processedBase64 = base64ImageData;
    let processedMimeType = mimeType;

    // NSFW XL models (used for inpainting) have a 1024x1024 pixel limit
    // Must downscale to prevent API errors while preserving aspect ratio
    const MAX_DIMENSION = 1024;
    
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      console.log(`[editImageWithPromptHF] Image exceeds max dimension (${MAX_DIMENSION}px), downscaling...`);
      console.log(`[editImageWithPromptHF] Original dimensions: ${width}x${height}`);
      
      // Calculate new dimensions while preserving aspect ratio
      const aspectRatio = width / height;
      if (width > height) {
        width = MAX_DIMENSION;
        height = Math.round(MAX_DIMENSION / aspectRatio);
      } else {
        height = MAX_DIMENSION;
        width = Math.round(MAX_DIMENSION * aspectRatio);
      }

      // Downscale the image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Kunde inte skapa canvas-kontext för nedskalning.');

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      processedBase64 = canvas.toDataURL('image/png').split(',')[1];
      processedMimeType = 'image/png';
      
      console.log(`[editImageWithPromptHF] Downscaled to ${width}x${height}`);
    }

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
      processedBase64,
      processedMimeType,
      maskBase64,
      'image/png',
      prompt
    );

    console.log('[editImageWithPromptHF] Image editing completed successfully');
    return result;

  } catch (error) {
    console.error("[editImageWithPromptHF] Error editing image with Hugging Face:", error);
    // Log detailed error information for debugging
    if (error && typeof error === 'object') {
      console.error("[editImageWithPromptHF] Error details:", JSON.stringify(error, null, 2));
    }
    if (error instanceof Error) {
      // Check for network/fetch errors
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Kunde inte ansluta till Hugging Face API. Kontrollera din internetanslutning och API-nyckel.');
      }
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
      // Check for network/fetch errors
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error('Kunde inte ansluta till Hugging Face API. Kontrollera din internetanslutning och API-nyckel.');
      }
      throw error;
    }
    throw new Error("Kunde inte skapa sammanslagen bild. Ett okänt fel inträffade.");
  }
};
