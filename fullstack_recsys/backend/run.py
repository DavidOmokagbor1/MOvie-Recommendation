import json
import logging
import os
from datetime import datetime
from flask.json import jsonify
from flask import request
import requests

from flask import render_template

from app import app, db, migrate
from app.model import User, Movie, Interaction
from db_helper import get_all_movies, get_movies_by_ids, get_movie_by_id, use_mongodb, save_interaction
from tmdb_helper import get_enhanced_movie_details

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get ML API URL from environment variable, with fallback for local development
ML_API_BASE = os.getenv('ML_API_URL', 'http://0.0.0.0:8000')
# Ensure the URL format is correct for string formatting
if ML_API_BASE.endswith('%s'):
    API_ADDRESS = ML_API_BASE
else:
    API_ADDRESS = f"{ML_API_BASE}%s"

@app.route('/recommend', methods=['POST'])
def recommend():
	"""Get movie recommendations"""
	try:
		data = request.get_json()
		
		if not data:
			return jsonify({'message': 'No data provided', 'error': 'MISSING_DATA'}), 400
		
		if 'context' not in data or not data['context']:
			return jsonify({'message': 'Context (movie IDs) is required', 'error': 'MISSING_CONTEXT'}), 400
		
		if 'model' not in data:
			return jsonify({'message': 'Model name is required', 'error': 'MISSING_MODEL'}), 400
		
		# Call recommendation API
		try:
			response = requests.post(
				API_ADDRESS % '/api/recommend', 
				json=data,
				timeout=30
			)
			response.raise_for_status()
			res = response.json()
		except requests.exceptions.RequestException as e:
			logger.error(f"API request failed: {str(e)}")
			return jsonify({
				'message': 'Recommendation service unavailable',
				'error': 'API_ERROR'
			}), 503
		
		if 'result' not in res:
			return jsonify({'message': 'Invalid response from recommendation API', 'error': 'INVALID_RESPONSE'}), 500
		
		# Get movie details from database using unified helper
		recommend_items = get_movies_by_ids(res['result'])
		
		# Save recommendation interaction if user is authenticated
		user_id = None
		try:
			auth_header = request.headers.get('Authorization', '')
			if auth_header.startswith('Bearer '):
				# Extract user from token without requiring decorator
				import jwt
				token = auth_header.split(' ')[1]
				token_data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
				user_id = token_data.get('user_id')
				
				# Save interactions for recommended movies
				if user_id:
					for movie_id in res['result']:
						save_interaction(user_id, movie_id, 'recommend')
		except Exception as e:
			logger.warning(f"Failed to save recommendation interactions: {str(e)}")
			# Don't fail the request if interaction saving fails
		
		return jsonify({'result': recommend_items}), 200
		
	except Exception as e:
		logger.error(f"Recommendation error: {str(e)}")
		return jsonify({
			'message': 'Failed to get recommendations',
			'error': 'INTERNAL_ERROR'
		}), 500

@app.route('/init', methods=['GET'])
def init():
	"""Initialize and return all movies"""
	try:
		# Use unified database helper (works with both SQLite and MongoDB)
		all_items = get_all_movies()
		all_items = sorted(all_items, key=lambda x: x["id"])
		
		return jsonify({'result': all_items}), 200
		
	except Exception as e:
		logger.error(f"Init error: {str(e)}")
		return jsonify({
			'message': 'Failed to load movies',
			'error': 'INTERNAL_ERROR'
		}), 500

@app.route('/api/movies', methods=['GET'])
def get_movies():
	"""Get all movies with optional pagination"""
	try:
		
		# Get pagination parameters
		page = request.args.get('page', 1, type=int)
		per_page = request.args.get('per_page', 50, type=int)
		per_page = min(per_page, 100)  # Limit to 100 per page
		
		# Get all movies
		all_movies = get_all_movies()
		all_movies = sorted(all_movies, key=lambda x: x["id"])
		
		# Calculate pagination
		total = len(all_movies)
		start = (page - 1) * per_page
		end = start + per_page
		movies_page = all_movies[start:end]
		
		return jsonify({
			'result': movies_page,
			'pagination': {
				'page': page,
				'per_page': per_page,
				'total': total,
				'pages': (total + per_page - 1) // per_page
			}
		}), 200
		
	except Exception as e:
		logger.error(f"Get movies error: {str(e)}")
		return jsonify({
			'message': 'Failed to get movies',
			'error': 'INTERNAL_ERROR'
		}), 500

@app.route('/api/movies/<int:movie_id>', methods=['GET'])
def get_movie(movie_id):
	"""Get a specific movie by ID"""
	try:
		movie = get_movie_by_id(movie_id)
		
		if movie:
			return jsonify({'result': movie}), 200
		else:
			return jsonify({
				'message': f'Movie with ID {movie_id} not found',
				'error': 'NOT_FOUND'
			}), 404
		
	except Exception as e:
		logger.error(f"Get movie error: {str(e)}")
		return jsonify({
			'message': 'Failed to get movie',
			'error': 'INTERNAL_ERROR'
		}), 500

@app.route('/api/movies/<int:movie_id>/details', methods=['GET'])
def get_movie_details(movie_id):
	"""Get enhanced movie details with cast, crew, and additional info from TMDB"""
	try:
		# Get basic movie info from our database
		movie = get_movie_by_id(movie_id)
		
		if not movie:
			return jsonify({
				'message': f'Movie with ID {movie_id} not found',
				'error': 'NOT_FOUND'
			}), 404
		
		# Try to get enhanced details from TMDB
		enhanced_details = None
		try:
			enhanced_details = get_enhanced_movie_details(movie.get('title'), movie.get('date'))
		except Exception as e:
			logger.warning(f"Failed to fetch TMDB details: {e}")
		
		# Merge basic movie info with enhanced details
		result = {
			**movie,  # Basic info (id, title, genre, date, poster)
			'enhanced': enhanced_details  # Enhanced details from TMDB
		}
		
		return jsonify({'result': result}), 200
		
	except Exception as e:
		logger.error(f"Get movie details error: {str(e)}")
		return jsonify({
			'message': 'Failed to get movie details',
			'error': 'INTERNAL_ERROR'
		}), 500

@app.route('/api/movies/search', methods=['GET'])
def search_movies():
	"""Search movies by title or genre"""
	try:
		
		query = request.args.get('q', '').strip().lower()
		genre_filter = request.args.get('genre', '').strip()
		
		if not query and not genre_filter:
			return jsonify({
				'message': 'Search query (q) or genre filter required',
				'error': 'MISSING_PARAMETER'
			}), 400
		
		# Get all movies
		all_movies = get_all_movies()
		
		# Filter movies
		filtered_movies = []
		for movie in all_movies:
			title = movie.get('title', '').lower()
			genre = movie.get('genre', '').lower()
			
			# Check title match
			title_match = query in title if query else True
			
			# Check genre match
			genre_match = genre_filter.lower() in genre if genre_filter else True
			
			if title_match and genre_match:
				filtered_movies.append(movie)
		
		return jsonify({
			'result': filtered_movies,
			'count': len(filtered_movies),
			'query': query,
			'genre': genre_filter
		}), 200
		
	except Exception as e:
		logger.error(f"Search movies error: {str(e)}")
		return jsonify({
			'message': 'Failed to search movies',
			'error': 'INTERNAL_ERROR'
		}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
	"""Get database statistics"""
	try:
		from app import mongodb
		from app.model import Movie, User, Interaction
		
		stats = {}
		
		# Check which database is being used
		is_mongo = use_mongodb()
		stats['database'] = 'MongoDB' if is_mongo else 'SQLite'
		
		if is_mongo and mongodb is not None:
			# MongoDB stats
			try:
				movies_count = mongodb['movies'].count_documents({})
				users_count = mongodb['users'].count_documents({})
				interactions_count = mongodb['interactions'].count_documents({})
				
				# Get genre distribution
				movies_collection = mongodb['movies']
				genres = {}
				for movie in movies_collection.find({}, {'genre': 1}):
					genre_str = movie.get('genre', '')
					if genre_str:
						for genre in genre_str.split(','):
							genre = genre.strip()
							if genre:
								genres[genre] = genres.get(genre, 0) + 1
				
				stats['movies'] = movies_count
				stats['users'] = users_count
				stats['interactions'] = interactions_count
				stats['genres'] = genres
			except Exception as e:
				logger.error(f"MongoDB stats error: {e}")
				raise
		else:
			# SQLite stats
			movies_count = Movie.query.count()
			users_count = User.query.count()
			interactions_count = Interaction.query.count()
			
			# Get genre distribution
			genres = {}
			for movie in Movie.query.all():
				if movie.genre:
					for genre in movie.genre.split(','):
						genre = genre.strip()
						if genre:
							genres[genre] = genres.get(genre, 0) + 1
			
			stats['movies'] = movies_count
			stats['users'] = users_count
			stats['interactions'] = interactions_count
			stats['genres'] = genres
		
		return jsonify({
			'result': stats,
			'timestamp': datetime.utcnow().isoformat()
		}), 200
		
	except Exception as e:
		logger.error(f"Get stats error: {str(e)}")
		return jsonify({
			'message': 'Failed to get statistics',
			'error': 'INTERNAL_ERROR',
			'details': str(e)
		}), 500

@app.errorhandler(404)
def not_found(error):
	return jsonify({'message': 'Endpoint not found', 'error': 'NOT_FOUND'}), 404

@app.errorhandler(500)
def internal_error(error):
	db.session.rollback()
	return jsonify({'message': 'Internal server error', 'error': 'INTERNAL_ERROR'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5555, debug=True)