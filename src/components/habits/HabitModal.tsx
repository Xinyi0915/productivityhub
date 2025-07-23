import React, { useState, useEffect } from 'react';
import { Habit } from '../../store/slices/habitsSlice';

const PASTEL_COLORS = [
  '#FFB3BA', // Pink
  '#BAFFC9', // Green
  '#BAE1FF', // Blue
  '#FFFFBA', // Yellow
  '#FFB3F7', // Purple
];

const HABIT_ICONS = [
  '🏃', '🧘', '💪', '🚴', '🏊', // Exercise
  '📚', '✍️', '🧠', '📝', '🎨', // Learning/Creative
  '💧', '🥗', '😴', '🧹', '💊', // Health/Self-care
  '💻', '📱', '🎮', '🎵', '📺', // Digital/Entertainment
  '🌱', '🧘‍♀️', '🙏', '🧠', '⏰'  // Mindfulness/Time
];

interface HabitModalProps {
  habit?: Habit | null;
  onClose: () => void;
  onSave: (habitData: {
    title: string;
    description: string;
    color: string;
    icon: string;
    frequency: 'daily';
    schedule: number[];
    startDate: string;
    endDate?: string;
  }) => void;
}

const HabitModal: React.FC<HabitModalProps> = ({ onClose, onSave, habit }) => {
  const [title, setTitle] = useState(habit?.title || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [color, setColor] = useState(habit?.color || PASTEL_COLORS[0]);
  const [icon, setIcon] = useState(habit?.icon || HABIT_ICONS[0]);
  const [frequency] = useState<'daily'>('daily');
  const [startDate, setStartDate] = useState(habit?.startDate || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(habit?.endDate || '');

  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setDescription(habit.description || '');
      setColor(habit.color);
      setIcon(habit.icon || HABIT_ICONS[0]);
      setStartDate(habit.startDate);
      setEndDate(habit.endDate || '');
    } else {
      setTitle('');
      setDescription('');
      setColor(PASTEL_COLORS[0]);
      setIcon(HABIT_ICONS[0]);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
    }
  }, [habit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const habitData = {
      title,
      description,
      color,
      icon,
      frequency,
      schedule: [],
      startDate,
      // Convert empty string to undefined
      endDate: endDate === '' ? undefined : endDate
    };

    onSave(habitData);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // If the input is cleared, set endDate to empty string
    setEndDate(value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {habit ? 'Edit Habit' : 'New Habit'}
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              rows={3}
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="w-full px-3 py-2 border rounded-md"
              min={startDate}
            />
            {endDate && endDate < startDate && (
              <p className="mt-1 text-sm text-red-500">End date cannot be before start date</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
            <div className="grid grid-cols-5 gap-2">
              {HABIT_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-full h-10 rounded-lg border-2 flex items-center justify-center transition-all text-2xl ${
                    icon === i ? 'border-gray-900 scale-110 bg-gray-100' : 'border-transparent hover:bg-gray-50'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <div className="grid grid-cols-5 gap-2">
              {PASTEL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-full h-10 rounded-lg border-2 transition-all ${
                    color === c ? 'border-gray-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
            <div className="px-3 py-2 border rounded-md bg-gray-50 text-gray-700">Daily</div>
            <p className="mt-1 text-xs text-gray-500">
              Track this habit every day for the best results
            </p>
          </div>
          <div className="mt-5 sm:mt-6 flex space-x-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 sm:text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={endDate && endDate < startDate}
              className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-base font-medium text-white hover:bg-blue-700 focus:outline-none disabled:bg-blue-300 sm:text-sm"
            >
              {habit ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HabitModal;