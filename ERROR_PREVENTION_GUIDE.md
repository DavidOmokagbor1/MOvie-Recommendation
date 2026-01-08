# 🛡️ Error Prevention Guide

This guide ensures your Movie Recommender app runs error-free for users.

## ✅ Critical Requirements

### 1. **Environment Variables** (MUST BE SET)

**Backend** (`fullstack_recsys/backend/.env`):
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=MovieRecommender
MONGODB_DB_NAME=movierecommender
FLASK_ENV=development  # or 'production' for deployment
SECRET_KEY=your-secret-key-here
```

**⚠️ IMPORTANT:** 
- `.env` file is gitignored (never commit it)
- Use `env.example` as a template
- Set these in your deployment platform (Render/Vercel) environment variables

### 2. **Model Checkpoints** (MUST EXIST)

Both models need trained checkpoints:
- ✅ `fullstack_recsys/api/recommend/ckpt/EASE_100.npy` (22MB)
- ✅ `fullstack_recsys/api/recommend/ckpt/ItemKNN_100.npz` (118KB)

**If missing, train them:**
```bash
cd fullstack_recsys/api
python3 fit_offline.py --model EASE --save_dir recommend/ckpt
python3 fit_offline.py --model ItemKNN --save_dir recommend/ckpt
```

### 3. **Service Dependencies**

All three services must be running:
- **ML API** (port 8000) - Provides recommendations
- **Backend** (port 5555) - Handles requests, connects to MongoDB
- **Frontend** (port 5052) - User interface

**Quick start:**
```bash
cd /Users/java/.cursor/worktrees/MOVIE-RECOMMENDER/jik
./fix-and-start.sh
```

## 🔍 Pre-Launch Verification

### Step 1: Test MongoDB Connection
```bash
cd fullstack_recsys/backend
python3 test_mongodb.py
```
**Expected:** ✅ Successfully connected to MongoDB Atlas!

### Step 2: Test All Endpoints
```bash
cd fullstack_recsys/backend
python3 test_endpoints.py
```
**Expected:** All 16 tests passing ✅

### Step 3: Test Both Models
```bash
# Test EASE
curl -X POST http://localhost:5555/recommend \
  -H "Content-Type: application/json" \
  -d '{"context": [1, 2, 3], "model": "EASE"}'

# Test ItemKNN
curl -X POST http://localhost:5555/recommend \
  -H "Content-Type: application/json" \
  -d '{"context": [1, 2, 3], "model": "ItemKNN"}'
```
**Expected:** Both return movie recommendations

### Step 4: Test Frontend
1. Open `http://localhost:5052`
2. Movies should load automatically
3. Select movies and click RECOMMEND
4. Try both EASE and ItemKNN models
5. Check browser console for errors

## 🚨 Common Errors & Fixes

### Error: "MONGODB_URI is empty or not set"
**Fix:** 
- Create `.env` file in `fullstack_recsys/backend/`
- Add your MongoDB connection string
- Restart backend

### Error: "503 Service Unavailable" on recommendations
**Fix:**
- Check ML API is running: `curl http://localhost:8000/api/health`
- Verify model checkpoints exist in `recommend/ckpt/`
- Restart ML API if needed

### Error: "Model checkpoint not found"
**Fix:**
- Train the missing model: `python3 fit_offline.py --model MODEL_NAME`
- Ensure checkpoint is in `recommend/ckpt/` directory

### Error: "Port already in use"
**Fix:**
```bash
# Kill existing processes
pkill -f "python.*api.py"
pkill -f "python.*run.py"
pkill -f "react-scripts"
```

### Error: CORS errors in browser
**Fix:**
- Verify backend CORS configuration allows frontend origin
- Check `config.js` has correct API URLs
- Ensure backend is running

## 📋 Deployment Checklist

### Before Deploying:

1. **Environment Variables Set:**
   - [ ] Backend: `MONGODB_URI`, `MONGODB_DB_NAME`, `FLASK_ENV`, `SECRET_KEY`
   - [ ] Frontend: `REACT_APP_API_URL`, `REACT_APP_ML_API_URL`
   - [ ] ML API: No special vars needed

2. **Model Checkpoints:**
   - [ ] EASE checkpoint exists and is committed (or uploaded to deployment)
   - [ ] ItemKNN checkpoint exists and is committed (or uploaded to deployment)

3. **MongoDB:**
   - [ ] MongoDB Atlas cluster is running
   - [ ] IP whitelist includes deployment platform IPs (or 0.0.0.0/0 for testing)
   - [ ] Database has movies, users, and interactions collections

4. **Code:**
   - [ ] All changes committed
   - [ ] No hardcoded credentials
   - [ ] `.env` files are gitignored
   - [ ] Error handling in place

5. **Testing:**
   - [ ] All tests passing locally
   - [ ] Both models work
   - [ ] Frontend loads without errors
   - [ ] Recommendations work

## 🔄 Maintenance

### Regular Checks:

1. **Monitor Logs:**
   ```bash
   tail -f /tmp/backend.log
   tail -f /tmp/ml_api.log
   ```

2. **Health Checks:**
   - Backend: `curl http://your-backend/api/stats`
   - ML API: `curl http://your-ml-api/api/health`

3. **Database:**
   - Check MongoDB connection status
   - Monitor collection sizes
   - Verify data integrity

### If Something Breaks:

1. Check service status (are all services running?)
2. Check logs for error messages
3. Verify environment variables are set
4. Test MongoDB connection
5. Verify model checkpoints exist
6. Check network connectivity between services

## 🎯 Success Criteria

Your app is ready when:
- ✅ All 16 backend tests pass
- ✅ Both EASE and ItemKNN models work
- ✅ Frontend loads movies without errors
- ✅ Recommendations work for both models
- ✅ No console errors in browser
- ✅ No 503/500 errors in network tab
- ✅ MongoDB connection stable
- ✅ All environment variables set
- ✅ Error messages are user-friendly

---

**Remember:** Always test locally before deploying to production!

