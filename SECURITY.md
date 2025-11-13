# Security Considerations

## API Key Storage

### Current Implementation

The application stores xAI API keys in two ways:

1. **Environment Variables** (`.env.local`): For development and server-side deployments
2. **localStorage** (Browser): For user-entered keys via the settings modal

### Security Model

#### Client-Side Storage (localStorage)

**Status**: API keys are stored in **clear text** in browser localStorage.

**Why This Is Acceptable for This Application:**

1. **User-Owned Keys**: Users enter their own API keys, not shared credentials
2. **Client-Side Architecture**: This is a purely client-side application (no backend)
3. **Industry Standard**: Common practice for client-side API integrations:
   - OpenAI Playground stores keys in localStorage
   - Many AI tools use the same approach
   - Standard for browser-based API clients

4. **Transparency**: Users are informed via UI notice:
   - "🔒 Din API-nyckel sparas lokalt i din webbläsare och skickas aldrig till någon annan än xAI."
   - Users understand their keys stay on their device

5. **Direct Communication**: API calls go directly from user's browser to xAI
   - No intermediary server
   - Key never leaves user's control
   - Same security model as using xAI's official web interface

#### Security Boundaries

**What IS Protected:**
- ✅ Keys are stored only in user's browser
- ✅ Keys are never sent to any server except xAI's API
- ✅ Keys are not logged or transmitted elsewhere
- ✅ Users can clear keys at any time
- ✅ Each user manages their own key independently

**What Is NOT Protected:**
- ❌ Keys are not encrypted in localStorage
- ❌ Anyone with physical access to the device can view keys
- ❌ Browser extensions can potentially access localStorage
- ❌ XSS vulnerabilities could expose keys (though none exist currently)

### CodeQL Security Findings

**Finding**: Clear-text storage of sensitive data (API keys)
**Severity**: Warning
**Status**: Acknowledged and documented

**Rationale for Acceptance:**
- Client-side API key storage is the intended design
- Consistent with how similar applications work
- Users have full control and awareness of their keys
- Alternative approaches would require backend infrastructure

### Production Recommendations

For production deployments with higher security requirements:

#### Option 1: Backend Proxy (Recommended for Production)

```typescript
// Instead of calling xAI directly from browser:
const response = await fetch('/api/edit-image', {
  method: 'POST',
  body: JSON.stringify({ image, prompt }),
  headers: { 'Authorization': `Bearer ${userToken}` }
});

// Backend server holds xAI API key:
// - More secure key storage
// - Rate limiting per user
// - Usage tracking
// - Cost control
```

**Benefits:**
- ✅ API key never exposed to client
- ✅ Centralized rate limiting
- ✅ Usage monitoring per user
- ✅ Cost controls and quotas
- ✅ Audit logging

**Trade-offs:**
- ❌ Requires backend infrastructure
- ❌ Additional hosting costs
- ❌ More complex deployment
- ❌ Potential latency increase

#### Option 2: Encrypted Storage

```typescript
// Encrypt before storing
const encryptedKey = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv: iv },
  key,
  data
);
localStorage.setItem('xai_api_key', encryptedKey);
```

**Benefits:**
- ✅ Keys encrypted at rest
- ✅ Protection against casual inspection

**Trade-offs:**
- ❌ Encryption key must be stored somewhere
- ❌ Limited additional security (key in same origin)
- ❌ Complexity increase
- ❌ Performance overhead

#### Option 3: Session-Only Storage

```typescript
// Store in memory only
let sessionApiKey: string | null = null;
// User must re-enter key each session
```

**Benefits:**
- ✅ No persistent storage
- ✅ Keys cleared when browser closes

**Trade-offs:**
- ❌ Poor user experience
- ❌ Re-entry required every session
- ❌ Still vulnerable during session

### Current Best Practice for This Application

**The current implementation is appropriate because:**

1. **Transparent**: Users know where their keys are stored
2. **Standard**: Follows industry patterns for client-side API apps
3. **Controlled**: Users manage their own keys
4. **Simple**: No false sense of security from weak encryption
5. **Documented**: Security model clearly explained

**When to move to backend:**
- Deploying for business/enterprise use
- Need usage tracking and cost controls
- Require audit logs
- Want to prevent key exposure
- Need rate limiting per user

## Other Security Considerations

### HTTPS Required

**Always use HTTPS in production:**
- API keys transmitted in headers
- Prevents man-in-the-middle attacks
- Required by xAI API

### Content Security Policy

Consider adding CSP headers:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; connect-src 'self' https://api.x.ai">
```

### Input Validation

**Current validation:**
- Image file types checked
- Prompt length reasonable
- API responses validated

**Additional recommendations:**
- Sanitize all user inputs
- Validate image dimensions
- Check file sizes
- Rate limit operations

### XSS Prevention

**Current protections:**
- React automatically escapes JSX
- No `dangerouslySetInnerHTML` used
- User inputs properly handled

**Maintain by:**
- Never use `eval()` or similar
- Validate all external data
- Keep dependencies updated

### Dependency Security

**Current status:**
- No known vulnerabilities in dependencies
- OpenAI SDK is official and maintained
- React 19.2.0 is current stable

**Maintenance:**
- Regular `npm audit` checks
- Update dependencies promptly
- Monitor security advisories

## Reporting Security Issues

If you discover a security vulnerability:

1. **DO NOT** open a public issue
2. Email the maintainers privately
3. Provide detailed information:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fixes (if any)

## Summary

The current API key storage approach is:
- ✅ **Appropriate** for client-side application
- ✅ **Transparent** to users
- ✅ **Standard** industry practice
- ✅ **Documented** with clear security model
- ⚠️ **Limited** by client-side architecture

For production deployments requiring higher security, consider implementing a backend proxy to keep API keys server-side.
