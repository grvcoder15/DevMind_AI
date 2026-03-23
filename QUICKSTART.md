# 🚀 Quick Start Guide - FREE Setup

Get DevMind AI running in **5 minutes** using **100% FREE tools**!

---

## Prerequisites

- Python 3.9+
- Node.js 18+
- Git

---

## Step 1: Clone & Setup

```bash
cd "c:\Users\HP\Desktop\codebase explainer engine\filesnew"

# Backend setup
cd backend
pip install -r requirements.txt
```

---

## Step 2: Install Ollama (FREE Local LLM)

### **Windows:**
1. Download: https://ollama.ai/download/windows
2. Run installer
3. Open PowerShell:
   ```powershell
   ollama pull llama3
   ```

### **Linux/Mac:**
```bash
curl https://ollama.ai/install.sh | sh
ollama pull llama3
```

**Verify it's running:**
```bash
ollama serve
# Keep this terminal open
```

📘 **Full Ollama guide:** [OLLAMA_SETUP.md](OLLAMA_SETUP.md)

---

## Step 3: Setup Supabase Database (FREE)

Already configured! Just need to verify your credentials:

1. Check `backend/.env` - should have:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:StrongPassword@123456@db.wtjlxubukquclnfiyifg.supabase.co:5432/postgres
   ```

2. That's it! ✅

---

## Step 4: Verify Configuration

Open `backend/.env` and confirm:

```env
# Should be set to ollama (FREE)
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3

# Supabase (already configured)
DATABASE_URL=postgresql+asyncpg://postgres:StrongPassword@123456@...
SUPABASE_URL=https://wtjlxubukquclnfiyifg.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
```

---

## Step 5: Run Backend

```bash
cd backend
uvicorn main:app --reload --port 8000
```

You should see:
```
🚀 DevMind AI starting up...
✅ Database tables ready
✅ Vector store initialized
INFO:     Uvicorn running on http://127.0.0.1:8000
```

**Test it:** http://localhost:8000/docs

---

## Step 6: Run Frontend

**New terminal:**

```bash
cd frontend
npm install
npm run dev
```

You should see:
```
VITE ready in 500ms
➜  Local:   http://localhost:5173/
```

---

## Step 7: Test the System!

1. Open browser: **http://localhost:5173**

2. Enter a GitHub URL:
   ```
   https://github.com/fastapi/fastapi
   ```

3. Click **"Analyze Repository"**

4. Wait ~30 seconds (Ollama will generate analysis)

5. Explore:
   - 📊 Dashboard - See analysis results
   - 💬 Chat - Ask questions about the codebase
   - 🎓 Learning - Get guided curriculum
   - 📈 Flow - View system diagrams
   - 🎤 Voice - Try voice assistant

---

## 🎉 You're Done!

Your system is now running **completely FREE**:
- ✅ Local LLM (Ollama)
- ✅ Free Database (Supabase)
- ✅ Free Voice (Whisper + gTTS)
- ✅ Free Embeddings (FAISS)

**Total monthly cost: $0** 💰

---

## Common Issues

### **"Connection refused" error**
```bash
# Make sure Ollama is running
ollama serve
```

### **Slow first response**
- First query loads the model (~10 seconds)
- Subsequent queries are fast (~2-5 seconds)

### **Frontend can't connect to backend**
- Check backend is running on port 8000
- Check `http://localhost:8000/docs` works

### **Database connection error**
- Verify Supabase password in `.env`
- Check internet connection

---

## Performance Tips

### **Faster LLM responses:**
```env
# Use smaller, faster model
OLLAMA_MODEL=phi3

# Reduce max tokens
MAX_TOKENS=1024
```

### **Better quality:**
```env
# Use larger model
OLLAMA_MODEL=llama3

# Increase temperature for creativity
TEMPERATURE=0.4
```

---

## Alternative FREE LLM Options

If you can't run Ollama locally:

### **HuggingFace (Cloud FREE)**
```env
LLM_PROVIDER=huggingface
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxx
```
Get key: https://huggingface.co/settings/tokens

### **OpenRouter (Cloud FREE)**
```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxx
OPENROUTER_MODEL=meta-llama/llama-3-8b-instruct:free
```
Get key: https://openrouter.ai/keys

---

## What's Next?

- 📖 Read [README.md](README.md) for full features
- 🔧 Customize settings in `backend/.env`
- 🧪 Try different Ollama models
- 🚀 Deploy to production (guide coming soon)

---

## Need Help?

- Ollama issues: [OLLAMA_SETUP.md](OLLAMA_SETUP.md)
- Check logs: `backend/` terminal output
- API documentation: http://localhost:8000/docs

---

**Happy Coding! 🎊**
