import { GoogleGenAI, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];


export const editImageWithPrompt = async (
  base64ImageData: string,
  mimeType: string,
  prompt: string
): Promise<{ base64: string, mimeType: string }> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64ImageData,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
        safetySettings,
      },
    });

    // 1. Check top-level safety feedback first.
    if (response.promptFeedback?.blockReason) {
      const reason = response.promptFeedback.blockReason;
      const detailedMessage = `Redigeringen blockerades av AI:ns säkerhetspolicy (${reason}). Jag förstår att detta är frustrerande, särskilt för professionellt arbete med mode, bikinis eller underkläder där filtret ofta är överdrivet försiktigt.\n\n**Tips för att komma runt filtret:**\n1. **Fokusera på miljön:** Istället för att direkt nämna plagget, beskriv en scenändring. Prova t.ex. "ändra bakgrunden till en tropisk strand med solnedgång" eller "placera personen i en lyxig hotellobby".\n2. **Beskriv en stil:** Använd en mer konstnärlig prompt som "ge fotot en drömsk och somrig estetik med mjukt ljus".\n\nGenom att undvika direkta kommandon om kläder kan man ofta kringgå de mest känsliga delarna av filtret.`;
      console.warn("Safety block triggered:", { reason, feedback: response.promptFeedback });
      throw new Error(detailedMessage);
    }
    
    const candidate = response.candidates?.[0];
    if (!candidate) {
        throw new Error("AI:n returnerade ett tomt svar (inga 'candidates'). Försök igen.");
    }
    
    // 2. Check candidate-level finish reason. This can also be SAFETY.
    if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'FINISH_REASON_UNSPECIFIED') {
        console.warn("AI processing finished for a non-standard reason:", { candidate });
        if (candidate.finishReason === 'IMAGE_OTHER') {
            const imageOtherMessage = "AI:ns säkerhetsfilter blockerade oväntat denna bild. Detta kan ibland hända med komplexa bilder som porträtt eller konst. Prova att beskära bilden litegrann och försök sedan igen. En liten ändring kan hjälpa AI:n att omvärdera bilden.";
            throw new Error(imageOtherMessage);
        }
        if (candidate.finishReason === 'SAFETY') {
            const safetyMessage = "Redigeringen stoppades av säkerhetsskäl. Prova att vara mindre specifik eller att ändra motivet.";
            throw new Error(safetyMessage);
        }
        throw new Error(`AI:n avslutade oväntat med anledning: ${candidate.finishReason}. Försök igen.`);
    }

    // 3. Look for image data.
    const imagePart = candidate.content?.parts?.find(p => p.inlineData);
    if (imagePart?.inlineData) {
      return {
        base64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
      };
    }

    // 4. If no image, check for a text response which might explain why.
    const textResponse = response.text?.trim();
    if (textResponse) {
      console.warn("No image data found in Gemini response, but found text:", textResponse);
      throw new Error(`AI:n returnerade text istället för en bild: "${textResponse}". Prova en mer specifik prompt.`);
    }
    
    // 5. Generic error if nothing was found.
    console.warn("No image data found in Gemini response. Full candidate:", JSON.stringify(candidate, null, 2));
    throw new Error("AI:n returnerade inget bildsvar. Prova en annan prompt.");

  } catch (error) {
    console.error("Error editing image with Gemini:", error);
    if (error instanceof Error) {
        // If the error message is already user-friendly, don't wrap it.
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
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64ImageData,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: "You are a scene analysis expert preparing an image for AI outpainting. Your task is to provide a concise but detailed description of the image's core visual DNA. This description will be used by another AI to seamlessly extend the scene. Focus exclusively on these critical elements:\n\n- **Artistic Style & Medium:** (e.g., 'Sharp, high-resolution digital photograph', 'Soft-focus vintage film photo with heavy grain', 'Impressionistic oil painting', '3D render')\n- **Subject & Environment:** (e.g., 'A woman in a red dress standing in a sunlit forest', 'A futuristic city skyline at night')\n- **Lighting Conditions:** (e.g., 'Golden hour sunlight from the right creating long, soft shadows', 'Bright, overcast daylight with flat, even lighting', 'Dramatic, high-contrast studio lighting')\n- **Color Palette:** (e.g., 'Dominated by earthy tones, browns, and greens', 'Vibrant neon blues and pinks', 'Muted, desaturated pastel colors')\n\nRespond only with this analysis in English. Do not add any conversational text or introductions.",
                    },
                ],
            },
            config: {
                safetySettings,
            },
        });

        if (response.promptFeedback?.blockReason) {
            const reason = response.promptFeedback.blockReason;
            console.warn("Prompt generation blocked for safety reasons:", { reason, feedback: response.promptFeedback });
            throw new Error(`Bildanalysen blockerades av säkerhetsskäl (${reason}). Försök med en annan bild.`);
        }

        const candidate = response.candidates?.[0];

        if (!candidate) {
            console.warn("No candidates returned from generateContent for prompt generation.");
            throw new Error("AI:n returnerade ett tomt svar. Försök igen.");
        }

        if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'FINISH_REASON_UNSPECIFIED') {
            console.warn("AI processing for prompt generation finished for a non-standard reason:", { candidate });
            if (candidate.finishReason === 'IMAGE_OTHER') {
                throw new Error("AI:ns säkerhetsfilter blockerade oväntat denna bildanalys. Prova att beskära bilden litegrann och försök igen.");
            }
            if (candidate.finishReason === 'SAFETY') {
                throw new Error("Bildanalysen stoppades av säkerhetsskäl. Prova en annan bild.");
            }
            throw new Error(`AI:n avslutade oväntat med anledning: ${candidate.finishReason}.`);
        }
        
        const text = response.text;
        
        if (!text || text.trim() === '') {
            console.warn("No text was generated. Full candidate:", JSON.stringify(candidate, null, 2));
            throw new Error("AI:n kunde inte generera en beskrivning.");
        }
        
        return text.trim();
        
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
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: text,
            config: {
                systemInstruction: "You are a translation expert. Your task is to translate the user's input to English. Respond ONLY with the translated English text and nothing else. Do not add any commentary, conversational text, or introductions like 'Here is the translation:'. If the user's input is already in English, simply return the original text without any changes.",
                temperature: 0,
                safetySettings,
            }
        });
        
        const translatedText = response.text?.trim();

        if (!translatedText) {
            console.warn("Translation returned empty response. Falling back to original text.", { response });
            return text; // Fallback to original text if translation fails
        }
        
        // Remove quotes if the model wraps the response in quotes
        return translatedText.replace(/^"|"$/g, '');

    } catch (error) {
        console.error("Error translating text to English:", error);
        // In case of error, it's better to proceed with the original prompt
        // than to fail the whole operation. The user can still get a result.
        console.warn("Translation failed. Falling back to the original prompt.");
        return text;
    }
};

export const createImageFromMultiple = async (
  images: { base64: string, mimeType: string }[]
): Promise<{ base64: string, mimeType: string }> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set.");
  }
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const imageParts = images.map(image => ({
      inlineData: {
        data: image.base64,
        mimeType: image.mimeType,
      },
    }));

    const textPart = {
      text: "Analyze the following images. Combine the key elements, styles, and subjects from all of them to create a completely new, cohesive image that merges their concepts. Do not simply make a collage or place the subjects side-by-side. Generate a single, artistic fusion that imagines a new scene or subject inspired by all inputs.",
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [...imageParts, textPart] },
      config: {
        responseModalities: [Modality.IMAGE],
        safetySettings,
      },
    });
    
    if (response.promptFeedback?.blockReason) {
      throw new Error(`Bildskapandet blockerades av säkerhetsskäl: ${response.promptFeedback.blockReason}`);
    }
    
    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error("AI:n returnerade ett tomt svar.");
    }
    
    if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'FINISH_REASON_UNSPECIFIED') {
      if (candidate.finishReason === 'SAFETY') {
        throw new Error("Bildskapandet stoppades av säkerhetsskäl.");
      }
      throw new Error(`AI:n avslutade oväntat med anledning: ${candidate.finishReason}.`);
    }

    const imagePart = candidate.content?.parts?.find(p => p.inlineData);
    if (imagePart?.inlineData) {
      return {
        base64: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
      };
    }
    
    const textResponse = response.text?.trim();
    if (textResponse) {
      throw new Error(`AI:n returnerade text istället för en bild: "${textResponse}".`);
    }

    throw new Error("AI:n returnerade inget bildsvar. Försök igen med andra bilder.");

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