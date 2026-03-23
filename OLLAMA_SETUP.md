# 🚀 Ollama Setup Guide (FREE LLM)

DevMind AI now supports **FREE local LLM** via Ollama! This means you can run the entire system without any paid API keys.

---

## Why Ollama?

✅ **Completely FREE**  
✅ **Runs locally** (no data sent to external servers)  
✅ **No API rate limits**  
✅ **Privacy-focused**  
✅ **Fast inference on modern hardware**  
✅ **Multiple model options** (Llama3, Mistral, CodeLlama, Phi3)

---

## Installation

### **Windows**

1. Download Ollama installer:
   ```
   https://ollama.ai/download/windows
   ```

2. Run the installer

3. Open PowerShell and verify:
   ```powershell
   ollama --version
   ```

### **Linux / macOS**

```bash
curl https://ollama.ai/install.sh | sh
```

---

## Download a Model

Ollama needs a model to run. Choose one:

### **Recommended: Llama 3 (8B)** - Best balance
```bash
ollama pull llama3
```

### **Alternative Models:**

```bash
# Mistral 7B - Fast and efficient
ollama pull mistral

# Code Llama - Optimized for code
ollama pull codellama

# Phi-3 - Lightweight (3.8B)
ollama pull phi3

# Gemma 2B - Ultra lightweight
ollama pull gemma:2b
```

**Model sizes:**
- `llama3` - ~4.7GB
- `mistral` - ~4.1GB  
- `codellama` - ~4.5GB
- `phi3` - ~2.3GB

---

## Start Ollama Server

### **Windows**
Ollama runs automatically as a service after installation.

To manually start:
```powershell
ollama serve
```

### **Linux / macOS**
```bash
ollama serve
```

**Verify it's running:**
```bash
curl http://localhost:11434
```

You should see:
```
Ollama is running
```

---

## Configure DevMind AI

1. Open `backend/.env`

2. Set LLM provider to Ollama:
   ```env
   LLM_PROVIDER=ollama
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3
   ```

3. That's it! No API keys needed.

---

## Test It

```bash
cd backend
uvicorn main:app --reload --port 8000
```

Visit: http://localhost:8000/docs

Try the `/analyze` endpoint - it will now use your local Ollama model!

---

## Performance Optimization

### **For Faster Inference:**

1. **Use GPU acceleration** (NVIDIA/AMD):
   - Ollama auto-detects GPU
   - On Windows: Ensure CUDA drivers installed
   - On Linux: Install CUDA toolkit

2. **Use smaller models for faster responses:**
   ```env
   OLLAMA_MODEL=phi3  # Faster than llama3
   ```

3. **Adjust token limits:**
   ```env
   MAX_TOKENS=1024  # Lower = faster
   ```

### **System Requirements:**

| Model | RAM | Disk | Speed |
|-------|-----|------|-------|
| llama3 | 8GB | 5GB | Medium |
| mistral | 8GB | 4.5GB | Fast |
| phi3 | 4GB | 2.5GB | Very Fast |
| gemma:2b | 4GB | 1.5GB | Ultra Fast |

---

## Alternative FREE Options

If you can't run Ollama locally, use these cloud FREE options:

### **Option 1: HuggingFace (FREE tier)**

1. Get API key: https://huggingface.co/settings/tokens
2. Update `.env`:
   ```env
   LLM_PROVIDER=huggingface
   HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
   ```

### **Option 2: OpenRouter (FREE models)**

1. Get API key: https://openrouter.ai/keys
2. Update `.env`:
   ```env
   LLM_PROVIDER=openrouter
   OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxx
   OPENROUTER_MODEL=meta-llama/llama-3-8b-instruct:free
   ```

**FREE models on OpenRouter:**
- `meta-llama/llama-3-8b-instruct:free`
- `mistralai/mistral-7b-instruct:free`
- `google/gemma-7b-it:free`

---

## Troubleshooting

### **Error: "Connection refused"**
- Check if Ollama is running: `ollama serve`
- Verify URL: `http://localhost:11434` (not https)

### **Error: "Model not found"**
- Pull the model: `ollama pull llama3`
- Check available models: `ollama list`

### **Slow responses**
- Use a smaller model: `OLLAMA_MODEL=phi3`
- Reduce `MAX_TOKENS=512`
- Ensure GPU is being used (check with `nvidia-smi` on NVIDIA)

### **Out of memory**
- Use smaller model: `phi3` or `gemma:2b`
- Close other applications
- Set `OLLAMA_NUM_PARALLEL=1`

---

## Comparison: FREE vs PAID

| Feature | Ollama (FREE) | Anthropic/OpenAI (PAID) |
|---------|---------------|-------------------------|
| Cost | $0 | $0.01-0.03 per 1K tokens |
| Privacy | 100% Local | Data sent externally |
| Speed | Fast (local) | Medium (network) |
| Quality | Very Good | Excellent |
| Rate Limits | None | Yes |
| Internet Required | No* | Yes |

*Only for model download

---

## Next Steps

1. ✅ Install Ollama
2. ✅ Pull a model (`ollama pull llama3`)
3. ✅ Start server (`ollama serve`)
4. ✅ Update `.env` to use Ollama
5. ✅ Run DevMind AI!

**You now have a fully FREE AI-powered codebase assistant! 🎉**

---

## Resources

- Ollama Website: https://ollama.ai
- Model Library: https://ollama.ai/library
- GitHub: https://github.com/ollama/ollama
- Discord: https://discord.gg/ollama
