import React from 'react';
import { Task } from '../types';
import { X, BarChart2, PieChart, TrendingUp, AlertTriangle, Calendar, Award } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  pomoTimeMinutes: number;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  tasks,
  pomoTimeMinutes,
}) => {
  if (!isOpen) return null;

  // Calculate statistics
  const totalActPomodoros = tasks.reduce((sum, t) => sum + (t.actPomodoros || 0), 0);
  const totalTimeSpentSeconds = tasks.reduce((sum, t) => sum + (t.timeSpentSeconds || (t.actPomodoros * pomoTimeMinutes * 60)), 0);
  const totalHours = (totalTimeSpentSeconds / 3600).toFixed(1);
  const totalMinutes = Math.round(totalTimeSpentSeconds / 60);

  const completedCount = tasks.filter((t) => t.completed).length;

  // Group by category
  const categoryMap: Record<string, { seconds: number; pomos: number; count: number }> = {};
  tasks.forEach((t) => {
    const cat = t.category || 'General';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { seconds: 0, pomos: 0, count: 0 };
    }
    const sec = t.timeSpentSeconds || (t.actPomodoros * pomoTimeMinutes * 60);
    categoryMap[cat].seconds += sec;
    categoryMap[cat].pomos += t.actPomodoros;
    categoryMap[cat].count += 1;
  });

  const categories = Object.entries(categoryMap).sort((a, b) => b[1].seconds - a[1].seconds);

  // Group by task time spent (to identify "Where I take more time")
  const tasksSortedByTime = [...tasks]
    .map((t) => {
      const sec = t.timeSpentSeconds || (t.actPomodoros * pomoTimeMinutes * 60);
      const isOverdue = t.actPomodoros > t.estPomodoros;
      const overrunPomos = Math.max(0, t.actPomodoros - t.estPomodoros);
      return {
        ...t,
        sec,
        minutes: Math.round(sec / 60),
        isOverdue,
        overrunPomos,
      };
    })
    .sort((a, b) => b.sec - a.sec);

  // Tasks that took longer than estimated (Time Sink detection)
  const timeSinks = tasksSortedByTime.filter((t) => t.isOverdue || t.minutes > 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 text-gray-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <BarChart2 size={22} className="text-red-500" />
            <h2 className="text-xl font-bold">Activity Report & Time Analysis</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50/70 p-3.5 rounded-xl border border-red-100 text-center">
              <span className="text-xs font-semibold text-red-600 block uppercase">Hours Focused</span>
              <span className="text-2xl font-extrabold text-red-600">{totalHours}h</span>
              <span className="text-[11px] text-red-400 block mt-0.5">({totalMinutes} mins)</span>
            </div>
            <div className="bg-orange-50/70 p-3.5 rounded-xl border border-orange-100 text-center">
              <span className="text-xs font-semibold text-orange-600 block uppercase">Pomodoros</span>
              <span className="text-2xl font-extrabold text-orange-600">{totalActPomodoros}</span>
              <span className="text-[11px] text-orange-400 block mt-0.5">sessions finished</span>
            </div>
            <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-100 text-center">
              <span className="text-xs font-semibold text-emerald-600 block uppercase">Completed</span>
              <span className="text-2xl font-extrabold text-emerald-600">
                {completedCount} / {tasks.length}
              </span>
              <span className="text-[11px] text-emerald-500 block mt-0.5">
                {tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}% tasks done
              </span>
            </div>
          </div>

          {/* Time Consuming Breakdown - "Where I take more time" */}
          <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <h3 className="font-bold text-gray-800 text-sm">
                Where You Spend The Most Time (Deep-Dive Analysis)
              </h3>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Identifies heavy tasks and items that exceeded your planned Pomodoro estimates.
            </p>

            {tasksSortedByTime.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No tasks logged yet. Start working on a task to see metrics.</p>
            ) : (
              <div className="space-y-2">
                {tasksSortedByTime.slice(0, 5).map((t, idx) => {
                  const percentOfTotal = totalTimeSpentSeconds > 0 ? Math.round((t.sec / totalTimeSpentSeconds) * 100) : 0;
                  return (
                    <div key={t.id} className="bg-white p-2.5 rounded-lg border border-amber-100/80 shadow-2xs">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-gray-800 flex items-center gap-1.5 truncate max-w-[260px]">
                          <span className="w-4 text-gray-400 font-mono text-[10px]">#{idx + 1}</span>
                          {t.title}
                          {t.isOverdue && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.2 rounded">
                              +{t.overrunPomos} pomos overdue
                            </span>
                          )}
                        </span>
                        <span className="font-bold text-gray-700 font-mono">
                          {t.minutes}m ({t.actPomodoros}/{t.estPomodoros} 🍅)
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            t.isOverdue ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.max(5, percentOfTotal)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Breakdown */}
          <div>
            <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
              <PieChart size={18} className="text-blue-500" />
              Time by Category
            </h3>
            {categories.length === 0 ? (
              <p className="text-xs text-gray-400">No categories recorded.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {categories.map(([cat, data]) => {
                  const mins = Math.round(data.seconds / 60);
                  const share = totalTimeSpentSeconds > 0 ? Math.round((data.seconds / totalTimeSpentSeconds) * 100) : 0;
                  return (
                    <div key={cat} className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <div className="flex justify-between items-center text-xs font-bold mb-1">
                        <span className="text-gray-700">{cat}</span>
                        <span className="text-blue-600 font-mono">{mins} mins ({share}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mb-1">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-400">
                        {data.pomos} pomos • {data.count} tasks
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Efficiency & Productivity Advice */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex gap-3 items-start">
            <Award size={20} className="text-indigo-600 mt-0.5 shrink-0" />
            <div className="text-xs text-indigo-900 leading-relaxed">
              <span className="font-bold block">Smart Productivity Insight:</span>
              {timeSinks.length > 0 ? (
                <span>
                  You spent significant additional time on <b>{timeSinks[0].title}</b>. Consider breaking tasks larger than 4 Pomodoros (100 min) into smaller sub-tasks to avoid fatigue.
                </span>
              ) : (
                <span>
                  Great job staying on track with your estimates! Consistency in your intervals is the key to deep focus.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-xl text-sm font-semibold transition-all"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

