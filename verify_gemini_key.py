"""Verify Gemini API key by listing available models"""
import asyncio
import httpx
from dotenv import load_dotenv
import os

load_dotenv("backend/.env")

async def verify_api_key():
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print("❌ GEMINI_API_KEY not found")
        return
    
    print(f"✅ API Key: {api_key[:20]}...{api_key[-4:]}")
    print("\nTrying to list available models...")
    
    # Try to list models - this will tell us if the API key is valid
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print("\n✅ API key is VALID! Available models:")
                if "models" in data:
                    for model in data["models"]:
                        name = model.get("name", "Unknown")
                        print(f"  - {name}")
                else:
                    print(data)
            else:
                print(f"\n❌ API Error: {response.text}")
                
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(verify_api_key())
