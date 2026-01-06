// API Configuration
// These will be set by environment variables during build
const config = {
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:5555',
  ML_API_URL: process.env.REACT_APP_ML_API_URL || 'http://localhost:8000',
};

export default config;




