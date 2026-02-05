# Recommendation Models – Core Functionality Checklist

Backend is on **Render**. For **recommendations (EASE / ItemKNN)** to work end-to-end:

---

## 1. Backend (Render) – required env var

In **Render** → your **backend** service → **Environment**:

| Name         | Value |
|-------------|--------|
| **ML_API_URL** | Full URL of your ML API, **no trailing slash**. |

Examples:

- ML API on Render: `https://movie-recommender-ml-api.onrender.com`
- ML API on Cloud Run: `https://movie-recommender-ml-api-xxxxx.us-west1.run.app`

After adding or changing `ML_API_URL`, **Save**; Render will redeploy the backend.

---

## 2. ML API must be deployed and reachable

Recommendations work like this:

**Frontend** → **Backend** (`/recommend`) → **ML API** (`/api/recommend`)

So you need **one** of these:

### Option A: ML API on Render

1. **Render** → **New +** → **Web Service** → same repo.
2. **Name:** e.g. `movie-recommender-ml-api`
3. **Root Directory:** `fullstack_recsys/api`
4. **Build Command:**  
   `pip install --upgrade pip setuptools wheel && pip install -r requirements.txt`
5. **Start Command:**  
   `gunicorn api:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`
6. **Environment:** `PYTHON_VERSION=3.9` (or 3.9.x).
7. Deploy and copy the service URL → use it as **ML_API_URL** on the backend (Step 1).

### Option B: ML API on Cloud Run

Use your existing Cloud Run ML API URL as **ML_API_URL** on the backend (Step 1).

---

## 3. Which models will work

- **ItemKNN** – works if the repo (and deployed app) contains `fullstack_recsys/api/recommend/ckpt/ItemKNN_100.npz`.
- **EASE** – works only if `fullstack_recsys/api/recommend/ckpt/EASE_100.npy` exists (e.g. after training and committing, or added to the image).

Right now the repo has **ItemKNN_100.npz** only, so **ItemKNN** is the model that will work until you add/train EASE.

---

## 4. Quick test

**Backend health (Render):**

```bash
curl https://YOUR-BACKEND-URL.onrender.com/health
```

**Recommendations (backend calls ML API):**

```bash
curl -X POST https://YOUR-BACKEND-URL.onrender.com/recommend \
  -H "Content-Type: application/json" \
  -d '{"context": [1, 5, 10], "model": "ItemKNN"}'
```

If the second returns **200** and a list of movies, the core recommendation flow is working.

---

## Summary

| Item              | Action |
|-------------------|--------|
| Backend on Render | Set **ML_API_URL** to your ML API URL (Render or Cloud Run). |
| ML API            | Deploy on Render or Cloud Run; use correct build/start and Python 3.9. |
| Models            | ItemKNN works with current checkpoint; EASE needs `EASE_100.npy` in `recommend/ckpt`. |
