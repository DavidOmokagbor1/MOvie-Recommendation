import os
import logging
from dotenv import load_dotenv
from flask import Flask
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
]

# Add Vercel domain from environment variable if set
vercel_url = os.getenv('VERCEL_URL')
if vercel_url:
    # Add with https:// prefix
    if not vercel_url.startswith('http'):
        allowed_origins.append(f"https://{vercel_url}")
    else:
        allowed_origins.append(vercel_url)

# Allow all origins in development, restrict in production
if os.getenv('FLASK_ENV') == 'production':
    # TEMPORARY: Allow all origins to fix CORS issue
    # TODO: Restrict to specific domains once verified working
    # In production, allow all origins for now (can be restricted later)
    CORS(app, resources={
        r"/*": {
            "origins": "*",  # Allow all origins temporarily
            "methods": ["GET", "POST", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": False
        }
    })
    logger.info(f"CORS configured for production (allowing all origins temporarily). Vercel URL: {vercel_url}")
else:
    # Development: allow all origins
    CORS(app, resources={r"/*": {"origins": "*"}})
    logger.info("CORS configured for development (allowing all origins)")

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