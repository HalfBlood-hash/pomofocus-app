import React, { useState } from 'react';
import { WorkTemplate, Task } from '../types';
import {
  X,
  FolderPlus,
  Trash2,
  Plus,
  Sparkles,
  Check,
  Bookmark,
  Layers,
  ListPlus,
  Clock,
  Tag,
  CheckSquare,
  Square,
} from 'lucide-react';

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: WorkTemplate[];
  onSaveTemplate: (template: WorkTemplate) => void;
  onDeleteTemplate: (templateId: string) => void;
  onApplyTemplate: (template: WorkTemplate) => void;
  currentTasks: Task[];
}

export const TemplateModal: React.FC<TemplateModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSaveTemplate,
  onDeleteTemplate,
  onApplyTemplate,
  currentTasks,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  
  // Bulk paste text mode
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Structured task items in this template (group of work)
  const [templateItems, setTemplateItems] = useState<
    Array<{
      title: string;
      estPomodoros: number;
      category: string;
      customDurationMinutes?: number;
      notes?: string;
    }>
  >([
    { title: 'Project Planning & Outline', estPomodoros: 2, category: 'Work', customDurationMinutes: 25 },
    { title: 'Execution & Development', estPomodoros: 3, category: 'Coding', customDurationMinutes: 45 },
    { title: 'Review & Documentation', estPomodoros: 1, category: 'Work', customDurationMinutes: 20 },
  ]);

  // Quick preset work routines (templates as groups of work)
  const QUICK_WORK_GROUPS = [
    {
      name: '💻 Full Dev Sprint (Group)',
      desc: 'Complete software development workflow',
      tasks: [
        { title: 'Check tickets & pull latest code', estPomodoros: 1, category: 'Coding', customDurationMinutes: 15 },
        { title: 'Feature implementation part 1', estPomodoros: 2, category: 'Coding', customDurationMinutes: 45 },
        { title: 'Feature implementation part 2', estPomodoros: 2, category: 'Coding', customDurationMinutes: 45 },
        { title: 'Write tests & self-review PR', estPomodoros: 2, category: 'Coding', customDurationMinutes: 30 },
      ],
    },
    {
      name: '📚 Deep Study Group Session',
      desc: 'Structured learning & revision cycle',
      tasks: [
        { title: 'Active reading & key takeaways', estPomodoros: 2, category: 'Study', customDurationMinutes: 30 },
        { title: 'Solve textbook practice problems', estPomodoros: 3, category: 'Study', customDurationMinutes: 40 },
        { title: 'Flashcards & recall quiz', estPomodoros: 1, category: 'Study', customDurationMinutes: 20 },
      ],
    },
    {
      name: '📋 Daily Standup & Office Routine',
      desc: 'Daily administrative & work sync tasks',
      tasks: [
        { title: 'Email inbox zero & slack replies', estPomodoros: 1, category: 'Work', customDurationMinutes: 20 },
        { title: 'Team sync / standup meeting', estPomodoros: 1, category: 'Work', customDurationMinutes: 25 },
        { title: 'High priority client deliverables', estPomodoros: 3, category: 'Work', customDurationMinutes: 45 },
      ],
    },
  ];

  if (!isOpen) return null;

  const handleAddItem = () => {
    setTemplateItems([
      ...templateItems,
      { title: '', estPomodoros: 1, category: 'Work', customDurationMinutes: 25 },
    ]);
  };

  const handleUpdateItem = (
    index: number,
    field: string,
    value: string | number | undefined
  ) => {
    const updated = [...templateItems];
    updated[index] = { ...updated[index], [field]: value };
    setTemplateItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setTemplateItems(templateItems.filter((_, i) => i !== index));
  };

  // Convert multi-line pasted text into tasks automatically
  const handleProcessBulkText = () => {
    if (!bulkText.trim()) return;
    const lines = bulkText.split('\n').filter((l) => l.trim().length > 0);
    const generated = lines.map((line) => {
      // Clean leading bullet points or numbers (e.g. "1. Task", "- Task", "* Task")
      const cleanTitle = line.replace(/^[\d+.-]\s*/, '').trim();
      return {
        title: cleanTitle,
        estPomodoros: 1,
        category: 'Work',
        customDurationMinutes: 25,
      };
    });
    setTemplateItems([...templateItems, ...generated]);
    setBulkText('');
    setIsBulkMode(false);
  };

  const handleSaveCurrentAsTemplate = () => {
    if (currentTasks.length === 0) {
      alert('You have no current tasks to save as a template group!');
      return;
    }
    const name = prompt('Enter a name for this Work Group Template:', 'Daily Work Group');
    if (!name) return;

    const newTemplate: WorkTemplate = {
      id: 'tpl_' + Date.now(),
      name,
      description: `Saved group of ${currentTasks.length} work tasks`,
      tasks: currentTasks.map((t) => ({
        title: t.title,
        estPomodoros: t.estPomodoros,
        category: t.category || 'General',
        customDurationMinutes: t.customDurationMinutes,
        notes: t.notes,
      })),
    };
    onSaveTemplate(newTemplate);
  };

  const handleCreateCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    const validTasks = templateItems.filter((t) => t.title.trim().length > 0);
    if (validTasks.length === 0) {
      alert('Please add at least one task to your work group.');
      return;
    }

    const newTemplate: WorkTemplate = {
      id: 'tpl_' + Date.now(),
      name: templateName,
      description: templateDescription || `Group of ${validTasks.length} tasks`,
      tasks: validTasks,
    };

    onSaveTemplate(newTemplate);
    setIsCreating(false);
    setTemplateName('');
    setTemplateDescription('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 text-gray-800 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center">
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Work Group Templates</h2>
              <p className="text-xs text-gray-500">
                Organize and batch multiple tasks together as a full routine
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="py-4 max-h-[70vh] overflow-y-auto space-y-4 pr-1">
          {!isCreating ? (
            <>
              {/* Top Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Your Work Groups ({templates.length})
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveCurrentAsTemplate}
                    className="text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors flex items-center gap-1.5"
                    title="Export your current active tasks as a template group"
                  >
                    <FolderPlus size={14} />
                    From Current Tasks
                  </button>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="text-xs font-semibold px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus size={14} />
                    Create Work Group
                  </button>
                </div>
              </div>

              {/* Quick Preset Work Groups */}
              {templates.length === 0 && (
                <div className="border border-red-100 bg-red-50/50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-red-500" />
                    <span className="text-xs font-bold text-red-700 uppercase">
                      Quick Start With A Work Group Preset
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                    {QUICK_WORK_GROUPS.map((q, idx) => (
                      <div
                        key={idx}
                        className="bg-white p-3 rounded-xl border border-red-200/60 shadow-2xs flex flex-col justify-between"
                      >
                        <div>
                          <h4 className="font-bold text-xs text-gray-800">{q.name}</h4>
                          <p className="text-[11px] text-gray-500 mt-1">{q.desc}</p>
                          <span className="text-[10px] text-red-600 font-semibold block mt-1">
                            {q.tasks.length} tasks ready
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            onSaveTemplate({
                              id: 'tpl_preset_' + idx,
                              name: q.name,
                              description: q.desc,
                              tasks: q.tasks,
                            });
                          }}
                          className="mt-3 w-full py-1 text-xs bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition-colors"
                        >
                          + Add This Group
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Saved Templates List */}
              {templates.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Layers size={36} className="mx-auto text-gray-300 mb-2" />
                  <p className="font-semibold text-gray-600">No template groups yet</p>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1">
                    Create a group of tasks (e.g. Morning Sprint, Study Schedule, Workout Routine) to load all your work at once in one click!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {templates.map((tpl) => {
                    const totalEstPomos = tpl.tasks.reduce(
                      (acc, t) => acc + (t.estPomodoros || 1),
                      0
                    );
                    const totalMinutes = tpl.tasks.reduce(
                      (acc, t) =>
                        acc + (t.estPomodoros || 1) * (t.customDurationMinutes || 25),
                      0
                    );

                    return (
                      <div
                        key={tpl.id}
                        className="p-4 rounded-2xl border border-gray-200 hover:border-red-300 transition-all bg-white hover:shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                              {tpl.name}
                              <span className="text-xs font-bold px-2 py-0.5 bg-red-50 text-red-600 rounded-lg">
                                {tpl.tasks.length} tasks in group
                              </span>
                              <span className="text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg">
                                ⏱ ≈ {Math.round(totalMinutes / 60 * 10) / 10}h ({totalEstPomos} pomos)
                              </span>
                            </h3>
                            {tpl.description && (
                              <p className="text-xs text-gray-500 mt-1">{tpl.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                onApplyTemplate(tpl);
                                onClose();
                              }}
                              className="px-3.5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1 active:scale-95 transition-all"
                            >
                              <Check size={14} />
                              Apply Group to Day
                            </button>
                            <button
                              onClick={() => onDeleteTemplate(tpl.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                              title="Delete template group"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* List preview of tasks in the group */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                            Group Workflow Tasks:
                          </span>
                          <div className="space-y-1">
                            {tpl.tasks.map((task, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs bg-gray-50 hover:bg-gray-100/70 p-2 rounded-xl transition-colors"
                              >
                                <span className="font-medium text-gray-800 flex items-center gap-2">
                                  <span className="w-5 text-center font-mono text-[10px] text-gray-400 bg-white py-0.5 rounded border border-gray-200">
                                    {idx + 1}
                                  </span>
                                  {task.title}
                                </span>
                                <div className="flex items-center gap-2">
                                  {task.category && (
                                    <span className="text-[10px] bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                      {task.category}
                                    </span>
                                  )}
                                  <span className="font-bold text-gray-700">
                                    {task.estPomodoros} 🍅
                                    {task.customDurationMinutes && ` (${task.customDurationMinutes}m)`}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleCreateCustomTemplate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                    Group / Template Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Afternoon Coding Sprint"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                    Group Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3-hour focus routine for feature work"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Tasks Group Editor */}
              <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Tasks in this Work Group ({templateItems.length})
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Add as many tasks as needed with custom pomodoros and individual timings
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsBulkMode(!isBulkMode)}
                      className="text-xs font-semibold px-2.5 py-1 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-100 flex items-center gap-1"
                    >
                      <ListPlus size={13} />
                      {isBulkMode ? 'Close Bulk Paste' : 'Bulk Paste'}
                    </button>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs font-bold px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-1 shadow-2xs"
                    >
                      <Plus size={13} /> Add Task
                    </button>
                  </div>
                </div>

                {/* Bulk Paste Box */}
                {isBulkMode && (
                  <div className="mb-3 p-3 bg-white border border-gray-200 rounded-xl space-y-2">
                    <label className="block text-[11px] font-bold text-gray-600">
                      Paste multiple tasks (one per line):
                    </label>
                    <textarea
                      rows={3}
                      value={bulkText}
                      onChange={(e) => setBulkText(e.target.value)}
                      placeholder="1. Plan architecture&#10;2. Write API routes&#10;3. Test endpoints"
                      className="w-full p-2 border border-gray-200 rounded-lg text-xs outline-none focus:border-red-500 font-mono"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleProcessBulkText}
                        className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600"
                      >
                        Convert & Add to Group
                      </button>
                    </div>
                  </div>
                )}

                {/* Individual Tasks Table */}
                <div className="space-y-2 max-h-[35vh] overflow-y-auto pr-1">
                  {templateItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs"
                    >
                      <span className="w-5 text-center font-bold text-xs text-gray-400">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Task title (e.g. Code Review)"
                        value={item.title}
                        onChange={(e) => handleUpdateItem(idx, 'title', e.target.value)}
                        className="flex-1 min-w-[140px] bg-gray-50 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:border-red-500"
                        required
                      />
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={item.estPomodoros}
                          onChange={(e) =>
                            handleUpdateItem(
                              idx,
                              'estPomodoros',
                              parseInt(e.target.value) || 1
                            )
                          }
                          className="w-14 bg-gray-50 px-1.5 py-1.5 border border-gray-200 rounded-lg text-xs text-center font-bold"
                          title="Estimated Pomodoros"
                        />
                        <span className="text-[11px] text-gray-400">🍅</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="180"
                          placeholder="Mins"
                          value={item.customDurationMinutes || ''}
                          onChange={(e) =>
                            handleUpdateItem(
                              idx,
                              'customDurationMinutes',
                              e.target.value ? parseInt(e.target.value) : undefined
                            )
                          }
                          className="w-16 bg-gray-50 px-1.5 py-1.5 border border-gray-200 rounded-lg text-xs text-center font-medium placeholder:text-gray-400"
                          title="Custom Duration (minutes) per pomodoro"
                        />
                        <span className="text-[11px] text-gray-400">m</span>
                      </div>
                      <select
                        value={item.category}
                        onChange={(e) => handleUpdateItem(idx, 'category', e.target.value)}
                        className="bg-gray-50 px-2 py-1.5 border border-gray-200 rounded-lg text-xs font-medium"
                      >
                        <option value="Work">Work</option>
                        <option value="Study">Study</option>
                        <option value="Personal">Personal</option>
                        <option value="Coding">Coding</option>
                        <option value="Reading">Reading</option>
                      </select>
                      {templateItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                          title="Remove from group"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-bold bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-md transition-all active:scale-95"
                >
                  Save Work Group ({templateItems.length} tasks)
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
