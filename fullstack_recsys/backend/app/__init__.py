import os
import logging
from dotenv import load_dotenv
from flask import Flask, request
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from flask_cors import CORS

# Load environment variables from .env file before importing Config
load_dotenv()

from config import Config, BASE_DIR
from mongodb_client import mongodb_client, init_mongodb

logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config.from_object(Config)
app.app_context().push()

# Configure CORS for production and development
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5052",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5052",
    "https://movie-recommender-delta-eight.vercel.app",  # Vercel frontend
]

# Add Vercel domain from environment variable if set
vercel_url = os.getenv('VERCEL_URL')
if vercel_url:
    # Add with https:// prefix
    if not vercel_url.startswith('http'):
        allowed_origins.append(f"https://{vercel_url}")
    else:
        allowed_origins.append(vercel_url)

# Configure CORS to handle preflight requests properly
# This fixes the "Response to preflight request doesn't pass access control check" error
CORS(app, resources={
    r"/*": {
        "origins": "*",  # Allow all origins (can be restricted to allowed_origins list if needed)
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
        "expose_headers": ["Content-Type", "Content-Length", "Authorization"],
        "supports_credentials": False,
        "max_age": 3600  # Cache preflight for 1 hour
    }
}, supports_credentials=False)

logger.info(f"CORS configured. Allowed origins: {allowed_origins}. Vercel URL: {vercel_url}")

# SQLAlchemy (for backward compatibility)
db = SQLAlchemy()
db.init_app(app)

# MongoDB connection (lazy initialization to avoid build-time errors)
# Don't connect here - let it connect when actually needed
mongodb = None
logger.info("MongoDB connection will be initialized on first use")

flask_bcrypt = Bcrypt()
flask_bcrypt.init_app(app)

migrate = Migrate(app, db)

# Initialize MongoDB for Flask (with error handling)
try:
    init_mongodb(app)
except Exception as e:
    logger.warning(f"MongoDB initialization deferred: {e}")
    # App can still start without MongoDB, will use SQLite fallback

# Ensure CORS headers are always added, even for error responses
@app.after_request
def after_request(response):
    """Add CORS headers to all responses"""
    # Flask-CORS should handle this, but ensure headers are always present
    origin = request.headers.get('Origin')
    if origin:
        response.headers.add('Access-Control-Allow-Origin', origin)
    else:
        response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
    response.headers.add('Access-Control-Expose-Headers', 'Content-Type, Content-Length, Authorization')
    response.headers.add('Access-Control-Max-Age', '3600')
    return response