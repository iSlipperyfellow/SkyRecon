/**
 * API client for backend communication
 */

import axios, { AxiosInstance } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class APIClient {
  client: AxiosInstance;
  token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = Cookies.get('access_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 responses
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired, redirect to login
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async login(username: string, password: string) {
    const response = await this.client.post('/auth/token/', { username, password });
    const { access, refresh } = response.data;

    Cookies.set('access_token', access, { expires: 0.25 }); // 6 hours
    Cookies.set('refresh_token', refresh, { expires: 1 });

    return response.data;
  }

  logout() {
    Cookies.remove('access_token');
    Cookies.remove('refresh_token');
  }

  // Drones
  async getDrones(filters?: Record<string, any>) {
    return this.client.get('/drones/', { params: filters });
  }

  async getDrone(id: string) {
    return this.client.get(`/drones/${id}/`);
  }

  async getDroneTelemetry(id: string) {
    return this.client.get(`/drones/${id}/telemetry/`);
  }

  async sendDroneCommand(id: string, command: string, data?: Record<string, any>) {
    return this.client.post(`/drones/${id}/command/`, {
      command,
      ...data,
    });
  }

  // Detections
  async getDetections(filters?: Record<string, any>) {
    return this.client.get('/detections/', { params: filters });
  }

  async clearDetections() {
    return this.client.delete('/detections/clear_all/');
  }

  async getDetection(id: string) {
    return this.client.get(`/detections/${id}/`);
  }

  async getNearestDetections(lat: number, lng: number, radius_m: number = 1000) {
    return this.client.get('/detections/nearest/', {
      params: { lat, lng, radius_m },
    });
  }

  async createDetection(data: Record<string, any>) {
    return this.client.post('/detections/', data);
  }

  // Hazards
  async getHazards(filters?: Record<string, any>) {
    return this.client.get('/hazards/', { params: filters });
  }

  async getHazard(id: string) {
    return this.client.get(`/hazards/${id}/`);
  }

  async archiveHazard(id: string) {
    return this.client.post(`/hazards/${id}/archive/`);
  }

  async archiveBulkHazards(ids: string[]) {
    return this.client.post('/hazards/archive_bulk/', { ids });
  }

  async acknowledgeHazard(id: string) {
    return this.client.post(`/hazards/${id}/acknowledge/`);
  }

  // Flights
  async getFlights(filters?: Record<string, any>) {
    return this.client.get('/flights/', { params: filters });
  }

  async getFlight(id: string) {
    return this.client.get(`/flights/${id}/`);
  }

  async createFlight(data: Record<string, any>) {
    return this.client.post('/flights/', data);
  }

  async getFlightPath(id: string) {
    return this.client.get(`/flights/${id}/path/`);
  }

  // Reports
  async getReports() {
    return this.client.get('/reports/');
  }

  getReportDownloadUrl(filename: string) {
    return `${this.client.defaults.baseURL}/reports/${filename}/download/`;
  }

  // Maps
  async getRunways() {
    return this.client.get('/maps/runways/');
  }

  async getHeatmap() {
    return this.client.get('/maps/heatmap/');
  }

  // Health
  async getHealth() {
    return this.client.get('/health/');
  }

  async getHealthMetrics() {
    return this.client.get('/health/metrics/');
  }

  // Analytics
  async getAnalytics() {
    return this.client.get('/analytics/');
  }

  // Inference
  async submitFrame(droneId: string, frameUrl: string, flightId?: string) {
    return this.client.post('/inference/submit-frame/', {
      drone_id: droneId,
      frame_url: frameUrl,
      flight_id: flightId,
    });
  }

  async getInferenceResults(jobId: string) {
    return this.client.get('/inference/results/', { params: { job_id: jobId } });
  }

  // Models (Module 4)
  async getModels() {
    return this.client.get('/models/');
  }

  async uploadModel(formData: FormData) {
    return this.client.post('/models/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async deployModel(id: string) {
    return this.client.post(`/models/${id}/deploy/`);
  }

  async archiveModel(id: string) {
    return this.client.post(`/models/${id}/archive/`);
  }

  async deleteModel(id: string) {
    return this.client.delete(`/models/${id}/`);
  }

  // Users
  async getUsers() {
    return this.client.get('/users/');
  }

  // Host Simulator Control
  async controlSimulator(action: 'start' | 'stop', script: string) {
    return this.client.post('/host/command/', { action, script });
  }
}

export const apiClient = new APIClient();
