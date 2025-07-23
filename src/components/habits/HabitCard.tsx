import React, { useMemo } from 'react';
import { Habit } from '../../store/slices/habitsSlice';

interface HabitCardProps {
  habit: Habit;
  onToggleCompletion: (date: string) => void;
  onClick: (habit: Habit) => void;
}

const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  onToggleCompletion,
  onClick,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const isCompletedToday = habit.completions.some(
    (c) => c.date.split('T')[0] === today && c.completed
  );

  // Calculate completion rate based on habit's date range
  const { daysInRange, completedDays, progress } = useMemo(() => {
    const startDate = new Date(habit.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Use today as end date instead of habit.endDate if habit is ongoing
    const endDate = habit.endDate && new Date(habit.endDate) < today 
      ? new Date(habit.endDate) 
      : today;
    
    // Calculate total days in range
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    
    // Generate array of dates in range
    const datesInRange = Array.from({ length: totalDays }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      return date.toISOString().split('T')[0];
    });

    // Filter out future dates
    const pastDates = datesInRange.filter(dateStr => dateStr <= today.toISOString().split('T')[0]);
    
    // Count completed days
    const completed = pastDates.filter(date => 
      habit.completions.some(c => {
        // Normalize date formats for comparison
        const completionDate = c.date.split('T')[0];
        return completionDate === date && c.completed;
      })
    ).length;

    return {
      daysInRange: pastDates.length,
      completedDays: completed,
      progress: pastDates.length > 0 ? Math.round((completed / pastDates.length) * 100) : 0
    };
  }, [habit]);

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 hover:border-gray-300 transition-all p-4 cursor-pointer"
      onClick={() => onClick(habit)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: habit.color }}
          />
          <div className="flex items-center space-x-2">
            <span className="text-xl" title="Habit icon">{habit.icon}</span>
          <h3 className="text-lg font-medium text-gray-900">{habit.title}</h3>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCompletion(today);
          }}
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
            isCompletedToday
              ? 'bg-green-500 border-transparent text-white'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {isCompletedToday ? (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            <span className="text-gray-400 text-xl">+</span>
          )}
        </button>
      </div>

      {habit.description && (
        <p className="mt-2 text-sm text-gray-500">{habit.description}</p>
      )}

      <div className="mt-4">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Completion Rate</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full transition-all"
            style={{ 
              width: `${progress}%`,
              backgroundColor: habit.color || '#10B981' // Use habit color or default to green
            }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-gray-500">
          {completedDays} of {daysInRange} days completed
        </span>
        {completedDays > 0 && (
          <span className="text-gray-600 font-medium">
            {progress}% success rate
          </span>
        )}
      </div>

      {/* Streak display */}
      {(habit.currentStreak > 0 || habit.bestStreak > 0) && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            {habit.currentStreak > 0 && (
              <div className="flex items-center space-x-1">
                <span className="text-orange-500 text-lg">🔥</span>
                <span className="text-sm font-medium text-gray-700">
                  Current streak: <span className="text-orange-600 font-bold">{habit.currentStreak}</span> {habit.currentStreak === 1 ? 'day' : 'days'}
                </span>
              </div>
            )}
            {habit.bestStreak > 0 && habit.bestStreak !== habit.currentStreak && (
              <div className="flex items-center space-x-1">
                <span className="text-purple-500 text-lg">🏆</span>
                <span className="text-sm font-medium text-gray-700">
                  Best: <span className="text-purple-600 font-bold">{habit.bestStreak}</span> {habit.bestStreak === 1 ? 'day' : 'days'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitCard; 