# SkyRecon Setup & Deployment Guide

## Prerequisites

- Node.js 16+ (https://nodejs.org)
- npm or yarn
- Git

## Installation

### 1. Clone & Navigate

```bash
cd d:\FYP\skyrecon-unified
```

### 2. Install Dependencies

```bash
npm install
```

This will install all frontend and backend dependencies.

### 3. Environment Setup

Create `.env.local` in the root directory:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_APP_NAME=SkyRecon
VITE_APP_VERSION=1.0.0
PORT=3001
NODE_ENV=development
```

## Development

### Start Development Servers

```bash
npm run dev
```

This starts:
- **Frontend**: http://localhost:5174 (Vite dev server with HMR)
- **Backend**: http://localhost:3001 (Express + WebSocket)

### Login with Test Credentials

1. Navigate to http://localhost:5174
2. Use any of these credentials:

```
drone.operator@example.com / operator123
admin@example.com / admin123
```

### Development Tips

- Frontend hot-reloads on file changes
- Backend requires restart on changes
- Open DevTools to see API calls
- WebSocket connected on login

## Production Build

### Build Frontend

```bash
npm run build
```

Creates optimized build in `dist/` folder

### Preview Production Build

```bash
npm run preview
```

Runs locally at http://localhost:4173

### Build Backend

Backend is ready to deploy as-is. Ensure `PORT` env variable is set.

## Deployment

### Option 1: Vercel + Railway

**Frontend (Vercel):**
1. Push to GitHub
2. Connect repository to Vercel
3. Set `VITE_API_BASE_URL` to your backend URL in environment variables

**Backend (Railway):**
1. Connect repository to Railway
2. Set PORT and NODE_ENV variables
3. Deploy

### Option 2: Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3001
CMD ["npm", "start"]
```

Build & run:

```bash
docker build -t skyrecon .
docker run -p 3001:3001 skyrecon
```

### Option 3: Self-Hosted (Linux/Ubuntu)

```bash
# SSH into server
ssh user@your-server.com

# Clone repo
git clone <your-repo>
cd skyrecon-unified

# Install & build
npm install
npm run build

# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server/index.js --name skyrecon
pm2 save

# Setup Nginx reverse proxy
# Create /etc/nginx/sites-available/skyrecon
# Add configuration pointing to localhost:3001
```

## Architecture

```
User Browser
    ↓
[Vite Frontend - React 18]
    ↓
[Express Backend]
    ├─ REST API Endpoints
    ├─ WebSocket Server
    └─ Mock Services
    ↓
[Services Layer]
    ├─ apiService (mock)
    ├─ WebSocket client
    └─ Auth service
```

## Key Files

- **Frontend Entry**: `src/main.jsx`
- **App Component**: `src/App.jsx`
- **Backend Entry**: `server/index.js`
- **Configuration**: `vite.config.js`, `tailwind.config.js`
- **Mock Data**: `src/data/mockData.js`
- **Airport Configs**: `src/data/airports.json`

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3001
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or change port in .env.local
PORT=3002
```

### Frontend Can't Connect to Backend

1. Check backend is running: `http://localhost:3001/api/health`
2. Verify `VITE_API_BASE_URL` in .env.local
3. Check CORS is enabled in `server/index.js`

### WebSocket Connection Failed

1. Check WebSocket URL: `ws://localhost:3001`
2. Verify backend is running
3. Check browser console for errors

## Monitoring & Logs

### Frontend Logs

Check browser DevTools Console tab

### Backend Logs

```bash
# View in terminal where npm run dev is running

# Or with PM2
pm2 logs skyrecon
```

## Performance Optimization

- **Lazy load tabs** with React.lazy() & Suspense
- **Code splitting** with Vite
- **Image optimization** - Use WebP where possible
- **Database indexing** - For large datasets
- **WebSocket compression** - Enable in production
- **CDN deployment** - For static assets

## Security Checklist

- ✅ HTTPS/TLS in production
- ✅ Environment variables for secrets
- ✅ CORS properly configured
- ✅ Input validation on all forms
- ✅ Rate limiting on API endpoints
- ✅ WebSocket authentication
- ✅ SQL injection prevention (when using real DB)
- ✅ CSRF protection tokens

## Next Steps

1. **Connect Real Backend**: Replace mock API with real endpoints
2. **Add Authentication**: Integrate Firebase, Auth0, or custom auth
3. **Database**: PostgreSQL, MongoDB, or DynamoDB
4. **Notifications**: Email/SMS alerts for critical hazards
5. **Monitoring**: Sentry, Datadog for production monitoring
6. **CI/CD**: GitHub Actions, GitLab CI for automated deployments

## Support & Documentation

- **API Docs**: See `server/index.js` comments
- **Component Docs**: Each tab component has comments
- **Config Docs**: Check `tailwind.config.js` for theme customization

