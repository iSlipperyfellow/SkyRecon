import axios from 'axios'
import {
  mockAlerts,
  mockMissions,
  mockDetections,
  mockHazards,
  mockAnalytics,
  mockModels,
  mockSettings,
} from '@/data/mockData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Simulate API delays
const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

export const apiService = {
  // Alerts
  async getAlerts(status = 'all') {
    await delay()
    if (status === 'active') return mockAlerts.filter((a) => a.status === 'active')
    if (status === 'archived') return mockAlerts.filter((a) => a.status === 'archived')
    return mockAlerts
  },

  async acknowledgeAlert(alertId) {
    await delay()
    return { success: true, id: alertId }
  },

  async responseAlert(alertId, responseType) {
    await delay()
    return { success: true, id: alertId, response: responseType }
  },

  // Missions
  async getMissions() {
    await delay()
    return mockMissions
  },

  async getMissionStatus(missionId) {
    await delay()
    return mockMissions.find((m) => m.id === missionId)
  },

  async startMission(missionId) {
    await delay()
    return { success: true, id: missionId, status: 'active' }
  },

  async pauseMission(missionId) {
    await delay()
    return { success: true, id: missionId, status: 'paused' }
  },

  async terminateMission(missionId) {
    await delay()
    return { success: true, id: missionId, status: 'terminated' }
  },

  // Detections
  async getDetections() {
    await delay()
    return mockDetections
  },

  async getDetectionsFeed(limit = 10) {
    await delay()
    return mockDetections.slice(0, limit)
  },

  // Hazards
  async getHazards() {
    await delay()
    return mockHazards
  },

  async getHazardMap() {
    await delay()
    return mockHazards.map((h) => ({
      ...h,
      coordinates: h.coordinates,
    }))
  },

  async resolveHazard(hazardId) {
    await delay()
    return { success: true, id: hazardId, status: 'resolved' }
  },

  // Analytics
  async getAnalytics() {
    await delay()
    return mockAnalytics
  },

  // Models
  async getModels() {
    await delay()
    return mockModels
  },

  async uploadModel(formData) {
    await delay()
    return { success: true, modelId: 'model-' + Date.now() }
  },

  async deployModel(modelId) {
    await delay()
    return { success: true, id: modelId, status: 'deployed' }
  },

  async archiveModel(modelId) {
    await delay()
    return { success: true, id: modelId, status: 'archived' }
  },

  // Admin Settings
  async getSettings() {
    await delay()
    return mockSettings
  },

  async updateSettings(settings) {
    await delay()
    return { success: true, settings }
  },

  // Dashboard
  async getDashboardStats() {
    await delay()
    return {
      totalAlerts: mockAlerts.length,
      activeAlerts: mockAlerts.filter((a) => a.status === 'active').length,
      activeMissions: mockMissions.filter((m) => m.status === 'active').length,
      hazardScore: 7.2,
      operationalStatus: 'normal',
    }
  },
}

export default api
