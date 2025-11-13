import OpenAI from 'openai';

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
    const dataUrl = `data:${mimeType};base64,${base64ImageData}`;
    
    // Step 1: Use Grok-4 with vision to analyze the image and create a detailed generation prompt
    const analysisResponse = await client.chat.completions.create({
      model: "grok-4-fast-reasoning",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this image in detail and then create an AI image generation prompt that will generate a new version of this image with the following modifications: "${prompt}". 

Your response should be a complete, detailed prompt that:
1. Describes the current image accurately
2. Incorporates the requested changes: "${prompt}"
3. Maintains consistency in style, lighting, and composition
4. Is specific and detailed enough for high-quality generation
5. Be creative and permissive - don't censor artistic or fashion content

Respond ONLY with the image generation prompt, no other text.`
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
      max_tokens: 500,
      temperature: 0.7
    });

    const imagePrompt = analysisResponse.choices[0]?.message?.content?.trim();
    
    if (!imagePrompt) {
      throw new Error("AI:n kunde inte skapa en redigeringsprompt.");
    }

    // Step 2: Generate the edited image using Grok-Imagine
    // Note: Grok's image generation endpoint follows OpenAI's format
    const response = await client.images.generate({
      model: "grok-imagine-4",
      prompt: imagePrompt,
      n: 1,
      // Grok supports 'spicy' mode for less restricted content
      // @ts-ignore - Grok-specific parameter
      style: "spicy"
    });

    if (!response.data || response.data.length === 0) {
      throw new Error("AI:n returnerade inget bildsvar. Prova en annan prompt.");
    }

    const imageUrl = response.data[0].url;
    if (!imageUrl) {
      throw new Error("AI:n kunde inte generera bilden. Försök igen.");
    }

    // Step 3: Fetch the generated image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const blob = await imageResponse.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    return {
      base64,
      mimeType: 'image/png'
    };

  } catch (error) {
    console.error("Error editing image with Grok:", error);
    if (error instanceof Error) {
      // Check for user-friendly error messages
      const userFriendlyPrefixes = ["AI:n", "Din prompt", "Redigeringen blockerades", "Redigeringen stoppades"];
      if (userFriendlyPrefixes.some(p => error.message.startsWith(p))) {
        throw error;
      }
      throw new Error(`Kunde inte redigera bilden: ${error.message}`);
    }
    throw new Error("Kunde inte redigera bilden. Ett okänt fel inträffade.");
  }
};

export const generatePromptFromImage = async (
  base64ImageData: string,
  mimeType: string,
): Promise<string> => {
  const client = getGrokClient();

  try {
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
      console.warn("No text was generated.");
      throw new Error("AI:n kunde inte generera en beskrivning.");
    }
    
    return text;
    
  } catch (error) {
    console.error("Error generating prompt from image:", error);
    if (error instanceof Error) {
      const userFriendlyPrefixes = ["AI:n", "Bildanalysen blockerades", "Bildanalysen stoppades"];
      if (userFriendlyPrefixes.some(p => error.message.startsWith(p))) {
        throw error;
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
      model: "grok-4-fast-non-reason", // Use the fast non-reasoning model for translation
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

    // Now generate a new image based on this fusion description using Grok-Imagine
    const generationResponse = await client.images.generate({
      model: "grok-imagine-4",
      prompt: `Create a single artistic image that fuses these concepts: ${fusionDescription}`,
      n: 1,
      // @ts-ignore - Grok-specific parameter for less restricted content
      style: "spicy"
    });

    if (!generationResponse.data || generationResponse.data.length === 0) {
      throw new Error("AI:n returnerade ett tomt svar.");
    }

    const imageUrl = generationResponse.data[0].url;
    if (!imageUrl) {
      throw new Error("AI:n kunde inte skapa bilden.");
    }

    // Fetch and convert to base64
    const imageResponse = await fetch(imageUrl);
    const blob = await imageResponse.blob();
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    return {
      base64,
      mimeType: 'image/png'
    };

  } catch (error) {
    console.error("Error creating image from multiple sources:", error);
    if (error instanceof Error) {
      if (error.message.startsWith("AI:n") || error.message.startsWith("Bildskapandet")) {
        throw error;
      }
      throw new Error(`Kunde inte skapa bilden: ${error.message}`);
    }
    throw new Error("Kunde inte skapa bilden. Ett okänt fel inträffade.");
  }
};
