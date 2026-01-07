# 🚀 Production Readiness Checklist

This checklist ensures your Movie Recommender app is error-free and ready for users.

## ✅ Pre-Deployment Checklist

### 1. Environment Variables Setup

**Backend (.env file in `fullstack_recsys/backend/`):**
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?appName=MovieRecommender
MONGODB_DB_NAME=movierecommender
FLASK_ENV=production
SECRET_KEY=your-secure-secret-key-here
```

**Frontend (Vercel Environment Variables):**
- `REACT_APP_API_URL` - Your backend URL (e.g., `https://your-backend.onrender.com`)
- `REACT_APP_ML_API_URL` - Your ML API URL (e.g., `https://your-ml-api.onrender.com`)

**ML API (Render Environment Variables):**
- No special env vars needed (uses checkpoints from repo)

### 2. Model Checkpoints

Ensure both models are trained and checkpoints exist:
- ✅ `fullstack_recsys/api/recommend/ckpt/EASE_100.npy` (22MB)
- ✅ `fullstack_recsys/api/recommend/ckpt/ItemKNN_100.npz` (118KB)

**To train models:**
```bash
cd fullstack_recsys/api
python3 fit_offline.py --model EASE --save_dir recommend/ckpt
python3 fit_offline.py --model ItemKNN --save_dir recommend/ckpt
```

### 3. Security Checklist

- [x] `.env` file is in `.gitignore` (never commit secrets)
- [x] MongoDB credentials are in environment variables (not hardcoded)
- [x] SECRET_KEY is set for production
- [x] CORS is configured properly
- [ ] MongoDB Atlas IP whitelist includes your deployment IPs
- [ ] API keys (if using TMDB/OMDB) are in environment variables

### 4. Error Handling

**Backend:**
- ✅ MongoDB connection errors handled gracefully
- ✅ ML API connection errors return 503 (service unavailable)
- ✅ Missing data returns appropriate HTTP status codes
- ✅ CORS errors handled

**ML API:**
- ✅ Missing checkpoint files return clear error messages
- ✅ Invalid model names return 404
- ✅ Invalid context format returns 400

**Frontend:**
- ✅ Network errors show user-friendly messages
- ✅ Empty states handled (no movies, no recommendations)
- ✅ Loading states for async operations
- ✅ Image loading errors handled with placeholders

### 5. Testing

**Run full test suite:**
```bash
cd fullstack_recsys/backend
python3 test_endpoints.py
```
Expected: All 16 tests passing ✅

**Manual Testing:**
- [ ] Load movies on app start
- [ ] Search functionality works
- [ ] Select movies and get recommendations (EASE)
- [ ] Select movies and get recommendations (ItemKNN)
- [ ] Switch between models
- [ ] Movie detail modal opens
- [ ] No console errors in browser
- [ ] No 503/500 errors in network tab

### 6. Performance

- [ ] Images lazy-loaded (`loading="lazy"` attribute)
- [ ] Large model checkpoints excluded from git (use `.gitignore`)
- [ ] MongoDB indexes on frequently queried fields
- [ ] API response times < 2 seconds

### 7. Deployment Configuration

**Backend (Render):**
- [x] `Procfile` exists with gunicorn command
- [x] `requirements.txt` includes all dependencies
- [x] `MONGODB_URI` set in Render environment variables
- [x] `FLASK_ENV=production` set

**ML API (Render):**
- [x] `Procfile` exists with gunicorn command
- [x] `requirements.txt` includes all dependencies
- [x] Model checkpoints committed to repo (or uploaded separately)

**Frontend (Vercel):**
- [x] `package.json` has build script
- [x] Environment variables set in Vercel dashboard
- [x] `vercel.json` configured (if needed)

### 8. Monitoring & Logging

- [ ] Error logging configured (check `/tmp/backend.log`, `/tmp/ml_api.log`)
- [ ] Health check endpoints working (`/api/health`, `/api/stats`)
- [ ] Monitor MongoDB connection status
- [ ] Monitor API response times

### 9. Documentation

- [x] README.md updated with setup instructions
- [x] API documentation available
- [x] Environment variable examples provided (`env.example`)
- [ ] Deployment guide updated

### 10. Code Quality

- [x] All changes committed to git
- [x] No hardcoded credentials
- [x] Error messages are user-friendly
- [x] Code follows consistent style
- [ ] No console.log statements in production code (use proper logging)

## 🔧 Quick Health Check Commands

**Check if services are running:**
```bash
# Backend
curl http://localhost:5555/api/stats

# ML API
curl http://localhost:8000/api/health

# Test recommendations
curl -X POST http://localhost:5555/recommend \
  -H "Content-Type: application/json" \
  -d '{"context": [1, 2, 3], "model": "EASE"}'
```

**Check MongoDB connection:**
```bash
cd fullstack_recsys/backend
python3 test_mongodb.py
```

**Run full test suite:**
```bash
cd fullstack_recsys/backend
python3 test_endpoints.py
```

## 🚨 Common Issues & Solutions

### Issue: 503 Error on Recommendations
**Solution:** Check ML API is running and model checkpoints exist

### Issue: MongoDB Connection Failed
**Solution:** Verify `.env` file has correct `MONGODB_URI` and IP is whitelisted

### Issue: Models Not Available
**Solution:** Train models using `fit_offline.py` and ensure checkpoints are in `recommend/ckpt/`

### Issue: CORS Errors
**Solution:** Verify backend CORS configuration allows frontend origin

### Issue: Images Not Loading
**Solution:** Check poster URLs in database, image error handling is in place

## 📝 Final Steps Before Going Live

1. ✅ All tests passing
2. ✅ Environment variables set in production
3. ✅ Model checkpoints available
4. ✅ MongoDB connection working
5. ✅ All services running
6. ✅ No console errors
7. ✅ Error handling tested
8. ✅ Code committed and pushed
9. ✅ Documentation updated

---

**Last Updated:** After fixing EASE model training and enabling both models
