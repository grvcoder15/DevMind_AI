# 🔐 GitHub Integration Setup

Your DevMind AI now has a **"Choose Repository"** button! This allows you to browse and select repositories from your GitHub account.

---

## 🚀 How to Use

### **Step 1: Get a GitHub Personal Access Token**

1. **Go to GitHub Settings:**
   - Visit: https://github.com/settings/tokens/new
   - Or: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Create New Token:**
   - **Note**: "DevMind AI Access"
   - **Expiration**: 90 days (or your preference)
   - **Scopes**: Select ✅ **`repo`** (Full control of private repositories)

3. **Generate Token:**
   - Click **"Generate token"**
   - **Copy the token** immediately (you won't see it again!)
   - Format: `ghp_xxxxxxxxxxxxxxxxxxxx`

---

### **Step 2: Use in DevMind AI**

1. **Click "📁 Choose" button** on the main screen

2. **Paste your token** in the input field

3. **Click "Connect"**

4. **Browse your repositories** - all your GitHub repos will appear!

5. **Click on any repository** to select it - the URL will auto-fill

6. **Click "Analyze →"** to start analysis

---

## 🔒 Security

- ✅ Your token is stored **locally** in your browser (`localStorage`)
- ✅ Never shared with third parties
- ✅ Only used to fetch your GitHub repositories
- ✅ You can clear it anytime by clicking "Clear token"

---

## 📋 Features

### **What You Get:**

✨ **Browse all your repos** - public and private  
🔍 **Search functionality** - find repos quickly  
🏷️ **Language badges** - see tech stack at a glance  
⭐ **Star counts** - popularity indicator  
📝 **Descriptions** - understand each repo  
⏰ **Sort by recent** - most recently updated first  

---

## 🎯 Example Workflow

```
1. Open DevMind AI (http://localhost:5173)
   ↓
2. Click "📁 Choose" button
   ↓
3. Enter GitHub token: ghp_xxxxxxxxxxxxxxxxxxxx
   ↓
4. Click "Connect"
   ↓
5. See all your repositories
   ↓
6. Search or browse
   ↓
7. Click on a repo to select
   ↓
8. Click "Analyze →"
   ↓
9. Get instant analysis!
```

---

## ❓ FAQ

### **Q: Is my token safe?**
A: Yes! It's stored only in your browser's localStorage and never sent to any server except GitHub API.

### **Q: What permissions does the token need?**
A: Only `repo` scope for accessing your repositories.

### **Q: Can I use this without a token?**
A: Yes! You can still paste any public GitHub URL manually.

### **Q: Token expired?**
A: Just generate a new one from GitHub and update it in DevMind AI.

### **Q: How do I revoke access?**
A: Go to GitHub → Settings → Developer settings → Personal access tokens → Delete the token.

---

## 🔧 Troubleshooting

### **"Invalid token" error:**
- Check if token has `repo` scope enabled
- Verify token hasn't expired
- Try generating a new token

### **"No repositories found":**
- Make sure you have repositories in your GitHub account
- Check if token has correct permissions
- Try refreshing (click Connect again)

### **Modal not opening:**
- Check browser console for errors
- Verify backend is running (http://localhost:8000)
- Restart frontend if needed

---

## 🎉 That's It!

You can now browse and analyze any of your GitHub repositories with just a few clicks!

**No more copy-pasting URLs manually!** 🚀
