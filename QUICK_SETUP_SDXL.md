# Quick Setup Guide for SDXL Inference

## Problem: "Failed to fetch" errors when using AI features

This happens because the Hugging Face public API has limitations. You need a **dedicated inference endpoint** for reliable operation.

---

## ✅ Solution: Set Up Hugging Face Dedicated Endpoint

**Time required:** 10-15 minutes  
**Cost:** $0.60-$1.30/hour (scales to $0 when idle)

---

## Step-by-Step Setup

### 1. Create Hugging Face Account (if you don't have one)

1. Go to [huggingface.co](https://huggingface.co)
2. Click "Sign Up"
3. Verify your email

### 2. Add Billing Information

1. Go to [Settings → Billing](https://huggingface.co/settings/billing)
2. Add a payment method
3. **Note:** You're only charged for actual usage (pay-as-you-go)

### 3. Create Inference Endpoint

⚠️ **Critical: Cloud Provider Selection Matters!**

**If you're getting "Hardware not compatible with selected model" errors:**
- AWS and Google Cloud often have GPU compatibility issues with SDXL
- **Use Azure instead** - most reliable for SDXL endpoints
- See [ENDPOINT_HARDWARE_FIX.md](./ENDPOINT_HARDWARE_FIX.md) for detailed troubleshooting

1. **Navigate to Endpoints:**
   - Go to [Inference Endpoints](https://huggingface.co/inference-endpoints)
   - Click **"Create new endpoint"**

2. **Configure Endpoint:**
   
   **Basic Settings:**
   - **Name:** `bella-sdxl` (or any name you prefer)
   - **Model Repository:** `stabilityai/stable-diffusion-xl-base-1.0`
   - **Cloud Provider:** **Azure** ← ⭐ **Recommended! AWS/GCP may fail**
   - **Region:** West Europe or East US 2 (best GPU availability)

   **Compute Settings:**
   - **Instance Type:** 
     - **GPU [medium]** - ⭐ **Recommended** (A10 or T4, works reliably)
     - **GPU [small]** - May not have enough VRAM for SDXL
     - **GPU [large]** - A100, expensive but guaranteed to work
   
   ⚠️ **Common Mistake:** Selecting CPU instance or incompatible GPU type
   
   **Advanced Settings:**
   - **Auto-scaling:**
     - **Min replicas:** `0` ← **Important!** Saves money when idle
     - **Max replicas:** `1`
     - **Scale to zero timeout:** `15 minutes`

3. **Create Endpoint:**
   - Click **"Create Endpoint"**
   - Wait 5-10 minutes for deployment
   - Status will change from "Building" → "Running" when ready
   
   **If deployment fails with "Hardware not compatible":**
   - See [ENDPOINT_HARDWARE_FIX.md](./ENDPOINT_HARDWARE_FIX.md) for solutions
   - Quick fix: Delete endpoint and recreate with Azure cloud provider

### 4. Get Your Credentials

1. **Endpoint URL:**
   - On the endpoint page, copy the **"Endpoint URL"**
   - Format: `https://xxxxx.endpoints.huggingface.cloud`
   - **This is NOT the dashboard URL!**

2. **API Token:**
   - Go to [Settings → Access Tokens](https://huggingface.co/settings/tokens)
   - Click **"New token"**
   - Name: `bella-editor`
   - Role: **Read**
   - Click **"Generate"**
   - **Copy the token** (starts with `hf_`)

### 5. Configure in Bella's Magic Image Editor

1. **Open the app** in your browser

2. **Open Settings:**
   - Click the ⚙️ **Settings** icon (usually top-right)

3. **Enter credentials:**
   - **Hugging Face API-nyckel:** Paste your API token (from step 4.2)
   - **Custom Inference Endpoint:** Paste endpoint URL (from step 4.1)
   - Also add your xAI API key if you haven't already

4. **Save:**
   - Click **"Spara"** (Save)
   - Modal will show ✓ Sparad! and close

### 6. Test It!

1. **Upload an image** or use a text prompt
2. **First request takes 30-60 seconds** (model loading on endpoint)
3. **Subsequent requests are much faster** (10-30 seconds)
4. **Check browser console** (F12) for any errors

✅ **If it works:** You'll see images generated at 1024x1024 resolution!

❌ **If you still get errors:** Check the troubleshooting section below

---

## Cost Management

### Auto-Scaling (Recommended)

With `min_replicas=0`, your endpoint:
- ✅ Scales to **$0/hour** when not in use
- ✅ Automatically starts when you make a request
- ✅ First request after idle takes 30-60 seconds
- ✅ Automatically stops after 15 minutes of inactivity

### Estimated Monthly Costs

**With auto-scaling enabled:**

| Usage | Hours/Month | Cost (T4) | Cost (A10G) |
|-------|-------------|-----------|-------------|
| Light (few images/day) | ~10 hours | **~$6** | **~$13** |
| Moderate (daily use) | ~50 hours | **~$30** | **~$65** |
| Heavy (frequent use) | ~160 hours | **~$96** | **~$208** |

### Money-Saving Tips

1. **Use min_replicas=0** - Endpoint scales to zero when idle
2. **Pause endpoint manually** - When you won't use it for days
3. **Start with T4** - Cheaper, upgrade to A10G if you need more speed
4. **Monitor usage** - Check [Billing dashboard](https://huggingface.co/settings/billing)

---

## Troubleshooting

### Endpoint URL Not Working

**Check the URL format:**
- ✅ Correct: `https://xxxxx.endpoints.huggingface.cloud`
- ❌ Wrong: `https://endpoints.huggingface.co/...` (this is the dashboard)

**Find the correct URL:**
1. Go to your endpoint in the dashboard
2. Look for "Endpoint URL" or "API URL"
3. Should end with `.endpoints.huggingface.cloud`

### Model Loading (First Request Slow)

**This is normal!**
- First request: 30-60 seconds (model loading)
- Subsequent requests: 10-30 seconds
- Don't refresh the page, just wait

### Still Getting "Failed to fetch"

**Check:**
1. API token starts with `hf_`
2. Endpoint status is "Running" in dashboard
3. Custom endpoint URL is entered in Settings
4. Both API key AND endpoint URL are saved

**Test connection:**
Open browser console (F12) and run:
```javascript
await testHFConnection()
```

### Endpoint Status Issues

**Status: "Hardware not compatible with selected model"**
- **AWS/GCP compatibility issue** - Try Azure instead
- Delete endpoint and recreate with Azure cloud provider
- Or use ml.g5.xlarge instance type if staying on AWS
- **Full guide:** [ENDPOINT_HARDWARE_FIX.md](./ENDPOINT_HARDWARE_FIX.md)

**Status: Building/Starting**
- Wait a few more minutes
- First deployment can take 5-10 minutes

**Status: Stopped/Failed**
- Click "Resume" button
- Check logs for errors
- May need to recreate endpoint with different cloud provider

**Status: Scaled to Zero**
- Normal with auto-scaling
- Will start on first request (30-60s)

### High Costs

**Check auto-scaling:**
1. Go to endpoint settings
2. Verify `min_replicas: 0`
3. Check "Scale to zero timeout"

**Pause endpoint when not using:**
1. Go to endpoint page
2. Click "Pause" button
3. Remember to resume when you want to use it

---

## Alternative: Try Public API First (Free)

If you want to test before setting up an endpoint:

1. Get API token: [Settings → Tokens](https://huggingface.co/settings/tokens)
2. Open app Settings (⚙️)
3. Enter API token
4. Leave "Custom Inference Endpoint" **empty**
5. Save and test

**Note:** Public API often fails with "Failed to fetch" due to CORS/network issues. If it doesn't work, use the dedicated endpoint approach above.

---

## What You Get

✅ **Stable Diffusion XL** - Full 1024x1024 resolution  
✅ **No CORS errors** - Properly configured for browsers  
✅ **Reliable performance** - Dedicated resources  
✅ **Auto-scaling** - Saves money when idle  
✅ **Compatible hardware** - NVIDIA GPUs optimized for SDXL  
✅ **No AWS/GCP setup** - Hugging Face manages everything  

---

## Need Help?

1. **Check detailed guide:** [CLOUD_INFERENCE_PROVIDERS.md](./CLOUD_INFERENCE_PROVIDERS.md)
2. **Troubleshooting:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
3. **Custom endpoints:** [CUSTOM_ENDPOINT_SETUP.md](./CUSTOM_ENDPOINT_SETUP.md)
4. **GitHub Issues:** Open an issue if you're still stuck

---

## Summary

To use SDXL with this app:
1. Create Hugging Face account + add billing
2. Create dedicated endpoint with SDXL model
3. Get endpoint URL and API token
4. Enter both in app Settings
5. Done! No more "Failed to fetch" errors

**Cost:** ~$6-$65/month depending on usage (with auto-scaling)

**Time to setup:** 10-15 minutes

**Result:** Fully working SDXL inference with 1024x1024 images! 🎉
