# Custom Inference Endpoint Setup Guide

This guide explains how to configure a dedicated Hugging Face Inference Endpoint to use higher quality models, including NSFW XL and Stable Diffusion XL models with full resolution support.

## Quick Start: Configure Your Existing Endpoint

If you already have an endpoint at `https://endpoints.huggingface.co/JohnDcc/endpoints/dedicated`:

### Step 1: Get Your Endpoint URL
1. Go to your endpoint page: https://endpoints.huggingface.co/JohnDcc/endpoints/dedicated
2. Look for the **"Endpoint URL"** - it should look like:
   ```
   https://xxxxx.endpoints.huggingface.cloud
   ```
   Or it might be labeled as **"API URL"** or similar
3. Copy this URL (you'll need it in Step 3)

### Step 2: Get Your Hugging Face API Token
1. Go to [Hugging Face Settings → Tokens](https://huggingface.co/settings/tokens)
2. Find your existing token OR create a new one:
   - Click **"New token"**
   - Name it (e.g., "bella-editor")
   - Role: **"Read"** (sufficient for inference)
   - Click **"Generate"**
3. Copy the token (starts with `hf_`)

### Step 3: Configure in Bella's Magic Image Editor
1. Open Bella's Magic Image Editor in your browser
2. Click the **⚙️ Settings** icon (gear icon, usually in top-right corner)
3. You'll see three fields:
   - **xAI API-nyckel**: Enter your xAI/Grok API key (for image analysis)
   - **Hugging Face API-nyckel**: Paste your HF token from Step 2
   - **Custom Inference Endpoint**: Paste the endpoint URL from Step 1
4. Click **"Spara"** (Save)
5. The modal will show: **✓ Sparad!** and close

### Step 4: Update Model Selection (Important!)

Since you're using a custom endpoint, you need to specify which model is deployed there.

**Check which model your endpoint is running:**
1. Go back to https://endpoints.huggingface.co/JohnDcc/endpoints/dedicated
2. Look for **"Model Repository"** or **"Model"** - note the exact model name
3. Common examples:
   - `stablediffusionapi/omnigenxl-nsfw-sfw`
   - `diffusers/stable-diffusion-xl-1.0-inpainting-0.1`
   - `stabilityai/stable-diffusion-xl-base-1.0`

**Update the code to use your model:**

Open `/services/huggingFaceService.ts` and make these changes:

**For Text-to-Image (around line 528):**
```typescript
// BEFORE:
const model = 'runwayml/stable-diffusion-v1-5';  // Most reliable, always accessible

// AFTER (uncomment and update with YOUR model):
const model = 'stablediffusionapi/omnigenxl-nsfw-sfw';  // Replace with your actual model
```

**For Inpainting (around line 293):**
```typescript
// BEFORE:
const model = 'runwayml/stable-diffusion-inpainting';  // Most reliable

// AFTER (if your endpoint supports inpainting):
const model = 'diffusers/stable-diffusion-xl-1.0-inpainting-0.1';  // Replace with your actual model
```

**Save the file and rebuild:**
```bash
npm run build
```

### Step 5: Test It!
1. Open the app in your browser
2. Open browser console (F12)
3. Run the test function:
   ```javascript
   await testHFConnection()
   ```
4. You should see:
   ```javascript
   { success: true, message: "Connection successful!", ... }
   ```

### Step 6: Try Generating an Image
1. Upload an image or use a text prompt
2. First request will take 30-60 seconds (model loading on endpoint)
3. Subsequent requests should be much faster
4. Check for higher resolution (1024x1024 if using SDXL)

---

## Troubleshooting Your Endpoint

### Endpoint URL Not Working
**Check the exact URL format:**
- ✅ Correct: `https://xxxxx.endpoints.huggingface.cloud`
- ❌ Wrong: `https://endpoints.huggingface.co/JohnDcc/endpoints/dedicated` (this is the dashboard URL, not API URL)

**To find the correct URL:**
1. On your endpoint dashboard page
2. Look for a section labeled "Endpoint" or "Overview"
3. There should be an API URL or Endpoint URL field
4. It should end with `.endpoints.huggingface.cloud`

### Endpoint Status
Make sure your endpoint is **Running**:
1. Go to https://endpoints.huggingface.co/JohnDcc/endpoints/dedicated
2. Check the status indicator:
   - 🟢 **Running** = Ready to use
   - 🟡 **Building/Starting** = Wait a few minutes
   - 🔴 **Stopped/Failed** = Click "Resume" or check logs
   - ⚪ **Scaled to Zero** = First request will wake it up (30-60s delay)

### Model Mismatch
If you get errors about unsupported operations:
- Text-to-image endpoint can't do inpainting
- Inpainting endpoint can't do text-to-image
- Make sure the model variable in the code matches your endpoint's model

### API Key Issues
- Token must start with `hf_`
- Token needs at least "Read" permission
- Same token works for both public API and custom endpoints

---

## Why Use a Custom Endpoint?

### Benefits
✅ **Higher Resolution**: Support for 1024x1024 (SDXL) or custom resolutions  
✅ **NSFW Content**: Full access to unrestricted NSFW models  
✅ **Better Quality**: Use advanced models like SDXL, NSFW XL, etc.  
✅ **Guaranteed Availability**: Dedicated resources, no cold starts  
✅ **CORS Support**: Properly configured for browser applications  
✅ **Custom Models**: Deploy any model you want  

### Costs
- **Startup**: ~30-60 seconds for first request (model loading)
- **Running Cost**: $0.60-$1.30/hour depending on GPU tier
- **Free Tier**: Public API works but has limitations

## Step-by-Step Setup

### 1. Create a Hugging Face Account
If you haven't already:
1. Go to [huggingface.co](https://huggingface.co/)
2. Sign up (free)
3. Verify your email

### 2. Add Billing Information
Dedicated endpoints require payment:
1. Go to [Settings → Billing](https://huggingface.co/settings/billing)
2. Add a payment method
3. No upfront charges - you're billed for usage

### 3. Create an Inference Endpoint

#### Navigate to Endpoints
1. Go to [Inference Endpoints](https://huggingface.co/inference-endpoints)
2. Click **"Create new endpoint"**

#### Configure Your Endpoint

**Basic Settings:**
- **Name**: Choose a descriptive name (e.g., "bella-nsfw-xl")
- **Model Repository**: Select your model (see recommendations below)
- **Cloud Provider**: **AWS (Recommended)** or Azure
  - ⚠️ **Avoid Google Cloud**: Limited GPU availability and more restrictive instance options
  - AWS has best GPU availability and pricing
  - Azure is acceptable alternative
- **Region**: Choose nearest to your users for lower latency
  - **AWS**: us-east-1 (N. Virginia), us-west-2 (Oregon), eu-west-1 (Ireland)
  - **Azure**: eastus, westus2, northeurope

**Compute Settings:**

⚠️ **CRITICAL: GPU REQUIRED - CPU instances will NOT work!**

Stable Diffusion models **require GPU acceleration**. Do NOT select CPU instances (Intel Sapphire Rapids, AMD EPYC, etc.) as they are incompatible with image generation models.

**Compatible GPU Instance Types:**
- **T4 (Small)**: $0.60/hour - Good for SD 1.5, basic SDXL
- **A10G (Medium)**: $1.30/hour - Best for SDXL, NSFW XL (recommended)
- **A100 (Large)**: $4.50/hour - Overkill for most use cases

**❌ Incompatible CPU Instance Types (DO NOT USE):**
- Intel Sapphire Rapids ($0.05/hour) - Will fail with "Hardware not compatible" error
- AMD EPYC - Will fail with "Hardware not compatible" error
- Any CPU-only instance - Image generation requires GPU

**Advanced Settings:**
- **Auto-scaling**: 
  - **Min replicas**: 0 (saves money when not in use)
  - **Max replicas**: 1 (or more for high traffic)
  - **Scale to zero timeout**: 15 minutes
- **Security**: Keep default settings
- **Environment Variables**: Usually not needed

#### Click "Create Endpoint"
- Initial deployment takes 5-10 minutes
- Status will change to "Running" when ready

### 4. Get Your Endpoint URL

Once deployed:
1. Click on your endpoint in the list
2. Copy the **Endpoint URL** (format: `https://xxxxx.endpoints.huggingface.cloud`)
3. Copy your **API token** from the endpoint details page

### 5. Configure in Bella's Magic Image Editor

#### Option A: Settings Modal (Recommended)
1. Open the app
2. Click the ⚙️ Settings icon
3. Enter your Hugging Face API key
4. Paste your endpoint URL in **"Custom Inference Endpoint"**
5. Click **Save**

#### Option B: Browser Console
```javascript
// Set your custom endpoint
localStorage.setItem('hf_custom_endpoint', 'https://xxxxx.endpoints.huggingface.cloud');

// Verify it's set
console.log('Endpoint:', localStorage.getItem('hf_custom_endpoint'));
```

### 6. Update Model in Code (Optional)

If using NSFW or SDXL models, update the model selection in `/services/huggingFaceService.ts`:

**For Text-to-Image** (around line 528):
```typescript
// Uncomment your preferred model:
const model = 'stablediffusionapi/omnigenxl-nsfw-sfw';  // NSFW XL
// const model = 'diffusers/stable-diffusion-xl-1.0-inpainting-0.1';  // SDXL
```

**For Inpainting** (around line 293):
```typescript
// Uncomment your preferred model:
const model = 'diffusers/stable-diffusion-xl-1.0-inpainting-0.1';  // SDXL inpainting
```

**Note**: When using a custom endpoint, the model is already deployed there, so you may not need to change the model variable. The endpoint itself determines which model is used.

## Recommended Models

### For NSFW Content

#### 1. OmnigenXL NSFW/SFW (Recommended)
- **Model ID**: `stablediffusionapi/omnigenxl-nsfw-sfw`
- **Resolution**: 1024x1024
- **GPU**: A10G or better
- **Quality**: Excellent for both NSFW and SFW
- **Speed**: ~30-45 seconds per image

#### 2. NSFW XL
- **Model ID**: Search "nsfw xl" on Hugging Face
- **Resolution**: 1024x1024
- **GPU**: A10G recommended
- **Quality**: Superior anatomical accuracy
- **Speed**: ~30-60 seconds per image

#### 3. Stable Diffusion XL 1.0
- **Model ID**: `stabilityai/stable-diffusion-xl-base-1.0`
- **Resolution**: 1024x1024
- **GPU**: A10G or better
- **Quality**: High quality, can be used for NSFW with prompts
- **Speed**: ~30-45 seconds per image

### For Inpainting

#### 1. SDXL Inpainting (Recommended)
- **Model ID**: `diffusers/stable-diffusion-xl-1.0-inpainting-0.1`
- **Resolution**: 1024x1024
- **GPU**: A10G recommended
- **Quality**: Excellent preservation of original
- **Speed**: ~30-60 seconds per edit

#### 2. SD 2.0 Inpainting
- **Model ID**: `stabilityai/stable-diffusion-2-inpainting`
- **Resolution**: 512x512
- **GPU**: T4 sufficient
- **Quality**: Good
- **Speed**: ~15-30 seconds per edit

## Testing Your Endpoint

### In Browser Console
```javascript
// Test endpoint connectivity
await testHFConnection()

// Should return:
// { success: true, message: "Connection successful!", ... }
```

### Expected Behavior
1. First request takes 30-60 seconds (model loading)
2. Subsequent requests are much faster (10-30 seconds)
3. Higher resolution output (1024x1024 for SDXL)
4. Better quality images
5. NSFW content works without restrictions

## Cost Management

### Tips to Save Money
1. **Set min replicas to 0**: Endpoint scales to zero when not in use
2. **Set scale-to-zero timeout**: 15 minutes is good balance
3. **Pause endpoint**: Manually pause when not actively using
4. **Monitor usage**: Check billing dashboard regularly

### Example Costs
**Light Use** (few hours per week):
- T4: $5-10/month
- A10G: $10-20/month

**Moderate Use** (daily, few hours):
- T4: $20-40/month
- A10G: $40-80/month

**Heavy Use** (always on):
- T4: ~$432/month
- A10G: ~$936/month

### Free Alternative
If costs are too high, continue using the public API with the default RunwayML models (512x512, no NSFW).

## Troubleshooting

### "Hardware not compatible with selected model" Error

**Error Message:**
```
Error in inference endpoint config: Intel Sapphire Rapids
1x vCPU · 2 GB
$0.05 / h
Hardware not compatible with selected model.
```

**Cause**: You selected a CPU instance instead of a GPU instance.

**Solution**: 
1. Delete the incompatible endpoint in your Hugging Face dashboard
2. Create a new endpoint with a **GPU instance type**:
   - Minimum: **T4 GPU** ($0.60/hour)
   - Recommended: **A10G GPU** ($1.30/hour)
3. **Never select CPU instances** (Intel Sapphire Rapids, AMD EPYC, etc.) - they cannot run Stable Diffusion models

**Why GPU is Required:**
- Stable Diffusion models use neural networks that require massive parallel computation
- GPUs provide thousands of cores for parallel processing
- CPUs only have a few cores and will fail to run these models
- This is a fundamental requirement, not a configuration issue

### Endpoint Not Working
1. **Check endpoint status**: Should be "Running" in dashboard
2. **Verify URL**: Must be exact URL from endpoint details
3. **Check API key**: Same key used for public API
4. **Test connection**: Run `testHFConnection()` in console
5. **Verify GPU instance**: Must use T4, A10G, or A100 (not CPU)

### Model Loading Timeout
- First request can take 30-60 seconds
- Wait patiently, don't refresh
- Subsequent requests are faster

### High Costs
- Check if endpoint is scaling to zero
- Verify min replicas is set to 0
- Consider pausing when not in use
- Use T4 instead of A10G if quality is acceptable

### NSFW Content Still Blocked
- Verify you're using an NSFW-capable model
- Check that custom endpoint is configured
- Some models have built-in safety filters - use truly uncensored models

## Reverting to Public API

To go back to free public API:

1. **Via Settings Modal**: Clear the "Custom Inference Endpoint" field and save
2. **Via Console**:
```javascript
localStorage.removeItem('hf_custom_endpoint');
```

The app will automatically use the default RunwayML models.

## Advanced: Multiple Endpoints

You can create separate endpoints for different purposes:
- One for text-to-image (NSFW XL)
- One for inpainting (SDXL Inpainting)

To use different endpoints for different tasks, you'll need to modify the code to switch endpoints based on the operation.

## Security Notes

🔒 **Your endpoint URL is not sensitive** - it requires your API key to use  
🔒 **API keys are stored locally** - never shared with anyone except Hugging Face  
🔒 **Endpoint is private** - only accessible with your API key  

## Summary

Custom Inference Endpoints enable:
- ✅ Higher resolution (1024x1024)
- ✅ NSFW content support
- ✅ Better quality models (SDXL, NSFW XL)
- ✅ Guaranteed availability
- ✅ Full CORS support

Trade-offs:
- ⚠️ Costs $0.60-$1.30/hour when running
- ⚠️ Requires payment method
- ⚠️ Initial setup complexity

For most users, the free public API is sufficient. Use custom endpoints when you need:
- Professional NSFW content generation
- Maximum quality and resolution
- Production-level reliability

## Questions?

- Check [Hugging Face Endpoint Docs](https://huggingface.co/docs/inference-endpoints/)
- Review the main [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Create a GitHub issue for support

---

**Ready to upgrade?** Set up your endpoint and enjoy higher quality, unrestricted image generation! 🚀
