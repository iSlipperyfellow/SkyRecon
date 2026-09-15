import express from 'express'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import dotenv from 'dotenv'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const PORT = process.env.PORT || 3001
const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

// Middleware
app.use(cors())
app.use(express.json())

// Simple API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalAlerts: 3,
    activeAlerts: 2,
    activeMissions: 1,
    hazardScore: 7.2,
    operationalStatus: 'normal',
  })
})

// WebSocket connections
const clients = new Set()

wss.on('connection', (ws) => {
  console.log('WebSocket client connected')
  clients.add(ws)

  ws.on('message', (message) => {
    console.log('Received:', message)
    // Broadcast to all clients
    clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(
          JSON.stringify({
            type: 'update',
            data: JSON.parse(message),
            timestamp: new Date().toISOString(),
          })
        )
      }
    })
  })

  ws.on('close', () => {
    console.log('WebSocket client disconnected')
    clients.delete(ws)
  })

  // Send initial connection message
  ws.send(
    JSON.stringify({
      type: 'connected',
      message: 'Connected to SkyRecon WebSocket server',
      timestamp: new Date().toISOString(),
    })
  )
})

// Simulate real-time telemetry
setInterval(() => {
  const telemetryUpdate = {
    type: 'telemetry',
    data: {
      droneId: 'DRONE-ALPHA',
      altitude: Math.floor(Math.random() * 100 + 20),
      speed: Math.random() * 20 + 10,
      battery: Math.floor(Math.random() * 30 + 60),
      signal: ['excellent', 'good', 'fair'][Math.floor(Math.random() * 3)],
    },
    timestamp: new Date().toISOString(),
  }

  clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(telemetryUpdate))
    }
  })
}, 3000)

server.listen(PORT, () => {
  console.log(`✅ SkyRecon Backend running on port ${PORT}`)
  console.log(`   API: http://localhost:${PORT}`)
  console.log(`   WebSocket: ws://localhost:${PORT}`)
})
