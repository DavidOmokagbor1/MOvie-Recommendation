# Quick Start: Real Movie Posters

## Get Your Free API Keys (5 minutes)

### TMDB API (Recommended - Best Quality)
1. Visit: https://www.themoviedb.org/signup
2. Sign up for free account
3. Go to: Settings → API → Request API Key
4. Choose "Developer"
5. Fill form → Submit → Copy your API key

### OMDb API (Optional - Fallback)
1. Visit: https://www.omdbapi.com/apikey.aspx
2. Choose FREE tier
3. Enter email → Get API key

## Set API Keys

**In your terminal:**
```bash
export TMDB_API_KEY='your_api_key_here'
export OMDB_API_KEY='your_omdb_key_here'  # Optional
```

**Or add to ~/.zshrc for permanent:**
```bash
echo 'export TMDB_API_KEY="your_api_key_here"' >> ~/.zshrc
source ~/.zshrc
```

## Run the Script

**Easy way (recommended):**
```bash
# Navigate to backend directory
cd "/Volumes/2-2-22/BEATZBYJAVA PRODUCTIONS WEB/MOVIE-RECOMMENDER/fullstack_recsys/backend"

# Test with 5 movies first
./fetch_posters.sh --test

# Update all movies (takes ~10-15 minutes for 1682 movies)
./fetch_posters.sh
```

**Or use Python directly:**
```bash
# Navigate to backend directory
cd "/Volumes/2-2-22/BEATZBYJAVA PRODUCTIONS WEB/MOVIE-RECOMMENDER/fullstack_recsys/backend"

# Test with 5 movies first
/usr/bin/python3 fetch_real_posters.py --test

# Update all movies
/usr/bin/python3 fetch_real_posters.py
```

> **Note:** 
> - Use the full path or navigate to the backend directory first
> - Use `/usr/bin/python3` (Python 3.9.6) instead of `python3` to ensure dependencies are available
> - Don't copy-paste comments (lines starting with `#`) - they're just for explanation

## That's It! 🎉

Your movies will now have real poster images from TMDB/OMDb instead of placeholders.

## What Happens

1. Script tries TMDB first (best quality)
2. Falls back to OMDb if TMDB doesn't have it
3. Uses placeholder if neither has it
4. Skips movies that already have real posters
5. Respects API rate limits automatically

## Need Help?

See `POSTER_API_SETUP.md` for detailed documentation.


