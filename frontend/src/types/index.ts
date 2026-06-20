export interface HRPoint {
  timestamp: string;
  bpm: number;
}

export interface HRData {
  user_id: string;
  date: string;
  points: HRPoint[];
  synced_at: string | null;
}

export interface HREvent {
  id: string;
  event_type: "spike" | "sustained_spike";
  start_time: string;
  end_time: string | null;
  peak_bpm: number;
  baseline_bpm: number;
  duration_minutes: number | null;
  matched_activity: string | null;
  matched_symptom: string | null;
}

export interface ActivityLog {
  id: string;
  activity_type: string;
  started_at: string;
  ended_at: string | null;
  intensity: string | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityLogCreate {
  activity_type: string;
  started_at: string;
  ended_at?: string;
  intensity?: string;
  notes?: string;
}

export interface SymptomLog {
  id: string;
  symptom_type: string;
  severity: number;
  occurred_at: string;
  duration_minutes: number | null;
  notes: string | null;
  created_at: string;
}

export interface SymptomLogCreate {
  symptom_type: string;
  severity: number;
  occurred_at: string;
  duration_minutes?: number;
  notes?: string;
}

export interface AIInsight {
  date: string;
  summary: string;
  patterns: string[];
  recommendations: string[];
  risk_flags: string[];
  created_at: string;
}

export interface SyncResult {
  date: string;
  points_count: number;
  baseline_bpm: number | null;
  spike_events: number;
  sustained_events: number;
}

export interface WearableStatus {
  connected: boolean;
  provider: string | null;
  last_sync: string | null;
}

export interface ReportEvent {
  date: string;
  event_type: string;
  peak_bpm: number;
  baseline_bpm: number;
  duration_minutes: number | null;
  matched_activity: string | null;
  matched_symptom: string | null;
}

export interface ReportActivity {
  activity_type: string;
  started_at: string;
  intensity: string | null;
}

export interface ReportSymptom {
  symptom_type: string;
  severity: number;
  occurred_at: string;
}

export interface ClinicianReport {
  id: string;
  date_range_start: string;
  date_range_end: string;
  hr_summary: {
    total_readings: number;
    days_with_data: number;
    overall_min: number;
    overall_max: number;
    overall_avg: number;
    baseline_bpm: number;
  };
  events_summary: ReportEvent[];
  activities: ReportActivity[];
  symptoms: ReportSymptom[];
  ai_insights: AIInsight[];
  generated_at: string;
}
