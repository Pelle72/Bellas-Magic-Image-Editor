# Why 30+ Copilot Agents Failed to Fix This Issue

## The Problem
Agents kept switching back and forth between two approaches, neither of which worked:
1. **FormData** (multipart/form-data) - Got error "Content type not supported"
2. **JSON with `inputs` field** - Wrong structure, API didn't understand it

## The Real Issue
**The field name was wrong!** The inpainting API expects `prompt`, not `inputs`.

## The Cycle of Failure

### Phase 1: FormData Attempts (Agents 1-10)
```javascript
// What they tried:
const formData = new FormData();
formData.append('image', imageBlob);
formData.append('mask', maskBlob);
formData.append('prompt', prompt);

fetch(apiUrl, { body: formData });
```

**Error:** `Content type "multipart/form-data" not supported`

**Why it failed:** The Hugging Face Inference API for inpainting doesn't accept multipart/form-data, only JSON.

### Phase 2: JSON with Wrong Field (Agents 11-20)
```javascript
// What they tried:
const payload = {
  inputs: prompt,              // ❌ WRONG FIELD NAME
  image: base64ImageData,
  mask_image: base64MaskData
};

fetch(apiUrl, {
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

**Error:** API doesn't recognize this structure, returns errors

**Why it failed:** Inpainting uses `prompt` field, not `inputs`. The `inputs` field is for text-to-image generation.

### Phase 3: Back to FormData (Agents 21-30)
Seeing that JSON didn't work, agents switched back to FormData, encountering the same multipart error again.

**Result:** Endless loop between two wrong approaches!

## The Correct Solution
```javascript
// ✅ CORRECT:
const payload = {
  prompt: prompt,              // ✅ Use "prompt" for inpainting
  image: base64ImageData,
  mask_image: base64MaskData
};

fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

## Why Did This Happen?

### 1. Misleading Examples
Agents looked at text-to-image examples which use:
```javascript
{ inputs: "a photo of a cat" }
```

They assumed inpainting would use the same field name.

### 2. Inconsistent API Design
Hugging Face uses different field names for different tasks:
- **Text-to-Image:** `inputs`
- **Inpainting:** `prompt`
- **Image-to-Image:** varies by model

### 3. Error Messages Weren't Clear
- FormData error said "content type not supported" but didn't explain what IS supported
- JSON errors didn't clearly state "wrong field name, use 'prompt' not 'inputs'"

### 4. Agents Copying Each Other
Each agent read previous attempts and documentation, but nobody went back to the **official model card** which shows the correct format.

### 5. No Integration Tests
Without actual API tests, agents couldn't verify their changes worked before committing.

## The Source of Truth

The **official documentation** for `runwayml/stable-diffusion-inpainting` shows:

```python
# From official Hugging Face documentation
data = {
    "prompt": "Face of a yellow cat, high resolution, sitting on a park bench",
    "image": encode_image("your_image.png"),
    "mask_image": encode_image("your_mask.png")
}
```

Reference: https://huggingface.co/runwayml/stable-diffusion-inpainting

## Lessons Learned

### For Future Agents
1. **Always check the official model card** on Hugging Face
2. **Look for working code examples** in official documentation, not just tutorials
3. **Understand the difference** between text-to-image and inpainting APIs
4. **Don't assume** field names are consistent across different model types
5. **Test with the actual API** when possible before committing

### Key Differences to Remember

| Task | API Endpoint | Request Format | Prompt Field |
|------|-------------|----------------|--------------|
| Text-to-Image | `/models/stabilityai/stable-diffusion-...` | JSON | `inputs` |
| **Inpainting** | `/models/runwayml/stable-diffusion-inpainting` | **JSON** | **`prompt`** |
| Image-to-Image | varies | JSON | varies |

### The Critical Fields for Inpainting
```javascript
{
  prompt: "text description",        // ✅ NOT "inputs"
  image: "base64 of original",       // ✅ Original image
  mask_image: "base64 of mask"       // ✅ NOT just "mask"
}
```

## How to Verify This Fix

### Test Payload
```javascript
const testPayload = {
  prompt: "a beautiful sunset over mountains",
  image: "<valid base64 image data>",
  mask_image: "<valid base64 mask data>"
};
```

### Expected Response
- HTTP 200 OK
- Response body contains binary image data (PNG)
- No errors about unsupported content type
- No errors about unrecognized fields

### If You Get Errors
- **400 "multipart/form-data not supported"** → You're using FormData, switch to JSON
- **400 "unrecognized field"** → Check field names: use `prompt`, `image`, `mask_image`
- **401** → Invalid API key
- **503** → Model loading, wait and retry

## Conclusion

**The fix was simple:** Change one field name from `inputs` to `prompt`.

**Why it took 30+ agents:** They were stuck in a loop between two wrong approaches, neither of which addressed the actual issue.

**The solution:** Go back to official documentation and verify the exact field names expected by the specific model you're using.
