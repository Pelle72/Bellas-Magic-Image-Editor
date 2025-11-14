# Cloud Inference Providers for Stable Diffusion XL

This guide provides information about cloud infrastructure providers that support `stable-diffusion-xl-base-1.0` (SDXL) with compatible hardware.

## ⚠️ Important: SDXL Requires GPUs, Not CPUs

**Why AWS and Google Cloud Don't Work When You Try Them Directly:**
- SDXL **requires NVIDIA GPUs** for practical inference (CPUs are 50-100x slower)
- AWS CPUs are **incompatible** - SDXL needs GPU instances, not CPU instances
- Google Cloud CPUs are **incompatible** - Same reason, you need their GPU offerings
- Setting up GPU instances yourself on AWS/GCP is **complex**: instance selection, GPU drivers, CUDA installation, model optimization, etc.

**The Solution: Use Managed Inference Providers**

Instead of dealing with AWS/GCP directly, use providers that:
- ✅ Give you **pre-configured NVIDIA GPU instances**
- ✅ Handle all infrastructure (drivers, CUDA, optimization)
- ✅ Provide simple **API endpoints** for your app
- ✅ **No AWS or GCP account needed** - they manage it for you

This guide focuses on providers with **working NVIDIA GPU infrastructure** for SDXL.

## Problem Statement

**AWS and Google Cloud have incompatible CPUs and don't support stable-diffusion-xl-base-1.0 when you try to set them up directly.**

**Critical Understanding:**
- ⚠️ **SDXL cannot run on CPUs** - It requires GPUs (specifically NVIDIA GPUs)
- ⚠️ **AWS doesn't have compatible CPUs for SDXL** - Because SDXL needs GPUs, not CPUs
- ⚠️ **Setting up GPU instances on AWS/GCP yourself is complex** - Requires GPU instance selection, driver configuration, CUDA setup, etc.

**The Solution:**
Use a **managed inference provider** that handles all GPU infrastructure for you. This document outlines providers with NVIDIA GPU infrastructure that's pre-configured for SDXL.

---

## ✅ Recommended: Hugging Face Inference API (Already Implemented)

**This app already uses Hugging Face Inference API** - but you may need a custom endpoint for it to work properly.

### ⚠️ Important: Public API Limitations

The **free/public Hugging Face Inference API may fail** with "Failed to fetch" errors due to:
- **CORS restrictions** - Browser security policies blocking cross-origin requests
- **Model availability** - Not all models work with the public API
- **Rate limiting** - Free tier has strict limits
- **Network policies** - Some networks block api-inference.huggingface.co

### ✅ Recommended Solution: Use Dedicated Inference Endpoint

For reliable operation, you should set up a **Hugging Face Dedicated Inference Endpoint**:

✅ **Already integrated** - App supports custom endpoints via Settings  
✅ **Compatible hardware** - Runs on NVIDIA GPUs (Tesla T4, A10, A100) optimized for SDXL  
✅ **No CORS issues** - Properly configured for browser applications  
✅ **Guaranteed availability** - Your own dedicated instance  
✅ **Full SDXL support** - 1024x1024 resolution, NSFW capable  
✅ **Predictable performance** - No cold starts after initial load  

### Hugging Face Infrastructure

**Backend Hardware:**
- NVIDIA Tesla T4 (16GB VRAM) - for SD 1.5 models
- NVIDIA A10 (24GB VRAM) - for SDXL models
- NVIDIA A100 (40GB/80GB VRAM) - for large SDXL workloads
- Auto-scaling based on demand

**Cloud Providers Used by Hugging Face:**
- Runs on a combination of AWS, Google Cloud, and Azure backends
- **Critical difference**: Hugging Face selects and manages GPU instances for you
- **You don't need AWS/GCP accounts** - Hugging Face is the provider
- **You don't deal with CPU compatibility** - SDXL uses GPUs, which Hugging Face provisions
- **All infrastructure is pre-configured** - GPU drivers, CUDA, model optimization

**Why This Matters:**
- ❌ If you tried to set up SDXL on AWS yourself: Need to select GPU instances (not CPUs), configure drivers, install CUDA, etc.
- ✅ With Hugging Face: They handle all GPU infrastructure - you just get an API endpoint
- ✅ **No CPU compatibility issues** because SDXL runs on NVIDIA GPUs that Hugging Face provides

**Important Notes:**
- ⚠️ **Public API has limitations** - May experience CORS errors or model unavailability
- ✅ **Dedicated Endpoints recommended** - Required for production use and reliable operation
- ✅ **Custom endpoints bypass CORS** - Properly configured for browser applications

**Supported Models:**
- `stabilityai/stable-diffusion-xl-base-1.0` ✅ (1024x1024) - **Requires dedicated endpoint**
- `runwayml/stable-diffusion-v1-5` ✅ (512x512) - Works on public API (may have issues)
- `runwayml/stable-diffusion-inpainting` ✅ - Works on public API (may have issues)
- Custom models via Dedicated Endpoints only

### Current App Configuration

The app is configured with these reliable models:
```typescript
// Text-to-image: Line ~532 in services/huggingFaceService.ts
const model = 'runwayml/stable-diffusion-v1-5';  // Default (512x512)
// Or for custom endpoints:
const model = 'stabilityai/stable-diffusion-xl-base-1.0';  // SDXL (1024x1024)

// Inpainting: Line ~297 in services/huggingFaceService.ts  
const model = 'runwayml/stable-diffusion-inpainting';  // Default
// Or for custom endpoints:
const model = 'stabilityai/stable-diffusion-xl-base-1.0';  // SDXL inpainting
```

### Getting Started with Hugging Face

**Option A: Dedicated Inference Endpoint (Recommended for Production)**

This is the **recommended approach** to avoid "Failed to fetch" errors:

1. **Create Endpoint** (5-10 minutes)
   - Visit [Hugging Face Inference Endpoints](https://huggingface.co/inference-endpoints)
   - Click "Create new endpoint"
   - Select model: `stabilityai/stable-diffusion-xl-base-1.0`
   - Choose GPU: **A10G** ($1.30/hour) or **T4** ($0.60/hour)
   - Set min replicas: **0** (scales to zero when idle)
   - Click "Create Endpoint"

2. **Get Endpoint URL**
   - Copy the endpoint URL (format: `https://xxxxx.endpoints.huggingface.cloud`)
   - Get your API token from [Settings → Tokens](https://huggingface.co/settings/tokens)

3. **Configure in App**
   - Open the app
   - Click ⚙️ Settings icon
   - Enter your Hugging Face API key
   - Paste endpoint URL in "Custom Inference Endpoint" field
   - Click Save

4. **Start Using**
   - First request takes 30-60 seconds (model loading)
   - Subsequent requests are fast (10-30 seconds)
   - Full SDXL support with 1024x1024 resolution
   - No CORS issues

**Option B: Public API (Free but Limited)**

You can try the public API, but it may not work reliably:

1. **Get API Key** (Free)
   - Visit [Hugging Face Settings](https://huggingface.co/settings/tokens)
   - Create a new access token (Read permission)
   - Copy the token (starts with `hf_`)

2. **Configure in App**
   - Click the ⚙️ Settings icon in the app
   - Paste your Hugging Face API key
   - Leave "Custom Inference Endpoint" empty
   - Click Save

3. **Test It**
   - Try generating an image
   - **If you get "Failed to fetch" errors**, you need Option A (Dedicated Endpoint)

**⚠️ Why Public API Often Fails:**
- CORS restrictions in browsers
- Network firewalls blocking api-inference.huggingface.co
- Rate limiting on free tier
- Model availability issues

**💡 Recommendation:** Start with a dedicated endpoint to ensure the app works reliably.

### Pricing (Hugging Face)

**Dedicated Inference Endpoint (Recommended):**

| GPU | VRAM | Cost/Hour | Monthly (Always On) | Monthly (Auto-scale, 50 hrs) |
|-----|------|-----------|---------------------|------------------------------|
| **T4** | 16GB | $0.60 | ~$432 | ~$30 |
| **A10G** | 24GB | $1.30 | ~$936 | ~$65 |
| **A100** | 40GB | $4.50 | ~$3,240 | ~$225 |

**Auto-scaling (min_replicas=0):**
- Endpoint scales to zero when idle (saves money)
- First request takes 30-60 seconds (model loading)
- Subsequent requests are fast
- Recommended for most users

**Public API (Limited, Often Fails):**

| Usage Tier | Cost | Limits | Reliability |
|------------|------|--------|-------------|
| **Free** | $0 | ~100 requests/month | ⚠️ May fail with CORS errors |
| **Pay-as-you-go** | $0.001-$0.02/request | Rate limited | ⚠️ May fail with CORS errors |
| **Pro Subscription** | $9/month | Higher limits | ⚠️ Still has CORS issues |

**⚠️ Public API Issues:**
- Browser CORS restrictions
- Network firewall blocks
- Unreliable for production use
- **Use dedicated endpoint instead**

**Estimated costs for typical usage (Dedicated Endpoint with auto-scale):**
- Light use (10 hours/month): ~$6-$13
- Moderate use (50 hours/month): ~$30-$65
- Heavy use (160 hours/month): ~$96-$208

---

## Option 2: Hugging Face Dedicated Endpoints (Custom SDXL)

For production use or custom SDXL models, deploy a dedicated endpoint.

### Benefits

✅ **Custom models** - Deploy any SDXL variant (NSFW XL, DreamBooth, LoRA)  
✅ **Guaranteed availability** - Dedicated GPU resources  
✅ **Full resolution** - Native 1024x1024 or higher  
✅ **No rate limits** - Unlimited requests on your endpoint  
✅ **Predictable costs** - Fixed hourly rate, no per-request fees  

### Hardware Options

| GPU | VRAM | Performance | Cost/Hour | Best For |
|-----|------|-------------|-----------|----------|
| **NVIDIA Tesla T4** | 16GB | Good | $0.60 | SD 1.5, basic SDXL |
| **NVIDIA A10G** | 24GB | Excellent | $1.30 | SDXL, NSFW XL, LoRA |
| **NVIDIA A100** | 40GB | Outstanding | $4.50 | Large batches, fine-tuning |

### Setup Guide

1. **Create Endpoint**
   - Go to [Hugging Face Inference Endpoints](https://huggingface.co/inference-endpoints)
   - Click "Create new endpoint"

2. **Configure**
   - **Model**: Select `stabilityai/stable-diffusion-xl-base-1.0`
   - **Cloud**: AWS, Azure, or GCP (Hugging Face manages compatibility)
   - **Region**: Choose closest to your users
   - **Instance**: A10G recommended for SDXL

3. **Deploy**
   - Review configuration
   - Click "Create Endpoint"
   - Wait 5-10 minutes for deployment

4. **Configure in App**
   - Copy your endpoint URL (format: `https://xxxxx.endpoints.huggingface.cloud`)
   - Open app Settings (⚙️ icon)
   - Paste URL in "Custom Inference Endpoint" field
   - Save

See [CUSTOM_ENDPOINT_SETUP.md](./CUSTOM_ENDPOINT_SETUP.md) for detailed instructions.

### Monthly Cost Examples

**A10G Instance ($1.30/hour):**
- Always on: ~$936/month
- 8 hours/day: ~$312/month
- 4 hours/day: ~$156/month
- **Auto-scaling (recommended)**: Scale to zero when idle, saves 60-80%

**With Auto-scaling (min_replicas=0):**
- Light use (10 hours/month): ~$13
- Moderate use (50 hours/month): ~$65
- Heavy use (160 hours/month): ~$208

---

## Alternative Cloud Providers (Beyond AWS/GCP)

If you need alternatives to Hugging Face, these providers offer SDXL-compatible infrastructure:

### 1. **immers.cloud** ⭐ Recommended Alternative

**Overview:**
- Specialized in Stable Diffusion hosting
- Pre-configured SDXL instances
- Free trial available

**Hardware:**
- NVIDIA Tesla T4 (16GB)
- RTX 3080 (10GB)
- RTX 3090 (24GB)
- Tesla A10 (24GB)
- Tesla A100 (40GB/80GB)

**Pricing:**
- Tesla T4: $0.33/hour
- RTX 3090: $0.92/hour
- A10: ~$1.30/hour

**Features:**
- ✅ SDXL pre-installed and configured
- ✅ Custom weights and LoRA support
- ✅ Public endpoints for testing
- ✅ Private servers for production
- ✅ Pay-per-hour or monthly rental

**Website:** [immers.cloud](https://en.immers.cloud/ai/stabilityai/stable-diffusion-xl-base-1.0/)

### 2. **RunPod**

**Overview:**
- Popular GPU marketplace for AI workloads
- Wide selection of GPUs
- Pay-per-minute billing

**Hardware:**
- RTX 3080, 3090, 4090
- RTX A6000 (48GB)
- A100 (40GB/80GB)
- H100 (80GB) in select regions

**Pricing:**
- Varies by GPU and region
- Typically $0.40-$3.00/hour
- Spot instances available for 50-70% savings

**Features:**
- ✅ Per-minute billing (very flexible)
- ✅ Pre-configured SD templates
- ✅ Easy scaling
- ✅ Community support

**Website:** [runpod.io](https://runpod.io)

### 3. **Vast.ai**

**Overview:**
- GPU rental marketplace
- Community-sourced GPUs
- Best for cost-conscious users

**Hardware:**
- Wide variety (consumer and datacenter GPUs)
- RTX 2080Ti, 3080, 3090, 4090
- A100, A6000, V100

**Pricing:**
- Highly competitive (often 50-70% cheaper than cloud providers)
- From $0.20/hour for mid-tier GPUs
- Spot pricing available

**Features:**
- ✅ Lowest prices
- ✅ Huge GPU selection
- ✅ Quick setup
- ⚠️ Variable reliability (peer-to-peer network)

**Website:** [vast.ai](https://vast.ai)

### 4. **Gcore Everywhere Inference**

**Overview:**
- Enterprise-focused SDXL hosting
- Global edge network
- Emphasis on privacy and security

**Hardware:**
- NVIDIA Tesla V100
- NVIDIA A100
- Enterprise-grade infrastructure

**Pricing:**
- Fixed monthly pricing (contact for quote)
- Unlimited usage within plan
- Predictable costs

**Features:**
- ✅ Private deployment
- ✅ Global points of presence
- ✅ Enterprise SLA
- ✅ Data privacy guarantees
- ✅ Suitable for agencies and e-commerce

**Website:** [gcore.com/everywhere-inference](https://gcore.com/everywhere-inference/stable-diffusion-xl)

### 5. **CoreWeave**

**Overview:**
- GPU-specialized cloud provider
- Kubernetes-native infrastructure
- API and direct access

**Hardware:**
- Large inventory of NVIDIA GPUs
- A40, A100, H100
- Custom configurations available

**Pricing:**
- Competitive with major clouds
- Volume discounts available
- On-demand and reserved instances

**Features:**
- ✅ Kubernetes-native
- ✅ High performance networking
- ✅ Excellent for ML workloads
- ✅ API and UI access

**Website:** [coreweave.com](https://coreweave.com)

---

## Hardware Requirements for SDXL

### Critical Understanding: SDXL Needs GPUs, Not CPUs

**⚠️ SDXL CANNOT run on CPUs effectively:**
- CPU inference is 50-100x slower than GPU (minutes per image vs. seconds)
- AWS CPUs are incompatible because **SDXL requires NVIDIA GPUs**
- Even Google Cloud CPUs won't work - you need their GPU instances

**Why Use Managed Providers:**
When you use Hugging Face, immers.cloud, RunPod, etc., they:
- ✅ Provide pre-configured NVIDIA GPU instances
- ✅ Handle all driver and CUDA installation
- ✅ Optimize model loading and inference
- ✅ **You never touch AWS/GCP directly** - the provider manages it

### Minimum Specifications

**For stable-diffusion-xl-base-1.0:**
- **GPU (Required)**: NVIDIA with 8GB+ VRAM
- **Minimum**: NVIDIA Tesla T4 (16GB VRAM)
- **Recommended**: NVIDIA A10 (24GB VRAM)
- **CUDA**: Version 11.7 or higher (managed by provider)
- **CPU**: Any modern CPU (secondary role, not used for inference)
- **RAM**: 16GB system RAM
- **Storage**: 10GB for model files

### Recommended Specifications

**For optimal SDXL performance:**
- **VRAM**: 16-24GB
- **GPU**: NVIDIA A10, RTX 3090, A6000, or A100
- **CUDA**: Latest version
- **RAM**: 32GB system RAM
- **Storage**: SSD for faster model loading

### Compatible GPUs

✅ **Confirmed Compatible (NVIDIA GPUs only):**
- NVIDIA Tesla T4 (16GB) - Works well, entry-level for SDXL
- NVIDIA RTX 3080 (10GB) - Works with optimizations
- NVIDIA RTX 3090 (24GB) - Excellent performance
- NVIDIA RTX 4090 (24GB) - Excellent performance
- NVIDIA A10 (24GB) - Excellent, recommended for SDXL
- NVIDIA A40 (48GB) - Excellent
- NVIDIA A100 (40GB/80GB) - Outstanding
- NVIDIA H100 (80GB) - Outstanding

❌ **Not Compatible:**
- **Any CPU-only setup** - SDXL requires GPU acceleration
- **AWS CPUs** - Incompatible because SDXL needs GPUs
- **Google Cloud CPUs** - Incompatible because SDXL needs GPUs
- GPUs with <8GB VRAM - Insufficient memory
- Non-NVIDIA GPUs (AMD, Intel) - Limited/no support for Stable Diffusion
- Integrated graphics - Insufficient power

**Key Point:** You need a provider that gives you **NVIDIA GPU instances**, not CPU instances. This is why AWS/GCP are incompatible if you're trying to use their CPU offerings.

---

## Integration Guide for Alternative Providers

If you choose a provider other than Hugging Face, you'll need to:

### 1. Set Up Custom Endpoint

Deploy SDXL on your chosen provider and get the API endpoint URL.

### 2. Modify App Configuration

Edit `/services/huggingFaceService.ts`:

```typescript
// Add your custom endpoint configuration
export const setHFCustomEndpoint = (endpoint: string) => {
  customEndpoint = endpoint;
  if (typeof window !== 'undefined') {
    localStorage.setItem('hf_custom_endpoint', endpoint);
  }
};
```

Then use the Settings modal to configure your endpoint URL.

### 3. Test Connection

Open browser console and run:
```javascript
await testHFConnection()
```

### 4. Verify SDXL

Generate a test image to verify SDXL is working:
```javascript
// Should return 1024x1024 image
```

---

## Comparison Table

| Provider | Best For | Hardware | Pricing | Setup Time | Reliability |
|----------|----------|----------|---------|------------|-------------|
| **Hugging Face API** | Most users | Auto-managed | $0.001-0.02/req | Immediate | Excellent |
| **HF Dedicated Endpoint** | Production | NVIDIA A10/A100 | $0.60-4.50/hr | 5-10 min | Excellent |
| **immers.cloud** | SDXL specialists | T4 to A100 | $0.33-1.30/hr | 10-15 min | Very Good |
| **RunPod** | Flexibility | Wide variety | $0.40-3.00/hr | 5-10 min | Very Good |
| **Vast.ai** | Budget-conscious | Community GPUs | $0.20+/hr | 5 min | Variable |
| **Gcore** | Enterprise | V100, A100 | Fixed monthly | 1-2 days | Excellent |
| **CoreWeave** | High performance | A40, A100, H100 | Competitive | Hours to days | Excellent |

---

## Recommendations

### For This Application (Bella's Magic Image Editor)

**Primary Choice: Hugging Face Inference API**
- ✅ Already integrated
- ✅ No setup required
- ✅ Works out of the box
- ✅ Handles all infrastructure
- ✅ Compatible hardware guaranteed

**Upgrade Path: HF Dedicated Endpoint**
- When you need custom models (NSFW XL, DreamBooth)
- When you need guaranteed availability
- When you need higher throughput
- When you need full 1024x1024 resolution

**Alternative: immers.cloud or RunPod**
- If you need more control
- If you want to avoid vendor lock-in
- If you need specific GPU models
- If you're doing other ML work beyond this app

### Quick Decision Guide

**Choose Hugging Face Public API if:**
- You're just getting started
- You generate <200 images/month
- You're okay with 512x512 default resolution
- You want minimal setup

**Choose HF Dedicated Endpoint if:**
- You need custom SDXL models
- You generate >500 images/month
- You need consistent performance
- You need NSFW content support

**Choose Alternative Provider if:**
- You need specific GPU hardware
- You want lowest possible cost
- You need custom infrastructure
- You're using multiple AI tools

---

## Getting Help

- **Hugging Face Issues**: [Hugging Face Community](https://huggingface.co/forums)
- **App Configuration**: See [CUSTOM_ENDPOINT_SETUP.md](./CUSTOM_ENDPOINT_SETUP.md)
- **Troubleshooting**: See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **General Questions**: Open a GitHub issue in this repository

---

## Summary

**The app uses Hugging Face Inference API, but you need a dedicated endpoint for it to work reliably.**

### Quick Start (Recommended Path)

1. **Set up Hugging Face Dedicated Endpoint** (~10 minutes)
   - Visit [Hugging Face Inference Endpoints](https://huggingface.co/inference-endpoints)
   - Create endpoint with `stabilityai/stable-diffusion-xl-base-1.0`
   - Choose A10G GPU ($1.30/hour) or T4 ($0.60/hour)
   - Set auto-scaling (min_replicas=0) to save money
   
2. **Get API credentials**
   - Copy endpoint URL from Hugging Face dashboard
   - Get API token from [Settings → Tokens](https://huggingface.co/settings/tokens)

3. **Configure in app**
   - Open app Settings (⚙️ icon)
   - Enter Hugging Face API key
   - Paste custom endpoint URL
   - Save

4. **Done!**
   - Full SDXL support (1024x1024)
   - No "Failed to fetch" errors
   - Runs on compatible NVIDIA GPUs (A10/T4/A100)
   - Compatible cloud infrastructure (AWS/GCP/Azure managed by Hugging Face)

### Why Not Public API?

The **public/free Hugging Face API often fails** with browser applications due to:
- ❌ CORS restrictions
- ❌ Network firewall blocks
- ❌ Rate limiting
- ❌ Model availability issues

**Dedicated endpoints bypass all these issues** and are required for production use.

### Cost Comparison

**Dedicated Endpoint (with auto-scaling):**
- Light use (10 hours/month): **$6-$13/month**
- Moderate use (50 hours/month): **$30-$65/month**
- Heavy use (160 hours/month): **$96-$208/month**

**Alternative Providers (if Hugging Face doesn't meet your needs):**
- **immers.cloud**: $0.33-$0.92/hour for SDXL-configured instances
- **RunPod**: $0.40-$3.00/hour with per-minute billing
- **Vast.ai**: From $0.20/hour (peer-to-peer, variable reliability)

### Infrastructure Details

**Hugging Face runs on:**
- Cloud: AWS, Google Cloud, and Azure (managed by Hugging Face)
- GPUs: NVIDIA T4, A10, A100 with SDXL support
- **You don't need AWS or Google Cloud accounts** - Hugging Face is your provider
- **You don't deal with GPU/CPU selection** - Hugging Face provisions NVIDIA GPUs automatically
- **Compatible hardware is guaranteed** - Hugging Face only uses NVIDIA GPUs that support SDXL

**This solves the original problem:**
✅ **No AWS account needed** - Hugging Face manages AWS GPU instances for you  
✅ **No CPU compatibility issues** - SDXL runs on NVIDIA GPUs, not CPUs  
✅ **No GCP setup needed** - Hugging Face is the provider  
✅ Hugging Face manages all hardware compatibility  
✅ NVIDIA GPUs are optimized for stable-diffusion-xl-base-1.0  
✅ Works out of the box once endpoint is configured  

**What you get:**
- Pre-configured NVIDIA GPU instances
- CUDA and drivers already installed
- SDXL model optimized and ready
- API endpoint for your app
- **Never touch AWS/GCP directly**
