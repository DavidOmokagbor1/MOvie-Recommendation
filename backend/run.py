import json
import logging
from datetime import datetime
from flask.json import jsonify
from flask import request
import requests

from flask import render_template

from app import app, db, manager, migrate
from app.model import User, Movie, Interaction
from routes.auth import auth_bp
from routes.interactions import interactions_bp

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(interactions_bp, url_prefix='/api')

API_ADDRESS = 'http://0.0.0.0:8000%s'

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
		
		# Get movie details from database
		recommend_db_items = []
		for movie_id in res['result']:
			movie = Movie.query.filter_by(id=movie_id).first()
			if movie:
				recommend_db_items.append(movie)
		
		recommend_items = [
			{
				"id": item.id, 
				"title": item.title, 
				"genre": item.genre,
				"date": datetime.strftime(item.date, '%Y-%b-%d') if item.date else None
			}
			for item in recommend_db_items
		]
		
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
						interaction = Interaction(
							user_id=user_id,
							movie_id=movie_id,
							interaction_type='recommend',
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
		all_db_items = Movie.query.all()
		all_items = sorted([
			{
				"id": item.id, 
				"title": item.title, 
				"genre": item.genre, 
				"date": datetime.strftime(item.date, '%Y-%b-%d') if item.date else None
			}
			for item in all_db_items
		], key=lambda x: x["id"])
		
		return jsonify({'result': all_items}), 200
		
	except Exception as e:
		logger.error(f"Init error: {str(e)}")
		return jsonify({
			'message': 'Failed to load movies',
			'error': 'INTERNAL_ERROR'
		}), 500

@app.errorhandler(404)
def not_found(error):
	return jsonify({'message': 'Endpoint not found', 'error': 'NOT_FOUND'}), 404

@app.errorhandler(500)
def internal_error(error):
	db.session.rollback()
	return jsonify({'message': 'Internal server error', 'error': 'INTERNAL_ERROR'}), 500


@manager.command
def run():
	app.run()

if __name__ == '__main__':
    manager.run()