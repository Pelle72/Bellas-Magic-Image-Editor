# Hybrid Service Architecture - Corrected Implementation

## Overview
The hybrid service combines Grok (for image analysis) with Hugging Face (for image generation/editing) to provide optimal quality and cost-effectiveness.

## Workflow by Operation Type

### 1. Image Editing via Prompt

**User Action**: Edit an existing image with a text prompt (e.g., "change the background to a beach")

**Flow**:
```
User Prompt
    ↓
App.tsx: handleEditImage()
    ↓ translateToEnglish(prompt)
    ↓
hybridService.ts: editImageWithPrompt(image, mimeType, englishPrompt)
    ↓
grokService.ts: analyzeImageForEditing(image, mimeType, englishPrompt)
    → Grok-4-fast-reasoning analyzes the image in extreme detail
    → Creates a comprehensive generation prompt that:
      - Describes every visual detail of the original
      - Specifies the exact modification requested
      - Instructs to maintain all other aspects
    ↓ Returns detailed generation prompt
    ↓
huggingFaceService.ts: editImageWithPromptHF(image, mimeType, generationPrompt)
    → Creates full-image mask (edit entire image)
    → Calls inpaintImage() with the detailed prompt
    → stablediffusionapi/omnigenxl-nsfw-sfw applies the edit
    ↓
Result: Edited image returned to user
```

**Key Points**:
- Uses `analyzeImageForEditing()` which includes the user's edit request in the analysis
- Generates a tailored prompt for image-to-image editing
- Preserves original image details while applying specific modifications

### 2. Image Expansion/Outpainting

**User Action**: Expand an image beyond its borders to a new aspect ratio

**Flow**:
```
User Selects Aspect Ratio
    ↓
App.tsx: handleExpandImage(aspectRatio)
    ↓
hybridService.ts: Re-exports generatePromptFromImage from grokService
    ↓
grokService.ts: generatePromptFromImage(image, mimeType)
    → Grok-4-fast-reasoning analyzes scene for outpainting
    → Focuses on: artistic style, subject, lighting, color palette
    → Creates scene description suitable for extending beyond borders
    ↓ Returns scene description
    ↓
huggingFaceService.ts: outpaintImage(image, mimeType, width, height, scenePrompt)
    → Creates canvas with original centered
    → Creates mask (black = preserve, white = generate)
    → Calls inpaintImage() with scene description
    → Generates new content for expanded areas
    ↓
Result: Expanded image with seamless borders
```

**Key Points**:
- Uses `generatePromptFromImage()` designed for scene analysis
- Focuses on overall scene characteristics for seamless extension
- Separate function optimized for outpainting use case

### 3. Image Enhancement

**User Action**: Enhance/upscale image quality

**Flow**:
```
User Clicks Enhance
    ↓
App.tsx: handleEnhanceImage()
    ↓ Creates enhancement prompt
    ↓
hybridService.ts: editImageWithPrompt(image, mimeType, enhancePrompt)
    → Same flow as regular editing (uses analyzeImageForEditing)
    → Enhancement prompt focuses on quality improvements
    ↓
Result: Enhanced image with improved quality
```

## Function Reference

### `grokService.ts`

#### `analyzeImageForEditing(image, mimeType, userPrompt): string`
- **Purpose**: Analyze image for editing operations
- **Input**: Image data + user's edit request
- **Output**: Detailed generation prompt for image-to-image editing
- **Used by**: Image editing, image enhancement
- **Model**: grok-4-fast-reasoning
- **Prompt Engineering**: Includes user's modification in the analysis context

#### `generatePromptFromImage(image, mimeType): string`
- **Purpose**: Analyze scene for outpainting/expansion
- **Input**: Image data only
- **Output**: Scene description for extending beyond borders
- **Used by**: Image expansion/outpainting
- **Model**: grok-4-fast-reasoning
- **Prompt Engineering**: Focuses on scene characteristics, style, lighting, colors

### `huggingFaceService.ts`

#### `editImageWithPromptHF(image, mimeType, prompt): EditedImage`
- **Purpose**: Edit image using prompt from Grok analysis
- **Method**: Inpainting with full-image mask
- **Model**: stablediffusionapi/omnigenxl-nsfw-sfw
- **Process**: Creates white mask → calls inpaintImage()

#### `outpaintImage(image, mimeType, width, height, prompt): EditedImage`
- **Purpose**: Expand image beyond original borders
- **Method**: Inpainting with selective mask
- **Model**: stablediffusionapi/omnigenxl-nsfw-sfw
- **Process**: 
  1. Create larger canvas with original centered
  2. Create mask (black for original, white for new areas)
  3. Call inpaintImage() to fill new areas

#### `inpaintImage(image, mimeType, mask, maskMimeType, prompt): EditedImage`
- **Purpose**: Core inpainting function
- **Method**: Multi-part form upload to Hugging Face API
- **Model**: stablediffusionapi/omnigenxl-nsfw-sfw
- **API**: Hugging Face Inference API

### `hybridService.ts`

#### `editImageWithPrompt(image, mimeType, userPrompt): EditedImage`
- **Purpose**: Main entry point for image editing
- **Workflow**:
  1. Call `analyzeImageForEditing()` to get generation prompt
  2. Call `editImageWithPromptHF()` to apply the edit
- **Returns**: Edited image

## Error Handling

All functions include comprehensive error handling:
- API authentication errors (401)
- Rate limiting (429)
- Model loading (503)
- Network errors (Failed to fetch)
- Detailed console logging for debugging

## Logging Strategy

Each step logs:
- Function entry/exit
- Input parameters
- API calls and responses
- Error details (full object + status codes)
- Success confirmations

Format: `[functionName] Description` for easy log filtering

## Benefits of Separation

### Editing: `analyzeImageForEditing()`
✅ Receives user's modification request during analysis  
✅ Creates prompts that preserve original while applying changes  
✅ Optimized for image-to-image editing workflow  
✅ Detailed description of all image elements  

### Expansion: `generatePromptFromImage()`
✅ Focuses on scene characteristics  
✅ Optimized for extending beyond borders  
✅ Scene description suitable for outpainting  
✅ Lighter analysis focused on continuity  

## Cost Optimization

The hybrid approach saves 60-75% compared to Grok-only:
- Grok: $0.02-$0.05 per analysis (text generation only)
- Hugging Face: $0.001-$0.02 per image generation
- Total: $0.03-$0.07 per operation

Compared to Grok-only image generation: ~$0.15-$0.20 per operation

## Quality Benefits

1. **Better preservation**: Hugging Face inpainting maintains originals
2. **Detailed analysis**: Grok provides superior image understanding
3. **Optimized models**: Each AI does what it's best at
4. **Permissive content**: Both providers support unrestricted creative content
