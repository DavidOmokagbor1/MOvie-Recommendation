# 🚀 Simple Vercel Deployment Guide

## Method 1: Deploy via Vercel Dashboard (EASIEST - Recommended)

### Step 1: Go to Vercel Dashboard
1. Open: https://vercel.com/dashboard
2. Login with your GitHub account

### Step 2: Import Your Project
1. Click **"Add New..."** → **"Project"**
2. Import from GitHub: `DavidOmokagbor1/MOvie-Recommendation`
3. Configure:
   - **Framework Preset**: Create React App (auto-detected)
   - **Root Directory**: `fullstack_recsys/react-front`
   - **Build Command**: `npm run build` (or leave default)
   - **Output Directory**: `build` (or leave default)
   - **Install Command**: `npm install` (or leave default)

### Step 3: Set Environment Variables (IMPORTANT!)
Click **"Environment Variables"** and add:
- `REACT_APP_API_URL` = `https://movie-recommender-backend.onrender.com`
- `REACT_APP_ML_API_URL` = `https://movie-recommender-ml-api.onrender.com`

### Step 4: Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes
3. Get your new URL!

---

## Method 2: Deploy via CLI (Command Line)

### Step 1: Navigate to React Frontend
```bash
cd "/Volumes/2-2-22/BEATZBYJAVA PRODUCTIONS WEB/MOVIE-RECOMMENDER/fullstack_recsys/react-front"
```

### Step 2: Login to Vercel
```bash
vercel login
```
Choose: **GitHub** (recommended)

### Step 3: Deploy
```bash
vercel --prod
```

### Step 4: Answer Prompts
When asked:
- **Set up and deploy?** → Type `Y` and press Enter
- **Which scope?** → Select your account (usually first option)
- **Link to existing project?** → Type `N` (create new) or `Y` (use existing)
- **Project name?** → Press Enter (uses `react-front`)
- **Directory?** → Press Enter (uses `./`)
- **Override settings?** → Press Enter (uses defaults)

### Step 5: Set Environment Variables
After deployment, set environment variables:
```bash
vercel env add REACT_APP_API_URL production
# Enter: https://movie-recommender-backend.onrender.com

vercel env add REACT_APP_ML_API_URL production
# Enter: https://movie-recommender-ml-api.onrender.com
```

---

## 🔧 Troubleshooting Common Issues

### Issue 1: "Build Command Failed"
**Solution:**
- Make sure you're in the `react-front` directory
- Check that `package.json` has the build script
- Try building locally first: `npm run build`

### Issue 2: "Directory Not Found"
**Solution:**
- Make sure Root Directory is set to: `fullstack_recsys/react-front`
- Or deploy from the react-front directory using CLI

### Issue 3: "Environment Variables Not Working"
**Solution:**
- Environment variables MUST start with `REACT_APP_`
- Redeploy after adding environment variables
- Check in Vercel dashboard → Settings → Environment Variables

### Issue 4: "Module Not Found"
**Solution:**
- Make sure `node_modules` is NOT in `.gitignore` (it should be)
- Vercel will install dependencies automatically
- Check `package.json` has all dependencies listed

### Issue 5: "Build Timeout"
**Solution:**
- Free tier has build time limits
- Optimize your build (remove unused imports)
- Consider upgrading to Pro tier

---

## ✅ Quick Checklist Before Deploying

- [ ] You're in the correct directory (`react-front`)
- [ ] `package.json` exists and has build script
- [ ] `build` folder exists (run `npm run build` first)
- [ ] `vercel.json` exists (for routing)
- [ ] Environment variables are ready
- [ ] You're logged into Vercel

---

## 🎯 Recommended: Use Dashboard Method

**Why?**
- ✅ Visual interface - easier to see what's happening
- ✅ Can set environment variables easily
- ✅ Can see build logs in real-time
- ✅ Can rollback if something goes wrong
- ✅ Better error messages

---

## 📝 After Successful Deployment

1. **Get your URL**: Vercel will give you a URL like `https://react-front-xyz.vercel.app`
2. **Test your app**: Open the URL in browser
3. **Update backend CORS**: Add your new Vercel URL to backend's `VERCEL_URL` env var
4. **Delete old deployment**: Remove the old URL you don't want

---

## 🆘 Still Having Issues?

1. **Check Vercel Dashboard** → Your Project → Deployments → Click on failed deployment → View logs
2. **Common fixes:**
   - Make sure Node.js version is compatible (check `.nvmrc`)
   - Clear Vercel cache: Dashboard → Settings → Clear Build Cache
   - Try deploying from a fresh clone

---

## Quick Command Reference

```bash
# Build locally first
cd react-front
npm install
npm run build

# Deploy to Vercel
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs
```


