import React, { useState } from 'react';
import { Task } from '../types';
import { Plus, Check, MoreVertical, Edit2, Trash2, CheckCircle2, Circle, Clock } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  activeTaskId: string | null;
  onSelectTask: (id: string) => void;
  onAddTask: (task: Omit<Task, 'id' | 'actPomodoros' | 'completed' | 'timeSpentSeconds' | 'createdAt'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onClearCompleted: () => void;
  onClearAll: () => void;
  pomoTimeMinutes: number;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  activeTaskId,
  onSelectTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onClearCompleted,
  onClearAll,
  pomoTimeMinutes,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [estPomodoros, setEstPomodoros] = useState(1);
  const [category, setCategory] = useState('Work');
  const [notes, setNotes] = useState('');

  const [customDuration, setCustomDuration] = useState<number | undefined>(undefined);

  // Dropdown menu state
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const resetForm = () => {
    setTitle('');
    setEstPomodoros(1);
    setCategory('Work');
    setNotes('');
    setCustomDuration(undefined);
    setIsAdding(false);
    setEditingTaskId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingTaskId) {
      const existing = tasks.find((t) => t.id === editingTaskId);
      if (existing) {
        onUpdateTask({
          ...existing,
          title: title.trim(),
          estPomodoros,
          category,
          notes,
          customDurationMinutes: customDuration && customDuration > 0 ? customDuration : undefined,
        });
      }
    } else {
      onAddTask({
        title: title.trim(),
        estPomodoros,
        category,
        notes,
        customDurationMinutes: customDuration && customDuration > 0 ? customDuration : undefined,
      });
    }

    resetForm();
  };

  const startEdit = (t: Task) => {
    setEditingTaskId(t.id);
    setTitle(t.title);
    setEstPomodoros(t.estPomodoros);
    setCategory(t.category || 'Work');
    setNotes(t.notes || '');
    setCustomDuration(t.customDurationMinutes);
    setIsAdding(true);
  };

  // Estimate completion time considering individual task custom durations
  const totalMinsNeeded = tasks
    .filter((t) => !t.completed)
    .reduce((sum, t) => {
      const remainingForTask = Math.max(0, t.estPomodoros - t.actPomodoros);
      const durationForTask = t.customDurationMinutes || pomoTimeMinutes;
      return sum + remainingForTask * durationForTask;
    }, 0);

  const totalRemainingPomos = tasks
    .filter((t) => !t.completed)
    .reduce((sum, t) => sum + Math.max(0, t.estPomodoros - t.actPomodoros), 0);

  const finishTime = new Date(Date.now() + totalMinsNeeded * 60000);
  const finishTimeStr = finishTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="w-full max-w-lg mx-auto mt-6 text-white">
      {/* Header with Title and Dropdown */}
      <div className="flex items-center justify-between pb-3 border-b border-white/20 mb-4">
        <div>
          <h2 className="text-xl font-bold tracking-wide">Tasks of the Day</h2>
          <p className="text-xs text-white/70">Click a task to set it as current focus</p>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            title="Task list options"
          >
            <MoreVertical size={18} />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-xl shadow-xl py-1 z-30 border border-gray-100 text-xs font-semibold animate-in fade-in">
              <button
                onClick={() => {
                  onClearCompleted();
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <CheckCircle2 size={15} className="text-emerald-500" />
                Clear Finished Tasks
              </button>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete all tasks?')) {
                    onClearAll();
                  }
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 flex items-center gap-2"
              >
                <Trash2 size={15} />
                Clear All Tasks
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task List Items */}
      <div className="space-y-2 mb-4">
        {tasks.map((task) => {
          const isActive = activeTaskId === task.id;
          return (
            <div
              key={task.id}
              onClick={() => onSelectTask(task.id)}
              className={`group flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all border ${
                isActive
                  ? 'bg-white text-gray-900 border-l-8 border-l-red-500 shadow-lg scale-[1.01]'
                  : 'bg-white/10 hover:bg-white/15 border-transparent text-white'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden flex-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTask({ ...task, completed: !task.completed });
                  }}
                  className={`p-1 rounded-full transition-transform active:scale-75 ${
                    task.completed
                      ? 'text-emerald-500'
                      : isActive
                      ? 'text-gray-400 hover:text-red-500'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {task.completed ? <CheckCircle2 size={22} className="fill-emerald-100 text-emerald-500" /> : <Circle size={22} />}
                </button>

                <div className="truncate flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-semibold truncate ${
                        task.completed
                          ? 'line-through opacity-60'
                          : isActive
                          ? 'text-gray-900 font-bold'
                          : 'text-white'
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.category && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-medium uppercase tracking-wider ${
                          isActive
                            ? 'bg-red-50 text-red-600'
                            : 'bg-white/20 text-white/90'
                        }`}
                      >
                        {task.category}
                      </span>
                    )}
                    {task.customDurationMinutes && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                          isActive
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-amber-500/30 text-amber-200'
                        }`}
                        title="Custom Timer for this task"
                      >
                        ⏱ {task.customDurationMinutes}m/pomo
                      </span>
                    )}
                  </div>
                  {task.notes && (
                    <p
                      className={`text-xs truncate mt-0.5 ${
                        isActive ? 'text-gray-500' : 'text-white/70'
                      }`}
                    >
                      {task.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Pomodoro count indicator */}
              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span
                  className={`text-xs font-mono font-bold ${
                    isActive ? 'text-gray-700' : 'text-white/90'
                  }`}
                >
                  <span className="text-base">{task.actPomodoros}</span>
                  <span className="opacity-60">/{task.estPomodoros} 🍅</span>
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(task);
                  }}
                  className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                    isActive
                      ? 'hover:bg-gray-100 text-gray-500'
                      : 'hover:bg-white/20 text-white'
                  }`}
                  title="Edit task"
                >
                  <Edit2 size={15} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteTask(task.id);
                  }}
                  className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 ${
                    isActive ? 'hover:bg-red-50 text-gray-400' : 'hover:bg-white/20 text-white/80'
                  }`}
                  title="Delete task"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Form or Button */}
      {!isAdding ? (
        <button
          onClick={() => {
            resetForm();
            setIsAdding(true);
          }}
          className="w-full py-3.5 bg-white/10 hover:bg-white/15 border-2 border-dashed border-white/25 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm tracking-wide transition-all active:scale-[0.99] text-white"
        >
          <Plus size={18} />
          <span>Add Task</span>
        </button>
      ) : (
        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl p-5 text-gray-800 shadow-2xl animate-in fade-in duration-150"
        >
          <div className="mb-4">
            <input
              type="text"
              autoFocus
              placeholder="What are you working on?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-base font-semibold px-1 py-1 border-b-2 border-gray-200 focus:border-red-500 outline-none transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Est. Pomodoros
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={estPomodoros}
                  onChange={(e) => setEstPomodoros(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 bg-gray-100 font-bold text-center py-1.5 rounded-xl text-sm border focus:border-red-500 outline-none"
                />
                <span className="text-xs text-gray-400 font-medium">
                  {estPomodoros * (customDuration || pomoTimeMinutes)}m total
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Custom Duration (Mins)
              </label>
              <input
                type="number"
                min="1"
                max="180"
                placeholder={`Default (${pomoTimeMinutes}m)`}
                value={customDuration || ''}
                onChange={(e) =>
                  setCustomDuration(e.target.value ? Math.max(1, parseInt(e.target.value)) : undefined)
                }
                className="w-full bg-gray-100 text-sm font-medium py-1.5 px-3 rounded-xl border focus:border-red-500 outline-none placeholder:text-gray-400"
              />
              <span className="text-[10px] text-gray-400">Leave blank for {pomoTimeMinutes}m</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-gray-100 text-sm font-medium py-1.5 px-3 rounded-xl border focus:border-red-500 outline-none"
              >
                <option value="Work">Work</option>
                <option value="Study">Study</option>
                <option value="Personal">Personal</option>
                <option value="Coding">Coding</option>
                <option value="Reading">Reading</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <textarea
              placeholder="Add note or subtasks (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs focus:bg-white focus:border-red-500 outline-none resize-none transition-all"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
            >
              {editingTaskId ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      )}

      {/* Completion Time & Summary Card */}
      {tasks.length > 0 && (
        <div className="mt-4 bg-black/20 backdrop-blur-xs rounded-xl p-3.5 flex flex-wrap items-center justify-between text-xs border border-white/10">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-300" />
            <span>
              Pomos: <b className="text-white">{tasks.reduce((a, b) => a + b.actPomodoros, 0)}</b> /{' '}
              <b className="text-white">{tasks.reduce((a, b) => a + b.estPomodoros, 0)}</b>
            </span>
          </div>

          <div>
            Finish at:{' '}
            <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded-md ml-1">
              {finishTimeStr} ({Math.round(totalMinsNeeded / 60 * 10) / 10}h left)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

