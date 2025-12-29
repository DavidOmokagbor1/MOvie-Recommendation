import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
	SECRET_KEY = os.getenv('SECRET_KEY', 'ITS-SECRET')
	
	# MongoDB Atlas connection string
	# Get from environment variable or use default
	MONGODB_URI = os.getenv(
		'MONGODB_URI', 
		'mongodb+srv://davidomokagbor_db_user:wbJK8zq0ie8teCNp@movierecommender.x0gaqcb.mongodb.net/?appName=MovieRecommender'
	)
	MONGODB_DB_NAME = os.getenv('MONGODB_DB_NAME', 'movierecommender')
	
	# SQLite (keep for backward compatibility or gradual migration)
	SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'sqlite:///' + os.path.join(BASE_DIR, 'app.db'))
	SQLALCHEMY_TRACK_MODIFICATIONS = False
	DEBUG = False
	
	# Movie Poster API Keys (optional)
	TMDB_API_KEY = os.getenv('TMDB_API_KEY', '')
	OMDB_API_KEY = os.getenv('OMDB_API_KEY', '')

key = Config.SECRET_KEY