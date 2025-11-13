import OpenAI from 'openai';
import { truncatePrompt } from '../utils/promptUtils';

// xAI Grok API service for AI image editing
// This replaces the expensive Gemini API with a more cost-effective and permissive solution
// Grok has better support for fashion, swimwear, and creative content without over-filtering

// Allow API key to be passed in or use environment variable
let userApiKey: string | null = null;

// Initialize from localStorage if available (browser environment)
// Security note: API keys are stored in clear text in localStorage.
// This is acceptable for client-side apps where users manage their own keys.
// For production, consider moving API calls to a backend server.
if (typeof window !== 'undefined') {
  const storedKey = localStorage.getItem('xai_api_key');
  if (storedKey) {
    userApiKey = storedKey;
  }
}

export const setApiKey = (apiKey: string) => {
  userApiKey = apiKey;
  // Also save to localStorage for persistence
  if (typeof window !== 'undefined') {
    localStorage.setItem('xai_api_key', apiKey);
  }
};

export const getApiKey = (): string | null => {
  // Check localStorage first, then userApiKey, then environment
  if (typeof window !== 'undefined') {
    const storedKey = localStorage.getItem('xai_api_key');
    if (storedKey) {
      return storedKey;
    }
  }
  return userApiKey || process.env.API_KEY || null;
};

const getGrokClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API_KEY not set. Please enter your xAI API key in settings.");
  }
  // Grok API uses OpenAI SDK format but with custom base URL
  return new OpenAI({ 
    apiKey: apiKey, 
    baseURL: 'https://api.x.ai/v1',
    dangerouslyAllowBrowser: true 
  });
};

export const editImageWithPrompt = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<{ base64: string, mimeType: string }> => {
  const client = getGrokClient();

  try {
    console.log('[editImageWithPrompt] Starting image edit process...');
    console.log('[editImageWithPrompt] User prompt:', prompt);
    
    const dataUrl = `data:${mimeType};base64,${base64ImageData}`;
    
    // Step 1: Use Grok-4 with vision to analyze the image and create a detailed generation prompt
    console.log('[editImageWithPrompt] Step 1: Analyzing image with Grok-4 vision...');
    const analysisResponse = await client.chat.completions.create({
      model: "grok-4-fast-reasoning",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert at creating precise image generation prompts that preserve the original image while applying specific edits.

Analyze this image in EXTREME detail and create a generation prompt that will recreate this EXACT image with ONLY this modification: "${prompt}"

CRITICAL REQUIREMENTS:
1. Describe EVERY visual detail of the current image with photographic precision:
   - Exact subject description (face, body, pose, expression, clothing, accessories)
   - Precise composition and framing
   - Specific lighting (direction, quality, shadows, highlights)
   - Exact color palette and tones
   - Background elements and their positions
   - Style and medium (photo, painting, etc.)
   - Camera angle and perspective
   - Any text, logos, or distinctive features

2. Apply ONLY the requested change: "${prompt}"
   - Be surgical and precise - change ONLY what's explicitly requested
   - Keep everything else EXACTLY as it appears in the original

3. Emphasize photo-realism and accuracy:
   - "Recreate this exact image with..."
   - "Preserve all original details except..."
   - "Maintain the identical composition, lighting, and style..."

4. Be permissive with artistic and fashion content

Your response must be a single detailed generation prompt that will produce an image nearly identical to the original, with only the requested modification applied. Respond ONLY with the generation prompt, no other text.`
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    const imagePrompt = analysisResponse.choices[0]?.message?.content?.trim();
    
    if (!imagePrompt) {
      throw new Error("AI:n kunde inte skapa en redigeringsprompt.");
    }

    console.log('[editImageWithPrompt] Generated image prompt:', imagePrompt);

    // Ensure the prompt doesn't exceed the 1024 character limit for image generation
    const truncatedPrompt = truncatePrompt(imagePrompt);
    console.log('[editImageWithPrompt] Truncated prompt length:', truncatedPrompt.length);

    // Step 2: Generate the edited image using Grok's image generation model
    // Note: Grok's image generation endpoint follows OpenAI's format
    // Note: The API does not support 'style', 'size', or 'quality' parameters.
    // Images are generated at the API's default resolution.
    // Content policy is inherently permissive for fashion, swimwear, and artistic content.
    // Style preferences should be incorporated directly into the prompt text.
    console.log('[editImageWithPrompt] Step 2: Generating image with Grok-2...');
    console.log('[editImageWithPrompt] Prompt being sent:', truncatedPrompt);
    
    // Try to generate the image with explicit error handling
    // Use b64_json format to avoid CORS issues when fetching generated images
    let response;
    try {
      response = await client.images.generate({
        model: "grok-2-image-1212",
        prompt: truncatedPrompt,
        n: 1,
        response_format: "b64_json"  // Use base64 to avoid CORS issues
      });
      console.log('[editImageWithPrompt] Image generation response received');
    } catch (genError: any) {
      console.error('[editImageWithPrompt] Image generation failed:', genError);
      // Provide more specific error message
      if (genError.status === 404) {
        throw new Error("AI:n kunde inte generera bilden: Bildgenerering stöds inte av denna API-version. Kontrollera att din API-nyckel har tillgång till grok-2-image-1212 modellen.");
      }
      throw genError; // Re-throw to be caught by outer catch block
    }

    if (!response.data || response.data.length === 0) {
      throw new Error("AI:n returnerade inget bildsvar. Prova en annan prompt.");
    }

    // Step 3: Extract base64 data from response
    const b64Data = response.data[0].b64_json;
    if (!b64Data) {
      throw new Error("AI:n kunde inte generera bilden. Försök igen.");
    }

    console.log('[editImageWithPrompt] Image edit completed successfully');
    return {
      base64: b64Data,
      mimeType: 'image/jpeg'  // xAI generates JPEG format
    };

  } catch (error) {
    console.error("Error editing image with Grok:", error);
    // Log full error details for debugging
    if (error && typeof error === 'object') {
      console.error("Error details:", JSON.stringify(error, null, 2));
    }
    
    if (error instanceof Error) {
      // Check for user-friendly error messages
      const userFriendlyPrefixes = ["AI:n", "Din prompt", "Redigeringen blockerades", "Redigeringen stoppades"];
      if (userFriendlyPrefixes.some(p => error.message.startsWith(p))) {
        throw error;
      }
      
      // Check for OpenAI SDK errors with more details
      if ('status' in error || 'code' in error) {
        const apiError = error as any;
        if (apiError.status === 401) {
          throw new Error(`Kunde inte redigera bilden: Ogiltig API-nyckel. Kontrollera din xAI API-nyckel i inställningarna.`);
        }
        if (apiError.status === 429) {
          throw new Error(`Kunde inte redigera bilden: API-gräns överskriden. Vänta en stund och försök igen.`);
        }
        if (apiError.status === 400) {
          throw new Error(`Kunde inte redigera bilden: Ogiltig förfrågan. ${apiError.message || 'Prova en annan prompt eller bild.'}`);
        }
        if (apiError.status) {
          throw new Error(`Kunde inte redigera bilden: API-fel (${apiError.status}). ${apiError.message || 'Försök igen.'}`);
        }
      }
      
      // Check for network/fetch errors
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error(`Kunde inte redigera bilden: Nätverksfel. Kontrollera din internetanslutning och API-nyckel.`);
      }
      throw new Error(`Kunde inte redigera bilden: ${error.message}`);
    }
    throw new Error("Kunde inte redigera bilden. Ett okänt fel inträffade.");
  }
};

/**
 * Analyze an image for editing purposes
 * This provides detailed understanding of the image to guide precise edits
 */
export const analyzeImageForEditing = async (
  base64ImageData: string,
  mimeType: string,
  userPrompt: string
): Promise<string> => {
  const client = getGrokClient();

  try {
    console.log('[analyzeImageForEditing] Analyzing image for editing...');
    console.log('[analyzeImageForEditing] User edit request:', userPrompt);
    const dataUrl = `data:${mimeType};base64,${base64ImageData}`;
    
    const response = await client.chat.completions.create({
      model: "grok-4-fast-reasoning",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `You are an expert at creating precise image generation prompts that preserve the original image while applying specific edits.

Analyze this image in EXTREME detail and create a generation prompt that will recreate this EXACT image with ONLY this modification: "${userPrompt}"

CRITICAL REQUIREMENTS:
1. Describe EVERY visual detail of the current image with photographic precision:
   - Exact subject description (face, body, pose, expression, clothing, accessories)
   - Precise composition and framing
   - Specific lighting (direction, quality, shadows, highlights)
   - Exact color palette and tones
   - Background elements and their positions
   - Style and medium (photo, painting, etc.)
   - Camera angle and perspective
   - Any text, logos, or distinctive features

2. Apply ONLY the requested change: "${userPrompt}"
   - Be surgical and precise - change ONLY what's explicitly requested
   - Keep everything else EXACTLY as it appears in the original

3. Output format:
   - Start with a complete description of the original image
   - Then specify the modification to apply
   - Use clear, detailed language suitable for image generation

Your response must be a detailed prompt for image generation. Respond ONLY with the generation prompt in English, no other text.`
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    const generationPrompt = response.choices[0]?.message?.content?.trim();
    
    if (!generationPrompt) {
      console.error('[analyzeImageForEditing] No prompt generated');
      throw new Error("AI:n kunde inte skapa en redigeringsprompt.");
    }
    
    console.log('[analyzeImageForEditing] Generated prompt:', generationPrompt);
    return generationPrompt;
    
  } catch (error) {
    console.error("[analyzeImageForEditing] Error analyzing image for editing:", error);
    // Log full error details for debugging
    if (error && typeof error === 'object') {
      console.error("[analyzeImageForEditing] Error details:", JSON.stringify(error, null, 2));
    }
    
    if (error instanceof Error) {
      const userFriendlyPrefixes = ["AI:n", "Bildanalysen blockerades", "Bildanalysen stoppades"];
      if (userFriendlyPrefixes.some(p => error.message.startsWith(p))) {
        throw error;
      }
      
      // Check for OpenAI SDK errors with more details
      if ('status' in error || 'code' in error) {
        const apiError = error as any;
        if (apiError.status === 401) {
          throw new Error(`Kunde inte analysera bilden: Ogiltig API-nyckel. Kontrollera din xAI API-nyckel i inställningarna.`);
        }
        if (apiError.status === 429) {
          throw new Error(`Kunde inte analysera bilden: API-gräns överskriden. Vänta en stund och försök igen.`);
        }
        if (apiError.status === 400) {
          throw new Error(`Kunde inte analysera bilden: Ogiltig förfrågan. ${apiError.message || ''}`);
        }
        if (apiError.status) {
          throw new Error(`Kunde inte analysera bilden: API-fel (${apiError.status}). ${apiError.message || 'Försök igen.'}`);
        }
      }
      
      // Check for network/fetch errors
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error(`Kunde inte analysera bilden: Nätverksfel. Kontrollera din internetanslutning och API-nyckel.`);
      }
      throw new Error(`Kunde inte analysera bilden: ${error.message}`);
    }
    throw new Error("Kunde inte analysera bilden. Ett okänt fel inträffade.");
  }
};

export const generatePromptFromImage = async (
  base64ImageData: string,
  mimeType: string,
): Promise<string> => {
  const client = getGrokClient();

  try {
    console.log('[generatePromptFromImage] Analyzing image for outpainting...');
    const dataUrl = `data:${mimeType};base64,${base64ImageData}`;
    
    const response = await client.chat.completions.create({
      model: "grok-4-fast-reasoning",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "You are a scene analysis expert preparing an image for AI outpainting. Your task is to provide a concise but detailed description of the image's core visual DNA. This description will be used by another AI to seamlessly extend the scene. Focus exclusively on these critical elements:\n\n- **Artistic Style & Medium:** (e.g., 'Sharp, high-resolution digital photograph', 'Soft-focus vintage film photo with heavy grain', 'Impressionistic oil painting', '3D render')\n- **Subject & Environment:** (e.g., 'A woman in a red dress standing in a sunlit forest', 'A futuristic city skyline at night')\n- **Lighting Conditions:** (e.g., 'Golden hour sunlight from the right creating long, soft shadows', 'Bright, overcast daylight with flat, even lighting', 'Dramatic, high-contrast studio lighting')\n- **Color Palette:** (e.g., 'Dominated by earthy tones, browns, and greens', 'Vibrant neon blues and pinks', 'Muted, desaturated pastel colors')\n\nRespond only with this analysis in English. Do not add any conversational text or introductions."
            },
            {
              type: "image_url",
              image_url: {
                url: dataUrl,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 500
    });

    const text = response.choices[0]?.message?.content?.trim();
    
    if (!text) {
      console.warn("[generatePromptFromImage] No text was generated.");
      throw new Error("AI:n kunde inte generera en beskrivning.");
    }
    
    console.log('[generatePromptFromImage] Generated scene description:', text);
    return text;
    
  } catch (error) {
    console.error("[generatePromptFromImage] Error generating prompt from image:", error);
    // Log full error details for debugging
    if (error && typeof error === 'object') {
      console.error("[generatePromptFromImage] Error details:", JSON.stringify(error, null, 2));
    }
    
    if (error instanceof Error) {
      const userFriendlyPrefixes = ["AI:n", "Bildanalysen blockerades", "Bildanalysen stoppades"];
      if (userFriendlyPrefixes.some(p => error.message.startsWith(p))) {
        throw error;
      }
      
      // Check for OpenAI SDK errors with more details
      if ('status' in error || 'code' in error) {
        const apiError = error as any;
        if (apiError.status === 401) {
          throw new Error(`Kunde inte analysera bilden: Ogiltig API-nyckel. Kontrollera din xAI API-nyckel i inställningarna.`);
        }
        if (apiError.status === 429) {
          throw new Error(`Kunde inte analysera bilden: API-gräns överskriden. Vänta en stund och försök igen.`);
        }
        if (apiError.status === 400) {
          throw new Error(`Kunde inte analysera bilden: Ogiltig förfrågan. ${apiError.message || ''}`);
        }
        if (apiError.status) {
          throw new Error(`Kunde inte analysera bilden: API-fel (${apiError.status}). ${apiError.message || 'Försök igen.'}`);
        }
      }
      
      // Check for network/fetch errors
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error(`Kunde inte analysera bilden: Nätverksfel. Kontrollera din internetanslutning och API-nyckel.`);
      }
      throw new Error(`Kunde inte analysera bilden: ${error.message}`);
    }
    throw new Error("Kunde inte analysera bilden. Ett okänt fel inträffade.");
  }
};

export const translateToEnglish = async (text: string): Promise<string> => {
  const client = getGrokClient();

  try {
    const response = await client.chat.completions.create({
      model: "grok-4-fast-non-reasoning", // Use the fast non-reasoning model for translation
      messages: [
        {
          role: "system",
          content: "You are a translation expert. Your task is to translate the user's input to English. Respond ONLY with the translated English text and nothing else. Do not add any commentary, conversational text, or introductions like 'Here is the translation:'. If the user's input is already in English, simply return the original text without any changes."
        },
        {
          role: "user",
          content: text
        }
      ],
      temperature: 0,
      max_tokens: 500
    });
    
    const translatedText = response.choices[0]?.message?.content?.trim();

    if (!translatedText) {
      console.warn("Translation returned empty response. Falling back to original text.");
      return text;
    }
    
    // Remove quotes if the model wraps the response in quotes
    return translatedText.replace(/^"|"$/g, '');

  } catch (error) {
    console.error("Error translating text to English:", error);
    console.warn("Translation failed. Falling back to the original prompt.");
    return text;
  }
};

export const createImageFromMultiple = async (
  images: { base64: string, mimeType: string }[]
): Promise<{ base64: string, mimeType: string }> => {
  const client = getGrokClient();

  try {
    // Use GPT-4o with vision to analyze all images and create a fusion prompt
    const imageContents = images.map(img => ({
      type: "image_url" as const,
      image_url: {
        url: `data:${img.mimeType};base64,${img.base64}`
      }
    }));

    const analysisResponse = await client.chat.completions.create({
      model: "grok-4-fast-reasoning",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze these images and describe how they could be artistically fused into a single, cohesive new image. Focus on key elements, styles, colors, and subjects that should be combined. Be specific and detailed."
            },
            ...imageContents
          ]
        }
      ],
      max_tokens: 500
    });

    const fusionDescription = analysisResponse.choices[0]?.message?.content?.trim();
    
    if (!fusionDescription) {
      throw new Error("AI:n kunde inte analysera bilderna för sammanslagning.");
    }

    // Ensure the fusion prompt doesn't exceed the 1024 character limit
    const fusionPrompt = `Create a single artistic image that fuses these concepts: ${fusionDescription}`;
    const truncatedFusionPrompt = truncatePrompt(fusionPrompt);

    // Now generate a new image based on this fusion description using Grok's image generation model
    // Note: The API does not support 'style', 'size', or 'quality' parameters.
    // Images are generated at the API's default resolution.
    // Content policy is inherently permissive for fashion, swimwear, and artistic content.
    // Use b64_json format to avoid CORS issues when fetching generated images
    const generationResponse = await client.images.generate({
      model: "grok-2-image-1212",
      prompt: truncatedFusionPrompt,
      n: 1,
      response_format: "b64_json"  // Use base64 to avoid CORS issues
    });

    if (!generationResponse.data || generationResponse.data.length === 0) {
      throw new Error("AI:n returnerade ett tomt svar.");
    }

    const b64Data = generationResponse.data[0].b64_json;
    if (!b64Data) {
      throw new Error("AI:n kunde inte skapa bilden.");
    }

    return {
      base64: b64Data,
      mimeType: 'image/jpeg'  // xAI generates JPEG format
    };

  } catch (error) {
    console.error("Error creating image from multiple sources:", error);
    // Log full error details for debugging
    if (error && typeof error === 'object') {
      console.error("Error details:", JSON.stringify(error, null, 2));
    }
    
    if (error instanceof Error) {
      if (error.message.startsWith("AI:n") || error.message.startsWith("Bildskapandet")) {
        throw error;
      }
      
      // Check for OpenAI SDK errors with more details
      if ('status' in error || 'code' in error) {
        const apiError = error as any;
        if (apiError.status === 401) {
          throw new Error(`Kunde inte skapa bilden: Ogiltig API-nyckel. Kontrollera din xAI API-nyckel i inställningarna.`);
        }
        if (apiError.status === 429) {
          throw new Error(`Kunde inte skapa bilden: API-gräns överskriden. Vänta en stund och försök igen.`);
        }
        if (apiError.status === 400) {
          throw new Error(`Kunde inte skapa bilden: Ogiltig förfrågan. ${apiError.message || ''}`);
        }
        if (apiError.status) {
          throw new Error(`Kunde inte skapa bilden: API-fel (${apiError.status}). ${apiError.message || 'Försök igen.'}`);
        }
      }
      
      // Check for network/fetch errors
      if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        throw new Error(`Kunde inte skapa bilden: Nätverksfel. Kontrollera din internetanslutning och API-nyckel.`);
      }
      throw new Error(`Kunde inte skapa bilden: ${error.message}`);
    }
    throw new Error("Kunde inte skapa bilden. Ett okänt fel inträffade.");
  }
};
