# Model Configuration Changes

## Updated Default Models for Better Reliability

### What Changed
The default Hugging Face models have been updated to use more reliable, officially supported models that are guaranteed to work with the public Inference API.

### Previous Configuration
- **Text-to-Image**: `stablediffusionapi/omnigenxl-nsfw-sfw`
- **Inpainting**: `diffusers/stable-diffusion-xl-1.0-inpainting-0.1`

### Current Configuration
- **Text-to-Image**: `runwayml/stable-diffusion-v1-5`
- **Inpainting**: `runwayml/stable-diffusion-inpainting`

### Why the Change?

#### Issue with Previous Models
Some users experienced "Failed to fetch" or "Could not connect to Hugging Face API" errors even with valid API keys. Investigation revealed that:

1. **Third-party models** (like `stablediffusionapi/*`) may not properly support CORS for browser requests
2. **Some SDXL models** from the `diffusers/*` namespace may require special permissions or Pro subscriptions
3. **Model availability** via the public Inference API is not guaranteed for all models

#### Benefits of New Models
The new default models (`runwayml/*`) are:

✅ **Officially supported** by Hugging Face and RunwayML  
✅ **Guaranteed CORS support** for browser-based applications  
✅ **Always accessible** via the free public Inference API  
✅ **Well-tested** and widely used in production applications  
✅ **No special permissions required** - work with standard Read tokens  

### Alternative Models

If you want to use different models (e.g., for NSFW content, higher resolution, or better quality), you can modify the model selection in `/services/huggingFaceService.ts`:

#### For Text-to-Image Generation

Edit around line 385:
```typescript
// Current (most reliable):
const model = 'runwayml/stable-diffusion-v1-5';

// Alternatives you can try:
// const model = 'stabilityai/stable-diffusion-2-1';        // SD 2.1 - better quality
// const model = 'CompVis/stable-diffusion-v1-4';           // SD 1.4 - older but stable
// const model = 'stablediffusionapi/omnigenxl-nsfw-sfw';  // NSFW support (may have CORS issues)
```

#### For Inpainting

Edit around line 175:
```typescript
// Current (most reliable):
const model = 'runwayml/stable-diffusion-inpainting';

// Alternatives you can try:
// const model = 'stabilityai/stable-diffusion-2-inpainting';          // SD 2.0 inpainting
// const model = 'diffusers/stable-diffusion-xl-1.0-inpainting-0.1';  // SDXL (may have CORS issues)
```

### Testing Model Accessibility

Before changing models, you can test if a model is accessible:

1. Open browser console (F12)
2. Run the test function:
```javascript
await testHFConnection()
```

3. Or test a specific model:
```javascript
const apiKey = localStorage.getItem('hf_api_key');
const testModel = 'stablediffusionapi/omnigenxl-nsfw-sfw'; // Replace with model to test

fetch(`https://api-inference.huggingface.co/models/${testModel}`, {
  headers: { 'Authorization': `Bearer ${apiKey}` }
})
.then(r => r.json())
.then(data => console.log('Model accessible:', data))
.catch(err => console.error('Model not accessible:', err));
```

### For NSFW Content

If you need uncensored/NSFW content generation:

1. **Option 1**: Use a dedicated Inference Endpoint (recommended for production)
   - Go to [Hugging Face Inference Endpoints](https://huggingface.co/inference-endpoints)
   - Deploy your preferred NSFW model
   - Update the `apiUrl` in the service to point to your endpoint

2. **Option 2**: Try alternative models and test for CORS support
   - Uncomment one of the NSFW model alternatives in the code
   - Test if it works with your setup using `testHFConnection()`
   - Some models may work depending on your network/browser

3. **Option 3**: Implement a backend proxy
   - See `TROUBLESHOOTING.md` for proxy implementation examples
   - This avoids CORS issues entirely by routing requests through your server

### Migration Guide

If you're upgrading from a previous version and want to keep using the old models:

1. Open `/services/huggingFaceService.ts`
2. Find the model configuration sections (around lines 175 and 385)
3. Comment out the current model line
4. Uncomment the line with your preferred model
5. Rebuild and test: `npm run build`

### Troubleshooting

If you're still having connection issues after this change:
- See `TROUBLESHOOTING.md` for comprehensive debugging steps
- Run `testHFConnection()` in browser console
- Check if Hugging Face is accessible: `ping api-inference.huggingface.co`
- Try a different browser or network
- Check browser console for detailed error messages

### Performance Notes

**Stable Diffusion v1.5** (current default):
- Resolution: 512x512 (auto-scaled)
- Speed: Fast (~10-15 seconds)
- Quality: Good for most use cases
- VRAM: Low requirements

**Stable Diffusion XL** (optional):
- Resolution: 1024x1024 (auto-scaled)
- Speed: Slower (~30-60 seconds)
- Quality: Excellent, photorealistic
- VRAM: Higher requirements
- **Note**: May require Pro subscription or dedicated endpoint

### Cost Comparison

All models use the same pricing model on Hugging Face Inference API:
- **Free tier**: ~100 requests/month
- **Pay-as-you-go**: $0.001-$0.02 per request
- **Pro subscription**: $9/month for higher limits

Dedicated Inference Endpoints have different pricing:
- **CPU**: $0.03-$0.06/hour
- **GPU (T4)**: $0.60/hour
- **GPU (A10G)**: $1.30/hour

### Questions or Issues?

If you're experiencing issues or have questions about model selection:
1. Check `TROUBLESHOOTING.md` first
2. Run `testHFConnection()` for diagnostics
3. Create a GitHub issue with debug information
4. Join the discussion in GitHub Issues

### Summary

These changes prioritize **reliability and accessibility** over advanced features. The new default models are guaranteed to work for all users with a standard Hugging Face account. Advanced users can still use specialized models by following the instructions above.
