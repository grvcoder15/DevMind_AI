# DevMind AI v2.0 - Railway Deployment Guide 🚀

## 📦 Railway Deployment Architecture

```
Railway Project
├── 🗄️ PostgreSQL Database (Railway addon)
├── 🔧 Backend Service (FastAPI - /backend folder)
└── 🎨 Frontend Service (React + Vite - /frontend folder)
```

---

## 🎯 Step-by-Step Deployment

### Step 1: Create Git Repository

```bash
cd "C:\Users\HP\Desktop\codebase explainer engine\filesnew"

# Initialize Git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: DevMind AI v2.0"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/devmind-ai.git
git branch -M main
git push -u origin main
```

---

### Step 2: Railway Setup

1. Go to [railway.app](https://railway.app) and login with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `devmind-ai` repository

---

### Step 3: Create PostgreSQL Database

1. In Railway project, click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway will create database and provide connection string
3. Copy the `DATABASE_URL` from Variables tab

---

### Step 4: Deploy Backend Service

1. Click **"+ New"** → **"GitHub Repo"** → Select same repo → Choose **"backend"** folder
2. **Settings** → **Root Directory**: `/backend`
3. **Settings** → **Custom Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

**Environment Variables** (Add in Variables tab):
```
DATABASE_URL=postgresql+asyncpg://... (automatically set from Railway PostgreSQL)
GEMINI_API_KEY=AIzaSyAeFicwnXNlOloqD3-SDHnYDiOp0RVcQKs
GITHUB_CLIENT_ID=Ov23liyjyfWAKlZ83bNB
GITHUB_CLIENT_SECRET=your_github_secret
GITHUB_REDIRECT_URI=https://your-frontend.railway.app/auth/callback
FRONTEND_URL=https://your-frontend.railway.app
BACKEND_URL=https://your-backend.railway.app
```

4. Click **"Deploy"**
5. After deployment, copy the **Backend URL** (e.g., `https://devmind-backend-production.up.railway.app`)

---

### Step 5: Deploy Frontend Service

1. Click **"+ New"** → **"GitHub Repo"** → Select same repo → Choose **"frontend"** folder
2. **Settings** → **Root Directory**: `/frontend`
3. **Settings** → **Custom Build Command**: `npm install && npm run build`
4. **Settings** → **Custom Start Command**: `npm run preview -- --host 0.0.0.0 --port $PORT`

**Environment Variables**:
```
VITE_API_BASE_URL=https://your-backend.railway.app
```

5. Click **"Deploy"**
6. After deployment, copy the **Frontend URL**

---

### Step 6: Update Environment Variables

Go back to **Backend Service** → **Variables** and update:
```
FRONTEND_URL=https://your-actual-frontend.railway.app
GITHUB_REDIRECT_URI=https://your-actual-frontend.railway.app/auth/callback
```

**IMPORTANT:** Also update GitHub OAuth App settings:
1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Update **Authorization callback URL** to: `https://your-actual-frontend.railway.app/auth/callback`

---

### Step 7: Link Database to Backend

1. In Backend Service → **Variables** tab
2. Railway should automatically add `DATABASE_URL` reference
3. If not, click **"+ New Variable"** → **"Reference"** → Select PostgreSQL → `DATABASE_URL`

---

## ✅ Verification

### Backend Health Check
```
https://your-backend.railway.app/health
```
Should return:
```json
{"status": "healthy", "version": "2.0.0"}
```

### Frontend Check
```
https://your-frontend.railway.app
```
Should load the React app

---

## 🔧 Common Issues & Solutions

### Issue 1: Backend CORS Error
**Solution:** Make sure `FRONTEND_URL` in backend env matches actual frontend URL

### Issue 2: Database Connection Failed
**Solution:** Check if `DATABASE_URL` format is `postgresql+asyncpg://...` (not just `postgresql://`)

### Issue 3: Frontend API Calls Failing
**Solution:** Verify `VITE_API_BASE_URL` is set correctly and frontend was rebuilt after change

### Issue 4: GitHub OAuth Not Working
**Solution:** 
- Check `GITHUB_REDIRECT_URI` in backend matches GitHub OAuth app settings
- Must be exact: `https://your-frontend.railway.app/auth/callback`

---

## 💰 Cost Estimate

**Free Tier Limits:**
- PostgreSQL: 512MB RAM, 1GB Storage
- Backend Service: $5/month (500 hours free)
- Frontend Service: $5/month (500 hours free)

**Total:** ~$0-10/month depending on usage

---

## 🔄 Continuous Deployment

Railway automatically redeploys when you push to GitHub:
```bash
git add .
git commit -m "Update feature"
git push
```

Both frontend and backend will auto-deploy! 🎉

---

## 📊 Monitoring

**Railway Dashboard:**
- View logs: Service → **Deployments** → Click latest deployment
- Metrics: Service → **Metrics** tab
- Database: PostgreSQL service → **Metrics** tab

**Backend Logs:**
```
uvicorn.access | INFO | 200 GET /health
```

**Frontend Logs:**
```
vite v5.2.0 server running at http://0.0.0.0:$PORT
```

---

## 🎯 Next Steps

1. **Custom Domain** (Optional):
   - Railway Settings → **Domains** → Add custom domain
   
2. **Environment-based Config**:
   - Create `.env.production` for production-specific settings
   
3. **Database Backup**:
   - Railway PostgreSQL → **Backups** tab

---

**🎉 Your DevMind AI is now LIVE!**
