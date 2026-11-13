"""Pytest fixtures for Flask backend unit tests (SQLite temp DB, no MongoDB)."""
import atexit
import os
import sys
import tempfile
from pathlib import Path
from unittest.mock import patch

import pytest

# Ensure backend package root is importable and avoid live MongoDB *before* app import
BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

_db_fd, _DB_PATH = tempfile.mkstemp(suffix='.db')
os.close(_db_fd)
atexit.register(lambda: os.path.exists(_DB_PATH) and os.unlink(_DB_PATH))

os.environ['FLASK_ENV'] = 'testing'
os.environ.pop('MONGODB_URI', None)
os.environ['SECRET_KEY'] = 'test-secret-key-for-unit-tests'
os.environ['DATABASE_URL'] = f'sqlite:///{_DB_PATH}'


@pytest.fixture(scope='session')
def _flask_app():
    """Import the real app once with SQLite pointed at a temp file."""
    with patch('mongodb_client.mongodb_client.connect', return_value=False):
        from app import app, db
        import run  # noqa: F401 — registers routes on app

        app.config['TESTING'] = True
        app.config['SECRET_KEY'] = 'test-secret-key-for-unit-tests'
        app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{_DB_PATH}'

        with app.app_context():
            db.create_all()
        yield app, db


@pytest.fixture
def app_client(_flask_app):
    """Per-test client; clears User rows so auth tests stay isolated."""
    app, db = _flask_app
    from app.model import User, Interaction

    with patch('run.use_mongodb', return_value=False), \
         patch('db_helper.use_mongodb', return_value=False), \
         patch('db_helper.get_mongodb', return_value=None):
        with app.app_context():
            Interaction.query.delete()
            User.query.delete()
            db.session.commit()
        yield app.test_client()
        with app.app_context():
            Interaction.query.delete()
            User.query.delete()
            db.session.commit()
