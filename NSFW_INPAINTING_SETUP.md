# NSFW Inpainting Setup Guide

This guide explains how to set up NSFW-capable inpainting for Bella's Magic Image Editor using a custom Hugging Face Inference Endpoint.

## Overview

For NSFW image editing (inpainting, outpainting) with high quality, you need to deploy a proper inpainting model on a custom endpoint that you control.

## Why You Need a Custom Endpoint

The public Hugging Face API's inpainting models may have NSFW restrictions. By deploying your own endpoint:
- ✅ Full NSFW support (you control content filtering)
- ✅ Higher resolution (1024x1024 with SDXL)
- ✅ Better quality (SDXL-based models)
- ✅ Faster inference (dedicated resources)
- ✅ All features: inpainting, outpainting, editing, generation

## Recommended Model

### `diffusers/stable-diffusion-xl-1.0-inpainting-0.1`

This is the perfect model for your needs:

**Capabilities:**
- ✅ Inpainting (selective editing with masks)
- ✅ Outpainting (image expansion)
- ✅ Image-to-image editing
- ✅ Text-to-image generation
- ✅ NSFW content (no restrictions on your endpoint)

**Specifications:**
- Resolution: 1024x1024 (SDXL)
- Quality: Excellent (SDXL-based)
- Speed: ~30-60 seconds per image (A10G GPU)
- Format: FormData (image + mask + prompt)

## Step-by-Step Setup

### 1. Create Hugging Face Account

1. Go to [huggingface.co](https://huggingface.co/)
2. Sign up (free account)
3. Verify your email

### 2. Add Payment Method

Custom endpoints require a payment method:
1. Go to [Settings → Billing](https://huggingface.co/settings/billing)
2. Add payment method
3. No upfront charges - you're billed for usage

### 3. Create Inference Endpoint

1. Go to [Inference Endpoints](https://huggingface.co/inference-endpoints)
2. Click **"Create new endpoint"**
3. Configure:
   - **Name**: `bella-nsfw-inpainting` (or your choice)
   - **Model Repository**: `diffusers/stable-diffusion-xl-1.0-inpainting-0.1`
   - **Cloud Provider**: AWS (most common)
   - **Region**: Choose nearest to you
   - **Instance Type**: 
     - **A10G (Medium)**: $1.30/hour - **Recommended for SDXL**
     - T4 (Small): $0.60/hour - works but slower
   - **Auto-scaling**:
     - Min replicas: 0 (saves money when not in use)
     - Max replicas: 1
     - Scale to zero timeout: 15 minutes
4. Click **"Create Endpoint"**
5. Wait 5-10 minutes for deployment (status will show "Running")

### 4. Get Your Endpoint URL

1. Click on your endpoint in the list
2. Copy the **Endpoint URL** (format: `https://xxxxx.endpoints.huggingface.cloud`)
3. Save this URL - you'll need it in the app

### 5. Get Your API Token

1. Go to [Settings → Tokens](https://huggingface.co/settings/tokens)
2. Create new token:
   - Click **"New token"**
   - Name: `bella-editor`
   - Role: **"Read"** (sufficient for inference)
   - Click **"Generate"**
3. Copy the token (starts with `hf_`)

### 6. Configure in Bella's Magic Image Editor

1. Open the app in your browser
2. Click the **⚙️ Settings** icon
3. Enter:
   - **Hugging Face API-nyckel**: Paste your token (from step 5)
   - **Custom Inference Endpoint**: Paste endpoint URL (from step 4)
4. Click **"Spara"** (Save)

### 7. Test It!

1. Upload an image
2. Try any editing feature (inpainting, outpainting, etc.)
3. First request will take 30-60 seconds (model loading)
4. Subsequent requests should be faster (10-30 seconds)
5. Check for 1024x1024 resolution and NSFW support

## How It Works

With the custom endpoint configured:
- ✅ **All inpainting/editing**: Uses your custom endpoint (NSFW-capable)
- ✅ **Text-to-image generation**: Uses your custom endpoint  
- ✅ **Outpainting**: Uses your custom endpoint
- ✅ **All operations**: 1024x1024 resolution, NSFW support

## Costs

### Pricing
- **A10G GPU**: $1.30/hour when running
- **Scale to zero**: Endpoint stops when idle (saves money)
- **Auto-wake**: First request takes 30-60s to wake up endpoint

### Example Monthly Costs
- **Light use** (few hours/week): $10-20/month
- **Moderate use** (daily, few hours): $40-80/month
- **Heavy use** (always on): ~$936/month

### Tips to Save Money
1. Set min replicas to 0 (auto-scale to zero when idle)
2. Set scale-to-zero timeout to 15 minutes
3. Pause endpoint manually when not actively using
4. Monitor usage in billing dashboard

## Alternative Models

If you want different capabilities:

### For More NSFW Focus
- `stablediffusionapi/omnigenxl-nsfw-sfw` - Text-to-image only, excellent NSFW
- Note: This doesn't support inpainting, only text-to-image

### For Lower Costs
- `stabilityai/stable-diffusion-2-inpainting` - 512x512, cheaper ($0.60/hour on T4)
- Note: Lower resolution but functional

## Troubleshooting

### Endpoint Not Working
1. Check endpoint status is "Running" in dashboard
2. Verify URL is exact from endpoint details (ends with `.endpoints.huggingface.cloud`)
3. Confirm API token is correct and starts with `hf_`

### First Request Slow
- Normal! Model loading takes 30-60 seconds on first request
- Subsequent requests are much faster
- Don't refresh browser while waiting

### Still Getting NSFW Blocks
- Verify you're using YOUR custom endpoint (check settings)
- Confirm model is `diffusers/stable-diffusion-xl-1.0-inpainting-0.1`
- Check browser console for which endpoint is being called

### High Costs
- Verify endpoint is scaling to zero (check "Min replicas: 0")
- Consider pausing when not in active use
- Use T4 GPU instead of A10G if acceptable quality

## Going Back to Free Public API

To revert to free public API:
1. Open Settings
2. Clear the "Custom Inference Endpoint" field
3. Click Save

App will use free public API (512x512, may have NSFW restrictions)

## Summary

**For NSFW editing with high quality:**
1. Deploy `diffusers/stable-diffusion-xl-1.0-inpainting-0.1` on custom endpoint
2. Configure endpoint URL in app settings
3. Enjoy 1024x1024 NSFW-capable inpainting, outpainting, and generation

**Cost**: ~$1.30/hour when active (A10G GPU), scales to zero when idle

This gives you complete control over content filtering and maximum quality for editing operations.
