import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate

from config import Config, BASE_DIR
from mongodb_client import mongodb_client, init_mongodb

app = Flask(__name__)
app.config.from_object(Config)
app.app_context().push()

# SQLAlchemy (for backward compatibility)
db = SQLAlchemy()
db.init_app(app)

# MongoDB connection
mongodb_client.connect()
mongodb = mongodb_client.get_database()

flask_bcrypt = Bcrypt()
flask_bcrypt.init_app(app)

migrate = Migrate(app, db)

# Initialize MongoDB for Flask
init_mongodb(app)