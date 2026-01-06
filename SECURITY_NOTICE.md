# 🔒 Security Notice

## Important: Environment Variables Required

This application **requires** environment variables to be set. All secrets have been removed from the codebase for security.

## Required Environment Variables

### Backend (`fullstack_recsys/backend/`)

1. **SECRET_KEY** (REQUIRED)
   - Used for JWT token signing and Flask session encryption
   - Generate a secure key:
     ```bash
     python -c "import secrets; print(secrets.token_hex(32))"
     ```
   - Set it:
     ```bash
     export SECRET_KEY='your-generated-secret-key-here'
     ```

2. **MONGODB_URI** (REQUIRED)
   - MongoDB Atlas connection string
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/?appName=MovieRecommender`
   - Set it:
     ```bash
     export MONGODB_URI='mongodb+srv://username:password@cluster.mongodb.net/?appName=MovieRecommender'
     ```

### Optional Environment Variables

- `MONGODB_DB_NAME` - Database name (defaults to 'movierecommender')
- `TMDB_API_KEY` - For enhanced movie details (optional)
- `OMDB_API_KEY` - For movie posters (optional)
- `FLASK_ENV` - Flask environment (defaults to 'production')
- `DATABASE_URL` - SQLite database URL (for fallback)

## Setup Instructions

1. **Copy the example file**:
   ```bash
   cd fullstack_recsys/backend
   cp env.example .env
   ```

2. **Edit `.env`** and fill in your actual values:
   ```bash
   nano .env  # or use your preferred editor
   ```

3. **Load environment variables**:
   ```bash
   # For bash/zsh
   export $(cat .env | xargs)
   
   # Or use python-dotenv (recommended)
   pip install python-dotenv
   # Then add to your code: from dotenv import load_dotenv; load_dotenv()
   ```

4. **Verify**:
   ```bash
   echo $SECRET_KEY  # Should show your key
   echo $MONGODB_URI  # Should show your MongoDB URI (first 50 chars)
   ```

## For Deployment (Render/Vercel)

Set these as environment variables in your deployment platform:

- **Render**: Dashboard → Your Service → Environment → Add Environment Variable
- **Vercel**: Project Settings → Environment Variables

## Security Best Practices

✅ **DO**:
- Use environment variables for all secrets
- Use strong, randomly generated SECRET_KEY
- Rotate credentials if exposed
- Keep `.env` files in `.gitignore` (already configured)
- Use different credentials for development and production

❌ **DON'T**:
- Commit `.env` files to version control
- Hardcode secrets in code
- Share credentials in documentation
- Use weak or default secret keys

## If Credentials Were Exposed

If you suspect credentials were exposed:

1. **MongoDB Atlas**:
   - Go to MongoDB Atlas → Database Access
   - Change the password for the exposed user
   - Update IP whitelist if needed

2. **SECRET_KEY**:
   - Generate a new SECRET_KEY
   - Update all deployments with the new key
   - Note: Existing JWT tokens will be invalidated

3. **API Keys** (TMDB, OMDb):
   - Regenerate API keys from their respective dashboards
   - Update environment variables

## Need Help?

See `fullstack_recsys/backend/env.example` for a template of all required environment variables.

