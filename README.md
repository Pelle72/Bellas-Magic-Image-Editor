<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Bella's Magic Image Editor

An AI-powered image editing application that uses both xAI's Grok API and Hugging Face Inference API for cost-effective and high-quality image manipulation.

## Hybrid AI Approach

This app uses a **hybrid strategy** combining the strengths of two AI providers:

### xAI Grok API
- **Image analysis and understanding** - Grok-4 with vision capabilities
- **General image editing** - Text-driven modifications
- **Content policy** - Permissive for fashion, swimwear, and artistic content
- **Cost**: $0.20-$0.40 per 1M input tokens, $0.50-$1.00 per 1M output tokens

### Hugging Face Inference API  
- **Inpainting** - Precise editing of masked areas while preserving the original image
- **Outpainting/Expansion** - Seamlessly extends images beyond their borders
- **Models**: Stable Diffusion Inpainting and related models
- **Cost**: $0.001-$0.02 per request (varies by GPU type and runtime)

**Why Hybrid?** xAI's original implementation generated completely new images during inpainting/expanding instead of preserving the original. Hugging Face's Stable Diffusion models provide proper inpainting and outpainting that maintains image integrity.

📊 See [API_COMPARISON.md](API_COMPARISON.md) for detailed pricing and capability comparison.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Create a `.env.local` file in the project root and set your API keys:
   ```
   XAI_API_KEY=your_xai_api_key_here
   HF_API_KEY=your_hf_api_key_here
   ```
3. Run the app:
   `npm run dev`

## Get API Keys

### xAI API Key (Required for image analysis and general editing)
1. Visit [xAI API Console](https://console.x.ai/)
2. Sign up or log in with your X (Twitter) account
3. Navigate to API Keys section
4. Create a new API key
5. Copy and paste it into your `.env.local` file or app settings

### Hugging Face API Key (Required for inpainting and expansion)
1. Visit [Hugging Face Settings](https://huggingface.co/settings/tokens)
2. Sign up or log in
3. Create a new access token (read permission is sufficient)
4. Copy and paste it into your `.env.local` file or app settings

📖 **Detailed Setup Guide**: See [HUGGINGFACE_SETUP.md](HUGGINGFACE_SETUP.md) for:
- Step-by-step API key generation
- Recommended NSFW-capable models for quality image generation
- Model comparison and performance tips
- Troubleshooting guide

## Features

- **AI Image Editing** - Describe changes and let AI apply them (xAI Grok)
- **Background Removal** - Remove backgrounds with AI precision
- **Image Enhancement** - Upscale and improve image quality
- **Image Expansion** - Extend images beyond their borders with proper outpainting (Hugging Face)
- **Crop & Zoom** - Standard image manipulation tools
- **Multi-image Sessions** - Work with multiple images simultaneously
- **Undo/Redo** - Full edit history for each image

## Deploy to GitHub Pages

**Yes! This app can be deployed to GitHub Pages for free.**

### Quick Deploy:

1. Enable GitHub Pages in your repository settings (Settings → Pages → Source: GitHub Actions)
2. Push to the `main` branch
3. Your app will be live at: `https://[your-username].github.io/Bellas-Magic-Image-Editor/`

The repository includes an automated GitHub Actions workflow that builds and deploys on every push to main.

**No API keys needed in deployment** - Users enter their own keys via the settings modal (⚙️ icon).

📖 See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions and troubleshooting.

## API Pricing Comparison

| Provider | Pricing Model | Typical Cost | Best For |
|----------|--------------|--------------|----------|
| **xAI Grok** | Token-based | $0.05-$0.20/operation | Image analysis, general editing |
| **Hugging Face** | Compute-time | $0.001-$0.02/request | Inpainting, outpainting |

**Hybrid savings**: 40-60% cost reduction on average compared to xAI-only implementation, with significantly better quality for inpainting and expansion operations.

See [API_COMPARISON.md](API_COMPARISON.md) for detailed pricing breakdown and feature comparison.

## Total Hosting Cost

- 🎉 **$0/month** - Free GitHub Pages hosting
- 🎉 **$0** - Users pay for their own API usage (both xAI and Hugging Face)
- 🎉 **$0** - No backend server required

## Content Policy

Both xAI and Hugging Face support permissive content generation:
- ✅ Fashion photography (swimwear, lingerie, etc.)
- ✅ Artistic and creative content
- ✅ Professional modeling work
- ✅ Body-positive and inclusive content

Models can be selected based on your specific content requirements.
