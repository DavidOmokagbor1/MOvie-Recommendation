# Setup Guide

## Prerequisites

### Node.js Version
This project requires **Node.js v18** (LTS) for optimal compatibility. If you're using `nvm`, the project includes a `.nvmrc` file:

```bash
cd react-front
nvm use
```

If you don't have Node.js v18, you can install it:
```bash
nvm install 18
nvm use 18
```

**Note:** If you're using Node.js v24+, the build will work but requires additional flags (already configured in package.json scripts).

### Python
The backend requires Python 3.7+. Install Python dependencies:

```bash
pip install -r requirements.txt
```

## Installation

### Frontend Dependencies
```bash
cd react-front
npm install --legacy-peer-deps
```

**Important:** Use `--legacy-peer-deps` flag due to peer dependency conflicts between React 17 and semantic-ui-react.

### Backend Dependencies
```bash
pip install -r requirements.txt
```

## Running the Application

### Development Mode

**Option 1: Run frontend and backend separately**

Frontend:
```bash
cd react-front
npm start
```

Backend:
```bash
cd backend
python run.py
```

**Option 2: Run both together**
```bash
cd react-front
npm run start-all
```

### API Server (Recommendation Engine)
```bash
cd react-front
npm run start-api
```

Or manually:
```bash
cd api
python api.py
```

## Building for Production

```bash
cd react-front
npm run build
```

The build output will be in the `react-front/build` directory.

## Troubleshooting

### Build Errors with Node.js v24+
If you encounter OpenSSL errors, the scripts already include `NODE_OPTIONS=--openssl-legacy-provider`. If issues persist, switch to Node.js v18.

### PostCSS Errors
The project includes npm overrides to handle PostCSS compatibility. If you still encounter issues, try:
```bash
cd react-front
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Port Conflicts
- Frontend runs on: `http://localhost:3000`
- Backend runs on: `http://localhost:5000`
- API server runs on: `http://localhost:8000`

Make sure these ports are available.

## Fixed Issues

✅ React JSX syntax errors (changed `class` to `className`)
✅ Node.js v24+ OpenSSL compatibility (added legacy provider flag)
✅ PostCSS compatibility (added npm overrides)
✅ Peer dependency conflicts (using --legacy-peer-deps)

