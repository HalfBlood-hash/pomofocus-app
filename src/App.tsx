import React, { useState, useEffect, useRef } from 'react';
import { TimerMode, Task, UserSettings, WorkTemplate, UserProfile } from './types';
import { playSound } from './utils/audio';
import { TaskList } from './components/TaskList';
import { SettingsModal } from './components/SettingsModal';
import { TemplateModal } from './components/TemplateModal';
import { ReportModal } from './components/ReportModal';
import { AuthModal } from './components/AuthModal';
import { useWakeLock } from './utils/useWakeLock';
import { MusicPlayer } from './components/MusicPlayer';
import confetti from 'canvas-confetti';
import {
  Settings,
  BarChart3,
  Bookmark,
  User,
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  CheckCircle,
  Timer as TimerIcon,
  Flame,
  Music,
  Zap,
} from 'lucide-react';

const DEFAULT_SETTINGS: UserSettings = {
  pomoTime: 25,
  shortBreakTime: 5,
  longBreakTime: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoro: false,
  alarmSound: 'bell',
  volume: 80,
};

const DEFAULT_TEMPLATES: WorkTemplate[] = [];

export function App() {
  // Settings state
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('pomofocus_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Auth User
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('pomofocus_user');
    return saved ? JSON.parse(saved) : { name: '', email: '', isLoggedIn: false };
  });

  // Timer states
  const [mode, setMode] = useState<TimerMode>('pomo');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(settings.pomoTime * 60);
  const [pomodoroCount, setPomodoroCount] = useState<number>(() => {
    const count = localStorage.getItem('pomofocus_pomo_count');
    return count ? parseInt(count) : 0;
  });

  // Tasks state (starts clean with no default demo tasks)
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('pomofocus_tasks');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [activeTaskId, setActiveTaskId] = useState<string | null>(() => {
    return null;
  });

  // Templates (starts clean with no default demo templates)
  const [templates, setTemplates] = useState<WorkTemplate[]>(() => {
    const saved = localStorage.getItem('pomofocus_templates');
    return saved ? JSON.parse(saved) : [];
  });

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isMusicOpen, setIsMusicOpen] = useState(false);

  // Anti-Sleep WakeLock (keeps screen and PC awake while timer is running)
  const { isLocked: isWakeLocked, isSupported: isWakeLockSupported } = useWakeLock(isRunning);

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('pomofocus_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('pomofocus_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('pomofocus_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('pomofocus_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('pomofocus_pomo_count', pomodoroCount.toString());
  }, [pomodoroCount]);

  // Restore logged-in session and fetch latest data from database across systems on startup
  useEffect(() => {
    const token = localStorage.getItem('pomofocus_jwt_token');
    if (!token) return;

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (payload && payload.user) {
          setCurrentUser({
            name: payload.user.name,
            email: payload.user.email,
            isLoggedIn: true,
            token,
          });
          if (payload.data) {
            if (payload.data.tasks && Array.isArray(payload.data.tasks) && payload.data.tasks.length > 0) {
              setTasks(payload.data.tasks);
              setActiveTaskId(payload.data.tasks[0].id);
            }
            if (payload.data.templates && Array.isArray(payload.data.templates)) {
              setTemplates(payload.data.templates);
            }
            if (payload.data.settings) {
              setSettings(payload.data.settings);
            }
            if (payload.data.pomodoroCount !== undefined) {
              setPomodoroCount(payload.data.pomodoroCount);
            }
          }
        }
      })
      .catch((err) => console.warn('Could not auto-sync profile from database:', err));
  }, []);

  // Multi-System Cloud Sync: automatically sync data to database whenever tasks, templates, or settings update
  useEffect(() => {
    const token = localStorage.getItem('pomofocus_jwt_token');
    if (!token || !currentUser.isLoggedIn) return;

    const timeout = setTimeout(() => {
      fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tasks,
          templates,
          settings,
          pomodoroCount,
        }),
      }).catch((err) => console.warn('Background sync warning:', err));
    }, 1000); // 1s debounce

    return () => clearTimeout(timeout);
  }, [tasks, templates, settings, pomodoroCount, currentUser.isLoggedIn]);

  // Active task helper
  const activeTask = tasks.find((t) => t.id === activeTaskId);

  // Duration in minutes for pomodoro: task's custom duration if set, otherwise global setting
  const currentPomoMinutes = (activeTask && activeTask.customDurationMinutes) ? activeTask.customDurationMinutes : settings.pomoTime;

  // Handle mode switches and reset timer
  const switchMode = (newMode: TimerMode, keepRunning = false) => {
    setMode(newMode);
    setIsRunning(keepRunning);

    let minutes = currentPomoMinutes;
    if (newMode === 'short') minutes = settings.shortBreakTime;
    if (newMode === 'long') minutes = settings.longBreakTime;
    setTimeLeft(minutes * 60);
  };

  // When user selects a different task and timer is not running, adjust timer to that task's custom duration
  const handleSelectTask = (taskId: string) => {
    setActiveTaskId(taskId);
    if (mode === 'pomo' && !isRunning) {
      const selected = tasks.find((t) => t.id === taskId);
      const minutes = selected?.customDurationMinutes || settings.pomoTime;
      setTimeLeft(minutes * 60);
    }
  };

  // Change title in browser tab
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    const modeLabel = mode === 'pomo' ? 'Time to focus!' : 'Break Time!';
    document.title = `${timeStr} - ${activeTask ? activeTask.title : modeLabel}`;
  }, [timeLeft, mode, activeTask]);

  // Main countdown tick loop
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        // Track time spent in active task
        if (mode === 'pomo' && activeTaskId) {
          setTasks((currentTasks) =>
            currentTasks.map((t) =>
              t.id === activeTaskId
                ? { ...t, timeSpentSeconds: (t.timeSpentSeconds || 0) + 1 }
                : t
            )
          );
        }

        if (prev <= 1) {
          clearInterval(timer);
          handleTimerCompletion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, mode, activeTaskId, settings]);

  // Action when a timer period finishes
  const handleTimerCompletion = () => {
    playSound(settings.alarmSound);

    if (mode === 'pomo') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });

      const nextCount = pomodoroCount + 1;
      setPomodoroCount(nextCount);

      // Increment active task pomodoro
      if (activeTaskId) {
        setTasks((prevTasks) =>
          prevTasks.map((t) =>
            t.id === activeTaskId ? { ...t, actPomodoros: t.actPomodoros + 1 } : t
          )
        );
      }

      // Check if long break interval reached
      if (nextCount % settings.longBreakInterval === 0) {
        switchMode('long', settings.autoStartBreaks);
      } else {
        switchMode('short', settings.autoStartBreaks);
      }
    } else {
      // Break completed, switch back to pomodoro
      switchMode('pomo', settings.autoStartPomodoro);
    }
  };

  // Toggle Play / Pause
  const toggleTimer = () => {
    playSound('click');
    setIsRunning(!isRunning);
  };

  // Skip to next phase
  const skipTimer = () => {
    playSound('click');
    if (confirm('Are you sure you want to skip to the next interval?')) {
      if (mode === 'pomo') {
        const nextCount = pomodoroCount + 1;
        setPomodoroCount(nextCount);
        if (nextCount % settings.longBreakInterval === 0) {
          switchMode('long', false);
        } else {
          switchMode('short', false);
        }
      } else {
        switchMode('pomo', false);
      }
    }
  };

  // Reset current phase
  const resetCurrentTimer = () => {
    playSound('click');
    let minutes = currentPomoMinutes;
    if (mode === 'short') minutes = settings.shortBreakTime;
    if (mode === 'long') minutes = settings.longBreakTime;
    setTimeLeft(minutes * 60);
    setIsRunning(false);
  };

  // Formatting helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Background Theme based on mode (Pomofocus signature style)
  const themeBg =
    mode === 'pomo'
      ? 'bg-[#ba4949]'
      : mode === 'short'
      ? 'bg-[#38858a]'
      : 'bg-[#397097]';

  const containerBg =
    mode === 'pomo'
      ? 'bg-[#c15c5c]'
      : mode === 'short'
      ? 'bg-[#4c9196]'
      : 'bg-[#4d7fa2]';

  // Task Operations
  const handleAddTask = (newTask: Omit<Task, 'id' | 'actPomodoros' | 'completed' | 'timeSpentSeconds' | 'createdAt'>) => {
    const created: Task = {
      ...newTask,
      id: 'task_' + Date.now(),
      actPomodoros: 0,
      completed: false,
      timeSpentSeconds: 0,
      createdAt: Date.now(),
    };
    setTasks([...tasks, created]);
    if (!activeTaskId) {
      setActiveTaskId(created.id);
      if (mode === 'pomo' && !isRunning) {
        setTimeLeft((created.customDurationMinutes || settings.pomoTime) * 60);
      }
    }
  };

  const handleUpdateTask = (updated: Task) => {
    setTasks(tasks.map((t) => (t.id === updated.id ? updated : t)));
    // If updating the active task's duration and timer is paused, adjust timer immediately
    if (activeTaskId === updated.id && mode === 'pomo' && !isRunning) {
      const minutes = updated.customDurationMinutes || settings.pomoTime;
      setTimeLeft(minutes * 60);
    }
  };

  const handleDeleteTask = (id: string) => {
    const remaining = tasks.filter((t) => t.id !== id);
    setTasks(remaining);
    if (activeTaskId === id) {
      const nextActive = remaining.length > 0 ? remaining[0] : null;
      setActiveTaskId(nextActive ? nextActive.id : null);
      if (mode === 'pomo' && !isRunning) {
        setTimeLeft((nextActive?.customDurationMinutes || settings.pomoTime) * 60);
      }
    }
  };

  const handleClearCompleted = () => {
    setTasks(tasks.filter((t) => !t.completed));
  };

  const handleClearAll = () => {
    setTasks([]);
    setActiveTaskId(null);
    if (mode === 'pomo' && !isRunning) {
      setTimeLeft(settings.pomoTime * 60);
    }
  };

  // Template handling
  const handleApplyTemplate = (tpl: WorkTemplate) => {
    const newTasks: Task[] = tpl.tasks.map((t, idx) => ({
      id: 'task_' + (Date.now() + idx),
      title: t.title,
      actPomodoros: 0,
      estPomodoros: t.estPomodoros,
      category: t.category || 'Work',
      customDurationMinutes: t.customDurationMinutes,
      notes: t.notes,
      completed: false,
      timeSpentSeconds: 0,
      createdAt: Date.now() + idx,
    }));
    setTasks((prev) => [...prev, ...newTasks]);
    if (!activeTaskId && newTasks.length > 0) {
      setActiveTaskId(newTasks[0].id);
      if (mode === 'pomo' && !isRunning) {
        setTimeLeft((newTasks[0].customDurationMinutes || settings.pomoTime) * 60);
      }
    }
  };

  return (
    <div className={`min-h-screen ${themeBg} text-white transition-colors duration-500 pb-20 select-none`}>
      {/* Top Navigation Bar */}
      <header className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between border-b border-white/15">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
            <CheckCircle size={20} className="text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">Pomofocus</span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Music Button */}
          <button
            onClick={() => setIsMusicOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold backdrop-blur-xs transition-all active:scale-95 text-white"
            title="Focus Music & Ambient Sounds"
          >
            <Music size={15} className="text-rose-300" />
            <span className="hidden sm:inline">Music</span>
          </button>

          {/* Report Button */}
          <button
            onClick={() => setIsReportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold backdrop-blur-xs transition-all active:scale-95"
            title="Generate Time & Work Report"
          >
            <BarChart3 size={15} />
            <span className="hidden sm:inline">Report</span>
          </button>

          {/* Templates Button */}
          <button
            onClick={() => setIsTemplateOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold backdrop-blur-xs transition-all active:scale-95"
            title="Work Templates"
          >
            <Bookmark size={15} />
            <span className="hidden sm:inline">Templates</span>
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-semibold backdrop-blur-xs transition-all active:scale-95"
            title="Timer Settings"
          >
            <Settings size={15} />
            <span className="hidden sm:inline">Setting</span>
          </button>

          {/* User Profile / Login Button */}
          <button
            onClick={() => setIsAuthOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${
              currentUser.isLoggedIn
                ? 'bg-white text-gray-900 shadow-xs'
                : 'bg-white/15 hover:bg-white/25'
            }`}
          >
            <User size={15} />
            <span>{currentUser.isLoggedIn ? currentUser.name : 'Login'}</span>
          </button>
        </div>
      </header>

      {/* Main Timer Display */}
      <main className="max-w-xl mx-auto px-4 mt-8">
        <div className={`${containerBg} rounded-3xl p-6 sm:p-10 shadow-2xl transition-colors duration-500`}>
          {/* Modes switch buttons */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <button
              onClick={() => switchMode('pomo')}
              className={`px-4 py-1.5 rounded-xl font-bold text-sm transition-all ${
                mode === 'pomo'
                  ? 'bg-black/20 text-white shadow-inner font-extrabold'
                  : 'hover:bg-white/10 text-white/80'
              }`}
            >
              Pomodoro
            </button>
            <button
              onClick={() => switchMode('short')}
              className={`px-4 py-1.5 rounded-xl font-bold text-sm transition-all ${
                mode === 'short'
                  ? 'bg-black/20 text-white shadow-inner font-extrabold'
                  : 'hover:bg-white/10 text-white/80'
              }`}
            >
              Short Break
            </button>
            <button
              onClick={() => switchMode('long')}
              className={`px-4 py-1.5 rounded-xl font-bold text-sm transition-all ${
                mode === 'long'
                  ? 'bg-black/20 text-white shadow-inner font-extrabold'
                  : 'hover:bg-white/10 text-white/80'
              }`}
            >
              Long Break
            </button>
          </div>

          {/* Large Clock Display */}
          <div className="text-center my-6">
            <div className="text-7xl sm:text-9xl font-black font-mono tracking-tighter text-white drop-shadow-md">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Primary Action Button (Start / Pause) & Quick Controls */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={resetCurrentTimer}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-90 transition-all text-white/90"
              title="Reset Timer"
            >
              <RotateCcw size={22} />
            </button>

            <button
              onClick={toggleTimer}
              className={`w-44 py-4 rounded-2xl text-xl font-black uppercase tracking-wider shadow-2xl transition-all duration-150 active:scale-95 flex items-center justify-center gap-2 ${
                isRunning
                  ? 'bg-white text-gray-800 shadow-[0_6px_0_#d1d5db]'
                  : 'bg-white text-red-600 shadow-[0_8px_0_#d1d5db] translate-y-[-2px]'
              }`}
            >
              {isRunning ? (
                <>
                  <Pause size={24} className="fill-current" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play size={24} className="fill-current" />
                  <span>Start</span>
                </>
              )}
            </button>

            <button
              onClick={skipTimer}
              className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-90 transition-all text-white/90"
              title="Skip Interval"
            >
              <SkipForward size={22} />
            </button>
          </div>
        </div>

          {/* Active Task Indicator & Anti-sleep Status */}
          <div className="text-center mt-6">
            <div className="text-xs uppercase tracking-widest text-white/70 font-semibold mb-1 flex items-center justify-center gap-2">
              <span className="flex items-center gap-1">
                <Flame size={14} className="text-amber-300" />
                # {pomodoroCount} Sessions completed today
              </span>

              {/* Anti-sleep indicator */}
              {isWakeLockSupported && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 transition-all ${
                    isWakeLocked
                      ? 'bg-amber-400 text-stone-900 shadow-sm animate-pulse'
                      : 'bg-white/10 text-white/60'
                  }`}
                  title={
                    isWakeLocked
                      ? 'Screen & system are kept awake automatically'
                      : 'Screen will stay awake when timer starts'
                  }
                >
                  <Zap size={11} className={isWakeLocked ? 'fill-current' : ''} />
                  <span>{isWakeLocked ? 'Anti-Sleep Active' : 'Anti-Sleep Ready'}</span>
                </span>
              )}
            </div>
            <div className="text-lg font-bold text-white drop-shadow-xs">
              {activeTask ? (
                <span className="bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-xs inline-flex items-center gap-2">
                  <span>Working on:</span>
                  <span className="underline decoration-amber-300 decoration-2">{activeTask.title}</span>
                </span>
              ) : (
                <span className="text-white/80 italic font-normal text-sm">
                  No active task selected. Choose or add a task below!
                </span>
              )}
            </div>
          </div>

        {/* Daily Tasks Section */}
        <TaskList
          tasks={tasks}
          activeTaskId={activeTaskId}
          onSelectTask={handleSelectTask}
          onAddTask={handleAddTask}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onClearCompleted={handleClearCompleted}
          onClearAll={handleClearAll}
          pomoTimeMinutes={settings.pomoTime}
        />
      </main>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={(newSettings) => {
          setSettings(newSettings);
          // If timer not running, update current clock to reflect changed duration
          if (!isRunning) {
            let mins = newSettings.pomoTime;
            if (mode === 'short') mins = newSettings.shortBreakTime;
            if (mode === 'long') mins = newSettings.longBreakTime;
            setTimeLeft(mins * 60);
          }
        }}
      />

      <TemplateModal
        isOpen={isTemplateOpen}
        onClose={() => setIsTemplateOpen(false)}
        templates={templates}
        currentTasks={tasks}
        onSaveTemplate={(tpl) => setTemplates([...templates, tpl])}
        onDeleteTemplate={(id) => setTemplates(templates.filter((t) => t.id !== id))}
        onApplyTemplate={handleApplyTemplate}
      />

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        tasks={tasks}
        pomoTimeMinutes={settings.pomoTime}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        onLoginSuccess={(profile, syncedData) => {
          setCurrentUser(profile);
          if (syncedData) {
            if (syncedData.tasks && Array.isArray(syncedData.tasks)) {
              setTasks(syncedData.tasks);
              if (syncedData.tasks.length > 0) setActiveTaskId(syncedData.tasks[0].id);
            }
            if (syncedData.templates && Array.isArray(syncedData.templates)) {
              setTemplates(syncedData.templates);
            }
            if (syncedData.settings) {
              setSettings(syncedData.settings);
            }
            if (syncedData.pomodoroCount !== undefined) {
              setPomodoroCount(syncedData.pomodoroCount);
            }
          }
        }}
        onLogout={() => {
          setCurrentUser({ name: '', email: '', isLoggedIn: false });
        }}
      />

      <MusicPlayer
        isOpen={isMusicOpen}
        onClose={() => setIsMusicOpen(false)}
      />
    </div>
  );
}

export default App;
