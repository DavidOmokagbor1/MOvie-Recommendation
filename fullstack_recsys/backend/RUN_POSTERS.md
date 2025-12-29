# How to Run the Poster Script

## Quick Commands

**From anywhere in the project:**

```bash
# Navigate to backend directory
cd "/Volumes/2-2-22/BEATZBYJAVA PRODUCTIONS WEB/MOVIE-RECOMMENDER/fullstack_recsys/backend"

# Test with 5 movies first (recommended)
./fetch_posters.sh --test

# Update all movies (after testing)
./fetch_posters.sh
```

## Step-by-Step

1. **Open terminal and navigate to backend:**
   ```bash
   cd "/Volumes/2-2-22/BEATZBYJAVA PRODUCTIONS WEB/MOVIE-RECOMMENDER/fullstack_recsys/backend"
   ```

2. **Set your API keys (if you have them):**
   ```bash
   export TMDB_API_KEY='your_api_key_here'
   export OMDB_API_KEY='your_omdb_key_here'
   ```

3. **Test with 5 movies:**
   ```bash
   ./fetch_posters.sh --test
   ```

4. **If test works, update all movies:**
   ```bash
   ./fetch_posters.sh
   ```

## Alternative: Use Python Directly

If the script doesn't work, use Python directly:

```bash
cd "/Volumes/2-2-22/BEATZBYJAVA PRODUCTIONS WEB/MOVIE-RECOMMENDER/fullstack_recsys/backend"

# Test
/usr/bin/python3 fetch_real_posters.py --test

# Update all
/usr/bin/python3 fetch_real_posters.py
```

## Troubleshooting

**If you get "command not found":**
- Make sure you're in the backend directory
- Check the script exists: `ls -la fetch_posters.sh`

**If you get "permission denied":**
- Make it executable: `chmod +x fetch_posters.sh`

**If you get "ModuleNotFoundError":**
- The script should handle this automatically
- If not, use the Python direct method above

