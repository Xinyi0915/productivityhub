import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { Task, toggleTaskAndUpdateCoins } from '../store/slices/tasksSlice';
import { Habit, toggleHabitCompletionAndUpdateCoins } from '../store/slices/habitsSlice';
import { useNavigate } from 'react-router-dom';

// Helper function to get days in month
const getDaysInMonth = (year: number, month: number): Date[] => {
  const days: Date[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month, day));
  }
  
  return days;
};

// Helper to get days of week as header
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const CalendarPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const habits = useSelector((state: RootState) => state.habits.habits);
  const taskGroups = useSelector((state: RootState) => state.tasks.groups);
  
  // State for selected date/month
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [showDayDetails, setShowDayDetails] = useState<boolean>(false);
  
  // Calculate calendar days for the month
  const calendarDays = useMemo(() => {
    const days = getDaysInMonth(currentYear, currentMonth);
    
    // Add days from previous month to fill first week
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const prevMonthDays: Date[] = [];
    
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth, 0);
      date.setDate(date.getDate() - i);
      prevMonthDays.push(date);
    }
    
    // Add days from next month to fill last week
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDay();
    const nextMonthDays: Date[] = [];
    
    for (let i = 1; i < 7 - lastDayOfMonth; i++) {
      const date = new Date(currentYear, currentMonth + 1, i);
      nextMonthDays.push(date);
    }
    
    return [...prevMonthDays, ...days, ...nextMonthDays];
  }, [currentMonth, currentYear]);
  
  // Get tasks and habits for a specific date
  const getTasksForDate = (date: Date): Task[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const startOfDay = new Date(year, month, day, 0, 0, 0, 0).getTime();
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999).getTime();

    return tasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = new Date(task.deadline).getTime();
      return taskDate >= startOfDay && taskDate <= endOfDay;
    });
  };
  
  // Get habits for a specific date
  const getHabitsForDate = (date: Date): Habit[] => {
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    
    return habits.filter(habit => {
      // Check if date is within habit's date range
      const startDate = new Date(habit.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      // If date is before start date, don't show the habit
      if (dateToCheck < startDate) return false;
      
      // If habit has an end date and date is after end date, don't show the habit
      if (habit.endDate) {
        const endDate = new Date(habit.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (dateToCheck > endDate) return false;
      }

      // Show habit if it's within the date range
      return true;
    });
  };
  
  // Get selected day data
  const selectedDayTasks = useMemo(() => getTasksForDate(selectedDate), [selectedDate, tasks]);
  const selectedDayHabits = useMemo(() => getHabitsForDate(selectedDate), [selectedDate, habits]);
  
  // Navigation between months
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(today);
  };
  
  // Get class for calendar day
  const getDayClass = (date: Date): string => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const isCurrentMonth = date.getMonth() === currentMonth;
    
    let classes = 'min-h-[100px] border border-gray-200 p-1 transition-colors ';
    
    if (isToday) {
      classes += 'bg-blue-50 ';
    }
    
    if (isSelected) {
      classes += 'ring-2 ring-blue-500 ';
    }
    
    if (!isCurrentMonth) {
      classes += 'bg-gray-50 text-gray-400 ';
    }
    
    return classes;
  };
  
  // Format date for display
  const formatDate = (date: Date): string => {
    return date.getDate().toString();
  };
  
  // Handle day selection
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayDetails(true);
  };
  
  // Handle task and habit interactions
  const handleTaskClick = (task: Task) => {
    navigate('/tasks');
  };
  
  const handleHabitClick = (habit: Habit) => {
    navigate('/habits');
  };
  
  const handleToggleTask = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(toggleTaskAndUpdateCoins(taskId));
  };
  
  const handleToggleHabit = (habitId: string, date: Date, e: React.MouseEvent) => {
    e.stopPropagation();
    // Use local date string instead of ISO string
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    dispatch(toggleHabitCompletionAndUpdateCoins({ habitId, date: dateStr }) as any);
  };
  
  // Get status of habit for a specific date
  const getHabitStatus = (habit: Habit, date: Date): boolean => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const completion = habit.completions.find(c => c.date === dateStr);
    return completion?.completed || false;
  };
  
  // Check if a habit can be toggled on a certain date
  const canToggleHabit = (habit: Habit, date: Date): boolean => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    // Prevent toggling future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (checkDate > today) return false;
    
    // Check if date is within habit's date range
    const startDate = new Date(habit.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    if (checkDate < startDate) return false;
    
    if (habit.endDate) {
      const endDate = new Date(habit.endDate);
      endDate.setHours(23, 59, 59, 999);
      if (checkDate > endDate) return false;
    }

    // Check if already completed
    return !getHabitStatus(habit, date);
  };
  
  // Get task priority color
  const getTaskPriorityColor = (priority: Task['priority']): string => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Format date for day details header
  const formatSelectedDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
            >
              Today
            </button>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-700">
          {MONTHS[currentMonth]} {currentYear}
        </h2>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        <div className="bg-white rounded-lg shadow overflow-hidden md:w-2/3">
          {/* Calendar header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
            {DAYS_OF_WEEK.map((day) => (
              <div key={day} className="py-2 text-center font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
              const dayTasks = getTasksForDate(day);
              const dayHabits = getHabitsForDate(day);
              
              return (
                <div
                  key={day.toISOString()}
                  className={getDayClass(day)}
                  onClick={() => handleDayClick(day)}
                >
                  {/* Day number */}
                  <div className="text-right">
                    <span className="text-sm font-semibold">{formatDate(day)}</span>
                  </div>
                  
                  {/* Tasks */}
                  <div className="mt-1 space-y-1 max-h-[75px] overflow-y-auto">
                    {dayTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`text-xs p-1 flex items-start ${
                          task.completed ? 'line-through text-gray-500' : getTaskPriorityColor(task.priority)
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTaskClick(task);
                        }}
                      >
                        <span className="truncate leading-normal">{task.title}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Habits */}
                  {dayHabits.length > 0 && (
                    <div className="mt-1 space-y-1 max-h-[75px] overflow-y-auto">
                      {dayHabits.map((habit) => {
                        const isCompleted = getHabitStatus(habit, day);
                        const canToggle = canToggleHabit(habit, day);
                        return (
                          <div
                            key={habit.id}
                            className={`text-xs p-1 flex items-start ${
                              isCompleted ? 'line-through text-gray-500' : ''
                            }`}
                            style={{ 
                              backgroundColor: isCompleted ? habit.color + '40' : habit.color + '20',
                              color: isCompleted ? '#6B7280' : '#1F2937'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleHabit(habit.id, day, e);
                            }}
                          >
                            <span className="truncate leading-normal">{habit.title}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Day details panel */}
        <div className={`bg-white rounded-lg shadow p-4 md:w-1/3 ${showDayDetails ? 'block' : 'hidden md:block'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {formatSelectedDate(selectedDate)}
            </h2>
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => setShowDayDetails(false)}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tasks section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Tasks</h3>
            {selectedDayTasks.length === 0 ? (
              <p className="text-gray-500 text-sm">No tasks scheduled for this day.</p>
            ) : (
              <div className="space-y-3">
                {selectedDayTasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition"
                  >
                    <div className="flex items-start">
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                            {task.title}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${getTaskPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p className={`mt-1 text-sm ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                            {task.description}
                          </p>
                        )}
                        {task.deadline && (
                          <p className="mt-1 text-xs text-gray-500">
                            Due: {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Habits section */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">Habits</h3>
            {selectedDayHabits.length === 0 ? (
              <p className="text-gray-500 text-sm">No habits to track.</p>
            ) : (
              <div className="space-y-3">
                {selectedDayHabits.map((habit) => {
                  const isCompleted = getHabitStatus(habit, selectedDate);
                  const canToggle = canToggleHabit(habit, selectedDate);
                  return (
                    <div 
                      key={habit.id} 
                      className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition"
                      style={{ backgroundColor: isCompleted ? habit.color + '20' : 'white' }}
                    >
                      <div className="flex items-start">
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <h4 className={`font-medium ${isCompleted ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                              {habit.title}
                            </h4>
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }}></span>
                          </div>
                          {habit.description && (
                            <p className={`mt-1 text-sm ${isCompleted ? 'text-gray-400' : 'text-gray-600'}`}>
                              {habit.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarPage; 