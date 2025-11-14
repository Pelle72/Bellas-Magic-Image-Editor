# Quick Reference: Configure Your Hugging Face Endpoint

**Your endpoint dashboard:** https://endpoints.huggingface.co/JohnDcc/endpoints/dedicated

⚠️ **IMPORTANT: Your endpoint MUST use a GPU instance (T4, A10G, or A100)**

**DO NOT use CPU instances** (Intel Sapphire Rapids, AMD EPYC) - they are incompatible with Stable Diffusion models and will fail with "Hardware not compatible" error.

## 3-Minute Setup

### 1️⃣ Get Your Endpoint URL

On your endpoint dashboard page, find the **Endpoint URL**:
- Look for a box/section labeled **"Endpoint"**, **"Overview"**, or **"API"**
- The URL format: `https://xxxxx-xxxxx-xxxxx.us-east-1.aws.endpoints.huggingface.cloud`
- Copy this entire URL

**💡 Tip:** It's NOT the dashboard URL you're on now. Look for "Endpoint URL" or "API URL" in the dashboard.

---

### 2️⃣ Get Your HF Token

Visit: https://huggingface.co/settings/tokens
- Use existing token OR click "New token"
- Name: `bella-editor`
- Role: `Read`
- Copy the token (starts with `hf_`)

---

### 3️⃣ Configure in App

1. Open Bella's Magic Image Editor
2. Click **⚙️ Settings** (gear icon)
3. Fill in:
   ```
   xAI API-nyckel: [your xAI key]
   Hugging Face API-nyckel: hf_xxxxxxxxxxxxxxxxxxxxx
   Custom Inference Endpoint: https://xxxxx.endpoints.huggingface.cloud
   ```
4. Click **Spara** (Save)

---

### 4️⃣ Model Configuration (Optional)

**Good News**: When using a custom endpoint, the app automatically sends requests to your endpoint URL, which uses whatever model you deployed. You typically **don't need to change any code**!

**Check your deployed model** (for reference):

On the endpoint dashboard, look for:
- **Model Repository** or **Model** field
- Common examples:
  - `stable-diffusion-xl-base-1-0-clr` (SDXL variant)
  - `stabilityai/stable-diffusion-xl-base-1.0` (standard SDXL)
  - `stablediffusionapi/omnigenxl-nsfw-sfw` (NSFW variant)

**Only update code if you encounter issues:**

If you get errors, you can specify the exact model name in `/services/huggingFaceService.ts`:

**Line ~531 (Text-to-Image):**
```typescript
const model = 'stable-diffusion-xl-base-1-0-clr';  // Use YOUR exact model name
```

**Line ~296 (Inpainting):**
```typescript
const model = 'stable-diffusion-xl-base-1-0-clr';  // Use YOUR exact model name
```

Then rebuild:
```bash
npm run build
```

**Note**: Most users won't need to do this - the endpoint URL is sufficient.

---

### 5️⃣ Test

In browser console (F12):
```javascript
await testHFConnection()
```

Expected result:
```javascript
{ success: true, message: "Connection successful!" }
```

---

## Common Issues

### ❌ "Hardware not compatible with selected model"
**Cause**: You selected a CPU instance (Intel Sapphire Rapids, AMD EPYC, etc.)

**Solution**: 
1. Delete the endpoint in your Hugging Face dashboard
2. Create a new endpoint with a **GPU instance**:
   - Minimum: **T4 GPU** ($0.60/hour)
   - Recommended: **A10G GPU** ($1.30/hour)
3. Stable Diffusion requires GPU - CPU instances will NEVER work

### "Failed to fetch" Error
- ❌ Using dashboard URL instead of endpoint URL
- ✅ Use the URL ending in `.endpoints.huggingface.cloud`

### Endpoint Not Responding
- Check status is **Running** (green)
- If "Scaled to Zero", first request takes 30-60 seconds

### Wrong API Key Format
- Must start with `hf_`
- Generate from https://huggingface.co/settings/tokens

---

## What You Get

With custom endpoint configured:
- ✅ Higher resolution (1024x1024 for SDXL)
- ✅ NSFW content support (if using NSFW model)
- ✅ Better quality (SDXL vs SD 1.5)
- ✅ Faster after initial load
- ✅ No CORS issues

Cost: ~$0.60-$1.30/hour while running

---

## Example Configuration

**If your endpoint uses `omnigenxl-nsfw-sfw`:**

**Settings Modal:**
```
HF API Key: hf_AbCdEfGhIjKlMnOpQrStUvWxYz123456
Custom Endpoint: https://abc123.us-east-1.aws.endpoints.huggingface.cloud
```

**Code (line 528 in huggingFaceService.ts):**
```typescript
const model = 'stablediffusionapi/omnigenxl-nsfw-sfw';
```

**Code (line 293 in huggingFaceService.ts):**
```typescript
// If your endpoint is text-to-image only, leave inpainting as is:
const model = 'runwayml/stable-diffusion-inpainting';  // Uses public API for inpainting
```

---

## Need Help?

1. **Can't find Endpoint URL?**
   - Click on your endpoint in the list
   - Look for "Overview" or "Endpoint" section
   - URL should be clearly labeled

2. **Don't know which model?**
   - Check the "Model Repository" field on dashboard
   - Or use the default: `stabilityai/stable-diffusion-xl-base-1.0`

3. **Still not working?**
   - Check browser console for errors (F12)
   - Run `testHFConnection()` for diagnostics
   - See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

**Ready?** Follow the 5 steps above and you'll have higher quality image generation in minutes! 🚀
