# Google Gemini Free Models - Auto Fallback System

## 🎯 Smart Fallback Feature
The system automatically tries multiple models if one hits rate limits or fails.
**User ka flow kabhi nahi tutega!** 🚀

**NEW:** Models are now prioritized by fresh quota availability!

## 📋 Available FREE Models (in NEW fallback order - Quota Optimized)

### 1. **models/gemini-2.0-flash-lite** (PRIMARY)
- **Speed**: ⚡⚡ Fastest
- **Quality**: Good
- **Rate Limit**: ~10 RPM (higher than others!)
- **Fresh Quota**: Usually available ✅
- **Use Case**: Primary fallback when main models exhausted

### 2. **models/gemini-2.0-flash** (Backup 1)
- **Speed**: ⚡ Very Fast
- **Quality**: Very Good
- **Rate Limit**: 4-5 RPM
- **Fresh Quota**: Usually available ✅
- **Use Case**: Reliable fallback with good quality

### 3. **models/gemini-2.5-flash** (Backup 2)
- **Speed**: ⚡ Fastest (newest)
- **Quality**: Excellent
- **Rate Limit**: 4-5 RPM, 20 RPD
- **May be exhausted**: Primary model, often hits limits
- **Use Case**: Try if fresh quota available

### 4. **models/gemini-2.5-pro** (Backup 3)
- **Speed**: 🐢 Slower (better quality)
- **Quality**: Highest
- **Rate Limit**: 2-3 RPM
- **Fresh Quota**: Usually available ✅
- **Use Case**: When highest quality needed

### 5. **models/gemini-flash-latest** (Backup 4)
- **Speed**: ⚡ Fast
- **Quality**: Good
- **Rate Limit**: Varies
- **Use Case**: Generic fallback

### 6. **models/gemini-pro-latest** (Backup 5)
- **Speed**: 🐢 Medium
- **Quality**: High
- **Rate Limit**: Varies
- **Use Case**: Pro-level fallback

### 7. **models/gemini-2.0-flash-001** (Backup 6)
- **Speed**: ⚡ Fast
- **Quality**: Good
- **Rate Limit**: 4-5 RPM
- **Use Case**: Last resort specific version

## 🔄 How Auto-Fallback Works

1. **Request comes in** → Try `gemini-2.5-flash`
2. **If 429 (rate limit)** → Auto-switch to `gemini-2.0-flash`
3. **If still failing** → Try `gemini-flash-latest`
4. **Need better quality?** → Fall back to `gemini-2.5-pro`
5. **Last resort** → Use `gemini-2.0-flash-lite`

## ⚙️ Configuration

Located in: `backend/app/core/config.py`

```python
GEMINI_FALLBACK_MODELS: list = [
    "models/gemini-2.5-flash",      # Primary
    "models/gemini-2.0-flash",      # Backup 1
    "models/gemini-flash-latest",   # Backup 2
    "models/gemini-2.5-pro",        # Backup 3
    "models/gemini-2.0-flash-lite", # Backup 4
]
```

## 📊 Rate Limits (Free Tier)

- **Total API calls**: 15 requests/minute across all models
- **Daily tokens**: 1 million tokens/day
- **Monthly quota**: Unlimited (but daily limit applies)

## 🎬 User Experience

**Before (without fallback):**
```
User sends message → Rate limit error → ❌ Error message shown
```

**After (with auto-fallback):**
```
User sends message → Model 1 rate limited → Auto-switch to Model 2 → ✅ Success!
User doesn't even know there was an issue! 🎉
```

## 🔍 Monitoring

Check backend logs to see which model is being used:
```
INFO: Trying Gemini model: gemini-2.5-flash...
WARNING: ⚠️ Rate limit hit on gemini-2.5-flash, trying next model...
INFO: Trying Gemini model: gemini-2.0-flash...
INFO: ✅ SUCCESS with gemini-2.0-flash (1234 chars)
```

## 💡 Tips

1. **Peak hours** (9 AM - 6 PM): More likely to hit rate limits
2. **Off-peak hours** (night): Primary model usually works
3. **Multiple concurrent requests**: Auto-fallback handles this gracefully
4. **No user action needed**: Everything happens automatically in background

## 🚨 If All Models Fail

Very rare, but if it happens:
- Wait 60 seconds (rate limit reset)
- Try again
- Check Google AI Studio for API status: https://makersuite.google.com/

---

**Built with ❤️ for seamless user experience**
