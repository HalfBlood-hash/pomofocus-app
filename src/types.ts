export type TimerMode = 'pomo' | 'short' | 'long';

export interface Task {
  id: string;
  title: string;
  actPomodoros: number; // actual pomodoros spent
  estPomodoros: number; // estimated pomodoros needed
  completed: boolean;
  notes?: string;
  category?: string; // e.g., 'Work', 'Study', 'Personal'
  customDurationMinutes?: number; // optional custom focus duration (in minutes) for this specific task
  timeSpentSeconds: number; // granular time tracker
  createdAt: number;
  completedAt?: number;
}

export interface UserSettings {
  pomoTime: number; // in minutes
  shortBreakTime: number; // in minutes
  longBreakTime: number; // in minutes
  longBreakInterval: number; // pomodoros until long break
  autoStartBreaks: boolean;
  autoStartPomodoro: boolean;
  alarmSound: 'bell' | 'digital' | 'kitchen';
  volume: number;
}

export interface WorkTemplate {
  id: string;
  name: string;
  description?: string;
  tasks: Array<{
    title: string;
    estPomodoros: number;
    customDurationMinutes?: number;
    category?: string;
    notes?: string;
  }>;
}

export interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  isLoggedIn: boolean;
  token?: string;
}

export interface DailyReportLog {
  date: string; // YYYY-MM-DD
  totalMinutes: number;
  tasksCompleted: number;
  categoryBreakdown: Record<string, number>; // category -> minutes
  taskBreakdown: Record<string, number>; // task title -> minutes
}

