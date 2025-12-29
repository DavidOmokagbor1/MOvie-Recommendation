# MongoDB Atlas Setup Guide

## ✅ Connection Status
Your MongoDB Atlas connection is **successfully configured** and tested!

## 📋 What's Been Done

1. ✅ **MongoDB Dependencies Installed**
   - `pymongo==4.6.0`
   - `dnspython==2.4.2`

2. ✅ **Configuration Updated**
   - MongoDB URI added to `backend/config.py`
   - Connection string configured

3. ✅ **MongoDB Client Module Created**
   - `backend/mongodb_client.py` - Handles MongoDB connections
   - Singleton pattern for efficient connection management

4. ✅ **Connection Tested**
   - Test script confirms successful connection
   - Database `movierecommender` is ready

## 🚀 Next Steps

### Step 1: Migrate Your Data (Optional but Recommended)

If you want to move your existing SQLite data to MongoDB:

```bash
cd backend
python3 migrate_to_mongodb.py
```

This will:
- Copy all Users from SQLite to MongoDB
- Copy all Movies from SQLite to MongoDB
- Copy all Interactions from SQLite to MongoDB
- Create indexes for better performance

### Step 2: Update Your Application Code

Currently, your app still uses SQLAlchemy (SQLite). You have two options:

#### Option A: Keep Both (Hybrid Approach)
- Use SQLite for local development
- Use MongoDB for production
- Switch based on environment variable

#### Option B: Full Migration to MongoDB
- Update all database queries to use MongoDB
- Replace SQLAlchemy models with MongoDB collections
- More work but cleaner architecture

### Step 3: Update run.py to Use MongoDB

You'll need to update your routes in `backend/run.py` to query MongoDB instead of SQLAlchemy. Here's an example:

**Before (SQLAlchemy):**
```python
movies = Movie.query.all()
```

**After (MongoDB):**
```python
from app import mongodb
movies_collection = mongodb['movies']
movies = list(movies_collection.find())
```

## 🔧 Environment Variables

For production, use environment variables instead of hardcoding:

```bash
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/?appName=MovieRecommender"
export MONGODB_DB_NAME="movierecommender"
```

## 📊 MongoDB Collections Structure

After migration, you'll have these collections:

1. **users** - User accounts
   - `_id`: user ID
   - `username`, `email`, `password_hash`
   - `age`, `gender`, `created_at`, `is_active`

2. **movies** - Movie catalog
   - `_id`: movie ID
   - `title`, `genre`, `date`, `poster`

3. **interactions** - User-movie interactions
   - `user_id`, `movie_id`
   - `rating`, `timestamp`, `interaction_type`, `created_at`

## 🔒 Security Notes

1. **Never commit your connection string to Git**
   - Use environment variables
   - Add `.env` to `.gitignore`

2. **IP Whitelist in MongoDB Atlas**
   - Add your server IP addresses
   - For development: `0.0.0.0/0` (not recommended for production)

3. **Database User Permissions**
   - Use read/write permissions only
   - Don't use admin credentials

## 🧪 Testing

Test your connection anytime:
```bash
cd backend
python3 test_mongodb.py
```

## 📝 Example: Querying MongoDB

```python
from app import mongodb

# Get all movies
movies_collection = mongodb['movies']
all_movies = list(movies_collection.find())

# Get movie by ID
movie = movies_collection.find_one({'_id': 1})

# Insert new movie
movies_collection.insert_one({
    '_id': 999,
    'title': 'New Movie',
    'genre': 'Action',
    'date': '2024-01-01',
    'poster': None
})

# Update movie
movies_collection.update_one(
    {'_id': 1},
    {'$set': {'title': 'Updated Title'}}
)

# Delete movie
movies_collection.delete_one({'_id': 999})
```

## 🚢 Deployment Considerations

When deploying your app:

1. **Set Environment Variables** on your hosting platform
2. **Whitelist Server IP** in MongoDB Atlas Network Access
3. **Use Connection Pooling** (already handled by PyMongo)
4. **Monitor Connection Limits** (MongoDB Atlas free tier has limits)

## 📚 Resources

- [PyMongo Documentation](https://pymongo.readthedocs.io/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Python Driver](https://www.mongodb.com/docs/drivers/python/)

## ⚠️ Important Notes

- Your connection string contains credentials - keep it secure!
- MongoDB Atlas free tier has limitations (512MB storage, shared cluster)
- Consider upgrading for production use
- Always test migrations on a copy of your data first





