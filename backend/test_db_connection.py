"""
Test Supabase PostgreSQL connection directly
"""

import asyncio
import asyncpg
from dotenv import load_dotenv
import os

load_dotenv()

async def test_connection():
    print("🔍 Testing Supabase connection...")
    
    # Parse DATABASE_URL
    db_url = os.getenv("DATABASE_URL", "")
    print(f"DATABASE_URL: {db_url[:50]}...")
    
    # Extract connection params
    # Format: postgresql+asyncpg://user:pass@host:port/db
    try:
        # Remove the driver prefix for asyncpg
        if "+asyncpg" in db_url:
            db_url_clean = db_url.replace("postgresql+asyncpg://", "postgresql://")
        
        print(f"\n📡 Attempting connection...")
        conn = await asyncpg.connect(db_url_clean, timeout=10)
        
        # Test query
        version = await conn.fetchval('SELECT version()')
        print(f"\n✅ SUCCESS! Connected to PostgreSQL")
        print(f"Version: {version[:100]}...")
        
        # Test table query
        result = await conn.fetch('SELECT table_name FROM information_schema.tables WHERE table_schema = $1 LIMIT 5', 'public')
        print(f"\n📋 Tables found: {len(result)}")
        for row in result:
            print(f"  - {row['table_name']}")
        
        await conn.close()
        print("\n🎉 Database connection working perfectly!")
        
    except Exception as e:
        print(f"\n❌ Connection FAILED: {type(e).__name__}")
        print(f"Error: {e}")
        print(f"\n💡 Troubleshooting:")
        print("  1. Check if Supabase project is active")
        print("  2. Verify password is correct")
        print("  3. Try with connection pooler (port 6543)")
        print("  4. Check firewall/antivirus settings")

if __name__ == "__main__":
    asyncio.run(test_connection())
