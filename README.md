<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Bella's Magic Image Editor

An AI-powered image editing application that uses xAI's Grok API for cost-effective and permissive image manipulation.

## Why Grok?

This app has been migrated from Google Gemini API to xAI's Grok API for significant improvements:
- **50-70% lower costs** compared to Gemini for image editing operations
- **Less restrictive content policies** - Better support for fashion, swimwear, and artistic content
- **"Spicy Mode"** - More permissive content generation without over-filtering professional photography
- Access to Grok-4 with vision capabilities and Grok-Imagine image generation
- Competitive pricing: $0.20-$0.40 per 1M input tokens, $0.50-$1.00 per 1M output tokens

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env.local` file in the project root and set your xAI API key:
   ```
   XAI_API_KEY=your_xai_api_key_here
   ```
3. Run the app:
   `npm run dev`

## Get an xAI API Key

1. Visit [xAI API Console](https://console.x.ai/)
2. Sign up or log in with your X (Twitter) account
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it into your `.env.local` file

## Features

- **AI Image Editing** - Describe changes and let Grok apply them
- **Background Removal** - Remove backgrounds with AI precision
- **Image Enhancement** - Upscale and improve image quality
- **Image Expansion** - Extend images beyond their borders
- **Crop & Zoom** - Standard image manipulation tools
- **Multi-image Sessions** - Work with multiple images simultaneously
- **Undo/Redo** - Full edit history for each image

## Cost Comparison

| Provider | Input (per 1M tokens) | Output (per 1M tokens) | Content Policy |
|----------|----------------------|------------------------|----------------|
| Gemini 2.5 Pro | $2.50 | $10.00 | Very Restrictive |
| OpenAI GPT-4o | $2.50 | $10.00 | Restrictive |
| **Grok-4 Fast** | **$0.20-$0.40** | **$0.50-$1.00** | **Permissive** |
