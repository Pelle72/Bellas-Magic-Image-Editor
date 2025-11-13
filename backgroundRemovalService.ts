
import { editImageWithPrompt } from './services/grokService';

export const removeBackground = async (
  base64ImageData: string,
  mimeType: string,
): Promise<{ base64: string, mimeType: 'image/png' }> => {
  try {
    const removeBgPrompt = "Act as an expert photo editor. Your task is to perfectly mask the main subject(s) and completely remove the background, making it transparent. The edges of the subject must be clean and precise. Do not crop, resize, or alter the subject in any way. Output a transparent PNG.";
    
    const result = await editImageWithPrompt(base64ImageData, mimeType, removeBgPrompt);

    // The AI model is instructed to create a transparent PNG. We will trust the output
    // and set the mimeType to 'image/png' to ensure the browser handles it correctly as a transparent image
    // for download and further edits.
    return {
      base64: result.base64,
      mimeType: 'image/png',
    };

  } catch (error) {
    console.error("Error removing background:", error);
    if (error instanceof Error) {
        // Re-throw user-friendly errors from openaiService
        const userFriendlyPrefixes = ["AI:n", "Din prompt", "Redigeringen blockerades", "Redigeringen stoppades"];
        if (userFriendlyPrefixes.some(p => error.message.startsWith(p))) {
            throw error;
        }
        throw new Error(`Fel vid bakgrundsborttagning: ${error.message}`);
    }
    throw new Error("Ett okänt fel inträffade vid bakgrundsborttagning.");
  }
};
