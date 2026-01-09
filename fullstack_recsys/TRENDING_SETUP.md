# Real Trending Movies Setup Guide

## Overview
The Movie Recommender now supports real-time trending movies from The Movie Database (TMDB) API. If no API key is configured, it falls back to showing the newest movies from your database sorted by release date.

## Quick Setup

### Step 1: Get TMDB API Key (Free)
1. Go to https://www.themoviedb.org/
2. Sign up for a free account (or log in)
3. Navigate to **Settings** → **API** → **Request an API Key**
4. Choose "Developer" option (free)
5. Fill out the application form
6. Copy your API key (looks like: `abc123def456...`)

### Step 2: Add API Key to Backend
1. Open `backend/.env` file (create it if it doesn't exist)
2. Add this line:
   ```
   TMDB_API_KEY=your_api_key_here
   ```
3. Replace `your_api_key_here` with your actual API key

### Step 3: Restart Backend
```bash
# Stop the backend server (Ctrl+C)
# Then restart it
cd backend
python run.py
# or
./start.sh
```

## How It Works

### With TMDB API Key
- Fetches real-time trending movies from TMDB (weekly trending)
- Matches TMDB movies with your database by title
- Uses your database movie data but updates posters from TMDB
- Shows 10 trending movies in the carousel

### Without TMDB API Key (Fallback)
- Sorts movies from your database by release date (newest first)
- Shows 10 most recent movies with valid posters
- Still provides a good "trending" experience

## API Endpoint

The backend exposes a `/api/trending` endpoint that:
- Returns trending movies in JSON format
- Automatically uses TMDB if key is available
- Falls back to date-based sorting if no key

**Example Response:**
```json
{
  "result": [
    {
      "id": 1,
      "title": "Movie Title",
      "genre": "Action, Drama",
      "date": "2024-01-15",
      "poster": "https://..."
    },
    ...
  ]
}
```

## Testing

Test the endpoint:
```bash
curl http://localhost:5555/api/trending
```

## Troubleshooting

### No trending movies showing?
1. Check backend logs for errors
2. Verify API key is correct in `.env`
3. Ensure backend was restarted after adding key
4. Check browser console for frontend errors

### TMDB API errors?
- Verify your API key is valid
- Check TMDB API status: https://status.themoviedb.org/
- Ensure you're not exceeding rate limits (free tier: 40 requests/10 seconds)

## Benefits of Real Trending

✅ **Real-time data**: Shows what's actually trending right now  
✅ **Better engagement**: Users see current popular movies  
✅ **Automatic updates**: No manual curation needed  
✅ **High-quality posters**: TMDB provides better image quality  

## Notes

- TMDB API is free for non-commercial use
- Rate limits apply (40 requests per 10 seconds)
- The fallback (date-based) works perfectly fine if you prefer not to use TMDB

