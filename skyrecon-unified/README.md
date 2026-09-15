# SkyRecon - Enterprise AI Debris Detection System

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
cd skyrecon-unified
npm install
```

### Development

Run both frontend and backend:

```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:5174 (Vite)
- **Backend**: http://localhost:3001 (Express + WebSocket)

### Production Build

```bash
npm run build
npm run preview
```

## 🏗️ Project Structure

```
skyrecon-unified/
├── src/
│   ├── components/
│   │   ├── auth/          # Login components
│   │   ├── layout/        # Header, Sidebar, Footer
│   │   ├── tabs/          # All 9 main tabs
│   │   └── common/        # Reusable components
│   ├── context/           # Auth & System context
│   ├── hooks/             # Custom hooks
│   ├── services/          # API services
│   ├── data/              # Mock data & configs
│   ├── styles/            # Global CSS
│   └── App.jsx            # Main app component
├── server/
│   └── index.js           # Express + WebSocket server
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

## 🎯 Features

### ✅ Authentication System
- Mock authentication with 5 pre-configured test users
- Session persistence with localStorage
- Role-based access control (operator, analyst, admin)
- Protected routes

### ✅ Dashboard (Home Tab)
- 7 main feature cards with status indicators
- Real-time statistics
- Quick access navigation

### ✅ Alerts & Notifications Tab
- Active/Archived filtering
- Severity levels (Critical, High, Medium)
- Bulk acknowledgement
- Real-time alert feed

### ✅ Drone Mission Control Tab
- Mission list & selection
- Real-time telemetry display
- Flight controls (Start, Pause, Terminate)
- Signal quality, battery, altitude monitoring

### ✅ Live Detection Feed Tab
- Simulated camera stream with SVG rendering
- Real-time bounding box annotations
- Detection confidence scores
- FPS & object count display

### ✅ Hazard Map Tab
- Interactive 3D/2D airport visualization with SVG
- Multiple configurable airports (KIA Karachi, Dubai)
- Real-time hazard markers
- Hazard type classification
- Click to zoom & detail view

### ✅ Analytics & Reports Tab
- Chart.js integration
- Detection trend graphs
- Model accuracy tracking
- Detection by type (bar chart)
- System performance radar chart
- Export functionality (ready for PDF/CSV)

### ✅ Model Management Tab
- Deployed models list
- Version control
- Model upload form
- Deploy/Archive/Delete actions
- Framework support (YOLOv8, TensorFlow, PyTorch, ONNX)
- Accuracy & latency metrics

### ✅ Admin Panel Tab (Admin Only)
- Settings: Confidence threshold, patrol interval, hazard alert threshold
- User management with role assignment
- Security settings (2FA, audit logging, IP whitelist)
- API key management

### ✅ Settings Tab
- Theme preferences (Auto/Light/Dark)
- Default airport selection
- Data retention configuration
- Notification preferences
- Account management

## 🔐 Test Credentials

All with password format: `{role}123`

| Email | Password | Role |
|-------|----------|------|
| drone.operator@example.com | operator123 | Operator |
| security.officer@example.com | security123 | Operator |
| analyst@example.com | analyst123 | Analyst |
| admin@example.com | admin123 | Admin |
| test@example.com | test123 | Operator |

## 🌐 API Endpoints

All endpoints are mocked with simulated delays:

- `GET /api/alerts` - Fetch alerts
- `GET /api/missions` - Fetch missions
- `GET /api/detections` - Fetch detections
- `GET /api/hazards` - Fetch hazards
- `GET /api/analytics` - Fetch analytics
- `GET /api/models` - Fetch models
- `GET /api/admin/settings` - Get settings
- `POST /api/alerts/:id/acknowledge` - Acknowledge alert
- `POST /api/missions/:id/start` - Start mission
- `POST /api/models/:id/deploy` - Deploy model

## 🔌 WebSocket Events

Real-time updates via WebSocket (`ws://localhost:3001`):

- `telemetry` - Drone telemetry updates
- `detection` - New object detections
- `hazard` - Hazard updates
- `alert` - New alerts

## 🎨 UI Features

- **Modern Design**: Glass morphism, soft blur, subtle glow
- **Dark Mode**: Full dark/light theme support
- **Animations**: Smooth transitions with Framer Motion
- **Responsive**: Mobile, Tablet, Desktop optimized
- **Status Colors**: Green (Active), Orange (Warning), Red (Critical)
- **Accessibility**: ARIA labels, keyboard navigation
- **Performance**: Lazy loading, optimized rendering

## 📊 Stack

**Frontend:**
- React 18.3.1
- Vite 5.4.21
- Tailwind CSS 3.4.1
- Framer Motion 11.0.8
- Chart.js 4.4.1
- Leaflet 1.9.4 (3D map ready)
- Three.js r128 (3D visualization ready)
- Zustand (state management ready)

**Backend:**
- Express.js
- WebSocket (ws)
- CORS enabled
- Environment variables support

## 🚀 Deployment

### Vercel (Frontend)
```bash
npm run build
# Deploy dist/ folder to Vercel
```

### Railway / Heroku (Backend)
```bash
npm start
# Deploy server/index.js
```

## 📝 Environment Variables

Create `.env.local`:

```
VITE_API_BASE_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
VITE_APP_NAME=SkyRecon
VITE_APP_VERSION=1.0.0
```

## 🤝 Integration Ready

This system is ready to integrate with:
- **Real Backend APIs** - Replace mock services
- **HuggingFace Models** - Via Model Management UI
- **Real-Time WebSocket** - Already configured
- **Databases** - PostgreSQL, MongoDB, etc.
- **Auth Services** - Firebase, Auth0, Cognito
- **Cloud Storage** - S3, GCS for model artifacts
- **Monitoring** - Datadog, New Relic, ELK stack

## 📄 License

© 2024 SkyRecon - All Rights Reserved

