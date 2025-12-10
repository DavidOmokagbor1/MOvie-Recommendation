import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Blueprint, request, jsonify
from datetime import datetime
from app import db
from app.model import Interaction, Movie, User
from auth import token_required

interactions_bp = Blueprint('interactions', __name__)

@interactions_bp.route('/interactions', methods=['POST'])
@token_required
def save_interaction(current_user):
    """Save user interaction (view, select, recommend, rate)"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        movie_id = data.get('movie_id')
        interaction_type = data.get('interaction_type', 'view')  # view, select, recommend, rate
        rating = data.get('rating')
        
        if not movie_id:
            return jsonify({'message': 'movie_id is required'}), 400
        
        # Validate interaction type
        valid_types = ['view', 'select', 'recommend', 'rate']
        if interaction_type not in valid_types:
            return jsonify({'message': f'interaction_type must be one of {valid_types}'}), 400
        
        # Check if movie exists
        movie = Movie.query.filter_by(id=movie_id).first()
        if not movie:
            return jsonify({'message': 'Movie not found'}), 404
        
        # Check if interaction already exists
        interaction = Interaction.query.filter_by(
            user_id=current_user.id,
            movie_id=movie_id
        ).first()
        
        if interaction:
            # Update existing interaction
            interaction.interaction_type = interaction_type
            if rating is not None:
                interaction.rating = rating
            interaction.created_at = datetime.utcnow()
        else:
            # Create new interaction
            interaction = Interaction(
                user_id=current_user.id,
                movie_id=movie_id,
                interaction_type=interaction_type,
                rating=rating,
                timestamp=int(datetime.utcnow().timestamp())
            )
            db.session.add(interaction)
        
        db.session.commit()
        
        return jsonify({
            'message': 'Interaction saved successfully',
            'interaction': interaction.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to save interaction', 'error': str(e)}), 500

@interactions_bp.route('/interactions', methods=['GET'])
@token_required
def get_user_interactions(current_user):
    """Get all interactions for current user"""
    try:
        interactions = Interaction.query.filter_by(user_id=current_user.id).all()
        
        return jsonify({
            'interactions': [interaction.to_dict() for interaction in interactions],
            'count': len(interactions)
        }), 200
        
    except Exception as e:
        return jsonify({'message': 'Failed to fetch interactions', 'error': str(e)}), 500

@interactions_bp.route('/interactions/batch', methods=['POST'])
@token_required
def save_batch_interactions(current_user):
    """Save multiple interactions at once"""
    try:
        data = request.get_json()
        
        if not data or 'interactions' not in data:
            return jsonify({'message': 'interactions array is required'}), 400
        
        saved_count = 0
        for item in data['interactions']:
            movie_id = item.get('movie_id')
            interaction_type = item.get('interaction_type', 'view')
            
            if not movie_id:
                continue
            
            movie = Movie.query.filter_by(id=movie_id).first()
            if not movie:
                continue
            
            interaction = Interaction.query.filter_by(
                user_id=current_user.id,
                movie_id=movie_id
            ).first()
            
            if interaction:
                interaction.interaction_type = interaction_type
                interaction.created_at = datetime.utcnow()
            else:
                interaction = Interaction(
                    user_id=current_user.id,
                    movie_id=movie_id,
                    interaction_type=interaction_type,
                    rating=item.get('rating'),
                    timestamp=int(datetime.utcnow().timestamp())
                )
                db.session.add(interaction)
            
            saved_count += 1
        
        db.session.commit()
        
        return jsonify({
            'message': f'Successfully saved {saved_count} interactions',
            'count': saved_count
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Failed to save interactions', 'error': str(e)}), 500

