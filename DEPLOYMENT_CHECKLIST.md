# 🚀 Railway Deployment Checklist

## ✅ Pre-Deployment (Complete these locally)

### 1. Git Setup
- [ ] Files created:
  - [ ] `.gitignore` (blocks .env files, node_modules, etc.)
  - [ ] `backend/railway.json` (backend config)
  - [ ] `backend/Procfile` (start command)
  - [ ] `frontend/railway.json` (frontend config)
  - [ ] `.env.example` (template for environment variables)
  
- [ ] Initialize Git repository:
  ```bash
  git init
  git add .
  git commit -m "Initial commit: DevMind AI v2.0"
  ```

- [ ] Create GitHub repository at https://github.com/new
  - Name: `devmind-ai` (or your choice)
  - Public or Private: Your choice
  - Don't initialize with README (we already have one)

- [ ] Push to GitHub:
  ```bash
  git remote add origin https://github.com/YOUR_USERNAME/devmind-ai.git
  git branch -M main
  git push -u origin main
  ```

### 2. Environment Variables Preparation
- [ ] Have your Gemini API key ready: `AIzaSyAeFicwnXNlOloqD3-SDHnYDiOp0RVcQKs`
- [ ] Have your GitHub OAuth credentials ready:
  - Client ID: `Ov23liyjyfWAKlZ83bNB`
  - Client Secret: (from GitHub app settings)

---

## 🏗️ Railway Deployment (Do these on railway.app)

### Step 1: Create Project
- [ ] Go to https://railway.app
- [ ] Login with GitHub
- [ ] Click **"New Project"**
- [ ] Select **"Deploy from GitHub repo"**
- [ ] Choose `devmind-ai` repository

### Step 2: Add PostgreSQL Database
- [ ] In project, click **"+ New"**
- [ ] Select **"Database"** → **"Add PostgreSQL"**
- [ ] Wait for database to provision
- [ ] Copy `DATABASE_URL` from **Variables** tab

### Step 3: Deploy Backend Service
- [ ] Click **"+ New"** → **"GitHub Repo"**
- [ ] Select `devmind-ai` repo
- [ ] **Settings** → Set **Root Directory**: `/backend`
- [ ] **Settings** → Set **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Go to **Variables** tab and add:

```env
GEMINI_API_KEY=AIzaSyAeFicwnXNlOloqD3-SDHnYDiOp0RVcQKs
GITHUB_CLIENT_ID=Ov23liyjyfWAKlZ83bNB
GITHUB_CLIENT_SECRET=your_github_secret_here
GITHUB_REDIRECT_URI=https://TEMP_VALUE  # Update after frontend deploys
FRONTEND_URL=https://TEMP_VALUE         # Update after frontend deploys
BACKEND_URL=${{RAILWAY_PUBLIC_DOMAIN}}  # Auto-filled
```

- [ ] Click **"Deploy"**
- [ ] Wait for deployment (check logs for "Application startup complete")
- [ ] **Copy Backend URL** from **Settings** → **Domains**

### Step 4: Deploy Frontend Service
- [ ] Click **"+ New"** → **"GitHub Repo"**
- [ ] Select `devmind-ai` repo
- [ ] **Settings** → Set **Root Directory**: `/frontend`
- [ ] **Settings** → Set **Build Command**: `npm install && npm run build`
- [ ] **Settings** → Set **Start Command**: `npm run preview -- --host 0.0.0.0 --port $PORT`
- [ ] Go to **Variables** tab and add:

```env
VITE_API_BASE_URL=https://your-backend-url.railway.app
```

- [ ] Click **"Deploy"**
- [ ] Wait for deployment
- [ ] **Copy Frontend URL** from **Settings** → **Domains**

### Step 5: Update Backend Environment Variables
- [ ] Go back to **Backend Service** → **Variables**
- [ ] Update these with actual frontend URL:
  - `GITHUB_REDIRECT_URI=https://your-frontend.railway.app/auth/callback`
  - `FRONTEND_URL=https://your-frontend.railway.app`
- [ ] Save (triggers automatic redeploy)

### Step 6: Link Database to Backend
- [ ] In **Backend Service** → **Variables** tab
- [ ] Check if `DATABASE_URL` reference exists (should be automatic)
- [ ] If not, click **"+ Variable Reference"** → Select PostgreSQL → `DATABASE_URL`
- [ ] **Important:** Format must be `postgresql+asyncpg://...` (Railway provides this automatically)

---

## 🔧 External Configuration Updates

### Update GitHub OAuth App
- [ ] Go to https://github.com/settings/developers
- [ ] Click on your OAuth App
- [ ] Update **Authorization callback URL**:
  ```
  https://your-actual-frontend.railway.app/auth/callback
  ```
- [ ] Save changes

---

## ✅ Verification & Testing

### Backend Health Check
- [ ] Open: `https://your-backend.railway.app/health`
- [ ] Should return:
  ```json
  {"status": "healthy", "version": "2.0.0"}
  ```

### Frontend Loading
- [ ] Open: `https://your-frontend.railway.app`
- [ ] Should load React app with DevMind AI logo
- [ ] Check browser console for errors

### Database Connection
- [ ] Check backend logs in Railway:
  ```
  ✅ Database tables ready
  ✅ Vector store initialized
  ```

### Full Flow Test
- [ ] Try uploading a GitHub repository
- [ ] Check if analysis works
- [ ] Test GitHub OAuth login
- [ ] Try chat feature
- [ ] Generate flow diagram
- [ ] Generate prototype

---

## 🐛 Common Issues & Fixes

### ❌ Backend: "Module not found"
**Fix:** Check if `requirements.txt` is in `/backend` folder

### ❌ Frontend: API calls failing (CORS)
**Fix:** Verify `FRONTEND_URL` in backend matches actual frontend URL

### ❌ Database: "Cannot connect"
**Fix:** Make sure `DATABASE_URL` uses `postgresql+asyncpg://` format

### ❌ Frontend: "404 Not Found" on page refresh
**Fix:** Already handled by Vite (SPA mode)

### ❌ GitHub OAuth: "Redirect URI mismatch"
**Fix:** Update GitHub OAuth app settings with exact Railway frontend URL

---

## 💰 Cost Tracking

Monitor usage in Railway dashboard:
- [ ] Check **Metrics** tab for each service
- [ ] Set up **Usage Alerts** (optional)
- [ ] Estimated cost: ~$0-10/month

---

## 🎯 Post-Deployment

### Optional Enhancements
- [ ] Add custom domain (Railway Settings → Domains)
- [ ] Set up database backups (automatic on Railway)
- [ ] Monitor logs regularly
- [ ] Test with different repositories

### Update Local Development
- [ ] Keep local `.env` for development
- [ ] Never commit `.env` to Git
- [ ] Use `.env.example` as template for team members

---

## 📊 Deployment Summary

Once complete, you'll have:

```
Railway Project: DevMind AI
├── 🗄️ PostgreSQL Database (512MB RAM)
├── 🔧 Backend Service 
│   └── URL: https://devmind-backend-xxx.railway.app
└── 🎨 Frontend Service
    └── URL: https://devmind-frontend-xxx.railway.app
```

---

## 🚨 Emergency Rollback

If something goes wrong:

1. **Railway Dashboard** → Service → **Deployments** tab
2. Click on previous working deployment
3. Click **"Redeploy"**

Or revert Git commit:
```bash
git revert HEAD
git push
```
Railway auto-redeploys!

---

**✅ All Done? Congratulations! Your DevMind AI is live! 🎉**

Share your deployed URL and test with real repositories!
