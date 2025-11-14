<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Bella's Magic Image Editor

An AI-powered image editing application that uses a **hybrid AI approach** combining xAI's Grok API and Hugging Face Inference API for optimal quality and cost-effectiveness.

## Hybrid AI Architecture

This app uses an **intelligent hybrid strategy** that leverages the unique strengths of two AI providers:

### 🧠 Grok 4 - Image Analysis & Understanding
- **Image analysis** - Grok-4-fast-reasoning with advanced vision capabilities
- **Scene understanding** - Detailed descriptions of composition, lighting, style
- **Prompt engineering** - Creating optimal generation prompts
- **Translation** - Multi-language support
- **Cost**: $0.20-$0.40 per 1M input tokens, $0.50-$1.00 per 1M output tokens

### 🎨 Hugging Face - Image Generation & Editing
- **All image generation** - Stable Diffusion for text-to-image  
  **Currently configured with: `runwayml/stable-diffusion-v1-5`** - most reliable model
- **Image editing** - Image-to-image with inpainting (preserves originals)  
  **Currently configured with: `runwayml/stable-diffusion-inpainting`** - most reliable
- **Inpainting** - Precise mask-based editing
- **Outpainting/Expansion** - Seamless image extension beyond borders
- **Cost**: $0.60-$1.30/hour for dedicated endpoint (scales to $0 when idle)
- **Resolution**: Supports up to 1024x1024 with SDXL on dedicated endpoints
- **Cloud Infrastructure**: Runs on NVIDIA GPUs (T4, A10, A100) with full SDXL support

⚠️ **Important:** The app requires a **Hugging Face Dedicated Inference Endpoint** to work reliably. The free public API often fails with "Failed to fetch" errors due to CORS restrictions.

📖 **Quick Setup:** See [QUICK_SETUP_SDXL.md](./QUICK_SETUP_SDXL.md) for step-by-step endpoint setup (10 minutes)

**Note**: The app uses the most reliable Stable Diffusion models by default, but requires a dedicated endpoint for reliable operation.

**⚠️ Getting "Failed to fetch" errors?**
- The free Hugging Face public API has CORS and rate limit issues
- **Solution:** Set up a [Dedicated Inference Endpoint](./QUICK_SETUP_SDXL.md) (10 min setup)
- **Cost:** $0.60-$1.30/hour, scales to $0 when idle (~$6-$65/month with auto-scaling)

**Want higher quality and NSFW support?** 
- Set up a [Custom Inference Endpoint](./CUSTOM_ENDPOINT_SETUP.md) with SDXL models
- Enable SDXL (1024x1024) and NSFW XL models
- Configure via Settings → Custom Inference Endpoint

**Looking for cloud infrastructure options?**
- See [CLOUD_INFERENCE_PROVIDERS.md](./CLOUD_INFERENCE_PROVIDERS.md) for compatible cloud providers
- Hugging Face API already uses SDXL-compatible hardware (NVIDIA T4/A10/A100)
- Alternative providers beyond AWS/GCP documented (immers.cloud, RunPod, Vast.ai, etc.)

### 🚀 Why This Combination?

**The Problem**: Grok's image generation creates completely new images instead of preserving the original during edits and expansions.

**The Solution**: Use Grok for what it does best (understanding images) and Hugging Face for what it does best (generating/editing images).

**The Result**: 
- ✅ 60-75% cost reduction compared to Grok-only
- ✅ Superior quality - preserves original images during edits
- ✅ Best-in-class tools for each task
- ✅ Permissive content policies from both providers

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

### Hugging Face Setup (Required for AI image generation)

⚠️ **Important:** You need to set up a **Dedicated Inference Endpoint** for reliable operation.

**Quick Setup (10 minutes):**
1. Visit [Hugging Face Inference Endpoints](https://huggingface.co/inference-endpoints)
2. Create endpoint with `stabilityai/stable-diffusion-xl-base-1.0`
3. Choose A10G GPU ($1.30/hour) or T4 ($0.60/hour)
4. Set min_replicas=0 for auto-scaling (saves money)
5. Get endpoint URL and API token
6. Enter both in app Settings (⚙️ icon)

📖 **Step-by-step guide:** [QUICK_SETUP_SDXL.md](./QUICK_SETUP_SDXL.md)

**Why not use the free public API?**
- ❌ Often fails with "Failed to fetch" errors (CORS restrictions)
- ❌ Rate limited and unreliable
- ✅ Dedicated endpoint bypasses these issues
- ✅ Auto-scaling keeps costs low (~$6-$65/month)

📖 **Detailed Setup Guide**: See [HUGGINGFACE_SETUP.md](HUGGINGFACE_SETUP.md) for:
- Step-by-step API key generation
- Recommended NSFW-capable models for quality image generation
- Model comparison and performance tips
- Troubleshooting guide

## Features

- **🎨 AI Image Editing** - Describe changes and let hybrid AI apply them (Grok analysis + HF generation)
- **🗑️ Background Removal** - Remove backgrounds with AI precision
- **✨ Image Enhancement** - Upscale and improve image quality
- **📐 Image Expansion** - Extend images beyond borders with proper outpainting (Grok + HF)
- **✂️ Crop & Zoom** - Standard image manipulation tools
- **🖼️ Multi-image Sessions** - Work with multiple images simultaneously
- **↩️ Undo/Redo** - Full edit history for each image

**All generation tasks use Hugging Face** for superior quality and preservation of original images.

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

| Provider | Pricing Model | Typical Cost | Used For |
|----------|--------------|--------------|----------|
| **Grok 4** | Token-based | $0.02-$0.05/analysis | Image analysis, understanding |
| **Hugging Face** | Compute-time | $0.001-$0.02/generation | All image generation/editing |
| **Hybrid Total** | Combined | $0.03-$0.07/operation | Complete workflow |

**Hybrid savings**: 60-75% cost reduction compared to Grok-only, with significantly better quality.

### Why Hybrid Costs Less

Traditional (Grok-only):
- Analysis: $0.05 + Generation: $0.15 = **$0.20** (generates new image ❌)

Hybrid approach:
- Grok Analysis: $0.03 + HF Generation: $0.01 = **$0.04** (preserves original ✅)
- **Savings: 80%** + better quality!

See [API_COMPARISON.md](API_COMPARISON.md) for detailed pricing breakdown and feature comparison.

## Total Hosting Cost

- 🎉 **$0/month** - Free GitHub Pages hosting
- 🎉 **$0** - Users pay for their own API usage (both Grok and Hugging Face)
- 🎉 **$0** - No backend server required
- 💰 **$0.03-$0.07 per operation** - Typical cost per image edit/generation

## How It Works

### Hybrid Workflow Example
1. **User uploads image** and requests "change background to sunset beach"
2. **Grok 4 analyzes** the image in detail (composition, lighting, style, subjects)
3. **Hybrid service** combines Grok's analysis with user's edit request
4. **Hugging Face generates** the edited image using Stable Diffusion inpainting
5. **Result**: High-quality edit that preserves the original image perfectly ✨

This architecture ensures:
- 🎯 **Best quality**: Each AI does what it's best at
- 💰 **Lower cost**: Optimized API usage
- 🖼️ **Image preservation**: Originals maintained during edits
- 🚀 **Fast results**: Efficient processing pipeline

## Content Policy

Both xAI and Hugging Face support permissive content generation:
- ✅ Fashion photography (swimwear, lingerie, etc.)
- ✅ Artistic and creative content
- ✅ Professional modeling work
- ✅ Body-positive and inclusive content

Models can be selected based on your specific content requirements.
