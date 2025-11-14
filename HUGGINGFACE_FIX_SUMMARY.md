# Hugging Face API Fix - Content Type Error

## Problem
The Hugging Face Inference API was returning a 400 error rejecting requests with multipart/form-data:
```
Content type "multipart/form-data; boundary=..." not supported.
Supported content types are: application/json, image/png, image/jpeg...
```

## Root Cause
The code was using FormData to send requests, which creates multipart/form-data format. However, the Hugging Face Inference API for inpainting expects JSON with base64-encoded image strings.

### Before (Incorrect)
```javascript
// Sending binary data as FormData (WRONG)
const imageBlob = base64ToBlob(processedImageData, processedMimeType);
const maskBlob = base64ToBlob(processedMaskData, 'image/png');

const formData = new FormData();
formData.append('image', imageBlob, 'image.png');
formData.append('mask', maskBlob, 'mask.png');
formData.append('prompt', prompt);

fetch(apiUrl, {
  headers: {
    'Authorization': `Bearer ${apiKey}`
    // No Content-Type - browser sets it automatically with multipart boundary
  },
  body: formData
});
```

### After (Correct)
```javascript
// Sending JSON with base64-encoded images (CORRECT)
const payload = {
  inputs: prompt,
  image: processedImageData,      // base64 string
  mask_image: processedMaskData   // base64 string
};

fetch(apiUrl, {
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

## Why This Matters
The Hugging Face Inference API for image inpainting models (like `stable-diffusion-inpainting`) expects:
- **JSON format** with `Content-Type: application/json`
- **Base64-encoded image strings** for `image` and `mask_image` fields
- **Prompt** in the `inputs` field

Using multipart/form-data results in a 400 error with the message "Content type not supported".

## Changes Made

### 1. Fixed `inpaintImage` Function
**File**: `services/huggingFaceService.ts`

- Changed from FormData to JSON payload
- Set `Content-Type: application/json` header
- Use correct field names: `inputs`, `image`, `mask_image`
- Send base64 strings directly (not Blob objects)
- Removed unused `base64ToBlob` helper function

### 2. Validation
The existing validation remains in place:
```javascript
if (resultBlob.size === 0) {
  console.error('[inpaintImage] Received empty blob (0 bytes)');
  throw new Error('Hugging Face API returnerade en tom bild...');
}
```

This catches empty responses and provides a clear error message.

### 3. Enhanced Logging
Updated logging to show base64 data lengths instead of blob sizes:
- Input data lengths before sending
- Response blob size and type
- API URL and key presence

## Impact

### Functions Fixed
All image editing functions that use Hugging Face API are now fixed:

1. ✅ **inpaintImage** - Direct fix
2. ✅ **outpaintImage** - Calls `inpaintImage`, so automatically fixed
3. ✅ **editImageWithPromptHF** - Calls `inpaintImage`, so automatically fixed
4. ✅ **generateImageFromText** - Already correct (text-to-image uses JSON), added validation
5. ✅ **createImageFromMultiple** - Calls `generateImageFromText`, so benefits from validation

### Features Now Working
- 🎨 Image inpainting (selective edits with masks)
- 📐 Image outpainting/expansion
- ✏️ Edit image with AI prompt
- 🖼️ Background removal (uses inpainting)
- 🎭 Multi-image fusion (uses text-to-image)

## Testing

### Manual Testing Steps
1. **Setup**:
   ```bash
   npm install
   npm run dev
   ```

2. **Set API Key**:
   - Open the app in browser
   - Click settings (⚙️) icon
   - Enter your Hugging Face API key (starts with `hf_`)
   - Save settings

3. **Test Inpainting**:
   - Upload an image
   - Select an area with crop tool
   - Enter a prompt like "make it blue"
   - Click "Inpaint" or "Edit Image"
   - **Expected**: Generated image with changes, NOT blank/0 bytes

4. **Check Console Logs**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for logs like:
     ```
     [inpaintImage] Image data length: 245678 chars
     [inpaintImage] Mask data length: 12345 chars
     [inpaintImage] Result blob size: 456789 bytes
     [inpaintImage] Result blob type: image/png
     ```
   - **Important**: Result blob size should be > 0

### What to Look For
✅ **Success Signs**:
- Blob sizes > 0 in console logs
- Images display correctly
- No blank/empty images
- Error messages are clear if something fails

❌ **Failure Signs**:
- Result blob size: 0 bytes (would trigger validation error now)
- Blank white/black images
- CORS errors (different issue, see TROUBLESHOOTING.md)

## Technical Notes

### Why JSON Format?
The Hugging Face Inference API uses different input formats for different model types:

| Model Type | Input Format | Field Names |
|------------|--------------|-------------|
| Text-to-Image | JSON | `{ inputs: "a cat" }` |
| Image-to-Image | JSON | `{ inputs: "prompt", image: "base64..." }` |
| Inpainting | JSON | `{ inputs: "prompt", image: "base64...", mask_image: "base64..." }` |

**Important:** The API expects `application/json` with base64-encoded strings, NOT `multipart/form-data` with binary data.

### Field Names
- `inputs`: The prompt/description
- `image`: Base64-encoded original image
- `mask_image`: Base64-encoded mask (white = inpaint, black = preserve)

Note: Use `mask_image` (with underscore), not just `mask`.

### Browser Compatibility
JSON.stringify and fetch API are supported in all modern browsers:
- Chrome/Edge: ✅
- Firefox: ✅
- Safari: ✅
- Mobile browsers: ✅

### Content-Type Header
Must be explicitly set to `application/json`:
```javascript
headers: {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
}
```

**Do NOT** use FormData as it automatically sets `Content-Type: multipart/form-data` which is not supported by the API.

## Related Documentation
- [Hugging Face Inference API](https://huggingface.co/docs/api-inference/)
- [MDN FormData](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - For other API issues

## Security
- ✅ CodeQL analysis: 0 alerts
- ✅ No credentials exposed
- ✅ No new vulnerabilities introduced
- ✅ API keys still securely stored in localStorage

## Next Steps
If you encounter issues after this fix:
1. Check browser console for error messages
2. Verify API key is valid and starts with `hf_`
3. Check blob sizes in console logs
4. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
5. Report issue with console logs included
