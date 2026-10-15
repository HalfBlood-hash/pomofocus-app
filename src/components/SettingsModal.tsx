import React from 'react';
import { UserSettings } from '../types';
import { X, Clock, Bell, Zap, Volume2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  onSave: (newSettings: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [localSettings, setLocalSettings] = React.useState<UserSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 text-gray-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock size={20} className="text-red-500" />
            Timer Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="py-4 space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* Time durations in minutes */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Time (Minutes)
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Pomodoro</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={localSettings.pomoTime}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, pomoTime: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-full bg-gray-100 text-gray-800 font-bold text-center py-2 rounded-xl text-base focus:bg-white focus:ring-2 focus:ring-red-400 outline-none border border-transparent focus:border-red-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Short Break</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={localSettings.shortBreakTime}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, shortBreakTime: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-full bg-gray-100 text-gray-800 font-bold text-center py-2 rounded-xl text-base focus:bg-white focus:ring-2 focus:ring-teal-400 outline-none border border-transparent focus:border-teal-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Long Break</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={localSettings.longBreakTime}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, longBreakTime: Math.max(1, parseInt(e.target.value) || 1) })
                  }
                  className="w-full bg-gray-100 text-gray-800 font-bold text-center py-2 rounded-xl text-base focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none border border-transparent focus:border-blue-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Long break interval */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-sm font-semibold text-gray-700 block">Long Break Interval</span>
              <span className="text-xs text-gray-400">Number of pomodoros before long break</span>
            </div>
            <input
              type="number"
              min="1"
              max="12"
              value={localSettings.longBreakInterval}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, longBreakInterval: Math.max(1, parseInt(e.target.value) || 1) })
              }
              className="w-16 bg-gray-100 text-gray-800 font-bold text-center py-1.5 rounded-xl text-base outline-none border focus:border-red-400"
            />
          </div>

          {/* Auto starts */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap size={14} /> Automation
            </h3>
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-sm text-gray-700">Auto-start Breaks</span>
              <input
                type="checkbox"
                checked={localSettings.autoStartBreaks}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, autoStartBreaks: e.target.checked })
                }
                className="w-5 h-5 accent-red-500 rounded cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-sm text-gray-700">Auto-start Pomodoros</span>
              <input
                type="checkbox"
                checked={localSettings.autoStartPomodoro}
                onChange={(e) =>
                  setLocalSettings({ ...localSettings, autoStartPomodoro: e.target.checked })
                }
                className="w-5 h-5 accent-red-500 rounded cursor-pointer"
              />
            </label>
          </div>

          {/* Sound Notification */}
          <div className="pt-2 border-t border-gray-100 space-y-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Bell size={14} /> Alarm Sound
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(['bell', 'kitchen', 'digital'] as const).map((sound) => (
                <button
                  key={sound}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, alarmSound: sound })}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl capitalize transition-all border ${
                    localSettings.alarmSound === sound
                      ? 'border-red-500 bg-red-50 text-red-600 shadow-xs'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {sound}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-md transition-all active:scale-95"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

