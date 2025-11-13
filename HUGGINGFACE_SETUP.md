# Hugging Face Setup Guide

This guide explains how to get a Hugging Face API key and recommends high-quality NSFW-capable image generation models.

## Getting a Hugging Face API Key

### Step 1: Create a Hugging Face Account
1. Visit [Hugging Face](https://huggingface.co/)
2. Click "Sign Up" in the top right corner
3. Create your account using:
   - Email address
   - GitHub account (recommended)
   - Google account

### Step 2: Generate an Access Token
1. Once logged in, go to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
2. Click **"New token"** button
3. Configure your token:
   - **Name**: Give it a descriptive name (e.g., "Bellas Image Editor")
   - **Type**: Select **"Read"** (sufficient for API inference)
     - *Note: "Write" is only needed if you're uploading models*
4. Click **"Generate token"**
5. **IMPORTANT**: Copy the token immediately - it won't be shown again!
   - Format: `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 3: Add to Your Application
You can add your API key in two ways:

**Option A: Environment File (.env.local)**
```bash
HF_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Option B: Settings Modal (⚙️ icon in app)**
- Click the settings/gear icon
- Paste your token in the "Hugging Face API Key" field
- Click "Save"

### API Key Security
- ✅ Your API key is stored locally in your browser (localStorage)
- ✅ Never shared with anyone except Hugging Face
- ✅ Can be regenerated anytime if compromised
- ⚠️ Don't commit API keys to GitHub or share them publicly

---

## Recommended NSFW Image Generation Models

For high-quality image generation with NSFW/explicit content support, here are the best models available on Hugging Face as of 2025:

### 🏆 Top Tier: Best Quality & NSFW Support

#### 1. **NSFW XL** (Most Popular)
- **Model**: Fine-tuned Stable Diffusion XL variant
- **Resolution**: Up to 1024x1024, SDXL quality
- **Strengths**:
  - Superior anatomical accuracy
  - Excellent skin texture and realism
  - Strong prompt adherence
  - Low-Rank Adaptation (LoRA) support
- **Best for**: Both hardcore and softcore content, artistic nudes
- **Links**: Search "NSFW XL" on [Hugging Face Models](https://huggingface.co/models?search=nsfw+xl)

#### 2. **HiDream by Vivago AI** (Highest Quality)
- **Parameters**: Up to 17 billion
- **License**: MIT (fully open source)
- **Variants**:
  - **Full**: Best quality, requires 60+ GB VRAM
  - **Developer**: Balanced, moderate VRAM
  - **Fast**: Lower resource requirements
- **Strengths**:
  - Photorealistic anatomy and facial realism
  - Complex scene rendering
  - Unfiltered/uncensored by design
  - Rivals premium subscription services
- **Best for**: Professional-quality NSFW content
- **VRAM Requirements**: 16GB+ recommended
- **Note**: Use quantized versions for mid-tier GPUs

#### 3. **OmnigenXL NSFW/SFW**
- **Model ID**: `stablediffusionapi/omnigenxl-nsfw-sfw`
- **Strengths**:
  - API-accessible via Hugging Face Inference
  - Safety checker can be disabled
  - Versatile for both NSFW and SFW content
- **Best for**: API-based applications (like this one)
- **Access**: Direct Hugging Face Inference API support
- **Link**: [stablediffusionapi/omnigenxl-nsfw-sfw](https://huggingface.co/stablediffusionapi/omnigenxl-nsfw-sfw)

---

### 🥈 High Quality: Proven & Reliable

#### 4. **Unstable Diffusion**
- **Training Data**: 30+ million adult images
- **Strengths**:
  - Long-running, community-supported
  - Excellent anatomical accuracy
  - Strong facial realism
  - LoRA extensions available
- **Best for**: Uncensored generation with prompt alignment
- **Community**: Active Discord, frequent updates

#### 5. **Kernel/sd-nsfw**
- **Model ID**: `Kernel/sd-nsfw`
- **Base**: Stable Diffusion v1.5 + LAION aesthetics
- **Strengths**:
  - Realism-focused NSFW improvements
  - Lower hardware requirements than XL models
  - Easy to use and integrate
  - OpenRAIL license
- **Best for**: Basic NSFW generation on modest hardware
- **Link**: [Kernel/sd-nsfw](https://huggingface.co/Kernel/sd-nsfw)

#### 6. **Realistic Vision / RealVisXL V4.0+**
- **Base**: Not specifically NSFW, but highly realistic
- **Strengths**:
  - Top-tier photorealism and texture quality
  - Community LoRA available for uncensored content
  - Excellent for artistic nudes
- **Best for**: High-resolution photorealistic nude art
- **Note**: May require uncensored LoRA or checkpoint add-ons

---

### 📝 Model Recommendations by Use Case

| Use Case | Recommended Model | Reason |
|----------|------------------|--------|
| **API Integration** | OmnigenXL NSFW/SFW | Direct Inference API support |
| **Best Overall Quality** | HiDream Full | 17B parameters, photorealistic |
| **Most Popular/Balanced** | NSFW XL | Community favorite, great quality |
| **Low VRAM/Entry Level** | Kernel/sd-nsfw | SD 1.5 based, lightweight |
| **Artistic/Professional** | RealVisXL + uncensored LoRA | Ultimate realism |
| **Community Support** | Unstable Diffusion | Active community, frequent updates |

---

## Using NSFW Models in This App

### Current Implementation
The app currently uses `runwayml/stable-diffusion-inpainting` for inpainting and outpainting. To use NSFW-capable models:

### Option 1: Modify the Service (Recommended for Developers)
Edit `/services/huggingFaceService.ts` and change the model:

```typescript
// Current (line ~88):
const model = 'runwayml/stable-diffusion-inpainting';

// Change to NSFW-capable model:
const model = 'stablediffusionapi/omnigenxl-nsfw-sfw';
// or
const model = 'Kernel/sd-nsfw';
```

### Option 2: Use Inference Endpoints (Advanced)
For production use with custom models:
1. Go to [Hugging Face Inference Endpoints](https://huggingface.co/inference-endpoints)
2. Create a dedicated endpoint with your chosen NSFW model
3. Update the API URL in the service

---

## Important Considerations

### Legal & Ethical
- ✅ **Legal Content**: Use models responsibly and legally
- ❌ **Prohibited**: CSAM, non-consensual content, illegal imagery
- ⚠️ **Age Verification**: Implement age gating for NSFW applications
- 📋 **Licensing**: Review model licenses (usually OpenRAIL-M or MIT)

### Technical
- **VRAM Requirements**: Most XL models need 8-16GB VRAM
- **Model Loading**: First request may take 30-60 seconds (model loading)
- **Subsequent Requests**: Much faster (10-30 seconds)
- **Hardware**: NVIDIA GPU recommended (GTX 1060+ minimum)

### Quality Tips
- **Detailed Prompts**: More specific prompts yield better results
- **Negative Prompts**: Use to exclude unwanted elements
- **LoRA**: Low-Rank Adaptation can enhance specific styles
- **Prompt Engineering**: Anatomically accurate descriptions work best

---

## Model Performance Comparison

| Model | Quality | Speed | VRAM | NSFW Support | License |
|-------|---------|-------|------|--------------|---------|
| **HiDream Full** | ⭐⭐⭐⭐⭐ | ⭐⭐ | 60GB+ | Unfiltered | MIT |
| **NSFW XL** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 16GB+ | Excellent | OpenRAIL |
| **OmnigenXL** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 12GB+ | Excellent | Custom |
| **Unstable Diff** | ⭐⭐⭐⭐ | ⭐⭐⭐ | 12GB+ | Excellent | Custom |
| **Kernel/sd-nsfw** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 6GB+ | Good | OpenRAIL |
| **RealVisXL** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 16GB+ | With LoRA | OpenRAIL |

---

## Additional Resources

### Finding More Models
- [Hugging Face Models Search](https://huggingface.co/models?search=nsfw) - Search for "nsfw", "uncensored", "unrestricted"
- [CivitAI](https://civitai.com/) - Community platform with many NSFW models
- [Unstable Diffusion Discord](https://discord.gg/unstable-diffusion) - Active community

### Learning & Tutorials
- [Stable Diffusion Tutorials](https://www.stablediffusiontutorials.com/)
- [Hugging Face Diffusers Documentation](https://huggingface.co/docs/diffusers/)
- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) - Advanced workflow tool

### API Documentation
- [Hugging Face Inference API Docs](https://huggingface.co/docs/api-inference/)
- [Diffusers Library](https://huggingface.co/docs/diffusers/)

---

## Troubleshooting

### "Model is loading" Error
**Solution**: Wait 30-60 seconds and retry. First request loads the model into memory.

### VRAM Out of Memory
**Solutions**:
- Use smaller models (Kernel/sd-nsfw instead of XL models)
- Reduce image resolution
- Use quantized model versions
- Use cloud-based inference endpoints

### Poor Quality Results
**Solutions**:
- Write more detailed prompts
- Use negative prompts to exclude unwanted elements
- Try different models
- Adjust inference parameters (steps, guidance scale)

### Safety Checker Blocking Content
**Solutions**:
- Use explicitly uncensored models
- Disable safety checker in code (if self-hosting)
- Use models designed for NSFW content

---

## Summary

For **this application**, the best approach is:
1. **Get a Hugging Face API key** (free, takes 2 minutes)
2. **Start with**: `stablediffusionapi/omnigenxl-nsfw-sfw` (API-friendly, good quality)
3. **Upgrade to**: NSFW XL or HiDream for better quality (if self-hosting)
4. **Monitor usage**: Check your [Hugging Face usage dashboard](https://huggingface.co/settings/billing)

**Estimated costs**: $0.001-$0.02 per image generation, significantly cheaper than xAI for inpainting/outpainting operations.
