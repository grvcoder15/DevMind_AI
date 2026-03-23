# 🗄️ Database Migration: Local PostgreSQL → Railway PostgreSQL

## Overview
This guide explains how to migrate your data from local `Devmind_ai` database to Railway PostgreSQL.

---

## ⚠️ Important Note

Railway PostgreSQL will **automatically create tables** when your backend first runs (SQLAlchemy `Base.metadata.create_all`).

You only need to migrate data if you have **existing repositories/analyses** you want to preserve.

---

## Option 1: Fresh Start (Recommended) ✅

**Best for:** New deployment, no critical data to preserve

**Steps:**
1. Deploy backend to Railway
2. Railway PostgreSQL will auto-create all tables
3. Upload new repositories and run fresh analyses

**Pros:**
- Simple and clean
- No migration complexity
- Latest schema guaranteed

---

## Option 2: Export & Import Data 📦

**Best for:** Preserving existing analyses and chat history

### Step 1: Export from Local PostgreSQL

```bash
# Export specific tables (without schema - Railway creates it)
pg_dump -U postgres -d Devmind_ai \
  -t repositories \
  -t repository_files \
  -t analyses \
  -t chat_sessions \
  -t chat_messages \
  --data-only \
  --inserts \
  -f devmind_backup.sql
```

**Windows (PowerShell):**
```powershell
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" `
  -U postgres -d Devmind_ai `
  -t repositories `
  -t repository_files `
  -t analyses `
  -t chat_sessions `
  -t chat_messages `
  --data-only `
  --inserts `
  -f devmind_backup.sql
```

### Step 2: Get Railway Database Credentials

1. Go to Railway → PostgreSQL service
2. Click **"Variables"** tab
3. Copy connection details:
   ```
   PGHOST=xxx.railway.app
   PGPORT=5432
   PGDATABASE=railway
   PGUSER=postgres
   PGPASSWORD=xxx
   ```

### Step 3: Import to Railway PostgreSQL

```bash
psql "postgresql://postgres:PASSWORD@PGHOST:PGPORT/PGDATABASE" \
  -f devmind_backup.sql
```

**Windows (PowerShell):**
```powershell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" `
  "postgresql://postgres:PASSWORD@PGHOST:PGPORT/PGDATABASE" `
  -f devmind_backup.sql
```

---

## Option 3: Selective Migration (Python Script) 🐍

**Best for:** Migrating specific repositories only

### Create Migration Script

```python
# migrate_to_railway.py
import asyncio
from sqlalchemy import select, create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models.models import Repository, RepositoryFile, Analysis

LOCAL_DB = "postgresql+asyncpg://postgres:Welcome%40123@localhost:5432/Devmind_ai"
RAILWAY_DB = "postgresql+asyncpg://postgres:PASSWORD@PGHOST:PGPORT/railway"

async def migrate_repo(repo_id: str):
    """Migrate a specific repository with all its data"""
    
    # Connect to local DB
    local_engine = create_async_engine(LOCAL_DB)
    LocalSession = sessionmaker(local_engine, class_=AsyncSession)
    
    # Connect to Railway DB
    railway_engine = create_async_engine(RAILWAY_DB)
    RailwaySession = sessionmaker(railway_engine, class_=AsyncSession)
    
    async with LocalSession() as local_session:
        async with RailwaySession() as railway_session:
            # 1. Fetch repository
            result = await local_session.execute(
                select(Repository).where(Repository.id == repo_id)
            )
            repo = result.scalar_one_or_none()
            
            if not repo:
                print(f"❌ Repository {repo_id} not found")
                return
            
            # 2. Fetch files
            result = await local_session.execute(
                select(RepositoryFile).where(RepositoryFile.repo_id == repo_id)
            )
            files = result.scalars().all()
            
            # 3. Fetch analysis
            result = await local_session.execute(
                select(Analysis).where(Analysis.repo_id == repo_id)
            )
            analysis = result.scalar_one_or_none()
            
            # 4. Insert into Railway
            railway_session.add(repo)
            for file in files:
                railway_session.add(file)
            if analysis:
                railway_session.add(analysis)
            
            await railway_session.commit()
            print(f"✅ Migrated repo: {repo_id} ({len(files)} files)")

async def main():
    # List of repo IDs to migrate
    repos_to_migrate = [
        "28573d8f",  # Voermon repository
        # Add more repo IDs here
    ]
    
    for repo_id in repos_to_migrate:
        await migrate_repo(repo_id)

if __name__ == "__main__":
    asyncio.run(main())
```

### Run Migration

```bash
cd backend
python migrate_to_railway.py
```

---

## 🧪 Verification

After migration, verify data:

```sql
-- Check repositories
SELECT id, project_name, language, framework 
FROM repositories;

-- Check file count
SELECT repo_id, COUNT(*) as file_count 
FROM repository_files 
GROUP BY repo_id;

-- Check analyses
SELECT repo_id, created_at 
FROM analyses;
```

Or use Backend API:
```bash
curl https://your-backend.railway.app/health
```

---

## 🔒 Security Best Practices

1. **Never commit database credentials** to Git
2. Use `.env` files (already in `.gitignore`)
3. Delete local backup file after migration:
   ```bash
   rm devmind_backup.sql
   ```
4. Use Railway's built-in database backups

---

## 📊 Railway Database Specs

**Free Tier:**
- 512 MB RAM
- 1 GB Storage
- Daily automatic backups
- Connection pooling

**Shared CPU Plan ($5/month):**
- 1 GB RAM
- 5 GB Storage
- Better performance

---

## 🆘 Troubleshooting

### Error: "relation already exists"
- Railway already created tables
- Use `--data-only` flag in pg_dump (already included above)

### Error: "duplicate key value"
- Data already exists in Railway DB
- Use `ON CONFLICT` clause in SQL
- Or drop and recreate tables first

### Error: "connection refused"
- Check Railway database is running
- Verify connection string format
- Allow Railway IP in any firewall rules

---

## ✅ Recommended Approach

For most users, I recommend **Option 1 (Fresh Start)**:

1. Deploy to Railway
2. Tables auto-create
3. Upload Voermon repository again (takes 10 seconds)
4. Run analysis again (cached in DB after first run)

This ensures clean schema and no migration issues!

---

**Need help?** Check Railway logs in Dashboard → Service → Deployments
