/**
 * Utility functions for handling prompt length constraints
 */

const MAX_PROMPT_LENGTH = 1024;

/**
 * Truncates a prompt to fit within the maximum allowed length
 * Tries to truncate at sentence boundaries when possible
 */
export const truncatePrompt = (prompt: string, maxLength: number = MAX_PROMPT_LENGTH): string => {
  if (prompt.length <= maxLength) {
    return prompt;
  }

  // Try to truncate at sentence boundary
  const truncated = prompt.substring(0, maxLength);
  const lastSentenceEnd = Math.max(
    truncated.lastIndexOf('. '),
    truncated.lastIndexOf('.\n'),
    truncated.lastIndexOf('? '),
    truncated.lastIndexOf('! ')
  );

  if (lastSentenceEnd > maxLength * 0.7) {
    // If we can preserve at least 70% of the content with a clean break
    return truncated.substring(0, lastSentenceEnd + 1);
  }

  // Otherwise, truncate at word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.9) {
    return truncated.substring(0, lastSpace);
  }

  // Last resort: hard truncate
  return truncated;
};

/**
 * Ensures a prompt with a variable description fits within max length
 * Prioritizes keeping the template and truncating the description if needed
 */
export const buildPromptWithDescription = (
  template: string,
  description: string,
  placeholder: string = '${description}',
  maxLength: number = MAX_PROMPT_LENGTH
): string => {
  // Replace placeholder with description
  const fullPrompt = template.replace(placeholder, description);
  
  if (fullPrompt.length <= maxLength) {
    return fullPrompt;
  }

  // Calculate how much space we have for the description
  const templateWithoutPlaceholder = template.replace(placeholder, '');
  const availableSpace = maxLength - templateWithoutPlaceholder.length;

  if (availableSpace <= 50) {
    // Template itself is too long, we need to truncate the whole thing
    return truncatePrompt(fullPrompt, maxLength);
  }

  // Truncate the description to fit
  const truncatedDescription = truncatePrompt(description, availableSpace);
  return template.replace(placeholder, truncatedDescription);
};
