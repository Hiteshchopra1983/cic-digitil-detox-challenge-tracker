export interface Participant {
  id: string;
  name: string;
  email: string;
  password: string;
  country: string;
  city: string;
  cohort: string;
  consentGiven: boolean;
  role: 'participant' | 'admin';
  createdAt: string;
}

export interface BaselineData {
  participantId: string;
  phoneStorageGB: number;
  laptopStorageGB: number;
  cloudStorageGB: number;
  mailboxSizeGB: number;
  avgScreenTimeHours: number;
  streamingHoursWeek: number;
  submittedAt: string;
}

export interface WeeklySubmission {
  id: string;
  participantId: string;
  weekNumber: number;
  gbDeleted: number;
  screenTimeChange: number;
  streamingReduction: number;
  alumniTouchpoints: number;
  ritualCompleted: boolean;
  submittedAt: string;
}

export interface AdminConfig {
  co2MultiplierPerGB: number;
}

const STORAGE_KEYS = {
  participants: 'cic_participants',
  baselines: 'cic_baselines',
  weeklySubmissions: 'cic_weekly_submissions',
  adminConfig: 'cic_admin_config',
  currentUser: 'cic_current_user',
};

// Seed data
const seedParticipants: Participant[] = [
  { id: 'p1', name: 'Marie Dupont', email: 'marie@insead.edu', password: 'pass123', country: 'France', city: 'Paris', cohort: 'MBA 22J', consentGiven: true, role: 'participant', createdAt: '2026-02-01' },
  { id: 'p2', name: 'James Chen', email: 'james@insead.edu', password: 'pass123', country: 'Singapore', city: 'Singapore', cohort: 'MBA 21D', consentGiven: true, role: 'participant', createdAt: '2026-02-02' },
  { id: 'p3', name: 'Aisha Khan', email: 'aisha@insead.edu', password: 'pass123', country: 'UAE', city: 'Dubai', cohort: 'EMBA 23', consentGiven: true, role: 'participant', createdAt: '2026-02-03' },
  { id: 'p4', name: 'Carlos Rivera', email: 'carlos@insead.edu', password: 'pass123', country: 'Brazil', city: 'São Paulo', cohort: 'MBA 22J', consentGiven: true, role: 'participant', createdAt: '2026-02-04' },
  { id: 'p5', name: 'Lena Müller', email: 'lena@insead.edu', password: 'pass123', country: 'Germany', city: 'Berlin', cohort: 'MBA 21D', consentGiven: true, role: 'participant', createdAt: '2026-02-05' },
  { id: 'admin1', name: 'Admin User', email: 'admin@cic.org', password: 'admin123', country: 'France', city: 'Paris', cohort: '', consentGiven: true, role: 'admin', createdAt: '2026-01-01' },
];

const seedBaselines: BaselineData[] = [
  { participantId: 'p1', phoneStorageGB: 48, laptopStorageGB: 200, cloudStorageGB: 80, mailboxSizeGB: 12, avgScreenTimeHours: 6.5, streamingHoursWeek: 14, submittedAt: '2026-02-01' },
  { participantId: 'p2', phoneStorageGB: 64, laptopStorageGB: 350, cloudStorageGB: 120, mailboxSizeGB: 25, avgScreenTimeHours: 8, streamingHoursWeek: 20, submittedAt: '2026-02-02' },
  { participantId: 'p3', phoneStorageGB: 32, laptopStorageGB: 150, cloudStorageGB: 50, mailboxSizeGB: 8, avgScreenTimeHours: 5, streamingHoursWeek: 10, submittedAt: '2026-02-03' },
  { participantId: 'p4', phoneStorageGB: 55, laptopStorageGB: 280, cloudStorageGB: 95, mailboxSizeGB: 18, avgScreenTimeHours: 7, streamingHoursWeek: 18, submittedAt: '2026-02-04' },
  { participantId: 'p5', phoneStorageGB: 40, laptopStorageGB: 180, cloudStorageGB: 60, mailboxSizeGB: 10, avgScreenTimeHours: 5.5, streamingHoursWeek: 12, submittedAt: '2026-02-05' },
];

const seedWeeklySubmissions: WeeklySubmission[] = [
  { id: 'w1', participantId: 'p1', weekNumber: 1, gbDeleted: 5.2, screenTimeChange: -1.5, streamingReduction: 3, alumniTouchpoints: 2, ritualCompleted: true, submittedAt: '2026-02-08' },
  { id: 'w2', participantId: 'p1', weekNumber: 2, gbDeleted: 8.1, screenTimeChange: -2, streamingReduction: 4, alumniTouchpoints: 3, ritualCompleted: true, submittedAt: '2026-02-15' },
  { id: 'w3', participantId: 'p2', weekNumber: 1, gbDeleted: 12, screenTimeChange: -3, streamingReduction: 5, alumniTouchpoints: 1, ritualCompleted: true, submittedAt: '2026-02-08' },
  { id: 'w4', participantId: 'p2', weekNumber: 2, gbDeleted: 7.5, screenTimeChange: -1, streamingReduction: 2, alumniTouchpoints: 4, ritualCompleted: false, submittedAt: '2026-02-15' },
  { id: 'w5', participantId: 'p3', weekNumber: 1, gbDeleted: 3.8, screenTimeChange: -0.5, streamingReduction: 2, alumniTouchpoints: 2, ritualCompleted: true, submittedAt: '2026-02-08' },
  { id: 'w6', participantId: 'p4', weekNumber: 1, gbDeleted: 15, screenTimeChange: -2.5, streamingReduction: 6, alumniTouchpoints: 3, ritualCompleted: true, submittedAt: '2026-02-08' },
  { id: 'w7', participantId: 'p4', weekNumber: 2, gbDeleted: 10.3, screenTimeChange: -1.5, streamingReduction: 3, alumniTouchpoints: 2, ritualCompleted: true, submittedAt: '2026-02-15' },
  { id: 'w8', participantId: 'p5', weekNumber: 1, gbDeleted: 6.7, screenTimeChange: -1, streamingReduction: 3, alumniTouchpoints: 1, ritualCompleted: true, submittedAt: '2026-02-08' },
  { id: 'w9', participantId: 'p5', weekNumber: 2, gbDeleted: 4.2, screenTimeChange: -0.5, streamingReduction: 1, alumniTouchpoints: 2, ritualCompleted: false, submittedAt: '2026-02-15' },
];

function initializeData() {
  if (!localStorage.getItem(STORAGE_KEYS.participants)) {
    localStorage.setItem(STORAGE_KEYS.participants, JSON.stringify(seedParticipants));
  }
  if (!localStorage.getItem(STORAGE_KEYS.baselines)) {
    localStorage.setItem(STORAGE_KEYS.baselines, JSON.stringify(seedBaselines));
  }
  if (!localStorage.getItem(STORAGE_KEYS.weeklySubmissions)) {
    localStorage.setItem(STORAGE_KEYS.weeklySubmissions, JSON.stringify(seedWeeklySubmissions));
  }
  if (!localStorage.getItem(STORAGE_KEYS.adminConfig)) {
    localStorage.setItem(STORAGE_KEYS.adminConfig, JSON.stringify({ co2MultiplierPerGB: 0.02 }));
  }
}

initializeData();

function getItem<T>(key: string): T {
  return JSON.parse(localStorage.getItem(key) || '[]');
}

function setItem<T>(key: string, data: T) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Auth
export function login(email: string, password: string): Participant | null {
  const participants = getItem<Participant[]>(STORAGE_KEYS.participants);
  const user = participants.find(p => p.email === email && p.password === password);
  if (user) {
    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
    return user;
  }
  return null;
}

export function register(data: Omit<Participant, 'id' | 'role' | 'createdAt'>): Participant {
  const participants = getItem<Participant[]>(STORAGE_KEYS.participants);
  const newUser: Participant = {
    ...data,
    id: 'p' + Date.now(),
    role: 'participant',
    createdAt: new Date().toISOString().split('T')[0],
  };
  participants.push(newUser);
  setItem(STORAGE_KEYS.participants, participants);
  localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(newUser));
  return newUser;
}

export function getCurrentUser(): Participant | null {
  const stored = localStorage.getItem(STORAGE_KEYS.currentUser);
  return stored ? JSON.parse(stored) : null;
}

export function logout() {
  localStorage.removeItem(STORAGE_KEYS.currentUser);
}

// Baseline
export function getBaseline(participantId: string): BaselineData | null {
  const baselines = getItem<BaselineData[]>(STORAGE_KEYS.baselines);
  return baselines.find(b => b.participantId === participantId) || null;
}

export function submitBaseline(data: Omit<BaselineData, 'submittedAt'>): void {
  const baselines = getItem<BaselineData[]>(STORAGE_KEYS.baselines);
  baselines.push({ ...data, submittedAt: new Date().toISOString().split('T')[0] });
  setItem(STORAGE_KEYS.baselines, baselines);
}

// Weekly
export function getWeeklySubmissions(participantId: string): WeeklySubmission[] {
  const submissions = getItem<WeeklySubmission[]>(STORAGE_KEYS.weeklySubmissions);
  return submissions.filter(s => s.participantId === participantId);
}

export function getAllWeeklySubmissions(): WeeklySubmission[] {
  return getItem<WeeklySubmission[]>(STORAGE_KEYS.weeklySubmissions);
}

export function submitWeekly(data: Omit<WeeklySubmission, 'id' | 'submittedAt'>): void {
  const submissions = getItem<WeeklySubmission[]>(STORAGE_KEYS.weeklySubmissions);
  submissions.push({ ...data, id: 'w' + Date.now(), submittedAt: new Date().toISOString().split('T')[0] });
  setItem(STORAGE_KEYS.weeklySubmissions, submissions);
}

// Admin
export function getAdminConfig(): AdminConfig {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.adminConfig) || '{"co2MultiplierPerGB":0.02}');
}

export function updateAdminConfig(config: AdminConfig): void {
  setItem(STORAGE_KEYS.adminConfig, config);
}

export function getAllParticipants(): Participant[] {
  return getItem<Participant[]>(STORAGE_KEYS.participants).filter(p => p.role === 'participant');
}

export function getAllBaselines(): BaselineData[] {
  return getItem<BaselineData[]>(STORAGE_KEYS.baselines);
}

export function resetData() {
  Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  initializeData();
}
