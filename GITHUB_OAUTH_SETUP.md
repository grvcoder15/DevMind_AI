# 🔐 GitHub OAuth Setup Guide

DevMind AI uses GitHub OAuth to let you seamlessly browse and select your repositories without manually creating access tokens.

---

## 🎯 What You Get

✅ **One-Click Login** - No need to create or copy tokens  
✅ **Secure Authentication** - OAuth 2.0 standard flow  
✅ **Auto Repository Access** - Browse all your repos instantly  
✅ **Better UX** - Authorize once, use forever  

---

## 📋 Setup Instructions (5 minutes)

### **Step 1: Create GitHub OAuth App**

1. **Go to GitHub Developer Settings:**
   - Visit: https://github.com/settings/developers
   - Click **"OAuth Apps"** → **"New OAuth App"**

2. **Fill in the form:**
   ```
   Application name: DevMind AI
   Homepage URL: http://localhost:5173
   Authorization callback URL: http://localhost:5173/auth/callback
   ```
   ⚠️ **The callback URL must be EXACTLY**: `http://localhost:5173/auth/callback`

3. **Register the Application:**
   - Click **"Register application"**
   - You'll see your **Client ID** - copy it!
   - Click **"Generate a new client secret"** - copy it NOW (won't show again!)

### **Step 2: Configure DevMind AI**

1. **Open** `backend/.env` file

2. **Add your credentials:**
   ```env
   # GitHub OAuth Configuration
   GITHUB_CLIENT_ID=Iv1.abc123def456      # Paste your Client ID here
   GITHUB_CLIENT_SECRET=ghp_xxxxxxxxxxxxx  # Paste your Client Secret here
   GITHUB_REDIRECT_URI=http://localhost:5173/auth/callback
   ```

3. **Save the file**

### **Step 3: Restart Backend Server**

```powershell
# Stop the current backend (Ctrl+C if running)

# Navigate to backend folder
cd backend

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Start server
uvicorn main:app --reload --port 8000
```

You should see: `INFO: Application startup complete.`

---

## ✨ How to Use

1. **Open DevMind AI**: http://localhost:5173

2. **Click "📁 Choose"** button

3. **Click "Login with GitHub"** (big button with GitHub icon)

4. **Authorize on GitHub** (first time only):
   - You'll be redirected to GitHub
   - Click **"Authorize [your OAuth app name]"**
   - You'll be redirected back to DevMind AI

5. **Your repositories appear!**
   - All your public and private repos
   - Search bar to filter
   - Shows language, stars, description
   - Click any repo to select it

6. **Click "Analyze →"** to start analysis

---

## 🔒 Security & Privacy

✅ **OAuth 2.0 Standard** - Industry-standard secure authentication  
✅ **No Password Sharing** - We never see your GitHub password  
✅ **Revocable Access** - You can revoke access anytime from GitHub settings  
✅ **Client Secret Secured** - Stored server-side only, never exposed to browser  
✅ **Local Storage** - Access tokens stored in your browser localStorage  

**To revoke access later:**
1. Go to https://github.com/settings/applications
2. Find "DevMind AI"
3. Click "Revoke"

---

## 🚨 Troubleshooting

### **Error: "GitHub OAuth not configured"**

**Fix:** Make sure `GITHUB_CLIENT_ID` is set in `backend/.env` and restart backend server.

```powershell
# Check .env file has:
GITHUB_CLIENT_ID=Iv1.abc123...
GITHUB_CLIENT_SECRET=ghp_...

# Then restart server
cd backend
.\venv\Scripts\Activate.ps1
uvicorn main:app --reload --port 8000
```

---

### **Error: "redirect_uri_mismatch"**

**Fix:** Callback URL in GitHub OAuth App must EXACTLY match:

```
http://localhost:5173/auth/callback
```

Check for:
- ❌ `https://` (should be `http://` for local dev)
- ❌ Trailing slash `/auth/callback/`
- ❌ Wrong port `:3000` instead of `:5173`
- ❌ Extra path segments

**How to fix:**
1. Go to https://github.com/settings/developers
2. Click on your OAuth App
3. Update "Authorization callback URL"
4. Click "Update application"

---

### **Error: "Failed to authenticate with GitHub"**

**Possible causes:**
- Backend server not running on port 8000
- Client Secret incorrect in `.env`
- Network/firewall blocking GitHub API

**Fix:**
1. Verify backend is running: http://localhost:8000/docs
2. Check `.env` credentials are correct
3. Try regenerating Client Secret on GitHub

---

### **Repositories not showing**

**Fix:**
1. Open browser DevTools (F12) → Console tab
2. Look for error messages
3. Common fixes:
   - Clear localStorage: `localStorage.clear()`
   - Refresh page
   - Try logging in again

---

## 🛠️ Technical Details

### **OAuth Flow**

1. User clicks "Login with GitHub"
2. Frontend calls: `GET /github/oauth/login`
3. Backend returns GitHub authorization URL
4. Frontend redirects to GitHub authorization page
5. User authorizes "DevMind AI" app
6. GitHub redirects back: `http://localhost:5173/auth/callback?code=ABC123`
7. Frontend calls: `POST /github/oauth/callback` with code
8. Backend exchanges code for access_token via GitHub API
9. Backend returns: `{access_token, user: {...}}`
10. Frontend stores token in localStorage
11. Frontend fetches repos: `GET /github/repos?access_token=...`

### **API Endpoints**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/github/oauth/login` | GET | Returns GitHub authorization URL |
| `/github/oauth/callback` | POST | Exchanges code for access token |
| `/github/repos` | GET | Fetches user's repositories |
| `/github/user` | GET | Fetches user info |

### **Files Modified**

**Backend:**
- `backend/app/api/v1/github.py` - OAuth & GitHub API integration
- `backend/app/core/config.py` - OAuth configuration
- `backend/.env` - OAuth credentials
- `backend/main.py` - GitHub router registration

**Frontend:**
- `frontend/src/components/GitHubRepoSelector.jsx` - Repository modal
- `frontend/src/pages/UploadPage.jsx` - OAuth callback handler

---

## 📚 Additional Resources

- [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [GitHub REST API](https://docs.github.com/en/rest)

---

## ✅ Verification Checklist

Before using the integration, verify:

- [ ] GitHub OAuth App created
- [ ] Client ID copied to `.env`
- [ ] Client Secret copied to `.env`
- [ ] Callback URL is exactly: `http://localhost:5173/auth/callback`
- [ ] Backend server restarted
- [ ] Backend accessible at http://localhost:8000/docs
- [ ] Frontend accessible at http://localhost:5173
- [ ] "📁 Choose" button visible on home page

---

🎉 **You're all set!** Enjoy seamless GitHub repository browsing with DevMind AI.
