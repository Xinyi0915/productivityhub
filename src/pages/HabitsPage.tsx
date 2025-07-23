import React, { useState, useMemo, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { 
  Habit, 
  toggleHabitCompletionAndUpdateCoins,
  deleteHabit,
  fetchHabits,
  createHabit,
  updateHabitAsync,
  deleteHabitAsync,
  refreshHabits
} from '../store/slices/habitsSlice';
import HabitModal from '../components/habits/HabitModal';
import { AppDispatch } from '../store';

const HabitsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { habits, loading, refreshing, error } = useSelector((state: RootState) => state.habits);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Load habits when component mounts and refresh when navigating back
  useEffect(() => {
    const loadHabits = async () => {
      await dispatch(fetchHabits());
      // Force a refresh to ensure we have the latest data
      await dispatch(refreshHabits());
    };
    
    loadHabits();
    
    // Add event listener for when the page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadHabits();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Force a final refresh and persist when leaving the page
      dispatch(refreshHabits());
      dispatch({ type: 'persist/PERSIST' });
    };
  }, [dispatch]);

  // Calculate the current date
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Handle refresh button click
  const handleRefresh = () => {
    dispatch(refreshHabits());
  };

  const handleViewHabitDetails = (habit: Habit) => {
    setSelectedHabit(habit);
    setIsDetailsModalOpen(true);
  };

  const handleEditHabit = (habit: Habit, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedHabit(habit);
    setIsModalOpen(true);
  };

  const handleAddHabit = () => {
    setSelectedHabit(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedHabit(null);
  };

  const handleToggleCompletion = async (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Find the habit to check if the selected date is valid for this habit
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    // Prevent completion for dates before the habit's start date
    const selectedDateObj = new Date(selectedDate);
    const startDateObj = new Date(habit.startDate);
    
    // Set both dates to start of day for accurate comparison
    selectedDateObj.setHours(0, 0, 0, 0);
    startDateObj.setHours(0, 0, 0, 0);
    
    if (selectedDateObj < startDateObj) {
      alert(`Cannot complete habit before its start date (${new Date(habit.startDate).toLocaleDateString()})`);
      return;
    }

    // Prevent completion for dates after the habit's end date, if specified
    if (habit.endDate) {
      const endDateObj = new Date(habit.endDate);
      endDateObj.setHours(23, 59, 59, 999); // Set to end of day
      if (selectedDateObj > endDateObj) {
        alert(`Cannot complete habit after its end date (${new Date(habit.endDate).toLocaleDateString()})`);
        return;
      }
    }

    // For weekly habits, check if the selected date is a scheduled day
    if (habit.frequency === 'weekly' && habit.schedule.length > 0) {
      const selectedDateObj = new Date(selectedDate);
      const dayOfWeek = selectedDateObj.getDay(); // 0 for Sunday, 1 for Monday, etc.
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1-7 format (Monday-Sunday)
      
      if (!habit.schedule.includes(adjustedDay)) {
        alert(`This habit is not scheduled for ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}`);
        return;
      }
    }

    try {
      // All checks passed, dispatch the action to toggle completion
      await dispatch(toggleHabitCompletionAndUpdateCoins({ habitId, date: selectedDate })).unwrap();
      
      // Refresh the habits list to ensure we have the latest data
      dispatch(refreshHabits());
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      // Optionally show an error message to the user
      alert('Failed to update habit completion. Please try again.');
    }
  };

  const handleDeleteHabit = (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this habit?')) {
      dispatch(deleteHabitAsync(habitId));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
    setShowDatePicker(false);
  };

  // Calculate streak for each habit
  // Note: This function is kept for reference but we now use habit.currentStreak
  // which is managed by the habitsSlice reducer
  const calculateStreak = (completions: Array<{date: string, completed: boolean}>): number => {
    const sortedCompletions = [...completions]
      .filter(c => c.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (sortedCompletions.length === 0) return 0;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if the most recent completion is from today or yesterday
    const mostRecentDate = sortedCompletions[0].date.split('T')[0];
    if (mostRecentDate !== today && mostRecentDate !== yesterdayStr) return 0;

    let streak = 1;
    for (let i = 1; i < sortedCompletions.length; i++) {
      const current = new Date(sortedCompletions[i].date);
      const previous = new Date(sortedCompletions[i - 1].date);
      const dayDifference = Math.floor(
        (previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dayDifference === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const getStreakEmoji = (streak: number): string => {
    if (streak === 0) return '🔄';
    if (streak < 3) return '🔥';
    if (streak < 7) return '🔥🔥';
    if (streak < 14) return '🔥🔥🔥';
    return '🔥🔥🔥💯';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Habit Tracker</h1>
          <p className="text-gray-600 mt-1">Build lasting habits, one day at a time</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Selector */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
            >
              <span className="hidden md:inline">Date:</span>
              <span className="font-medium">
                {selectedDate === today
                  ? 'Today'
                  : new Date(selectedDate).toLocaleDateString()}
              </span>
              <svg
                className="w-4 h-4 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            
            {showDatePicker && (
              <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg z-10 p-4">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  max={today}
                  className="border rounded px-2 py-1"
                />
              </div>
            )}
          </div>
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-2 rounded-lg text-gray-600 hover:bg-gray-100 ${refreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Refresh habits"
          >
            <svg
              className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
          
          <button
            onClick={handleAddHabit}
            className="btn-primary"
          >
            Add Habit
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded-lg">
          Error loading habits: {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}

      {/* Habits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {habits.length === 0 && !loading ? (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500 text-lg">
              You haven't created any habits yet.
            </p>
            <button
              onClick={handleAddHabit}
              className="mt-4 btn-secondary"
            >
              Create Your First Habit
          </button>
        </div>
      ) : (
          habits.map((habit) => {
            // Check if the habit is completed for the selected date
            const isCompletedForSelectedDate = habit.completions.some(
              (c) => c.date === selectedDate && c.completed
            );
            
            return (
              <div 
              key={habit.id}
                onClick={() => handleViewHabitDetails(habit)}
                className={`bg-white rounded-xl shadow-sm border-2 overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                  isCompletedForSelectedDate
                    ? 'border-green-400'
                    : 'border-transparent'
                }`}
                style={{ borderLeftColor: habit.color, borderLeftWidth: '8px' }}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{habit.icon}</span>
                      <h3 className="font-semibold text-lg text-gray-900">
                        {habit.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleEditHabit(habit, e)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDeleteHabit(habit.id, e)}
                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {habit.description || 'No description'}
                  </p>

                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-500">
                        {habit.frequency === 'daily'
                          ? 'Daily'
                          : `Weekly (${habit.schedule
                              .map((day) =>
                                ['', 'M', 'T', 'W', 'T', 'F', 'S', 'S'][day]
                              )
                              .join(', ')})`}
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs font-medium">
                          {getStreakEmoji(habit.currentStreak)}
                        </span>
                        <span className="text-xs font-medium text-gray-700">
                          {habit.currentStreak} day{habit.currentStreak !== 1 ? 's' : ''} streak
                        </span>
                      </div>
                    </div>

                    <button 
                      onClick={(e) => handleToggleCompletion(habit.id, e)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isCompletedForSelectedDate
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                      }`}
                    >
                      {isCompletedForSelectedDate ? (
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
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        </div>

      {/* Habit Modal */}
      {isModalOpen && (
      <HabitModal
          habit={selectedHabit}
        onClose={handleCloseModal}
          onSave={(habitData) => {
            if (selectedHabit) {
              // Update existing habit
              dispatch(updateHabitAsync({
                id: selectedHabit.id,
                ...habitData
              }));
            } else {
              // Create new habit
              dispatch(createHabit(habitData));
            }
            setIsModalOpen(false);
          }}
        />
      )}

      {/* Habit Details Modal */}
      {isDetailsModalOpen && selectedHabit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                <span className="text-2xl">{selectedHabit.icon}</span>
                {selectedHabit.title}
              </h2>
              <button
                onClick={handleCloseDetailsModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600">{selectedHabit.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Frequency</p>
                <p className="font-medium">
                  Daily
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Current Streak</p>
                <p className="font-medium flex items-center gap-2">
                  <span>{getStreakEmoji(selectedHabit.currentStreak)}</span>
                  {selectedHabit.currentStreak} {selectedHabit.currentStreak !== 1 ? 'days' : 'day'}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Best Streak</p>
                <p className="font-medium">
                  {selectedHabit.bestStreak} {selectedHabit.bestStreak !== 1 ? 'days' : 'day'}
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Started</p>
                <p className="font-medium">
                  {new Date(selectedHabit.startDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Recent Activity</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {selectedHabit.completions.length > 0 ? (
                  [...selectedHabit.completions]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 10)
                    .map((completion) => (
                      <div
                        key={completion.date}
                        className="flex justify-between items-center p-2 border-b"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              completion.completed ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                          />
                          <span>
                            {new Date(completion.date).toLocaleDateString()}
                          </span>
                        </div>
                        {completion.completed && completion.completedAt && (
                          <span className="text-xs text-gray-500">
                            {new Date(completion.completedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 text-sm">No activity recorded yet</p>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button 
                onClick={(e) => {
                  handleCloseDetailsModal();
                  handleEditHabit(selectedHabit, e);
                }} 
                className="btn-secondary"
              >
                Edit
              </button>
              <button onClick={handleCloseDetailsModal} className="btn-primary">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HabitsPage; 