# ML Recommendation API Setup Guide

## Overview

The Movie Recommender system uses a separate ML API service to generate movie recommendations. This service must be running and accessible for recommendations to work.

## Architecture

```
Frontend (Vercel) 
    ↓
Backend (Render) → ML API (Render/separate service)
    ↓
Recommendations returned to Frontend
```

## Setup Steps

### 1. Deploy ML API Service

The ML API is located in `fullstack_recsys/api/` directory. You need to deploy this as a separate service.

#### Option A: Deploy to Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the root directory to: `fullstack_recsys/api`
4. Build command: `pip install -r requirements.txt`
5. Start command: `python api.py` or use the provided `start_api.sh`
6. Set environment variables if needed

#### Option B: Run Locally

```bash
cd fullstack_recsys/api
pip install -r requirements.txt
python api.py
```

The ML API will run on `http://localhost:8000` by default.

### 2. Configure Backend to Use ML API

#### For Local Development

Add to `backend/.env`:
```bash
ML_API_URL=http://localhost:8000
```

#### For Production (Render)

1. Go to your Render backend service dashboard
2. Navigate to Environment variables
3. Add:
   - Key: `ML_API_URL`
   - Value: `https://your-ml-api-service.onrender.com` (your actual ML API URL)

### 3. Verify ML API is Running

Test the ML API endpoint:
```bash
curl -X POST https://your-ml-api-service.onrender.com/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "context": [1, 2, 3],
    "model": "ItemKNN"
  }'
```

Expected response:
```json
{
  "result": [4, 5, 6, ...],
  "model": "ItemKNN",
  "count": 10
}
```

### 4. Available Models

The ML API supports these models:
- **ItemKNN** - Item-based collaborative filtering (default, always available)
- **EASE** - Embarrassingly Shallow Autoencoders
- **NeuralMF** - Neural Matrix Factorization (requires training)
- **DeepFM** - Deep Factorization Machine (requires training)

### 5. Model Training

Some models (NeuralMF, DeepFM) require training before use:

```bash
cd fullstack_recsys/api
python fit_offline.py --model NeuralMF --save_dir recommend/ckpt
python fit_offline.py --model DeepFM --save_dir recommend/ckpt
```

ItemKNN and EASE models are pre-trained and available by default.

## Troubleshooting

### Error: "Cannot connect to recommendation service"

**Cause**: ML API service is not running or ML_API_URL is incorrect.

**Solution**:
1. Verify ML API is deployed and running
2. Check ML_API_URL environment variable in backend
3. Test ML API endpoint directly (see step 3 above)
4. Check backend logs for connection errors

### Error: "Model checkpoint file not found"

**Cause**: Model hasn't been trained yet.

**Solution**:
1. Train the model using `fit_offline.py`
2. Ensure checkpoint files are in `recommend/ckpt/` directory
3. For production, include checkpoint files in deployment

### Error: "No recommendations found"

**Cause**: Model couldn't generate recommendations for the selected movies.

**Solution**:
1. Try selecting different movies
2. Try a different model (ItemKNN is most reliable)
3. Check ML API logs for errors

### Error: "API_CONNECTION_ERROR"

**Cause**: Backend cannot reach ML API service.

**Solution**:
1. Verify ML_API_URL is correct
2. Check if ML API service is accessible from backend
3. Check firewall/network settings
4. Verify CORS is configured on ML API (if needed)

## Environment Variables Summary

### Backend (.env)
```bash
ML_API_URL=http://localhost:8000  # Local
# or
ML_API_URL=https://your-ml-api.onrender.com  # Production
```

### ML API Service
No special environment variables required, but you may need:
- `PORT` - Port to run on (default: 8000)
- Model checkpoint files in `recommend/ckpt/` directory

## Quick Start Checklist

- [ ] ML API service deployed/running
- [ ] ML_API_URL set in backend environment variables
- [ ] ML API endpoint accessible (test with curl)
- [ ] At least one model checkpoint available (ItemKNN recommended)
- [ ] Backend can connect to ML API (check logs)

## Support

If recommendations still don't work:
1. Check backend logs for detailed error messages
2. Test ML API endpoint directly
3. Verify all environment variables are set correctly
4. Ensure ML API service is running and accessible

