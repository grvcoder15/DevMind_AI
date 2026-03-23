#!/bin/bash

echo "🎯 Quick Deployment Checklist"
echo "================================"
echo ""

# Check if git is initialized
if [ -d .git ]; then
    echo "✅ Git repository initialized"
else
    echo "❌ Git not initialized. Run: git init"
    exit 1
fi

# Check for sensitive files
if [ -f backend/.env ]; then
    echo "⚠️  WARNING: backend/.env exists (should be .gitignore'd)"
fi

if [ -f frontend/.env ]; then
    echo "⚠️  WARNING: frontend/.env exists (should be .gitignore'd)"
fi

# Check for required files
echo "📝 Checking required files..."

required_files=(
    "backend/requirements.txt"
    "backend/main.py"
    "backend/railway.json"
    "backend/Procfile"
    "frontend/package.json"
    "frontend/railway.json"
    ".gitignore"
    "README.md"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ Missing: $file"
    fi
done

echo ""
echo "🚀 Next Steps:"
echo "1. git add ."
echo "2. git commit -m 'Prepare for Railway deployment'"
echo "3. git remote add origin https://github.com/YOUR_USERNAME/devmind-ai.git"
echo "4. git push -u origin main"
echo "5. Go to railway.app and deploy!"
