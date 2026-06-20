import axios from "axios";

const API_BASE = "http://localhost:8000";

const api = axios.create({
  baseURL: API_BASE,
});

export function getUserId(): string {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get("user_id");
  if (fromUrl) {
    localStorage.setItem("pacewell_user_id", fromUrl);
    return fromUrl;
  }
  return localStorage.getItem("pacewell_user_id") || "";
}

export function setUserId(id: string) {
  localStorage.setItem("pacewell_user_id", id);
}

// Auth
export function getFitbitAuthUrl(userId: string): string {
  return `${API_BASE}/auth/fitbit/start?user_id=${encodeURIComponent(userId)}`;
}

// Fitbit sync
export async function syncToday(userId: string) {
  const resp = await api.post(`/fitbit/sync/today?user_id=${userId}`);
  return resp.data;
}

export async function syncDate(userId: string, date: string) {
  const resp = await api.post(`/fitbit/sync/date/${date}?user_id=${userId}`);
  return resp.data;
}

// Heart rate
export async function getHRToday(userId: string) {
  const resp = await api.get(`/heart-rate/today?user_id=${userId}`);
  return resp.data;
}

export async function getHRByDate(userId: string, date: string) {
  const resp = await api.get(`/heart-rate/date/${date}?user_id=${userId}`);
  return resp.data;
}

export async function getHREventsToday(userId: string) {
  const resp = await api.get(`/heart-rate/events/today?user_id=${userId}`);
  return resp.data;
}

export async function getHREventsByDate(userId: string, date: string) {
  const resp = await api.get(
    `/heart-rate/events/date/${date}?user_id=${userId}`
  );
  return resp.data;
}

// Activities
export async function createActivity(
  userId: string,
  data: {
    activity_type: string;
    started_at: string;
    ended_at?: string;
    intensity?: string;
    notes?: string;
  }
) {
  const resp = await api.post(`/activities?user_id=${userId}`, data);
  return resp.data;
}

export async function getActivities(userId: string, date?: string) {
  const params = date ? `?user_id=${userId}&date=${date}` : `?user_id=${userId}`;
  const resp = await api.get(`/activities${params}`);
  return resp.data;
}

export async function deleteActivity(userId: string, activityId: string) {
  const resp = await api.delete(
    `/activities/${activityId}?user_id=${userId}`
  );
  return resp.data;
}

// Symptoms
export async function createSymptom(
  userId: string,
  data: {
    symptom_type: string;
    severity: number;
    occurred_at: string;
    duration_minutes?: number;
    notes?: string;
  }
) {
  const resp = await api.post(`/symptoms?user_id=${userId}`, data);
  return resp.data;
}

export async function getSymptoms(userId: string, date?: string) {
  const params = date ? `?user_id=${userId}&date=${date}` : `?user_id=${userId}`;
  const resp = await api.get(`/symptoms${params}`);
  return resp.data;
}

export async function deleteSymptom(userId: string, symptomId: string) {
  const resp = await api.delete(`/symptoms/${symptomId}?user_id=${userId}`);
  return resp.data;
}

// AI
export async function getAIInsight(userId: string, date?: string) {
  const dateParam = date ? `&date=${date}` : "";
  const resp = await api.post(`/ai/insight?user_id=${userId}${dateParam}`);
  return resp.data;
}

export async function listInsights(userId: string) {
  const resp = await api.get(`/ai/insights?user_id=${userId}`);
  return resp.data;
}

// Reports
export async function generateReport(
  userId: string,
  startDate: string,
  endDate: string
) {
  const resp = await api.post(
    `/reports/generate?user_id=${userId}&start_date=${startDate}&end_date=${endDate}`
  );
  return resp.data;
}

export async function listReports(userId: string) {
  const resp = await api.get(`/reports?user_id=${userId}`);
  return resp.data;
}

export async function getReport(userId: string, reportId: string) {
  const resp = await api.get(`/reports/${reportId}?user_id=${userId}`);
  return resp.data;
}

// Demo
export async function seedDemoData(userId: string, date?: string) {
  const dateParam = date ? `&date=${date}` : "";
  const resp = await api.post(`/demo/seed?user_id=${userId}${dateParam}`);
  return resp.data;
}

export default api;
