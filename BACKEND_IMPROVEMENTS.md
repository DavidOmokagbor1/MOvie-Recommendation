# Backend Improvements Documentation

## Overview
This document describes the backend improvements implemented for the Movie Recommender System.

## 1. User Authentication ✅

### Features
- JWT-based authentication
- User registration and login endpoints
- Password hashing with Flask-Bcrypt
- Token-based protected routes

### Endpoints

#### Register User
```
POST /api/auth/register
Body: {
  "username": "string",
  "email": "string",
  "password": "string",
  "age": int (optional),
  "gender": "string" (optional)
}
Response: {
  "message": "User registered successfully",
  "user": {...},
  "token": "jwt_token"
}
```

#### Login
```
POST /api/auth/login
Body: {
  "username": "string" (or "email"),
  "password": "string"
}
Response: {
  "message": "Login successful",
  "user": {...},
  "token": "jwt_token"
}
```

#### Get Current User
```
GET /api/auth/user
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "user": {...}
}
```

### Usage
Include the JWT token in the Authorization header for protected routes:
```
Authorization: Bearer <your_jwt_token>
```

## 2. User Interactions Tracking ✅

### Features
- Save user interactions (view, select, recommend, rate)
- Track movie selections and recommendations
- Batch interaction saving
- Retrieve user interaction history

### Endpoints

#### Save Interaction
```
POST /api/interactions
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "movie_id": int,
  "interaction_type": "view" | "select" | "recommend" | "rate",
  "rating": int (optional, for rate type)
}
```

#### Get User Interactions
```
GET /api/interactions
Headers: {
  "Authorization": "Bearer <token>"
}
Response: {
  "interactions": [...],
  "count": int
}
```

#### Save Batch Interactions
```
POST /api/interactions/batch
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "interactions": [
    {
      "movie_id": int,
      "interaction_type": "string",
      "rating": int (optional)
    },
    ...
  ]
}
```

### Interaction Types
- `view`: User viewed a movie
- `select`: User selected a movie for recommendations
- `recommend`: Movie was recommended to user
- `rate`: User rated a movie

## 3. Neural Network Models Support ✅

### Added Models
- **NeuralMF**: Neural Matrix Factorization (placeholder)
- **DeepFM**: Deep Factorization Machine (placeholder)

### Model Registry
Models are registered in `api/recommend/models/__init__.py`:
- EASE (working)
- ItemKNN (working)
- NeuralMF (placeholder - ready for implementation)
- DeepFM (placeholder - ready for implementation)

### Get Available Models
```
GET /api/models
Response: {
  "models": [
    {
      "name": "EASE",
      "type": "non-neural",
      "description": "..."
    },
    ...
  ]
}
```

## 4. Improved API Error Handling ✅

### Error Response Format
All errors now return consistent JSON format:
```json
{
  "error": "ERROR_CODE",
  "message": "Human-readable message",
  "details": "..." (optional)
}
```

### Error Codes
- `MISSING_DATA`: No data provided in request
- `MISSING_CONTEXT`: Movie IDs (context) not provided
- `MISSING_MODEL`: Model name not specified
- `INVALID_MODEL`: Model name not in available models
- `INVALID_CONTEXT`: Context format is invalid
- `MODEL_NOT_FOUND`: Model file not found
- `API_ERROR`: Recommendation API unavailable
- `INTERNAL_ERROR`: Server error
- `NOT_FOUND`: Endpoint not found

### Logging
- All errors are logged with appropriate levels
- Request/response logging for debugging
- Error details logged server-side (not exposed to client)

### Health Check
```
GET /api/health
Response: {
  "status": "healthy",
  "service": "recommendation-api"
}
```

## Database Schema Updates

### User Model
- Added: `username`, `email`, `password_hash`
- Added: `created_at`, `is_active`
- Methods: `set_password()`, `check_password()`, `to_dict()`

### Interaction Model
- Added: `interaction_type` (view, select, recommend, rate)
- Added: `created_at` timestamp
- Method: `to_dict()`

## Migration Instructions

1. **Install new dependencies:**
   ```bash
   pip install PyJWT==2.8.0
   ```

2. **Create database migration:**
   ```bash
   cd backend
   flask db migrate -m "Add authentication and interaction tracking"
   flask db upgrade
   ```

3. **Test endpoints:**
   - Register a user
   - Login to get token
   - Use token for protected routes

## Next Steps

1. **Implement Neural Network Models:**
   - Train NeuralMF model
   - Train DeepFM model
   - Add model checkpoints

2. **Frontend Integration:**
   - Add login/register UI
   - Store JWT token in localStorage
   - Send token with API requests
   - Track user interactions automatically

3. **Additional Features:**
   - User profile management
   - Recommendation history
   - Personalized recommendations based on user history
   - Rating system

