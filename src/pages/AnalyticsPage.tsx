import React, { useState, useMemo, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import StatsCard from '../components/analytics/StatsCard';
import TimeRangeSelector, { TimeRange } from '../components/analytics/TimeRangeSelector';
import { Habit } from '../store/slices/habitsSlice';
import { Task } from '../store/slices/tasksSlice';
import { format, subDays, isWithinInterval, startOfToday, isBefore, isAfter, parseISO, eachDayOfInterval } from 'date-fns';
import AnalysisPanel from '../components/analytics/AnalysisPanel';
import { TimerSession } from '../store/slices/timerSlice';

const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const habits = useSelector((state: RootState) => state.habits.habits);
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const focusSessions = useSelector((state: RootState) => state.timer.sessions);
  const totalFocusMinutes = useSelector((state: RootState) => state.timer.totalFocusMinutes);
  
  // Force component to update when focus data changes
  const [focusDataVersion, setFocusDataVersion] = useState(0);
  
  // Watch for changes in focus data and update the component
  useEffect(() => {
    // Increment version to trigger re-render
    setFocusDataVersion(prev => prev + 1);
    
    // Also log focus data for debugging
    console.log('Focus data updated:', { 
      sessionsCount: focusSessions?.length || 0,
      totalFocusMinutes
    });
  }, [focusSessions, totalFocusMinutes]);

  const dateRange = useMemo(() => {
    const today = startOfToday();
    const days = timeRange === '7d' ? 7 : 30;
    const startDate = subDays(today, days - 1);
    return { 
      startDate, 
      endDate: today,
      days,
      daysArray: eachDayOfInterval({ start: startDate, end: today })
    };
  }, [timeRange]);

  // Helper function to calculate priority completion rate
  const calculatePriorityCompletionRate = (tasksArray: Task[], priority: 'high' | 'medium' | 'low'): number => {
    const { startDate, endDate } = dateRange;
    
    // Only include tasks with matching priority
    const priorityTasks = tasksArray.filter(task => task.priority === priority);
    
    if (priorityTasks.length === 0) return 0;
    
    // Count all completed tasks with the specified priority in the date range
    const priorityCompleted = priorityTasks.filter(task => 
      task.completed && 
      task.completedAt && 
      isWithinInterval(new Date(task.completedAt), { start: startDate, end: endDate })
    ).length;
    
    return Math.round((priorityCompleted / priorityTasks.length) * 100);
  };

  const habitStats = useMemo(() => {
    const { startDate, endDate, daysArray } = dateRange;
    
    // Only include habits that existed at some point during the time period
    const activeHabits = habits.filter(habit => {
      const habitStartDate = parseISO(habit.startDate);
      const habitEndDate = habit.endDate ? parseISO(habit.endDate) : null;
      
      // Check if habit existed in the selected time period
      const existedInPeriod = (
        // Started before or during the period
        (isBefore(habitStartDate, endDate) || format(habitStartDate, 'yyyy-MM-dd') === format(endDate, 'yyyy-MM-dd')) 
        // AND ended after or during the period (or has no end date)
        && (!habitEndDate || isAfter(habitEndDate, startDate) || format(habitEndDate, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd'))
      );
      
      // Only include habits that had at least one possible day in this period
      if (!existedInPeriod) return false;
      
      // Count scheduled days in period
      const hasScheduledDaysInPeriod = daysArray.some(day => {
        if (isBefore(day, habitStartDate)) return false;
        if (habitEndDate && isAfter(day, habitEndDate)) return false;
        
        if (habit.frequency === 'daily') return true;
        
        if (habit.frequency === 'weekly' && habit.schedule.length > 0) {
          const dayOfWeek = day.getDay();
          const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
          return habit.schedule.includes(adjustedDay);
        }
        
        return false;
      });
      
      return existedInPeriod && hasScheduledDaysInPeriod;
    });
    
    if (activeHabits.length === 0) {
      return {
        averageCompletionRate: 0,
        totalCompletions: 0,
        totalPossible: 0,
        activeHabitsCount: 0,
        bestHabit: null,
        worstHabit: null,
        completionsByDay: daysArray.map(day => ({ date: day, count: 0 })),
        hasHabitsInPeriod: false
      };
    }

    // Track total possible and actual completions
    let totalPossibleCompletions = 0;
    let totalActualCompletions = 0;
    const habitPerformance = activeHabits.map(habit => {
      // Get completions within the date range - for this specific habit
      const completionsInRange = habit.completions.filter(c => {
        const completionDate = c.date.split('T')[0];
        return (
          c.completed && 
          completionDate >= format(startDate, 'yyyy-MM-dd') && 
          completionDate <= format(endDate, 'yyyy-MM-dd')
        );
      });
      
      // Calculate possible completion days for this habit (based on frequency and when it existed)
      const possibleDays = daysArray.filter(day => {
        // Skip days before habit started or after it ended
        if (isBefore(day, parseISO(habit.startDate))) return false;
        if (habit.endDate && isAfter(day, parseISO(habit.endDate))) return false;
        
        // For daily habits, every day is a possible completion day
        if (habit.frequency === 'daily') return true;
        
        // For weekly habits, only include scheduled days
        if (habit.frequency === 'weekly') {
          const dayOfWeek = day.getDay(); // 0 = Sunday, 1 = Monday, etc.
          const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek; // Convert to 1-7 format
          return habit.schedule.includes(adjustedDay);
        }
        
        return false;
      });
      
      const possibleCompletions = possibleDays.length;
      totalPossibleCompletions += possibleCompletions;
      totalActualCompletions += completionsInRange.length;
      
      const completionRate = possibleCompletions > 0 ? (completionsInRange.length / possibleCompletions) * 100 : 0;
      
      return {
        habit,
        completions: completionsInRange.length,
        possibleDays: possibleCompletions,
        completionRate: Math.round(completionRate) // Round to nearest integer
      };
    });
    
    // Get the overall completion rate - actual completed vs total possible
    const overallCompletionRate = totalPossibleCompletions > 0 
      ? Math.round((totalActualCompletions / totalPossibleCompletions) * 100) 
      : 0;
    
    // Sort habits by completion rate (most consistent first)
    const sortedHabits = [...habitPerformance]
      .filter(h => h.possibleDays > 0) // Only include habits with possible days
      .sort((a, b) => b.completionRate - a.completionRate);
    
    // Get completion counts by day
    const completionsByDay = daysArray.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const count = activeHabits.reduce((acc, habit) => {
        const isCompleted = habit.completions.some(c => 
          c.completed && c.date.split('T')[0] === dayStr
        );
        return isCompleted ? acc + 1 : acc;
      }, 0);
      
      return { date: day, count };
    });

    return {
      averageCompletionRate: overallCompletionRate,
      totalCompletions: totalActualCompletions,
      totalPossible: totalPossibleCompletions,
      activeHabitsCount: activeHabits.length,
      bestHabit: sortedHabits.length > 0 ? sortedHabits[0] : null,
      worstHabit: sortedHabits.length > 1 ? sortedHabits[sortedHabits.length - 1] : null,
      completionsByDay,
      hasHabitsInPeriod: totalPossibleCompletions > 0
    };
  }, [habits, dateRange]);

  const taskStats = useMemo(() => {
    const { startDate, endDate, daysArray } = dateRange;
    
    // Get all tasks in the system
    const allTasks = tasks;
    
    // For the selected time period:
    // 1. Tasks created within the period
    const tasksCreatedInRange = allTasks.filter(task => {
      try {
        const createdDate = new Date(task.createdAt);
        return isWithinInterval(createdDate, { start: startDate, end: endDate });
      } catch (error) {
        console.error('Error processing task creation date', task, error);
        return false;
      }
    });
    
    // 2. Tasks completed within the period (regardless of creation date)
    const completedInRange = allTasks.filter(task => {
      try {
        if (!task.completed || !task.completedAt) return false;
        const completedDate = new Date(task.completedAt);
        return isWithinInterval(completedDate, { start: startDate, end: endDate });
      } catch (error) {
        console.error('Error processing task completion date', task, error);
        return false;
      }
    });
    
    // 3. Tasks with deadlines in the period (regardless of completion status)
    const tasksWithDeadlineInRange = allTasks.filter(task => {
      try {
        if (!task.deadline) return false;
        const taskDate = new Date(task.deadline);
        return isWithinInterval(taskDate, { start: startDate, end: endDate });
      } catch (error) {
        console.error('Error processing task deadline date', task, error);
        return false;
      }
    });
    
    // Combine all relevant tasks for this time period (without duplicates)
    const combinedTaskIds = new Set([
      ...tasksCreatedInRange.map(task => task.id),
      ...completedInRange.map(task => task.id),
      ...tasksWithDeadlineInRange.map(task => task.id)
    ]);
    
    const tasksInRange = Array.from(combinedTaskIds)
      .map(id => allTasks.find(task => task.id === id))
      .filter(Boolean) as Task[];
    
    // Calculate completion counts by day, grouped by task group
    const completionsByDay = daysArray.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      
      // Count completed tasks by group
      let totalCompletedTasks = 0;
      
      // Count regular completed tasks
      Object.values(tasksInRange).forEach(task => {
        const isCompletedOnDay = task.completed && 
          task.completedAt && 
          task.completedAt.split('T')[0] === dayStr;
        
        if (isCompletedOnDay) {
          totalCompletedTasks += 1;
        }
      });

      return { date: day, count: totalCompletedTasks };
    });

    // If there are no tasks in the system, return 0% completion
    if (allTasks.length === 0) {
      return {
        completionRate: 0,
        completed: 0,
        total: 0,
        tasksInPeriod: 0,
        highPriorityCompletion: 0,
        mediumPriorityCompletion: 0,
        lowPriorityCompletion: 0,
        completionsByDay
      };
    }

    // Count all completed tasks in the range (regardless of when they were completed)
    const completedTasksInRange = tasksInRange.filter(t => t.completed).length;
    
    const completionRate = tasksInRange.length > 0
      ? Math.round((completedTasksInRange / tasksInRange.length) * 100)
      : 0;
    
    return {
      completionRate,
      completed: completedTasksInRange,
      total: tasksInRange.length,
      tasksInPeriod: tasksInRange.length,
      highPriorityCompletion: calculatePriorityCompletionRate(tasksInRange, 'high'),
      mediumPriorityCompletion: calculatePriorityCompletionRate(tasksInRange, 'medium'),
      lowPriorityCompletion: calculatePriorityCompletionRate(tasksInRange, 'low'),
      completionsByDay
    };
  }, [tasks, dateRange]);

  const focusStats = useMemo(() => {
    const { startDate, endDate, days, daysArray } = dateRange;
    
    // Safety check in case focusSessions is undefined
    if (!focusSessions || !Array.isArray(focusSessions) || focusSessions.length === 0) {
      return {
        totalMinutes: 0,
        avgMinutesPerDay: 0,
        sessionsCount: 0,
        minutesByDay: daysArray.map(day => ({ date: day, minutes: 0 })),
        mostProductiveDay: null,
        hasSessions: false
      };
    }
    
    console.log('Recalculating focus stats with', focusSessions.length, 'sessions');
    
    // Get all focus sessions in the date range with more reliable date comparison
    const sessionsInRange = focusSessions.filter(session => {
      // Safety check on session data
      if (!session || !session.startTime) return false;
      
      try {
        // Extract just the date part for comparison to avoid timezone issues
        const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
        const rangeStartDate = startDate.toISOString().split('T')[0];
        const rangeEndDate = endDate.toISOString().split('T')[0];
        
        // Check if session date is within the range (inclusive)
        return sessionDate >= rangeStartDate && sessionDate <= rangeEndDate;
      } catch (e) {
        console.error("Error processing session date:", e);
        return false;
      }
    });
    
    // Calculate total focus minutes from sessions in range
    const totalMinutes = sessionsInRange.reduce((acc, session) => {
      // Make sure duration is a number and has a valid value
      const duration = typeof session.duration === 'number' && session.duration > 0 
        ? session.duration 
        : 0;
        
      return acc + duration;
    }, 0);
    
    const avgMinutesPerDay = days > 0 ? Math.round(totalMinutes / days) : 0;
    
    // Minutes focused by day
    const minutesByDay = daysArray.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      
      const dayMinutes = sessionsInRange
        .filter(session => {
          if (!session.startTime) return false;
          const sessionDateStr = new Date(session.startTime).toISOString().split('T')[0];
          return sessionDateStr === dayStr;
        })
        .reduce((sum, session) => {
          const duration = typeof session.duration === 'number' ? session.duration : 0;
          return sum + duration;
        }, 0);
      
      return { date: day, minutes: dayMinutes };
    });
    
    // Find the most productive day (if any)
    const daysWithMinutes = minutesByDay.filter(day => day.minutes > 0);
    const mostProductiveDay = daysWithMinutes.length > 0 
      ? daysWithMinutes.sort((a, b) => b.minutes - a.minutes)[0]
      : null;

    return {
      totalMinutes,
      avgMinutesPerDay,
      sessionsCount: sessionsInRange.length,
      minutesByDay,
      mostProductiveDay,
      hasSessions: sessionsInRange.length > 0
    };
  }, [focusSessions, dateRange, focusDataVersion]);

  // Calculate detailed task stats including subtasks
  const getDetailedTaskStats = useMemo(() => {
    const { startDate, endDate } = dateRange;
    
    // Get tasks relevant to the selected time period
    const tasksInRange = tasks.filter(task => {
      try {
        // Include tasks created in this period
        const createdDate = new Date(task.createdAt);
        const createdInRange = isWithinInterval(createdDate, { start: startDate, end: endDate });
        
        // Include tasks with deadlines in this period
        let hasDeadlineInRange = false;
        if (task.deadline) {
          const deadlineDate = new Date(task.deadline);
          hasDeadlineInRange = isWithinInterval(deadlineDate, { start: startDate, end: endDate });
        }
        
        // Include tasks completed in this period
        let completedInRange = false;
        if (task.completed && task.completedAt) {
          const completedDate = new Date(task.completedAt);
          completedInRange = isWithinInterval(completedDate, { start: startDate, end: endDate });
        }
        
        return createdInRange || hasDeadlineInRange || completedInRange;
      } catch (error) {
        console.error('Error processing task date', task, error);
        return false;
      }
    });
    
    // Count all tasks in the selected range
    const allTasksCount = tasksInRange.length;
    
    // Count all completed tasks in the range (regardless of when they were completed)
    const completedTasksCount = tasksInRange.filter(task => task.completed).length;
    
    // Debug logging to identify issues
    console.log('Analytics - Task Stats:', { 
      totalTasks: allTasksCount, 
      completedTasksCount,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      tasksInRange: tasksInRange.map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        completedAt: t.completedAt ? new Date(t.completedAt).toISOString() : null,
        createdAt: new Date(t.createdAt).toISOString()
      }))
    });
    
    // Total items (tasks only, since subtasks were removed)
    const totalItems = allTasksCount;
    const totalCompletedItems = completedTasksCount;
    
    // Calculate overall completion percentage - count all completed tasks
    // If there are no tasks in range, return 0%
    const completionPercentage = totalItems > 0 
      ? Math.round((totalCompletedItems / totalItems) * 100) 
      : 0;
      
    return {
      tasks: {
        total: allTasksCount,
        completed: completedTasksCount
      },
      subtasks: {
        total: 0,
        completed: 0
      },
      overall: {
        total: totalItems,
        completed: totalCompletedItems,
        percentage: completionPercentage
      }
    };
  }, [tasks, dateRange]);

  // Chart data transformations
  const chartData = useMemo(() => {
    // Add safety checks to prevent errors
    const safeTaskCompletions = taskStats.completionsByDay || [];
    const safeHabitCompletions = habitStats.completionsByDay || [];
    const safeMinutesByDay = focusStats.minutesByDay || [];
    
    // Calculate daily task completions (no subtasks)
    const detailedTaskCompletions = dateRange.daysArray.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      
      // Count completed tasks on this day
      const tasksCompletedOnDay = tasks.filter(task => 
        task.completed && 
        task.completedAt && 
        task.completedAt.split('T')[0] === dayStr
      ).length;
      
      return {
        date: day,
        count: tasksCompletedOnDay
      };
    });
    
    // Find maximum values with extra safety
    const maxTaskCount = Math.max(...detailedTaskCompletions.map(d => d?.count || 0), 1);
    const maxHabitCount = Math.max(...safeHabitCompletions.map(d => d?.count || 0), 1);
    const maxMinutes = Math.max(...safeMinutesByDay.map(d => d?.minutes || 0), 1);

    return {
      taskCompletions: detailedTaskCompletions.map(day => ({
        date: day?.date ? format(day.date, 'MM/dd') : '',
        count: day?.count || 0,
        percentage: (day?.count || 0) / maxTaskCount * 100
      })),
      habitCompletions: safeHabitCompletions.map(day => ({
        date: day?.date ? format(day.date, 'MM/dd') : '',
        count: day?.count || 0,
        percentage: (day?.count || 0) / maxHabitCount * 100
      })),
      focusMinutes: safeMinutesByDay.map(day => ({
        date: day?.date ? format(day.date, 'MM/dd') : '',
        minutes: day?.minutes || 0,
        percentage: (day?.minutes || 0) / maxMinutes * 100
      }))
    };
  }, [taskStats, habitStats, focusStats, tasks, dateRange.daysArray]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your productivity and habits over time</p>
        </div>
        <TimeRangeSelector selectedRange={timeRange} onChange={setTimeRange} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCard
          title="Task Completion"
          value={`${Math.round((tasks.filter(t => t.completed).length / tasks.length) * 100)}%`}
          subtitle={tasks.length > 0 
            ? `${tasks.filter(t => t.completed).length} of ${tasks.length} items completed` 
            : 'No tasks available'}
          icon="📋"
          color="bg-blue-50"
          iconColor="text-blue-500"
        />
        <StatsCard
          title="Habit Progress"
          value={habitStats.hasHabitsInPeriod ? `${habitStats.averageCompletionRate}%` : 'N/A'}
          subtitle={habitStats.hasHabitsInPeriod
            ? `${habitStats.totalCompletions} of ${habitStats.totalPossible} possible completions`
            : 'No scheduled habits in this period'}
          icon="🎯"
          color="bg-green-50"
          iconColor="text-green-500"
        />
        <StatsCard
          title="Focus Time"
          value={totalFocusMinutes > 0 ? `${totalFocusMinutes} min` : 'N/A'}
          subtitle={totalFocusMinutes > 0
            ? ''
            : 'No focus sessions in this period'}
          icon="⏱️"
          color="bg-purple-50"
          iconColor="text-purple-500"
        />
      </div>

      {/* Analysis and Recommendations */}
      <AnalysisPanel
        tasks={tasks}
        habits={habits}
        focusMinutes={totalFocusMinutes}
        timeRange={timeRange}
      />
    </div>
  );
};

export default AnalyticsPage; 