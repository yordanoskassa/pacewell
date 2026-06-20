/**
 * Offline demo — loads instantly when Render API is cold/down.
 * Mirrors backend POTS simulation (orthostatic, shower, standing, PEM).
 */

import type { ActivityLog, HREvent, HRPoint, SymptomLog } from "../types";

function easeRise(t: number): number {
  t = Math.max(0, Math.min(1, t));
  return t ** 0.55;
}

function easeFall(t: number): number {
  t = Math.max(0, Math.min(1, t));
  return 1 - (1 - t) ** 1.6;
}

function bpmAt(minute: number, keyframes: [number, number][]): number {
  if (minute <= keyframes[0][0]) return keyframes[0][1];
  if (minute >= keyframes[keyframes.length - 1][0]) return keyframes[keyframes.length - 1][1];

  for (let i = 0; i < keyframes.length - 1; i++) {
    const [m0, b0] = keyframes[i];
    const [m1, b1] = keyframes[i + 1];
    if (m0 <= minute && minute <= m1) {
      const span = m1 - m0;
      if (span <= 0) return b1;
      const t = (minute - m0) / span;
      const eased = b1 > b0 ? easeRise(t) : easeFall(t);
      return b0 + (b1 - b0) * eased;
    }
  }
  return keyframes[keyframes.length - 1][1];
}

const KEYFRAMES: [number, number][] = [
  [0, 61], [360, 60], [405, 67], [412, 78], [418, 118], [422, 126], [430, 112],
  [438, 129], [442, 134], [450, 112], [465, 84], [480, 78], [660, 82], [685, 118],
  [705, 98], [760, 108], [870, 78], [878, 142], [915, 98], [1149, 122], [1152, 128],
  [1200, 80], [1439, 62],
];

function generatePoints(date: string): HRPoint[] {
  const base = new Date(`${date}T00:00:00`);
  const points: HRPoint[] = [];
  for (let minute = 0; minute < 1440; minute++) {
    const dt = new Date(base.getTime() + minute * 60_000);
    let bpm = bpmAt(minute, KEYFRAMES);
    bpm += (minute % 7) - 3;
    points.push({
      timestamp: dt.toISOString(),
      bpm: Math.round(Math.max(52, Math.min(155, bpm))),
    });
  }
  return points;
}

function iso(date: string, hour: number, minute: number): string {
  return new Date(`${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`).toISOString();
}

export function getOfflineDemo(date: string) {
  const points = generatePoints(date);
  const bpms = points.map((p) => p.bpm).sort((a, b) => a - b);
  const baseline = bpms[Math.floor(bpms.length / 2)] ?? 76;

  const activities: ActivityLog[] = [
    { id: "off-1", activity_type: "standing", started_at: iso(date, 6, 51), ended_at: iso(date, 7, 8), intensity: "light", notes: "Got out of bed — orthostatic trigger", created_at: iso(date, 6, 51) },
    { id: "off-2", activity_type: "showering", started_at: iso(date, 7, 11), ended_at: iso(date, 7, 28), intensity: "moderate", notes: "Hot shower — HR peaked ~134 bpm", created_at: iso(date, 7, 11) },
    { id: "off-3", activity_type: "standing", started_at: iso(date, 11, 0), ended_at: iso(date, 11, 42), intensity: "light", notes: "Prolonged standing while cooking", created_at: iso(date, 11, 0) },
    { id: "off-4", activity_type: "climbing stairs", started_at: iso(date, 14, 30), ended_at: iso(date, 14, 38), intensity: "moderate", notes: "One flight — spike to 142 bpm", created_at: iso(date, 14, 30) },
    { id: "off-5", activity_type: "showering", started_at: iso(date, 19, 0), ended_at: iso(date, 19, 18), intensity: "moderate", notes: "Evening shower episode", created_at: iso(date, 19, 0) },
  ];

  const symptoms: SymptomLog[] = [
    { id: "off-s1", symptom_type: "dizziness", severity: 7, occurred_at: iso(date, 6, 55), duration_minutes: 12, notes: "Lightheaded within 2 min of standing", created_at: iso(date, 6, 55) },
    { id: "off-s2", symptom_type: "nausea", severity: 6, occurred_at: iso(date, 7, 16), duration_minutes: 8, notes: "During hot shower", created_at: iso(date, 7, 16) },
    { id: "off-s3", symptom_type: "brain fog", severity: 6, occurred_at: iso(date, 11, 14), duration_minutes: 35, notes: "While standing at stove", created_at: iso(date, 11, 14) },
    { id: "off-s4", symptom_type: "fatigue", severity: 8, occurred_at: iso(date, 14, 45), duration_minutes: 120, notes: "Post-exertional malaise after stairs", created_at: iso(date, 14, 45) },
    { id: "off-s5", symptom_type: "palpitations", severity: 6, occurred_at: iso(date, 19, 9), duration_minutes: 12, notes: "Evening shower", created_at: iso(date, 19, 9) },
  ];

  const events: HREvent[] = [
    { id: "off-e1", event_type: "sustained_spike", start_time: iso(date, 6, 52), end_time: iso(date, 7, 28), peak_bpm: 134, baseline_bpm: baseline, duration_minutes: 36, matched_activity: "standing", matched_symptom: "dizziness" },
    { id: "off-e2", event_type: "sustained_spike", start_time: iso(date, 11, 2), end_time: iso(date, 11, 38), peak_bpm: 118, baseline_bpm: baseline, duration_minutes: 36, matched_activity: "standing", matched_symptom: "brain fog" },
    { id: "off-e3", event_type: "spike", start_time: iso(date, 14, 32), end_time: iso(date, 14, 40), peak_bpm: 142, baseline_bpm: baseline, duration_minutes: 8, matched_activity: "climbing stairs", matched_symptom: "fatigue" },
    { id: "off-e4", event_type: "sustained_spike", start_time: iso(date, 19, 2), end_time: iso(date, 19, 16), peak_bpm: 128, baseline_bpm: baseline, duration_minutes: 14, matched_activity: "showering", matched_symptom: "palpitations" },
  ];

  return { points, baseline, events, activities, symptoms };
}
