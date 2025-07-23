import React from 'react';
import { useMemo } from 'react';
import { Habit } from '../../store/slices/habitsSlice';
import { addTask } from '../../store/slices/tasksSlice';
import { addDays, startOfToday, isWithinInterval, isSameDay, parseISO, isBefore, isAfter } from 'date-fns';
import { useAppDispatch } from '../../hooks/useAppDispatch';
import { addNotification } from '../../store/slices/notificationsSlice';

interface HabitGridProps {
  habits: Habit[];
  onToggleCompletion: (habitId: string, date: string) => void;
  onHabitClick: (habit: Habit) => void;
}

const HabitGrid: React.FC<HabitGridProps> = ({ habits, onToggleCompletion, onHabitClick }) => {
  const dispatch = useAppDispatch();
  const today = startOfToday();

  const dates = useMemo(() => {
    const result: Date[] = [];
    const maxDaysToShow = 7;
    
    // Always start from today and show next 6 days
    for (let i = 0; i < maxDaysToShow; i++) {
      const date = addDays(today, i);
      result.push(date);
    }
    
    return result;
  }, [today]);

  // Helper function to format date consistently as YYYY-MM-DD
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDayLabel = (date: Date) => {
    if (isSameDay(date, today)) return 'Today';
    if (isSameDay(date, addDays(today, 1))) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Check if a date is within the habit's active range
  const isDateInHabitRange = (habit: Habit, date: Date) => {
    const habitStartDate = parseISO(habit.startDate);
    const habitEndDate = habit.endDate ? parseISO(habit.endDate) : null;
    
    // Check if date is after or equal to start date
    if (isBefore(date, habitStartDate)) return false;
    
    // Check if date is before or equal to end date (if end date exists)
    if (habitEndDate && isBefore(habitEndDate, date)) return false;
    
    return true;
  };

  // Check if a date is in the future (after today)
  const isDateInFuture = (date: Date) => {
    return isAfter(date, today);
  };

  const getCompletionStatus = (habit: Habit, date: Date) => {
    const dateStr = formatDate(date);
    return habit.completions.find(c => c.date === dateStr)?.completed;
  };

  const handleCreateTask = (habit: Habit, date: Date, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent habit click
    const deadline = new Date(date);
    deadline.setHours(23, 59, 59);

    // Create the task
    dispatch(addTask({
      title: habit.title,
      description: habit.description,
      priority: 'medium',
      deadline: deadline.toISOString()
    }));

    // Show success notification
    dispatch(addNotification({
      title: 'Task Created',
      message: `Created task "${habit.title}" for ${date.toLocaleDateString()}`,
      type: 'success'
    }));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr>
            <th className="py-3 px-4 text-left bg-gray-50 border-b font-medium text-gray-900 w-48">
              Habit
            </th>
            {dates.map((date) => (
              <th
                key={date.toISOString()}
                className="py-3 px-4 text-center bg-gray-50 border-b font-medium text-gray-900 min-w-[100px]"
              >
                <div className="text-sm">{formatDayLabel(date)}</div>
                <div className="text-xs text-gray-500">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {habits.map((habit) => (
            <tr
              key={habit.id}
              className="border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
              onClick={() => onHabitClick(habit)}
            >
              <td className="py-3 px-4">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: habit.color }}
                  />
                  <span className="font-medium text-gray-900">{habit.title}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Started: {new Date(habit.startDate).toLocaleDateString()}
                </div>
              </td>
              {dates.map((date) => {
                const isCompleted = getCompletionStatus(habit, date);
                const isInRange = isDateInHabitRange(habit, date);
                const isFutureDate = isDateInFuture(date);
                return (
                  <td
                    key={date.toISOString()}
                    className="py-3 px-4 text-center relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isInRange ? (
                      <div className="flex flex-col items-center space-y-2">
                        <button
                          onClick={() => !isFutureDate && onToggleCompletion(habit.id, formatDate(date))}
                          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                            isCompleted
                              ? 'bg-green-500 border-transparent'
                              : isFutureDate
                                ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                                : 'border-gray-300 hover:border-gray-400'
                          }`}
                          disabled={isFutureDate}
                        >
                          {isCompleted && (
                            <svg
                              className="w-5 h-5 text-white"
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
                          )}
                          {isFutureDate && !isCompleted && (
                            <span className="text-xs text-gray-400">🔒</span>
                          )}
                        </button>
                        <button
                          onClick={(e) => handleCreateTask(habit, date, e)}
                          className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          Create Task
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 italic">Not started</div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HabitGrid; 