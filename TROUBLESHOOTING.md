# Troubleshooting Guide

## Hugging Face API Connection Issues

If you're experiencing the error "Kunde inte ansluta till Hugging Face API" (Could not connect to Hugging Face API), follow these steps:

### 1. Verify Your API Key

#### Check API Key Format
- Open browser developer console (F12)
- Go to Application/Storage → Local Storage
- Find the `hf_api_key` entry
- **Correct format**: `hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (starts with `hf_`)
- If it doesn't start with `hf_`, regenerate your token at [Hugging Face Settings](https://huggingface.co/settings/tokens)

#### Check API Key Permissions
1. Go to [Hugging Face Settings → Access Tokens](https://huggingface.co/settings/tokens)
2. Find your token
3. Ensure it has at least **"Read"** permission
4. Some models may require additional permissions

### 2. Test API Key Validity

Open browser console (F12) and run:
```javascript
fetch('https://api-inference.huggingface.co/models/bert-base-uncased', {
  headers: { 'Authorization': 'Bearer hf_YOUR_KEY_HERE' }
}).then(r => r.json()).then(console.log).catch(console.error)
```

Replace `hf_YOUR_KEY_HERE` with your actual key.

**Expected Result**: Should return model information (JSON object)
**Error Result**: 
- `401`: Invalid or expired API key
- `Failed to fetch`: CORS or network issue
- `403`: Insufficient permissions

### 3. Check Browser Console for Detailed Errors

1. Open browser developer tools (F12)
2. Go to Console tab
3. Try using a feature in the app
4. Look for error messages starting with `[inpaintImage]` or `[generateImageFromText]`

Common error patterns:

#### "CORS error" or "Failed to fetch"
**Cause**: Cross-Origin Resource Sharing restriction
**Solutions**:
- **For Development**: Use `npm run dev` (proxy is configured)
- **For Production**: This indicates a browser or network policy blocking the request
  - Try a different browser (Chrome, Firefox, Safari)
  - Disable browser extensions (especially privacy/ad blockers)
  - Check if your network has a firewall blocking api-inference.huggingface.co
  - Try on a different network (mobile hotspot, different WiFi)

#### "Ogiltig Hugging Face API-nyckel format"
**Cause**: API key doesn't start with 'hf_'
**Solution**: 
- Regenerate your token at [Hugging Face Settings](https://huggingface.co/settings/tokens)
- Make sure you're using an **Access Token**, not an API endpoint URL

#### Network errors (ERR_NAME_NOT_RESOLVED, ERR_CONNECTION_REFUSED)
**Cause**: DNS or connectivity issue
**Solutions**:
- Check your internet connection
- Try accessing https://huggingface.co in a new tab
- Flush DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (Mac)
- Try using Google DNS (8.8.8.8, 8.8.4.4) or Cloudflare DNS (1.1.1.1)

### 4. Model-Specific Issues

Some models may not be available via the public Inference API or may require additional permissions.

#### Check Model Availability
Visit these URLs directly in your browser:
- Inpainting model: https://huggingface.co/diffusers/stable-diffusion-xl-1.0-inpainting-0.1
- Text-to-image model: https://huggingface.co/stablediffusionapi/omnigenxl-nsfw-sfw

If you see "Model not found" or "Access denied", the model may not be publicly accessible.

#### Alternative Models
If the default models don't work, you can modify the code to use different models:

Edit `/services/huggingFaceService.ts`:

For inpainting (around line 163):
```typescript
// Change from:
const model = 'diffusers/stable-diffusion-xl-1.0-inpainting-0.1';

// To a publicly available model:
const model = 'runwayml/stable-diffusion-inpainting';
```

For text-to-image (around line 365):
```typescript
// Change from:
const model = 'stablediffusionapi/omnigenxl-nsfw-sfw';

// To a publicly available model:
const model = 'runwayml/stable-diffusion-v1-5';
```

### 5. Rate Limiting

Hugging Face Inference API has rate limits. If you're making many requests:

**Symptoms**:
- Status 429 errors in console
- "API-gräns överskriden" error message

**Solutions**:
- Wait a few minutes between requests
- Consider upgrading to Hugging Face Pro for higher limits
- Use Dedicated Inference Endpoints for production use

### 6. Browser-Specific Issues

#### Safari
Safari has stricter CORS policies. Try:
- Settings → Privacy → Disable "Prevent cross-site tracking"
- Settings → Advanced → Disable "Block all cookies"

#### Firefox
- Settings → Privacy & Security → Standard (not Strict)
- Disable Tracking Protection for the app's domain

#### Chrome
- Check for CORS errors in console
- Try in Incognito mode to rule out extensions
- Disable all extensions temporarily

### 7. Network/Firewall Issues

If you're on a corporate, school, or public network:

**Check if Hugging Face is blocked**:
```bash
ping api-inference.huggingface.co
```

or

```bash
curl -I https://api-inference.huggingface.co
```

**Solutions**:
- Contact network administrator to whitelist api-inference.huggingface.co
- Use a VPN
- Try on a different network (mobile hotspot)
- Use the app on your home network

### 8. For Developers: Backend Proxy Solution

If CORS continues to be an issue in production, implement a backend proxy:

**Option A: Cloudflare Workers** (Recommended - Free tier available)
```javascript
// Example Cloudflare Worker
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const hfUrl = 'https://api-inference.huggingface.co' + url.pathname;
    
    const response = await fetch(hfUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body,
    });
    
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    return newResponse;
  }
}
```

**Option B: Vercel Serverless Functions**
Create `/api/hf-proxy.ts`:
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const hfUrl = 'https://api-inference.huggingface.co' + req.url?.replace('/api/hf-proxy', '');
  
  const response = await fetch(hfUrl, {
    method: req.method,
    headers: {
      'Authorization': req.headers.authorization || '',
      'Content-Type': req.headers['content-type'] || '',
    },
    body: req.body,
  });
  
  res.status(response.status).send(await response.blob());
}
```

Then update `huggingFaceService.ts` to use the proxy endpoint.

### 9. Still Having Issues?

If none of the above solutions work:

1. **Collect Debug Information**:
   - Browser console output (with errors)
   - Network tab in DevTools (check if requests are being made)
   - Your operating system and browser version
   - Whether you're using VPN or proxy

2. **Create a GitHub Issue**:
   - Include the debug information above
   - Mention what you've already tried
   - Include any relevant error messages

3. **Alternative: Use Grok-only mode**:
   - The app can work with just xAI Grok API (no Hugging Face needed)
   - Edit `/services/hybridService.ts` to use Grok for image generation instead of Hugging Face
   - Note: This will be more expensive but avoids CORS issues

## Common Error Messages Explained

| Error Message | Likely Cause | Solution |
|--------------|--------------|----------|
| "Failed to fetch" | CORS or network issue | See sections 3 & 6 |
| "Kunde inte ansluta till Hugging Face API" | CORS, network, or invalid key | See sections 1-3 |
| "Ogiltig API-nyckel format" | Wrong API key format | Must start with 'hf_' |
| "API-fel (401)" | Invalid/expired API key | Regenerate at Hugging Face |
| "API-fel (503)" | Model loading | Wait 30-60 seconds and retry |
| "API-fel (429)" | Rate limit exceeded | Wait a few minutes |
| "Modellen laddas" | First request to model | Wait and retry |

## Prevention Tips

1. **Always use Read tokens** (not Write) for better security
2. **Don't share your API keys** publicly or commit them to GitHub
3. **Test in development mode** (`npm run dev`) before deploying
4. **Monitor your usage** at [Hugging Face Billing](https://huggingface.co/settings/billing)
5. **Keep the app updated** to get the latest fixes

## Additional Resources

- [Hugging Face Inference API Documentation](https://huggingface.co/docs/api-inference/)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- [Browser DevTools Guide](https://developer.chrome.com/docs/devtools/)
