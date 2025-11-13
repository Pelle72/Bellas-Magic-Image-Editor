# Deployment Guide

## GitHub Pages Deployment

Yes! This app can be deployed to GitHub Pages for free hosting.

### Prerequisites

- GitHub repository for this project
- Push access to the repository
- GitHub Pages enabled for your repository

### Automatic Deployment (Recommended)

The repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages on every push to the `main` branch.

#### Setup Steps:

1. **Enable GitHub Pages in your repository:**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages**
   - Under "Source", select **GitHub Actions**
   - Save the settings

2. **Push to main branch:**
   ```bash
   git push origin main
   ```

3. **Access your deployed app:**
   - After the workflow completes (2-3 minutes)
   - Visit: `https://[your-username].github.io/Bellas-Magic-Image-Editor/`
   - Replace `[your-username]` with your GitHub username

#### Monitor Deployment:

- Go to **Actions** tab in your repository
- Click on the latest "Deploy to GitHub Pages" workflow
- Watch the build and deployment progress
- Get the live URL from the deployment step

### Manual Deployment

If you prefer manual deployment:

1. **Build the app:**
   ```bash
   npm run build
   ```

2. **Install gh-pages package:**
   ```bash
   npm install --save-dev gh-pages
   ```

3. **Add deploy script to package.json:**
   ```json
   "scripts": {
     "deploy": "gh-pages -d dist"
   }
   ```

4. **Deploy:**
   ```bash
   npm run deploy
   ```

### Important Configuration

The `vite.config.ts` file is already configured with the correct base path:

```typescript
base: mode === 'production' ? '/Bellas-Magic-Image-Editor/' : '/',
```

**If your repository name is different**, update this line to match your repo name.

### API Key Management on GitHub Pages

Since this is a static site, you have two options:

#### Option 1: User-Entered Keys (Recommended)
- Users enter their own xAI API keys via the settings modal
- Keys stored in browser localStorage
- **This is already implemented** ✅
- No special configuration needed

#### Option 2: Single Shared Key (Not Recommended)
- Build-time environment variable injection
- Security risk: key visible in client code
- Cost risk: shared usage limits
- **Not recommended for public deployments**

### Post-Deployment

After deployment:

1. **Visit your live site:**
   ```
   https://[your-username].github.io/Bellas-Magic-Image-Editor/
   ```

2. **Test the app:**
   - Age gate should work
   - Settings modal should open
   - Enter your xAI API key
   - Upload and edit images

3. **Share the URL:**
   - Users can access your deployed app
   - Each user manages their own API key
   - No server costs for you

### Updating the Deployment

**With automatic deployment:**
- Simply push to main branch
- GitHub Actions rebuilds and redeploys automatically

**With manual deployment:**
- Run `npm run build`
- Run `npm run deploy`

### Troubleshooting

#### 404 Error on GitHub Pages
**Problem:** Page shows 404 after deployment

**Solutions:**
1. Check GitHub Pages is enabled (Settings → Pages)
2. Verify base path in `vite.config.ts` matches repo name
3. Wait 5-10 minutes after first deployment
4. Check Actions tab for deployment errors

#### API Key Not Persisting
**Problem:** API key clears after page reload

**Solutions:**
1. Check browser allows localStorage
2. Ensure HTTPS is used (required by GitHub Pages)
3. Clear browser cache and re-enter key

#### Assets Not Loading
**Problem:** CSS/JS files return 404

**Solutions:**
1. Verify `base` path in `vite.config.ts`
2. Should be: `/[your-repo-name]/`
3. Rebuild after changing config

#### Service Worker Issues
**Problem:** App doesn't update after redeployment

**Solutions:**
1. Clear browser cache
2. Hard reload (Ctrl+Shift+R / Cmd+Shift+R)
3. Update service worker in `sw.js` if needed

### Performance on GitHub Pages

**Expected Performance:**
- ✅ Fast static file serving
- ✅ Global CDN distribution
- ✅ HTTPS by default
- ✅ Free hosting

**Limitations:**
- ⚠️ 100 GB/month soft bandwidth limit
- ⚠️ 10 builds per hour
- ⚠️ Public repositories only (free tier)
- ⚠️ No server-side processing

### Alternative Hosting Options

If GitHub Pages doesn't meet your needs:

#### Vercel
```bash
npm install -g vercel
vercel
```
- ✅ Automatic deployments
- ✅ Custom domains
- ✅ Faster builds
- ✅ Better analytics

#### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```
- ✅ Easy setup
- ✅ Form handling
- ✅ Split testing
- ✅ Serverless functions

#### Cloudflare Pages
- ✅ Unlimited bandwidth
- ✅ Fast global CDN
- ✅ Workers integration
- ✅ Analytics included

#### Self-Hosted
```bash
npm run build
# Copy dist/ folder to your web server
```
- ✅ Full control
- ✅ No limits
- ⚠️ Requires server management
- ⚠️ HTTPS certificate needed

### Custom Domain

To use a custom domain with GitHub Pages:

1. **Add CNAME file:**
   ```bash
   echo "yourdomain.com" > dist/CNAME
   ```

2. **Configure DNS:**
   - Add A records pointing to GitHub Pages IPs:
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`
   - Or CNAME record: `[username].github.io`

3. **Update GitHub Settings:**
   - Settings → Pages → Custom domain
   - Enter your domain
   - Enable HTTPS

### Security Considerations for Public Deployment

When deploying publicly:

1. **API Keys:** Users manage their own keys (✅ already implemented)
2. **HTTPS:** Enforced by GitHub Pages (✅ automatic)
3. **CSP:** Consider adding security headers (see SECURITY.md)
4. **Rate Limiting:** xAI handles this on API side
5. **Updates:** Keep dependencies updated

### Cost Analysis

**GitHub Pages Hosting:**
- ✅ **FREE** for public repositories
- ✅ **FREE** bandwidth up to 100 GB/month
- ✅ **FREE** builds (10/hour limit)

**xAI API Usage:**
- 💰 Users pay for their own API usage
- 💰 Each user gets their own xAI account
- 💰 No shared cost pool
- ✅ You pay nothing for hosting

**Total Cost to You:**
- 🎉 **$0/month** for hosting
- 🎉 **$0** for user API usage
- 🎉 **$0** for maintenance

### Monitoring

**GitHub Actions:**
- View deployment logs in Actions tab
- Get notified of build failures
- Track deployment history

**Analytics Options:**
1. **Google Analytics** - Add tracking script
2. **Plausible** - Privacy-focused analytics
3. **GitHub Insights** - Basic traffic stats
4. **Cloudflare Analytics** - If using Cloudflare

### Best Practices

1. **Test locally before pushing:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Use branch protection:**
   - Require PR reviews before merging to main
   - Enable required status checks

3. **Version tagging:**
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **Keep dependencies updated:**
   ```bash
   npm audit
   npm update
   ```

5. **Monitor deployments:**
   - Check Actions tab regularly
   - Set up GitHub notifications

### FAQ

**Q: Can I deploy to a subdirectory?**
A: Yes, update `base` in `vite.config.ts` to your subdirectory path.

**Q: How long does deployment take?**
A: 2-3 minutes with GitHub Actions, 30 seconds with manual deploy.

**Q: Can I deploy from a different branch?**
A: Yes, change `branches: [ main ]` in `.github/workflows/deploy.yml`.

**Q: Is the API key secure on GitHub Pages?**
A: Yes, keys are stored locally in each user's browser. See SECURITY.md.

**Q: Can I use environment variables?**
A: Only at build time. Runtime variables aren't supported for static sites.

**Q: What about the .env.local file?**
A: Not needed for deployment. Users enter keys in the UI.

## Summary

✅ **GitHub Pages deployment is fully supported**
✅ **Automatic deployment is configured**
✅ **No hosting costs**
✅ **Users manage their own API keys**
✅ **Simple setup: just enable GitHub Pages**

Your app will be live at:
```
https://[your-username].github.io/Bellas-Magic-Image-Editor/
```

Just enable GitHub Pages in repository settings and push to main!
