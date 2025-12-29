#!/usr/bin/env python3
"""
Script to add poster URLs to all movies in MongoDB
Uses a placeholder service to generate poster images with movie titles
"""
import sys
import os
from urllib.parse import quote

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, mongodb
from db_helper import use_mongodb
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_poster_url(movie_title, movie_id):
    """
    Generate a poster URL using a placeholder service
    Uses a service that creates movie poster-like placeholders
    """
    # Clean title for URL - remove year in parentheses
    import re
    clean_title = re.sub(r'\s*\(\d{4}\)\s*', '', movie_title).strip()
    # Truncate if too long
    if len(clean_title) > 25:
        clean_title = clean_title[:22] + "..."
    
    # Use placeholder.com with movie poster dimensions (300x450)
    # Dark blue background (#1a1a2e) with white text for movie poster look
    encoded_title = quote(clean_title)
    # Use a gradient-like dark background color for movie poster aesthetic
    poster_url = f"https://via.placeholder.com/300x450/2c3e50/ecf0f1?text={encoded_title}"
    return poster_url

def add_posters_to_mongodb():
    """Add poster URLs to all movies in MongoDB"""
    with app.app_context():
        if not use_mongodb() or mongodb is None:
            logger.error("MongoDB is not available or has no data")
            return False
        
        try:
            movies_collection = mongodb['movies']
            movies = list(movies_collection.find({}))
            total = len(movies)
            updated = 0
            
            logger.info(f"Found {total} movies to update")
            
            for movie in movies:
                movie_id = movie.get('_id')
                title = movie.get('title', 'Unknown')
                current_poster = movie.get('poster')
                
                # Update poster even if it exists (to use improved format)
                # Uncomment the next 2 lines to skip existing posters:
                # if current_poster:
                #     continue
                
                # Generate poster URL
                poster_url = generate_poster_url(title, movie_id)
                
                # Update movie in MongoDB
                movies_collection.update_one(
                    {'_id': movie_id},
                    {'$set': {'poster': poster_url}}
                )
                updated += 1
                
                if updated % 100 == 0:
                    logger.info(f"Updated {updated}/{total} movies...")
            
            logger.info(f"✅ Successfully updated {updated} movies with poster URLs")
            return True
            
        except Exception as e:
            logger.error(f"Error updating posters: {e}")
            import traceback
            traceback.print_exc()
            return False

if __name__ == '__main__':
    print("🎬 Adding poster URLs to movies...")
    print("=" * 50)
    success = add_posters_to_mongodb()
    if success:
        print("\n✅ Done! All movies now have poster URLs")
        print("\n💡 Note: These are placeholder images. For real movie posters,")
        print("   you can integrate with TMDB API or OMDb API.")
    else:
        print("\n❌ Failed to update posters")
        sys.exit(1)

