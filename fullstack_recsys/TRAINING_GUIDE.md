# Training Neural Models - Quick Guide

## Prerequisites

✅ PyTorch is now installed! (`pip3 install torch==1.9.0`)

## Training Commands

### For macOS (use `python3` instead of `python`):

**1. Train NeuralMF:**
```bash
cd api
python3 fit_offline.py --model NeuralMF --save_dir recommend/ckpt --epochs 20
```

**2. Train DeepFM:**
```bash
cd api
python3 fit_offline.py --model DeepFM --save_dir recommend/ckpt --epochs 20
```

**3. Train with fewer epochs (faster, for testing):**
```bash
python3 fit_offline.py --model NeuralMF --save_dir recommend/ckpt --epochs 5
```

## Testing the API

The POST request you saw is for **API testing**, not terminal commands. To test the API:

### Option 1: Using curl (in terminal)
```bash
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"context": [1, 5, 10], "model": "NeuralMF"}'
```

### Option 2: Using Python
```python
import requests

response = requests.post(
    'http://localhost:8000/api/recommend',
    json={'context': [1, 5, 10], 'model': 'NeuralMF'}
)
print(response.json())
```

### Option 3: Use the React frontend
The frontend already supports selecting models. Just make sure:
1. API server is running: `cd api && python3 api.py`
2. Backend is running: `cd backend && flask run`
3. Frontend is running: `cd react-front && npm start`

Then select "NeuralMF" or "DeepFM" from the dropdown in the UI!

## Important Notes

- **Use `python3` and `pip3`** on macOS (not `python` or `pip`)
- Training takes time (5-20 minutes depending on data size)
- Make sure the database is initialized before training
- Models will be saved in `api/recommend/ckpt/`

## Troubleshooting

**If you get "Module not found" errors:**
```bash
pip3 install -r requirements.txt
```

**If training is too slow:**
- Reduce epochs: `--epochs 5`
- Use CPU (default) - GPU will be used automatically if available

**If model file not found:**
- Make sure you've trained the model first
- Check that the file exists: `ls api/recommend/ckpt/`

