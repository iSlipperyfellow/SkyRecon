# Setup & Deployment Guide

Complete step-by-step guide for setting up, running, and deploying the Authentication App.

## Table of Contents

1. [Local Development](#local-development)
2. [Firebase Configuration](#firebase-configuration)
3. [Environment Variables](#environment-variables)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [Troubleshooting](#troubleshooting)

## Local Development

### Prerequisites

- **Node.js**: v16 or higher
- **npm**: v8 or higher
- **Git**: For version control
- **Firebase Account**: Free tier is sufficient

### Installation Steps

```bash
# 1. Navigate to project directory
cd auth-app

# 2. Install dependencies
npm install

# 3. Create .env.local file
cp .env.example .env.local

# 4. Add your Firebase credentials (see Firebase Configuration below)
# Edit .env.local and add your Firebase keys

# 5. Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

```bash
# Development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Lint code (if configured)
npm run lint

# Format code (if configured)
npm run format
```

## Firebase Configuration

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **"Create a project"**
3. Enter project name: `auth-app`
4. Follow the setup wizard to completion

### Step 2: Enable Email/Password Authentication

1. In Firebase Console, select your project
2. Navigate to **Authentication** (left sidebar)
3. Click **"Get started"**
4. Select **"Email/Password"**
5. Toggle "Enable" to ON
6. Click **"Save"**

### Step 3: Get Firebase Configuration

1. In Firebase Console, click **Settings icon** (gear) → **Project settings**
2. Scroll to "Your apps" section
3. Click on your web app or create new one if needed
4. Copy the configuration object

Example configuration:
```javascript
{
  "apiKey": "AIzaSyD-1234567890abcdefghijklmnopqr",
  "authDomain": "myapp-abc123.firebaseapp.com",
  "projectId": "myapp-abc123",
  "storageBucket": "myapp-abc123.appspot.com",
  "messagingSenderId": "123456789012",
  "appId": "1:123456789012:web:abc123def456ghi789jkl"
}
```

### Step 4: Update .env.local

Create `.env.local` file in the project root:

```env
VITE_FIREBASE_API_KEY=AIzaSyD-1234567890abcdefghijklmnopqr
VITE_FIREBASE_AUTH_DOMAIN=myapp-abc123.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=myapp-abc123
VITE_FIREBASE_STORAGE_BUCKET=myapp-abc123.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123def456ghi789jkl
```

### Step 5: Verify Connection

1. Start the app: `npm run dev`
2. Go to http://localhost:5173
3. Try signing up with an email
4. Check Firebase Console → Authentication → Users to verify the user was created

## Environment Variables

### Required Variables

All variables must be prefixed with `VITE_` to be accessible in the browser.

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIzaSyD...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `myapp.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `myapp-abc123` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `myapp.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123:web:abc` |

### File Locations

- **Development**: `.env.local` (not committed to git)
- **Production**: Environment variables in hosting platform
- **Template**: `.env.example` (committed to git)

### Security Notes

⚠️ **Important**: 
- Never commit `.env.local` to git
- Firebase keys are safe to expose in the browser (they're meant to be)
- Use Firebase Security Rules to protect your data
- Set up proper authentication rules before production

## Docker Deployment

### Prerequisites

- Docker installed and running
- `.env.local` file with Firebase credentials

### Quick Start

```bash
# Build and run with Docker Compose
docker-compose up --build

# App will be available at http://localhost
```

### Manual Docker Build

```bash
# Build the image
docker build -t auth-app:latest .

# Run the container
docker run -p 3000:3000 \
  -e VITE_FIREBASE_API_KEY=your_key \
  -e VITE_FIREBASE_AUTH_DOMAIN=your_domain \
  # ... other env vars
  auth-app:latest
```

### Docker Compose Services

The `docker-compose.yml` includes:

- **auth-app**: Main application (serves on port 3000)
- **nginx**: Reverse proxy and static file server (serves on port 80)

To use without nginx:
```bash
# Comment out nginx service in docker-compose.yml
# Or use:
docker run -p 3000:3000 auth-app:latest
```

### Docker Commands

```bash
# Build and start
docker-compose up --build

# Start existing containers
docker-compose up

# Stop containers
docker-compose down

# View logs
docker-compose logs -f auth-app

# View specific service logs
docker-compose logs -f nginx

# Restart services
docker-compose restart
```

## Production Deployment

### Deploy to Vercel (Recommended)

Vercel is optimized for Vite/React apps and offers free hosting.

#### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/auth-app.git
git push -u origin main
```

#### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"New Project"**
3. Select your GitHub repository
4. Click **"Import"**
5. Add Environment Variables:
   - Click **"Add"** for each variable
   - Add all `VITE_FIREBASE_*` variables
6. Click **"Deploy"**

Your app will be live at `your-project.vercel.app`

### Deploy to Firebase Hosting

Firebase Hosting is tightly integrated with Firebase authentication.

#### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### Step 2: Initialize Firebase

```bash
firebase login
firebase init hosting
```

Select options:
- Use existing project: Yes
- Public directory: `dist`
- Single-page app: Yes
- GitHub deploys: Optional

#### Step 3: Build and Deploy

```bash
npm run build
firebase deploy
```

Your app will be live at `your-project.firebaseapp.com`

### Deploy to Docker Hub

```bash
# Build the image
docker build -t username/auth-app:1.0 .

# Login to Docker
docker login

# Push to Docker Hub
docker push username/auth-app:1.0

# Others can run:
docker run -p 3000:3000 username/auth-app:1.0
```

### Deploy to AWS

**Using Amplify:**

```bash
npm install -g @aws-amplify/cli
amplify init
amplify add hosting
amplify publish
```

**Using S3 + CloudFront:**

```bash
# Build the app
npm run build

# Sync to S3
aws s3 sync dist/ s3://your-bucket-name/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
```

### Deploy to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click **"New site from Git"**
3. Select your GitHub repository
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Add environment variables (all `VITE_FIREBASE_*`)
7. Click **"Deploy"**

## Troubleshooting

### Common Issues

#### 1. "Cannot find module" errors

**Problem**: TypeScript/Vite can't resolve imports

**Solution**:
```bash
# Clear dependencies and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

#### 2. Firebase authentication not working

**Problem**: Sign up/login fails with error

**Solution**:
- Verify `.env.local` has correct Firebase credentials
- Check Firebase Console → Email/Password is enabled
- Check browser console for error messages
- Verify domain is in Firebase's authorized domains

**Add domain to Firebase:**
1. Firebase Console → Authentication → Settings
2. Add your domain to "Authorized domains"

#### 3. Dark mode not persisting

**Problem**: Theme resets on page refresh

**Solution**:
- Clear browser cache: Ctrl+Shift+Delete
- Check localStorage is enabled
- Try incognito/private window
- Check console for errors

#### 4. Build fails

**Problem**: `npm run build` produces errors

**Solution**:
```bash
# Force build with verbose output
npm run build -- --debug

# Check Node version
node --version  # Should be 16+

# Try clean install
rm -rf node_modules
npm install
npm run build
```

#### 5. Environment variables not loading

**Problem**: `process.env` returns undefined

**Solution**:
- Variables must start with `VITE_` in development
- Restart dev server after changing `.env.local`
- Use `import.meta.env.VITE_VARIABLE` not `process.env.VITE_VARIABLE`

#### 6. CORS errors when deploying

**Problem**: API calls fail with CORS error

**Solution**:
- Update Firebase Security Rules
- Ensure API endpoints allow your domain
- For Firebase: Security Rules are configured per-project

#### 7. Container won't start

**Problem**: Docker container exits immediately

**Solution**:
```bash
# Check logs
docker logs container-name

# Verify environment variables are passed
docker run -e VITE_FIREBASE_API_KEY=xxx ... auth-app

# Build with verbose output
docker build --progress=plain -t auth-app .
```

### Getting Help

1. **Check error message** - Browser console (F12)
2. **Search documentation** - README.md and SETUP_GUIDE.md
3. **Firebase Console** - Check project logs
4. **Browser DevTools** - Check Network tab for API calls
5. **GitHub Issues** - Search existing issues

### Debug Mode

```bash
# Run with debug logging
DEBUG=* npm run dev

# Verbose build output
npm run build -- --debug

# Docker with verbose logs
docker-compose logs -f --tail=100
```

---

**Need more help?** Check the main README.md or create an issue on GitHub.
