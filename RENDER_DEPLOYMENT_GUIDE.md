# Render Deployment Guide - Backend & ML API

This guide provides step-by-step instructions for deploying both the backend and ML API services to Render.

> **Important**: All deployments use the `master` branch exclusively. No other branches are supported for production deployment.

## Prerequisites

- GitHub repository: `DavidOmokagbor1/MOvie-Recommendation` (up to date)
- MongoDB Atlas connection string ready
- Render account (sign up at https://render.com)
- Optional: TMDB API key, OMDb API key

## Part 1: Deploy Backend Service

### Step 1.1: Create Backend Web Service

1. Go to https://render.com and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect GitHub repository: `DavidOmokagbor1/MOvie-Recommendation`

### Step 1.2: Configure Backend Settings

**Basic Settings:**
- **Name**: `movie-recommender-backend`
- **Region**: Choose closest to you (e.g., Oregon US West)
- **Branch**: `master`
- **Root Directory**: `fullstack_recsys/backend`

**Build & Deploy:**
- **Runtime**: `Python 3`
- **Build Command**: 
  ```bash
  pip install --upgrade pip setuptools wheel && pip install -r requirements.txt
  ```
- **Start Command**: 
  ```bash
  gunicorn run:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
  ```

**Instance:**
- **Instance Type**: `Free` (512 MB RAM)

### Step 1.3: Set Backend Environment Variables

In Render dashboard → Your service → **Environment** tab, click **"Add Environment Variable"** and add:

**Required:**
```
MONGODB_URI=mongodb+srv://davidomokagbor_db_user:wbJK8zq0ie8teCNp@movierecommender.x0gaqcb.mongodb.net/?appName=MovieRecommender
FLASK_ENV=production
PYTHON_VERSION=3.9.6
```

**Note**: `ML_API_URL` will be added after ML API is deployed (see Step 2.4)

**Optional:**
```
TMDB_API_KEY=your_tmdb_api_key
OMDB_API_KEY=your_omdb_api_key
VERCEL_URL=your-vercel-app-url.vercel.app
```

### Step 1.4: Deploy Backend

1. Click **"Create Web Service"** at the bottom
2. Wait 5-10 minutes for first deployment
3. Watch the logs for progress
4. **Save your backend URL**: `https://movie-recommender-backend.onrender.com` (or your assigned URL)

## Part 2: Deploy ML API Service

### Step 2.1: Create ML API Web Service

1. In Render dashboard, click **"New +"** → **"Web Service"**
2. Connect same GitHub repository: `DavidOmokagbor1/MOvie-Recommendation`

### Step 2.2: Configure ML API Settings

**Basic Settings:**
- **Name**: `movie-recommender-ml-api`
- **Region**: Same as backend (for lower latency)
- **Branch**: `master`
- **Root Directory**: `fullstack_recsys/api`

**Build & Deploy:**
- **Runtime**: `Python 3`
- **Build Command**: 
  ```bash
  pip install --upgrade pip setuptools wheel && pip install -r ../backend/requirements.txt
  ```
- **Start Command**: 
  ```bash
  python api.py
  ```

**Instance:**
- **Instance Type**: `Free` (512 MB RAM)
- **Note**: If models are large, may need to upgrade to paid tier

### Step 2.3: Set ML API Environment Variables

In Render dashboard → Your ML API service → **Environment** tab, add:

```
PYTHON_VERSION=3.9.6
PORT=8000
```

**Note**: Render will override PORT with $PORT, but setting it helps with local compatibility.

### Step 2.4: Deploy ML API

1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. **Save your ML API URL**: `https://movie-recommender-ml-api.onrender.com` (or your assigned URL)

## Part 3: Connect Backend to ML API

### Step 3.1: Update Backend Environment Variable

1. Go to Render dashboard → Backend service → **Environment** tab
2. Click **"Add Environment Variable"** (or edit if you added a placeholder)
3. Add:
   ```
   ML_API_URL=https://movie-recommender-ml-api.onrender.com
   ```
   **Important**: Replace with your actual ML API URL from Step 2.4
4. Click **"Save Changes"**
5. Render will automatically redeploy the backend

### Step 3.2: Verify Connection

After redeployment, test the connection:

```bash
curl -X POST https://movie-recommender-backend.onrender.com/recommend \
  -H "Content-Type: application/json" \
  -d '{"context": [1, 5, 10], "model": "EASE"}'
```

Should return full movie objects with details.

## Part 4: Verify Deployment

### Step 4.1: Test Backend Endpoints

1. **Health Check - Init Endpoint**: 
   ```bash
   curl https://movie-recommender-backend.onrender.com/init
   ```
   Should return JSON with movies array

2. **Stats Endpoint**:
   ```bash
   curl https://movie-recommender-backend.onrender.com/api/stats
   ```
   Should return database statistics

3. **Search Endpoint**:
   ```bash
   curl "https://movie-recommender-backend.onrender.com/api/movies/search?q=star"
   ```
   Should return filtered movies

### Step 4.2: Test ML API

1. **Health Check**:
   ```bash
   curl https://movie-recommender-ml-api.onrender.com/api/health
   ```
   Should return: `{"status": "healthy", "service": "recommendation-api"}`

2. **Recommendation Endpoint**:
   ```bash
   curl -X POST https://movie-recommender-ml-api.onrender.com/api/recommend \
     -H "Content-Type: application/json" \
     -d '{"context": [1, 5, 10], "model": "EASE"}'
   ```
   Should return recommendation IDs

### Step 4.3: Test Full Integration

Test the complete recommendation flow:

```bash
curl -X POST https://movie-recommender-backend.onrender.com/recommend \
  -H "Content-Type: application/json" \
  -d '{"context": [1, 5, 10], "model": "EASE"}'
```

Should return full movie objects with details (not just IDs).

### Step 4.4: Run Automated Tests

Use the test script:

```bash
cd fullstack_recsys/backend
TEST_API_URL=https://movie-recommender-backend.onrender.com python test_endpoints.py
```

## Part 5: CORS Configuration (if deploying frontend)

If you plan to deploy frontend to Vercel:

1. In Render dashboard → Backend service → **Environment** tab
2. Add environment variable:
   ```
   VERCEL_URL=your-vercel-app-url.vercel.app
   ```
   **Note**: No `https://` prefix, just the domain
3. Click **"Save Changes"**
4. Render will auto-redeploy

The CORS configuration in `fullstack_recsys/backend/app/__init__.py` already reads this environment variable automatically.

## Important Notes

### Free Tier Limitations

- **Render free instances spin down after 15 minutes of inactivity**
- **First request after spin-down takes ~50 seconds** (cold start)
- Consider upgrading for production use

### Auto-Deployments

- Both services auto-deploy on git push to connected branch
- No manual deployment needed after initial setup
- Changes to environment variables trigger auto-redeploy

### Environment Variables Summary

**Backend Required:**
- `MONGODB_URI` - MongoDB connection string
- `FLASK_ENV=production`
- `PYTHON_VERSION=3.9.6`
- `ML_API_URL` - ML API service URL (set after ML API deployment)

**Backend Optional:**
- `TMDB_API_KEY` - For enhanced movie details
- `OMDB_API_KEY` - For movie posters
- `VERCEL_URL` - For CORS configuration

**ML API Required:**
- `PYTHON_VERSION=3.9.6`
- `PORT=8000` (optional, Render sets $PORT automatically)

## Troubleshooting

### Backend Build Fails

**Symptoms**: Build fails in Render logs

**Solutions**:
- Check Render logs for specific error
- Verify `requirements.txt` exists in `fullstack_recsys/backend/`
- Check Python version matches `runtime.txt` (3.9.6)
- Verify all dependencies are listed in requirements.txt

### Backend Can't Connect to ML API

**Symptoms**: `/recommend` endpoint returns 503

**Solutions**:
- Verify `ML_API_URL` environment variable is set correctly in backend
- Check ML API service is running (not spun down)
- Test ML API URL directly with curl
- Verify ML API URL doesn't have trailing slash
- Check backend logs for connection errors

### ML API Build Fails

**Symptoms**: ML API build fails

**Solutions**:
- Check if models are too large for free tier (check file sizes)
- Verify all dependencies in requirements.txt
- Check Render logs for memory issues
- Consider upgrading to paid tier if models are large

### Recommendations Return 503

**Symptoms**: Backend returns 503 when calling `/recommend`

**Solutions**:
- Verify ML API service is deployed and running
- Check `ML_API_URL` in backend environment variables
- Test ML API endpoint directly
- Check if ML API service has spun down (free tier limitation)
- Wait ~50 seconds for cold start if service was spun down

### Port Binding Errors

**Symptoms**: Service fails to start with port errors

**Solutions**:
- Verify Start Command uses `$PORT` (not hardcoded port)
- Check that `api.py` reads PORT from environment (already updated)
- Verify gunicorn command uses `0.0.0.0:$PORT`

## Success Criteria

After deployment, verify:

- [ ] Backend responds at `/init` endpoint
- [ ] Backend responds at `/api/stats` endpoint
- [ ] ML API responds at `/api/health` endpoint
- [ ] ML API responds at `/api/recommend` endpoint
- [ ] Backend can call ML API successfully
- [ ] Full recommendation flow works end-to-end
- [ ] No errors in Render logs
- [ ] Services auto-deploy on git push

## Next Steps

After successful deployment:

1. Deploy frontend to Vercel (see other deployment guides)
2. Set up CORS with VERCEL_URL environment variable
3. Monitor Render dashboards for performance
4. Set up error tracking (optional, e.g., Sentry)
5. Configure custom domain (optional)

## Quick Reference

**Your URLs (after deployment):**
- Backend: `https://movie-recommender-backend.onrender.com`
- ML API: `https://movie-recommender-ml-api.onrender.com`

**Key Files:**
- Backend config: `fullstack_recsys/backend/requirements.txt`
- Backend start: `fullstack_recsys/backend/Procfile`
- ML API: `fullstack_recsys/api/api.py`
- Backend routes: `fullstack_recsys/backend/run.py`

**Update Commands:**
```bash
# After making code changes
git add .
git commit -m "Your message"
git push origin master
# Render will auto-deploy both services
```



