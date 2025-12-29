# Movie Recommender API Documentation

## Base URL
```
http://localhost:5555
```

## Available Endpoints

### 1. Get All Movies (with Pagination)
**GET** `/api/movies`

Get all movies with optional pagination.

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `per_page` (optional, default: 50, max: 100) - Number of movies per page

**Example:**
```bash
curl http://localhost:5555/api/movies?page=1&per_page=10
```

**Response:**
```json
{
  "result": [
    {
      "id": 0,
      "title": "Kolya",
      "genre": "Comedy",
      "date": "1997-01-24",
      "poster": null
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 1682,
    "pages": 169
  }
}
```

---

### 2. Get Movie by ID
**GET** `/api/movies/<movie_id>`

Get a specific movie by its ID.

**Example:**
```bash
curl http://localhost:5555/api/movies/0
```

**Response:**
```json
{
  "result": {
    "id": 0,
    "title": "Kolya",
    "genre": "Comedy",
    "date": "1997-01-24",
    "poster": null
  }
}
```

**Error Response (404):**
```json
{
  "message": "Movie with ID 9999 not found",
  "error": "NOT_FOUND"
}
```

---

### 3. Search Movies
**GET** `/api/movies/search`

Search movies by title or filter by genre.

**Query Parameters:**
- `q` (optional) - Search query (searches in movie titles)
- `genre` (optional) - Filter by genre

**Examples:**
```bash
# Search by title
curl "http://localhost:5555/api/movies/search?q=action"

# Filter by genre
curl "http://localhost:5555/api/movies/search?genre=Comedy"

# Search and filter
curl "http://localhost:5555/api/movies/search?q=star&genre=Sci-Fi"
```

**Response:**
```json
{
  "result": [
    {
      "id": 1,
      "title": "Star Wars",
      "genre": "Sci-Fi, Action",
      "date": "1977-05-25",
      "poster": null
    },
    ...
  ],
  "count": 5,
  "query": "star",
  "genre": "Sci-Fi"
}
```

---

### 4. Get Database Statistics
**GET** `/api/stats`

Get database statistics including counts and genre distribution.

**Example:**
```bash
curl http://localhost:5555/api/stats
```

**Response:**
```json
{
  "result": {
    "database": "MongoDB",
    "movies": 1682,
    "users": 944,
    "interactions": 100000,
    "genres": {
      "Action": 251,
      "Comedy": 298,
      "Drama": 436,
      "Horror": 92,
      ...
    }
  },
  "timestamp": "2025-12-28T18:30:00.000000"
}
```

---

### 5. Get Recommendations
**POST** `/recommend`

Get movie recommendations based on user context.

**Request Body:**
```json
{
  "context": [1, 5, 10],
  "model": "EASE"
}
```

**Available Models:**
- `EASE` - Embarrassingly Shallow Autoencoders
- `ItemKNN` - Item-based Collaborative Filtering
- `NeuralMF` - Neural Matrix Factorization
- `DeepFM` - Deep Factorization Machine

**Example:**
```bash
curl -X POST http://localhost:5555/recommend \
  -H "Content-Type: application/json" \
  -d '{"context": [1, 5, 10], "model": "EASE"}'
```

**Response:**
```json
{
  "result": [
    {
      "id": 50,
      "title": "Recommended Movie",
      "genre": "Action",
      "date": "1995-01-01",
      "poster": null
    },
    ...
  ]
}
```

---

### 6. Initialize (Get All Movies - Legacy)
**GET** `/init`

Get all movies (legacy endpoint, use `/api/movies` for new code).

**Example:**
```bash
curl http://localhost:5555/init
```

**Response:**
```json
{
  "result": [
    {
      "id": 0,
      "title": "Kolya",
      "genre": "Comedy",
      "date": "1997-01-24",
      "poster": null
    },
    ...
  ]
}
```

---

## Error Responses

All endpoints return standard error responses:

**400 Bad Request:**
```json
{
  "message": "Error description",
  "error": "ERROR_CODE"
}
```

**404 Not Found:**
```json
{
  "message": "Resource not found",
  "error": "NOT_FOUND"
}
```

**500 Internal Server Error:**
```json
{
  "message": "Internal server error",
  "error": "INTERNAL_ERROR"
}
```

---

## Database Information

- **Current Database:** MongoDB Atlas
- **Database Name:** `movierecommender`
- **Collections:**
  - `movies` - Movie catalog (1,682 movies)
  - `users` - User accounts (944 users)
  - `interactions` - User-movie interactions (100,000 interactions)

---

## Connection String

Your MongoDB connection string (for reference):
```
mongodb+srv://davidomokagbor_db_user:wbJK8zq0ie8teCNp@movierecommender.x0gaqcb.mongodb.net/?appName=MovieRecommender
```

**⚠️ Security Note:** Never expose this connection string publicly. Use environment variables in production.

---

## MongoDB Atlas Dashboard

Access your MongoDB Atlas dashboard:
- **URL:** https://cloud.mongodb.com
- **Cluster:** movierecommender.x0gaqcb.mongodb.net
- **Database:** movierecommender

---

## Example Usage

### Python
```python
import requests

# Get all movies (first page)
response = requests.get('http://localhost:5555/api/movies?page=1&per_page=10')
movies = response.json()

# Get specific movie
movie = requests.get('http://localhost:5555/api/movies/0').json()

# Search movies
results = requests.get('http://localhost:5555/api/movies/search?q=action').json()

# Get statistics
stats = requests.get('http://localhost:5555/api/stats').json()

# Get recommendations
recommendations = requests.post(
    'http://localhost:5555/recommend',
    json={'context': [1, 5, 10], 'model': 'EASE'}
).json()
```

### JavaScript/Node.js
```javascript
// Get all movies
fetch('http://localhost:5555/api/movies?page=1&per_page=10')
  .then(res => res.json())
  .then(data => console.log(data));

// Get specific movie
fetch('http://localhost:5555/api/movies/0')
  .then(res => res.json())
  .then(data => console.log(data));

// Search movies
fetch('http://localhost:5555/api/movies/search?q=action')
  .then(res => res.json())
  .then(data => console.log(data));

// Get recommendations
fetch('http://localhost:5555/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ context: [1, 5, 10], model: 'EASE' })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

---

## Notes

- All endpoints return JSON
- The API uses MongoDB as the primary database (falls back to SQLite if MongoDB unavailable)
- Pagination is available for the movies endpoint
- Search is case-insensitive
- Genre filtering supports partial matches


