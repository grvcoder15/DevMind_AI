"""Quick test of Gemini API"""
import asyncio
import httpx
from dotenv import load_dotenv
import os

load_dotenv("backend/.env")

async def test_gemini():
    api_key = os.getenv("GEMINI_API_KEY")
    model = os.getenv("GEMINI_MODEL", "gemini-pro")
    
    if not api_key:
        print("❌ GEMINI_API_KEY not found in backend/.env")
        return
    
    print(f"✅ API Key found: {api_key[:20]}...")
    
    payload = {
        "contents": [{
            "parts": [{"text": "Say 'Hello from Gemini!' if you are working."}]
        }]
    }
    
    # Try different model names (based on API listing)
    models_to_try = ["models/gemini-2.5-flash", "models/gemini-2.0-flash", "models/gemini-flash-latest"]
    
    for test_model in models_to_try:
        print(f"\nTesting Gemini model: {test_model}")
        
        # Remove 'models/' prefix if present for the API endpoint
        model_name = test_model.replace("models/", "")
        
        # Try both v1 and v1beta endpoints
        urls = [
            f"https://generativelanguage.googleapis.com/v1/models/{model_name}:generateContent?key={api_key}",
            f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        ]
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                for url in urls:
                    print(f"  Trying: ...{url[-60:]}")
                    try:
                        response = await client.post(url, json=payload)
                        response.raise_for_status()
                        data = response.json()
                        
                        if "candidates" in data and len(data["candidates"]) > 0:
                            result = data["candidates"][0]["content"]["parts"][0]["text"]
                            print(f"\n✅ SUCCESS with {test_model}! Gemini responded:")
                            print(f"   {result}")
                            return True
                        else:
                            print(f"  Unexpected response format")
                    except httpx.HTTPStatusError as e:
                        print(f"  Failed (HTTP {e.response.status_code})")
                        continue
                        
        except Exception as e:
            print(f"  Error: {e}")
            continue
    
    print("\n❌ All model/endpoint combinations failed")
    return False

if __name__ == "__main__":
    asyncio.run(test_gemini())
