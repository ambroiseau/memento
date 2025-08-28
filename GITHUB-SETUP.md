# GitHub Repository Setup Guide

This guide will help you push your Memento PWA to GitHub.

## 🚀 **Quick Setup**

### **Option 1: Automated Setup (Recommended)**

```bash
npm run github:setup
```

This will guide you through the entire process automatically.

### **Option 2: Manual Setup**

Follow the steps below if you prefer to do it manually.

## 📋 **Step-by-Step Instructions**

### **Step 1: Create GitHub Repository**

1. **Go to [GitHub.com](https://github.com)** and sign in
2. **Click the "+" icon** in the top right corner
3. **Select "New repository"**
4. **Fill in the repository details**:
   - **Repository name**: `memento-app` (or your preferred name)
   - **Description**: `A PWA for family photo sharing with Supabase backend`
   - **Visibility**: 
     - **Public** - Anyone can see your code
     - **Private** - Only you and collaborators can see it
   - **DO NOT** check "Add a README file" (we already have one)
   - **DO NOT** check "Add .gitignore" (we already have one)
   - **DO NOT** check "Choose a license" (add later if needed)
5. **Click "Create repository"**

### **Step 2: Copy Repository URL**

After creating the repository, GitHub will show you a page with setup instructions. Copy the repository URL. It will look like:
- `https://github.com/yourusername/memento-app.git`

### **Step 3: Connect and Push**

Run these commands in your terminal:

```bash
# Add the remote repository
git remote add origin https://github.com/yourusername/memento-app.git

# Push your code to GitHub
git push -u origin main
```

## 🔧 **Alternative Methods**

### **Using GitHub CLI (if installed)**

```bash
# Install GitHub CLI
brew install gh  # macOS
# or download from: https://cli.github.com/

# Login to GitHub
gh auth login

# Create repository and push
gh repo create memento-app --public --source=. --remote=origin --push
```

### **Using GitHub Desktop**

1. **Download GitHub Desktop** from [desktop.github.com](https://desktop.github.com)
2. **Sign in** with your GitHub account
3. **Add existing repository** → Select your memento-app folder
4. **Publish repository** → Choose name and visibility
5. **Push to GitHub**

## 📱 **Post-Setup Configuration**

### **1. Repository Settings**

After pushing to GitHub, consider these settings:

#### **Topics (Tags)**
Add these topics to your repository for better discoverability:
- `pwa`
- `react`
- `typescript`
- `supabase`
- `family-app`
- `photo-sharing`
- `progressive-web-app`

#### **Repository Description**
Update the description to be more descriptive:
```
A Progressive Web App (PWA) for families to share photos and memories. Built with React, TypeScript, and Supabase. Features offline support, mobile app deployment, and real-time updates.
```

### **2. GitHub Pages (Optional)**

If you want to host your app directly from GitHub:

1. **Go to repository Settings**
2. **Scroll to "Pages" section**
3. **Source**: Select "Deploy from a branch"
4. **Branch**: Select "main" and "/docs" or "/ (root)"
5. **Save**

### **3. GitHub Actions (Optional)**

Set up automated deployment:

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
    - run: npm ci
    - run: npm run build
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### **4. Environment Variables**

For deployment, you'll need to set up environment variables in your hosting platform:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## 🔒 **Security Considerations**

### **What's Safe to Push**

✅ **Safe to include in repository**:
- Source code
- Configuration files
- Documentation
- Build scripts
- UI components

❌ **Never push to repository**:
- `.env` files with real credentials
- API keys
- Database passwords
- Private keys
- User data

### **Environment Variables**

Your `.env` file is already in `.gitignore`, so it won't be pushed. For production, set environment variables in your hosting platform's dashboard.

## 📊 **Repository Features**

### **Issues**
- Use for bug reports
- Feature requests
- Questions
- Documentation improvements

### **Pull Requests**
- Code reviews
- Feature branches
- Collaborative development

### **Projects**
- Kanban boards for project management
- Milestone tracking
- Release planning

### **Wiki**
- Additional documentation
- Setup guides
- API documentation

## 🎯 **Next Steps After GitHub Setup**

1. **Test the repository**:
   ```bash
   # Clone to a different location to test
   git clone https://github.com/yourusername/memento-app.git test-clone
   cd test-clone
   npm install
   npm run dev
   ```

2. **Set up deployment**:
   ```bash
   npm run deploy
   ```

3. **Configure mobile apps**:
   ```bash
   # Android TWA
   npm run twa:setup
   
   # iOS Capacitor
   npm run ios:setup
   ```

4. **Share your repository**:
   - Add collaborators
   - Share on social media
   - Submit to app stores

## 🚨 **Troubleshooting**

### **Authentication Issues**

If you get authentication errors:

```bash
# Use Personal Access Token
git remote set-url origin https://YOUR_TOKEN@github.com/username/memento-app.git

# Or use SSH
git remote set-url origin git@github.com:username/memento-app.git
```

### **Large File Issues**

If you have large files that can't be pushed:

```bash
# Check for large files
git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sed -n 's/^blob //p' | sort --numeric-sort --key=2 | tail -10

# Use Git LFS for large files
git lfs track "*.png"
git lfs track "*.jpg"
git add .gitattributes
```

### **Repository Already Exists**

If the repository already exists:

```bash
# Remove existing remote
git remote remove origin

# Add new remote
git remote add origin https://github.com/yourusername/memento-app.git

# Push
git push -u origin main
```

## 🎉 **Success!**

Once you've successfully pushed to GitHub, your repository will be available at:
`https://github.com/yourusername/memento-app`

You can now:
- Share your code with others
- Collaborate with team members
- Set up automated deployments
- Track issues and features
- Showcase your work

---

**Need help?** Check the [GitHub documentation](https://docs.github.com/) or run `npm run github:setup` for automated assistance.
