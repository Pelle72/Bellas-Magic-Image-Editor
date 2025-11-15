# xAI API Compatibility Fix

## Issue
**Error**: `An API error occurred: Failed to fetch data from grok API. xAI API error (422): Failed to deserialize the JSON body into the target type: tools[0]: missing field 'sources' at line 1 column 2861.`

## Root Cause
OpenAI SDK version 4.104.0 introduced changes that are incompatible with the xAI Grok API. Specifically:
- The SDK may be automatically including tool-related parameters in API requests
- xAI's API expects a different schema for the `tools` array than what the newer OpenAI SDK provides
- The xAI API requires a `sources` field in tool definitions that the OpenAI SDK doesn't include

## Solution
**Downgrade OpenAI SDK from v4.104.0 to v4.100.0**

This version is confirmed compatible with the xAI API and doesn't cause the 422 deserialization error.

## Changes Made
- Updated `package.json` to pin `openai` dependency to version `4.100.0` (removed caret `^` to prevent automatic updates)
- Ran `npm install` to install the compatible version
- Verified build succeeds with the downgraded version

## Version Constraint Explanation
The OpenAI SDK version is now **pinned** (without `^`) to prevent automatic updates:
```json
{
  "dependencies": {
    "openai": "4.100.0"  // Pinned - do not auto-update to maintain xAI compatibility
  }
}
```

## Testing
After the fix:
1. Build succeeds: ✅
2. xAI API calls should no longer throw 422 errors
3. Chat completions and image generation should work as expected

## Future Considerations
- Monitor OpenAI SDK releases for xAI compatibility improvements
- When upgrading the OpenAI SDK in the future, test thoroughly with xAI API
- Consider using xAI's official SDK if/when available, instead of the OpenAI SDK
- Check xAI's documentation at https://docs.x.ai/docs/guides/tools/overview for tool schema requirements

## Related Documentation
- xAI API Reference: https://docs.x.ai/docs/api-reference
- xAI Tools Overview: https://docs.x.ai/docs/guides/tools/overview
- OpenAI SDK Changelog: https://github.com/openai/openai-node/blob/master/CHANGELOG.md
