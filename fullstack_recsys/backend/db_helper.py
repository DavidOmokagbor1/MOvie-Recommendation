"""
Database helper module
Provides unified interface for both SQLite (SQLAlchemy) and MongoDB
"""
from app import db, mongodb
from app.model import Movie as SQLMovie, User as SQLUser, Interaction as SQLInteraction
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

def use_mongodb():
    """Check if MongoDB should be used and has data"""
    if mongodb is None:
        return False
    try:
        # Check if MongoDB has movies (if empty, fallback to SQLite)
        movies_collection = mongodb['movies']
        movie_count = movies_collection.count_documents({})
        # Only use MongoDB if it has data, otherwise fallback to SQLite
        return movie_count > 0
    except Exception as e:
        logger.warning(f"Error checking MongoDB: {e}, falling back to SQLite")
        return False

def get_all_movies():
    """Get all movies from database (SQLite or MongoDB)"""
    if use_mongodb():
        try:
            movies_collection = mongodb['movies']
            movies = list(movies_collection.find().sort('_id', 1))
            return [
                {
                    "id": movie.get('_id'),
                    "title": movie.get('title'),
                    "genre": movie.get('genre'),
                    "date": movie.get('date'),
                    "poster": movie.get('poster')
                }
                for movie in movies
            ]
        except Exception as e:
            logger.error(f"MongoDB query error: {e}, falling back to SQLite")
            # Fall through to SQLite
    
    # Fallback to SQLite (either MongoDB not available or empty)
    try:
        all_db_items = SQLMovie.query.all()
        return [
            {
                "id": item.id,
                "title": item.title,
                "genre": item.genre,
                "date": item.date.strftime('%Y-%b-%d') if item.date else None,
                "poster": item.poster if item.poster else None
            }
            for item in all_db_items
        ]
    except Exception as e:
        logger.error(f"SQLite query error: {e}")
        return []

def get_movie_by_id(movie_id):
    """Get a single movie by ID"""
    if use_mongodb():
        try:
            movies_collection = mongodb['movies']
            movie = movies_collection.find_one({'_id': movie_id})
            if movie:
                return {
                    "id": movie.get('_id'),
                    "title": movie.get('title'),
                    "genre": movie.get('genre'),
                    "date": movie.get('date'),
                    "poster": movie.get('poster')
                }
            return None
        except Exception as e:
            logger.error(f"MongoDB query error: {e}, falling back to SQLite")
            # Fall through to SQLite
    
    # Fallback to SQLite
    try:
        movie = SQLMovie.query.filter_by(id=movie_id).first()
        if movie:
            return {
                "id": movie.id,
                "title": movie.title,
                "genre": movie.genre,
                "date": movie.date.strftime('%Y-%b-%d') if movie.date else None,
                "poster": movie.poster if movie.poster else None
            }
        return None
    except Exception as e:
        logger.error(f"SQLite query error: {e}")
        return None

def get_movies_by_ids(movie_ids):
    """Get multiple movies by their IDs"""
    if use_mongodb():
        try:
            movies_collection = mongodb['movies']
            movies = list(movies_collection.find({'_id': {'$in': movie_ids}}))
            return [
                {
                    "id": movie.get('_id'),
                    "title": movie.get('title'),
                    "genre": movie.get('genre'),
                    "date": movie.get('date'),
                    "poster": movie.get('poster')
                }
                for movie in movies
            ]
        except Exception as e:
            logger.error(f"MongoDB query error: {e}, falling back to SQLite")
            # Fall through to SQLite
    
    # Fallback to SQLite
    try:
        movies = SQLMovie.query.filter(SQLMovie.id.in_(movie_ids)).all()
        return [
            {
                "id": item.id,
                "title": item.title,
                "genre": item.genre,
                "date": item.date.strftime('%Y-%b-%d') if item.date else None,
                "poster": item.poster if item.poster else None
            }
            for item in movies
        ]
    except Exception as e:
        logger.error(f"SQLite query error: {e}")
        return []

def save_interaction(user_id, movie_id, interaction_type='view', rating=None):
    """Save user interaction (works with both databases)"""
    if use_mongodb():
        try:
            interactions_collection = mongodb['interactions']
            interaction_doc = {
                'user_id': user_id,
                'movie_id': movie_id,
                'interaction_type': interaction_type,
                'rating': rating,
                'timestamp': int(datetime.utcnow().timestamp()),
                'created_at': datetime.utcnow().isoformat()
            }
            interactions_collection.replace_one(
                {'user_id': user_id, 'movie_id': movie_id},
                interaction_doc,
                upsert=True
            )
            return True
        except Exception as e:
            logger.error(f"MongoDB save error: {e}")
            return False
    else:
        try:
            from app import db
            from app.model import Interaction
            
            interaction = Interaction(
                user_id=user_id,
                movie_id=movie_id,
                interaction_type=interaction_type,
                rating=rating,
                timestamp=int(datetime.utcnow().timestamp())
            )
            # Check if exists
            existing = Interaction.query.filter_by(
                user_id=user_id,
                movie_id=movie_id
            ).first()
            if not existing:
                db.session.add(interaction)
                db.session.commit()
            return True
        except Exception as e:
            logger.error(f"SQLite save error: {e}")
            db.session.rollback()
            return False

