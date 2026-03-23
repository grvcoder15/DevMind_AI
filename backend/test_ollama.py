"""
Test script to verify Ollama integration
Run this to test if your FREE LLM setup is working!

Usage:
    python test_ollama.py
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.ai_service import llm
from app.core.config import settings


async def test_ollama():
    print("=" * 60)
    print("🧪 Testing DevMind AI - FREE LLM Integration")
    print("=" * 60)
    print()
    
    print(f"Provider: {settings.LLM_PROVIDER}")
    
    if settings.LLM_PROVIDER == "ollama":
        print(f"Ollama URL: {settings.OLLAMA_BASE_URL}")
        print(f"Model: {settings.OLLAMA_MODEL}")
    elif settings.LLM_PROVIDER == "huggingface":
        print(f"Model: {settings.HUGGINGFACE_MODEL}")
    elif settings.LLM_PROVIDER == "openrouter":
        print(f"Model: {settings.OPENROUTER_MODEL}")
    
    print()
    print("Sending test query...")
    print("-" * 60)
    
    try:
        response = await llm.complete(
            messages=[{
                "role": "user",
                "content": "Explain what FastAPI is in one sentence."
            }],
            system="You are a helpful coding assistant.",
            temperature=0.3,
            max_tokens=100
        )
        
        print("✅ SUCCESS!")
        print()
        print("Response:")
        print(response)
        print()
        print("=" * 60)
        print("🎉 Your FREE LLM setup is working perfectly!")
        print("=" * 60)
        
    except Exception as e:
        print("❌ ERROR!")
        print()
        print(f"Error: {e}")
        print()
        print("Troubleshooting:")
        
        if settings.LLM_PROVIDER == "ollama":
            print("1. Check if Ollama is running: ollama serve")
            print("2. Verify model is installed: ollama list")
            print("3. Pull model if needed: ollama pull llama3")
        elif settings.LLM_PROVIDER == "huggingface":
            print("1. Check API key in .env: HUGGINGFACE_API_KEY")
            print("2. Verify internet connection")
        elif settings.LLM_PROVIDER == "openrouter":
            print("1. Check API key in .env: OPENROUTER_API_KEY")
            print("2. Verify internet connection")
        
        print()
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_ollama())
