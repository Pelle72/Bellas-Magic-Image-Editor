# Testing Guide for Grok API Integration

## Overview
This guide provides step-by-step instructions for testing the new Grok API integration.

## Prerequisites

### 1. Get an xAI API Key
1. Visit [https://console.x.ai/](https://console.x.ai/)
2. Sign up or log in with your X (Twitter) account
3. Navigate to the "API Keys" section
4. Click "Create new API key"
5. Copy the key (it will only be shown once!)

### 2. Configure Environment
Create a `.env.local` file in the project root:
```bash
XAI_API_KEY=xai-your-actual-api-key-here
```

**Important**: The key should start with `xai-` prefix.

### 3. Install and Run
```bash
npm install
npm run dev
```

The app should start at `http://localhost:3000`

## Test Scenarios

### ✅ Test 1: Basic Image Edit
**Purpose**: Verify basic image editing functionality

**Steps**:
1. Upload any image (landscape, portrait, or square)
2. In the prompt box, type: `change background to sunset beach`
3. Click "Redigera bild" (Edit Image)
4. Wait 10-20 seconds

**Expected Result**:
- Loading indicator appears with "Översätter instruktion..." then "Applicerar magi..."
- New image generated with a beach sunset background
- Original subject remains intact
- Image is added to edit history (can undo)

**Pass Criteria**: ✅ New image generated successfully without errors

---

### ✅ Test 2: Fashion/Swimwear Content (CRITICAL)
**Purpose**: Verify that Grok's permissive policy works for fashion content

**Steps**:
1. Upload an image of fashion/swimwear/lingerie (or any professional modeling photo)
2. Type prompt: `enhance the lighting and make colors more vibrant`
3. Click "Redigera bild"

**Expected Result**:
- Should process WITHOUT content policy blocks
- Enhanced image with better lighting/colors
- No Swedish error messages about safety filters

**Pass Criteria**: ✅ Image processes successfully (unlike Gemini which would block)

**If it fails**: Check error message - if it mentions safety/content blocks, this indicates a Grok API configuration issue

---

### ✅ Test 3: Background Removal
**Purpose**: Test AI background removal feature

**Steps**:
1. Upload an image with a clear subject (person, object, etc.)
2. Click "Ta bort bakgrund" (Remove Background)
3. Wait 5-15 seconds

**Expected Result**:
- Loading message: "Tar bort bakgrund med AI..."
- Subject remains intact
- Background becomes transparent (checkerboard pattern visible)
- Output is PNG format

**Pass Criteria**: ✅ Clean background removal with transparent PNG

---

### ✅ Test 4: Image Enhancement
**Purpose**: Test upscaling and quality improvement

**Steps**:
1. Upload a lower quality or smaller image
2. Click "Förbättra" (Enhance)
3. Wait 10-20 seconds

**Expected Result**:
- Loading message: "Förbättrar och skalar upp bilden..."
- Image appears sharper and clearer
- Better color balance and lighting
- Higher perceived quality

**Pass Criteria**: ✅ Noticeable quality improvement

---

### ✅ Test 5: Image Expansion (Outpainting)
**Purpose**: Test AI outpainting to extend image borders

**Steps**:
1. Upload any image
2. Click "Expandera" (Expand)
3. Select an aspect ratio (e.g., "16:9")
4. Click "Expandera" in the modal
5. Wait 15-30 seconds (this is a complex operation)

**Expected Result**:
- Loading messages:
  - "Analyserar bildens innehåll..."
  - "Förbereder expansion till 16:9..."
  - "AI expanderar bilden till 16:9..."
- Image extended to new aspect ratio
- New content seamlessly blends with original
- No visible borders or seams

**Pass Criteria**: ✅ Image expanded with natural-looking extension

---

### ✅ Test 6: Prompt Generation
**Purpose**: Test AI's ability to describe images

**Steps**:
1. Upload any image
2. Click "Föreslå" (Suggest) button
3. Wait 3-5 seconds

**Expected Result**:
- Loading message: "Analyserar bild..."
- Prompt box fills with detailed English description
- Description includes: artistic style, subject, lighting, color palette
- Description is accurate and detailed

**Pass Criteria**: ✅ Accurate, detailed description generated

---

### ✅ Test 7: Multiple Images (Session Management)
**Purpose**: Test working with multiple images simultaneously

**Steps**:
1. Upload 3 different images
2. Click through thumbnails to switch between images
3. Make edits to each image
4. Use undo/redo on different images
5. Delete one image

**Expected Result**:
- All 3 images appear as thumbnails
- Active image has blue ring around thumbnail
- Edit history is separate for each image
- Undo/redo works per image
- Delete removes image and switches to another

**Pass Criteria**: ✅ Clean multi-image session management

---

### ✅ Test 8: Crop and Zoom
**Purpose**: Test non-AI image manipulation tools

**Steps**:
1. Upload an image
2. Click "Zooma" (Zoom), select area, click "Zooma in"
3. Click "Nollställ vy" (Reset View) to reset
4. Click "Beskär" (Crop), select area, click "Beskär bild"

**Expected Result**:
- Zoom: View zooms to selected area (no new image)
- Reset: Returns to full image view
- Crop: Creates new cropped image in history

**Pass Criteria**: ✅ Zoom and crop work correctly

---

### ✅ Test 9: Download and Share
**Purpose**: Test exporting edited images

**Steps**:
1. Make some edits to an image
2. Click "Ladda ner" (Download)
3. If on mobile, click "Dela" (Share)

**Expected Result**:
- Download: Image saves to computer with `edited_` prefix
- Share (mobile): Native share dialog appears
- Image format is PNG

**Pass Criteria**: ✅ Image exports successfully

---

### ✅ Test 10: Error Handling
**Purpose**: Test graceful error handling

**Steps**:
1. Try editing with empty prompt (should show error)
2. Try editing without uploading image (should show error)
3. Try with invalid API key (if possible - set wrong key in .env.local)

**Expected Result**:
- Clear Swedish error messages
- Red error banner at top of image viewer
- "Stäng" (Close) button to dismiss
- App remains functional after error

**Pass Criteria**: ✅ Errors handled gracefully with clear messages

---

## Performance Benchmarks

| Operation | Expected Time | Grok Performance |
|-----------|--------------|------------------|
| Image Analysis | 2-5 seconds | ⏱️ Test and record |
| Image Generation | 5-15 seconds | ⏱️ Test and record |
| Translation | 1-2 seconds | ⏱️ Test and record |
| Background Removal | 5-15 seconds | ⏱️ Test and record |
| Image Enhancement | 10-20 seconds | ⏱️ Test and record |
| Image Expansion | 15-30 seconds | ⏱️ Test and record |

## Cost Tracking

Track your API usage at: [https://console.x.ai/usage](https://console.x.ai/usage)

Estimated costs per operation (approximate):
- Simple edit: $0.01-$0.03
- Complex edit: $0.03-$0.05
- Enhancement: $0.02-$0.04
- Expansion: $0.04-$0.08

Compare to previous Gemini costs (roughly 10-20x higher).

## Common Issues & Solutions

### Issue: "API_KEY environment variable not set"
**Solution**: 
- Ensure `.env.local` exists in project root
- Check that it contains: `XAI_API_KEY=your_key_here`
- Restart the dev server (`Ctrl+C` then `npm run dev`)

### Issue: "401 Unauthorized" error
**Solution**:
- API key is invalid or expired
- Get a new key from [https://console.x.ai/](https://console.x.ai/)
- Update `.env.local`
- Restart dev server

### Issue: "Rate limit exceeded"
**Solution**:
- You've hit xAI's rate limits
- Wait a few minutes
- Consider upgrading your xAI account tier

### Issue: Image generation takes very long
**Solution**:
- Complex operations (expansion, multi-image) can take 20-30 seconds
- Check your internet connection
- Check xAI service status
- If consistently slow, report to xAI support

### Issue: Content still being blocked
**Solution**:
- Verify you're using Grok API (check network tab, should see `api.x.ai`)
- Try rephrasing prompt to be more descriptive
- Check that `style: "spicy"` parameter is being sent
- Report specific cases for prompt engineering improvements

## Success Criteria Summary

For the migration to be considered successful, ALL of the following must pass:

- ✅ All 10 test scenarios complete without critical errors
- ✅ Fashion/swimwear content processes without blocks (Test 2)
- ✅ Image quality is comparable or better than Gemini
- ✅ Response times are acceptable (within benchmarks)
- ✅ No security vulnerabilities (CodeQL passed ✅)
- ✅ Build completes without errors (npm run build ✅)
- ✅ Cost per operation is 80%+ lower than Gemini

## Reporting Issues

If you encounter problems:

1. **Check console**: Open browser DevTools (F12), check Console tab for errors
2. **Check network**: In DevTools Network tab, filter for `x.ai` to see API calls
3. **Capture details**:
   - Error message (Swedish and technical)
   - Operation being performed
   - Browser and OS
   - Screenshot of issue
4. **Create issue** with all above details

## Next Steps After Testing

Once testing is complete and successful:

1. Document any issues found
2. Verify cost savings in xAI console
3. Consider optimizations (caching, batch operations)
4. Plan production deployment
5. Set up monitoring and alerts
6. Train users on new features/limitations

## Resources

- **xAI Console**: [https://console.x.ai/](https://console.x.ai/)
- **xAI Docs**: [https://docs.x.ai/](https://docs.x.ai/)
- **Migration Guide**: See `MIGRATION.md` for detailed technical information
- **README**: See `README.md` for setup and feature overview
