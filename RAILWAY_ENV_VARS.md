# Railway Environment Variables - Quick Reference

## 🎯 Frontend Service

```bash
VITE_API_BASE_URL=${{Backend.RAILWAY_PUBLIC_URL}}
```

---

## 🎯 Backend Service

### Required Environment Variables

```bash
# Frontend URL (for CORS) - REQUIRED
FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_URL}}

# GitHub OAuth Credentials - REQUIRED for GitHub features
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret

# Git Configuration - REQUIRED for cloning repos
GIT_TERMINAL_PROMPT=0
GIT_ASKPASS=echo

# LLM Configuration - REQUIRED
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Database - REQUIRED
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### Optional Environment Variables

```bash
# App Settings
DEBUG=false
APP_NAME=DevMind AI

# LLM Model Selection
GEMINI_MODEL=gemini-2.5-flash

# Alternative LLM Providers
OLLAMA_BASE_URL=http://localhost:11434
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
```

---

## 📍 Where to Get API Keys

| Service | URL | Cost |
|---------|-----|------|
| **Gemini API** | https://makersuite.google.com/app/apikey | FREE ✅ |
| **GitHub OAuth** | https://github.com/settings/developers | FREE ✅ |
| **OpenAI** | https://platform.openai.com/api-keys | PAID 💰 |
| **Anthropic** | https://console.anthropic.com/ | PAID 💰 |

---

## 🔧 How to Set Variables in Railway

1. Open Railway Dashboard
2. Select your project
3. Click on service (Frontend or Backend)
4. Go to **Variables** tab
5. Click **+ New Variable**
6. Enter name and value
7. Click **Add** then **Deploy** to apply

---

## ⚠️ Common Mistakes

### ❌ Wrong:
```bash
VITE_API_BASE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5174
```

### ✅ Correct:
```bash
VITE_API_BASE_URL=${{Backend.RAILWAY_PUBLIC_URL}}
FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_URL}}
```

Railway's `${{...}}` syntax automatically fills in the correct deployed URLs.

---

## 🧪 Testing

After setting all variables and deploying:

```powershell
# Test backend health
curl https://your-backend.railway.app/health

# Test GitHub OAuth endpoint
curl https://your-backend.railway.app/github/oauth/login

# Visit frontend in browser
https://your-frontend.railway.app
```

---

## 📋 Deployment Checklist

### Before First Deploy:
- [ ] Add PostgreSQL database to Railway project
- [ ] Set `GEMINI_API_KEY` in backend variables
- [ ] Set `LLM_PROVIDER=gemini` in backend variables
- [ ] Set `VITE_API_BASE_URL=${{Backend.RAILWAY_PUBLIC_URL}}` in frontend
- [ ] Set `FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_URL}}` in backend
- [ ] Set `GIT_TERMINAL_PROMPT=0` and `GIT_ASKPASS=echo` in backend

### For GitHub Integration:
- [ ] Create GitHub OAuth App at https://github.com/settings/developers
- [ ] Set Homepage URL to your Railway frontend URL
- [ ] Set Callback URL to `https://your-frontend.railway.app/auth/callback`
- [ ] Add `GITHUB_CLIENT_ID` to backend variables
- [ ] Add `GITHUB_CLIENT_SECRET` to backend variables

### After Deploy:
- [ ] Check backend logs for startup errors
- [ ] Test health endpoint
- [ ] Test repo upload functionality
- [ ] Test GitHub OAuth flow (if configured)

---

## 🆘 Need Help?

See detailed troubleshooting guide: [GITHUB_OAUTH_FIX.md](./GITHUB_OAUTH_FIX.md)
