# GitHub OAuth Connection Fix - Railway Deployment

## Problem
"Failed to fetch" errors when trying to connect GitHub because frontend had **hardcoded localhost URLs** that don't work on Railway.

## ✅ Fixes Applied

### 1. Frontend Files Fixed (Hardcoded URLs Removed)
- ✅ [frontend/src/components/GitHubRepoSelector.jsx](../frontend/src/components/GitHubRepoSelector.jsx)
- ✅ [frontend/src/pages/GitHubCallbackPage.jsx](../frontend/src/pages/GitHubCallbackPage.jsx)
- ✅ [frontend/src/pages/UploadPage.jsx](../frontend/src/pages/UploadPage.jsx)

**Changed from:**
```javascript
const API_BASE = "http://localhost:8000";
```

**Changed to:**
```javascript
const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
```

### 2. Backend Config Fixed (Dynamic Redirect URI)
- ✅ [backend/app/core/config.py](../backend/app/core/config.py)

Now `GITHUB_REDIRECT_URI` automatically constructs from `FRONTEND_URL` environment variable.

---

## 🚀 Railway Deployment Steps

### Step 1: Set Frontend Environment Variable

In Railway Dashboard → **Frontend Service** → **Variables**:

```bash
VITE_API_BASE_URL=${{Backend.RAILWAY_PUBLIC_URL}}
```

This tells the frontend where to find your backend API.

### Step 2: Set Backend Environment Variables

In Railway Dashboard → **Backend Service** → **Variables**:

```bash
# Frontend URL (for CORS)
FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_URL}}

# GitHub OAuth Credentials
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here

# Git Configuration (for repo cloning)
GIT_TERMINAL_PROMPT=0
GIT_ASKPASS=echo

# LLM Configuration
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### Step 3: Update GitHub OAuth App Settings

Go to your GitHub OAuth App settings (screenshot you showed):

**Homepage URL:**
```
https://fearless-enchantment-production-61db.up.railway.app
```

**Authorization callback URL:**
```
https://fearless-enchantment-production-61db.up.railway.app/auth/callback
```

⚠️ **Important:** Replace with YOUR actual Railway frontend URL!

To find your frontend URL:
- Go to Railway Dashboard
- Click on Frontend service
- Copy the URL shown under "Deployments" (should end with `.railway.app`)

### Step 4: Commit and Push Changes

```powershell
# Stage all changes
git add .

# Commit with message
git commit -m "Fix GitHub OAuth for Railway deployment"

# Push to trigger Railway rebuild
git push
```

### Step 5: Verify Deployment

After Railway rebuilds (2-3 minutes):

1. **Test Backend Health:**
   ```powershell
   curl https://your-backend.railway.app/health
   ```
   Expected: `{"status":"healthy","version":"2.0.0"}`

2. **Test GitHub OAuth Endpoint:**
   ```powershell
   curl https://your-backend.railway.app/github/oauth/login
   ```
   Expected: `{"auth_url":"https://github.com/login/oauth/authorize?..."}`

3. **Test Frontend:**
   - Open your frontend URL in browser
   - Click "Login with GitHub" button
   - Should redirect to GitHub (not show "Failed to fetch")

---

## 🔍 Troubleshooting

### Issue: Still showing "Failed to fetch"

**Check 1: Frontend environment variable**
```bash
# In Railway → Frontend → Variables
# Should have:
VITE_API_BASE_URL=${{Backend.RAILWAY_PUBLIC_URL}}
```

**Check 2: Check browser console**
```javascript
// Open browser DevTools (F12) → Console tab
// Look for errors like:
// ❌ "Failed to fetch" = Wrong API URL
// ❌ "CORS error" = Backend FRONTEND_URL not set correctly
```

**Check 3: Backend logs**
```bash
# In Railway → Backend → Logs
# Should see requests coming in:
INFO: 100.64.0.2:48589 - "GET /github/oauth/login HTTP/1.1" 200 OK
```

### Issue: GitHub OAuth redirects to wrong URL

**Problem:** Callback URL mismatch

**Solution:** 
1. Check Railway frontend URL: `https://your-app.railway.app`
2. Update GitHub OAuth app callback to: `https://your-app.railway.app/auth/callback`
3. Must match EXACTLY (including https://)

### Issue: "GitHub OAuth not configured" error

**Problem:** `GITHUB_CLIENT_ID` not set in Railway

**Solution:**
1. Go to Railway → Backend → Variables
2. Add `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`
3. Get values from: https://github.com/settings/developers

### Issue: CORS errors in browser console

**Problem:** Backend doesn't allow requests from frontend URL

**Solution:**
```bash
# In Railway → Backend → Variables
FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_URL}}
```

Backend automatically adds this to CORS allowed origins.

---

## ✨ Summary of Changes

| File | What Changed | Why |
|------|--------------|-----|
| **GitHubRepoSelector.jsx** | Removed `localhost:8000` | Use Railway backend URL from env var |
| **GitHubCallbackPage.jsx** | Removed `localhost:8000` | Use Railway backend URL from env var |
| **UploadPage.jsx** | Removed `localhost:8000` | Use Railway backend URL from env var |
| **config.py** | Made `GITHUB_REDIRECT_URI` dynamic | Auto-construct from `FRONTEND_URL` |

---

## 📋 Environment Variables Checklist

### Frontend Service ✅
- `VITE_API_BASE_URL=${{Backend.RAILWAY_PUBLIC_URL}}`

### Backend Service ✅
- `FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_URL}}`
- `GITHUB_CLIENT_ID=...`
- `GITHUB_CLIENT_SECRET=...`
- `GEMINI_API_KEY=...`
- `LLM_PROVIDER=gemini`
- `DATABASE_URL=${{Postgres.DATABASE_URL}}`
- `GIT_TERMINAL_PROMPT=0`
- `GIT_ASKPASS=echo`

### GitHub OAuth App ✅
- Homepage URL: `https://your-app.railway.app`
- Callback URL: `https://your-app.railway.app/auth/callback`

---

## 🎯 Expected Result

After applying all fixes and setting environment variables:

1. ✅ Frontend loads without errors
2. ✅ "Login with GitHub" button works
3. ✅ Redirects to GitHub authorization page
4. ✅ After authorization, redirects back to your app
5. ✅ Shows "Connected" with your GitHub username
6. ✅ Can browse and select your repositories

---

## Need More Help?

- Check Railway logs: Dashboard → Service → Deploy Logs / Runtime Logs
- Check browser console: F12 → Console tab
- Test endpoints manually with `curl` commands above
- Verify all environment variables are set correctly

