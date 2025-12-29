"""
MongoDB connection module for Movie Recommender
Handles connection to MongoDB Atlas
"""
from pymongo import MongoClient
from pymongo.server_api import ServerApi
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import logging
from config import Config

logger = logging.getLogger(__name__)

class MongoDBClient:
    """Singleton MongoDB client"""
    _instance = None
    _client = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MongoDBClient, cls).__new__(cls)
        return cls._instance
    
    def connect(self):
        """Connect to MongoDB Atlas"""
        if self._client is None:
            import ssl
            import certifi
            
            # Try multiple connection methods
            connection_methods = [
                # Method 1: Use certifi certificates explicitly
                {
                    'name': 'certifi certificates',
                    'kwargs': {
                        'server_api': ServerApi('1'),
                        'tls': True,
                        'tlsCAFile': certifi.where(),
                        'connectTimeoutMS': 30000,
                        'serverSelectionTimeoutMS': 30000,
                        'socketTimeoutMS': 30000,
                        'retryWrites': True
                    }
                },
                # Method 2: Standard connection
                {
                    'name': 'standard connection',
                    'kwargs': {
                        'server_api': ServerApi('1'),
                        'tls': True,
                        'connectTimeoutMS': 30000,
                        'serverSelectionTimeoutMS': 30000,
                        'socketTimeoutMS': 30000,
                        'retryWrites': True
                    }
                },
                # Method 3: Without explicit TLS (let URI handle it)
                {
                    'name': 'URI-based TLS',
                    'kwargs': {
                        'server_api': ServerApi('1'),
                        'connectTimeoutMS': 30000,
                        'serverSelectionTimeoutMS': 30000,
                        'socketTimeoutMS': 30000,
                        'retryWrites': True
                    }
                },
                # Method 4: Relaxed SSL (last resort for testing)
                {
                    'name': 'relaxed SSL (testing only)',
                    'kwargs': {
                        'server_api': ServerApi('1'),
                        'tls': True,
                        'tlsAllowInvalidCertificates': True,
                        'connectTimeoutMS': 30000,
                        'serverSelectionTimeoutMS': 30000,
                        'socketTimeoutMS': 30000,
                        'retryWrites': True
                    }
                }
            ]
            
            for method in connection_methods:
                try:
                    logger.info(f"Trying connection method: {method['name']}")
                    self._client = MongoClient(
                        Config.MONGODB_URI,
                        **method['kwargs']
                    )
                    # Test connection
                    self._client.admin.command('ping')
                    logger.info(f"✅ Successfully connected to MongoDB Atlas using: {method['name']}!")
                    return True
                except (ConnectionFailure, ServerSelectionTimeoutError) as e:
                    logger.warning(f"Method '{method['name']}' failed: {str(e)[:200]}")
                    if self._client:
                        try:
                            self._client.close()
                        except:
                            pass
                    self._client = None
                    continue
                except Exception as e:
                    logger.warning(f"Method '{method['name']}' error: {str(e)[:200]}")
                    if self._client:
                        try:
                            self._client.close()
                        except:
                            pass
                    self._client = None
                    continue
            
            # All methods failed
            logger.error("All connection methods failed. MongoDB connection unavailable.")
            return False
        return True
    
    def get_client(self):
        """Get MongoDB client instance"""
        if self._client is None:
            self.connect()
        return self._client
    
    def get_database(self, db_name=None):
        """Get database instance"""
        if db_name is None:
            db_name = Config.MONGODB_DB_NAME
        client = self.get_client()
        if client:
            return client[db_name]
        return None
    
    def close(self):
        """Close MongoDB connection"""
        if self._client:
            self._client.close()
            self._client = None
            logger.info("MongoDB connection closed")

# Global MongoDB client instance
mongodb_client = MongoDBClient()

def get_mongodb():
    """Get MongoDB database instance"""
    return mongodb_client.get_database()

def init_mongodb(app):
    """Initialize MongoDB connection for Flask app"""
    # Connect on app initialization
    mongodb_client.connect()
    
    @app.teardown_appcontext
    def close_mongodb_connection(error):
        # Don't close on every request, keep connection alive
        pass

