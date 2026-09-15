# Installation Instructions

## Step 1: Navigate to Project

```powershell
cd d:\FYP\skyrecon-unified
```

## Step 2: Install Dependencies

```powershell
npm install
```

This will install:
- React 18.3.1
- Vite 5.4.21
- Tailwind CSS
- Framer Motion
- Chart.js
- Express
- WebSocket
- And all other dependencies

**Installation time**: 3-5 minutes depending on internet speed

## Step 3: Verify Installation

```powershell
npm run dev
```

You should see:
```
  ➜  Local:   http://localhost:5174/
  ➜  Backend: http://localhost:3001
```

## Step 4: Open in Browser

- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3001/api/health

## Step 5: Login

Use any of these credentials:
- Email: `drone.operator@example.com`
- Password: `operator123`

## Troubleshooting

### npm install fails
```powershell
# Clear npm cache
npm cache clean --force
npm install
```

### Port 3001 already in use
```powershell
# Change port in .env.local
$env:PORT = 3002
npm run dev
```

### Module not found errors
```powershell
# Reinstall dependencies
rm -r node_modules package-lock.json
npm install
```

## Success!

You should now see the SkyRecon dashboard with all 9 tabs and full functionality ready to use.

