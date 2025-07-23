import React, { useMemo } from 'react';
import { Task } from '../../store/slices/tasksSlice';
import { Habit } from '../../store/slices/habitsSlice';

interface AnalysisPanelProps {
  tasks: Task[];
  habits: Habit[];
  focusMinutes: number;
  timeRange: '7d' | '30d';
}

interface Insight {
  icon: string;
  title: string;
  description: string;
  type: 'success' | 'warning' | 'info';
}

interface Recommendation {
  icon: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  tasks,
  habits,
  focusMinutes,
  timeRange,
}) => {
  const insights = useMemo(() => {
    const results: Insight[] = [];
    
    // Task Analysis - count all completed tasks regardless of completedAt timestamp
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTaskItems = tasks.length;
    
    // Subtasks were removed from the Task interface
    const completedSubtasks = 0;
    const totalSubtasks = 0;
    
    // Only task completion rate (no subtasks)
    const totalItems = totalTaskItems;
    const totalCompletedItems = completedTasks;
    const taskCompletionRate = totalItems ? (totalCompletedItems / totalItems) * 100 : 0;
    
    // Most Productive Time Analysis
    const completedTasksWithTime = tasks.filter(t => t.completed && t.completedAt);
    const taskCompletionHours = completedTasksWithTime.map(t => 
      new Date(t.completedAt!).getHours()
    );
    
    if (taskCompletionHours.length > 0) {
      const hourCounts = taskCompletionHours.reduce((acc, hour) => {
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      const mostProductiveHour = Object.entries(hourCounts)
        .reduce((a, b) => (a[1] > b[1] ? a : b))[0];
        
      results.push({
        icon: '⏰',
        title: 'Peak Productivity Time',
        description: `You're most productive at ${mostProductiveHour}:00`,
        type: 'info'
      });
    }

    // Task Completion Analysis
    if (taskCompletionRate > 80) {
      results.push({
        icon: '🎯',
        title: 'High Task Completion',
        description: `Great job! You've completed ${taskCompletionRate.toFixed(1)}% of your tasks.`,
        type: 'success'
      });
    } else if (taskCompletionRate < 40) {
      results.push({
        icon: '📊',
        title: 'Low Task Completion',
        description: `You've completed ${taskCompletionRate.toFixed(1)}% of your tasks. Consider breaking them into smaller steps.`,
        type: 'warning'
      });
    }

    // Task Priority Analysis
    const highPriorityTasks = tasks.filter(t => t.priority === 'high');
    const completedHighPriorityTasks = highPriorityTasks.filter(t => t.completed && t.completedAt);
    const highPriorityCompletionRate = highPriorityTasks.length 
      ? (completedHighPriorityTasks.length / highPriorityTasks.length) * 100 
      : 0;

    if (highPriorityTasks.length > 0) {
      if (highPriorityCompletionRate > 75) {
        results.push({
          icon: '⚡',
          title: 'Priority Focus',
          description: `You're handling priorities well, completing ${highPriorityCompletionRate.toFixed(1)}% of high-priority tasks.`,
          type: 'success'
        });
      } else if (highPriorityCompletionRate < 50) {
        results.push({
          icon: '⚠️',
          title: 'Priority Tasks Attention',
          description: `Only ${highPriorityCompletionRate.toFixed(1)}% of your high-priority tasks are completed.`,
          type: 'warning'
        });
      }
    }

    // Habit Analysis
    if (habits.length > 0) {
    const habitStreaks = habits.map(habit => {
      return { habit, streak: habit.currentStreak };
    });

    const bestStreak = habitStreaks.reduce((max, curr) => 
      curr.streak > max.streak ? curr : max
    , { habit: habits[0], streak: 0 });

    if (bestStreak.streak >= 30) {
      results.push({
        icon: '🔥🔥🔥',
        title: 'Exceptional Streak!',
        description: `Wow! ${bestStreak.habit.title} has an incredible ${bestStreak.streak}-day streak! You're making this a lifestyle!`,
        type: 'success'
      });
    } else if (bestStreak.streak >= 7) {
      results.push({
        icon: '🔥',
        title: 'Outstanding Streak',
        description: `${bestStreak.habit.title} has a ${bestStreak.streak}-day streak! Keep going!`,
        type: 'success'
      });
    }

    // Use currentStreak from habit objects if available
    const habitsWithLongStreaks = habits.filter(habit => habit.currentStreak >= 7);
    if (habitsWithLongStreaks.length > 1) {
      results.push({
        icon: '⚡',
        title: 'Streak Master',
        description: `You have ${habitsWithLongStreaks.length} habits with streaks of 7+ days. Impressive consistency!`,
        type: 'success'
      });
    }

    // Count consistent habits (completed at least 5 times in the last week)
    const consistentHabits = habits.filter(habit => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      const recentCompletions = habit.completions.filter(
        c => new Date(c.date) >= lastWeek && c.completed
      );
      return recentCompletions.length >= 5;
    });

    if (consistentHabits.length > 0) {
      results.push({
        icon: '🏆',
        title: 'Habit Consistency',
        description: `You're consistent with ${consistentHabits.length} habit${consistentHabits.length > 1 ? 's' : ''} this week.`,
        type: 'success'
      });
      }
    }

    // Focus Time Analysis
    const averageDailyFocus = focusMinutes / (timeRange === '7d' ? 7 : 30);
    if (averageDailyFocus >= 120) {
      results.push({
        icon: '⭐',
        title: 'Great Focus Time',
        description: `You're averaging ${Math.round(averageDailyFocus)} minutes of focus time daily.`,
        type: 'success'
      });
    }

    // Focus trend analysis
    if (timeRange === '30d' && focusMinutes > 0) {
      const focusPerDay = Math.round(averageDailyFocus);
      if (focusPerDay > 90) {
        results.push({
          icon: '⭐',
          title: 'Deep Focus',
          description: `Your daily average of ${focusPerDay} minutes is excellent for deep work.`,
          type: 'success'
        });
      }
    }

    return results;
  }, [tasks, habits, focusMinutes, timeRange]);

  const recommendations = useMemo(() => {
    const results: Recommendation[] = [];
    
    // Task-based recommendations - count all completed tasks
    const completedTasks = tasks.filter(t => t.completed).length;
    const totalTaskItems = tasks.length;
    
    // Subtasks were removed from the Task interface
    const completedSubtasks = 0;
    const totalSubtasks = 0;
    
    // Only task completion rate (no subtasks)
    const totalItems = totalTaskItems;
    const totalCompletedItems = completedTasks;
    const taskCompletionRate = totalItems ? (totalCompletedItems / totalItems) * 100 : 0;

    if (taskCompletionRate < 50) {
      results.push({
        icon: '📋',
        title: 'Task Management',
        description: 'Try the "Two-Minute Rule": If a task takes less than two minutes, do it immediately.',
        priority: 'high'
      });
    }

    // Long streak maintenance recommendation
    if (habits.length > 0) {
    const longestStreakHabit = habits.reduce((max, habit) => 
      habit.currentStreak > (max?.currentStreak || 0) ? habit : max
    , null as Habit | null);
    
    if (longestStreakHabit && longestStreakHabit.currentStreak >= 30) {
      results.push({
        icon: '🏆',
        title: 'Maintain Your Streak',
        description: `Your ${longestStreakHabit.currentStreak}-day streak with ${longestStreakHabit.title} is impressive! Consider setting a new milestone goal of 50 days.`,
        priority: 'medium'
      });
      
      results.push({
        icon: '📊',
        title: 'Track Your Progress',
        description: `With ${longestStreakHabit.title}, you've built a strong foundation. Try tracking additional metrics like intensity or duration.`,
        priority: 'low'
      });
      }
    }

    // Focus time recommendations
    const averageDailyFocus = focusMinutes / (timeRange === '7d' ? 7 : 30);
    if (averageDailyFocus < 60) {
      results.push({
        icon: '⏱️',
        title: 'Focus Time',
        description: 'Start with 25-minute focused work sessions (Pomodoro Technique) to build concentration.',
        priority: 'high'
      });
    } else if (averageDailyFocus > 180) {
      results.push({
        icon: '🧠',
        title: 'Prevent Burnout',
        description: 'Remember to take breaks between intense focus sessions to prevent mental fatigue.',
        priority: 'medium'
      });
    }

    // Habit-based recommendations
    const activeHabits = habits.filter(h => {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      return h.completions.some(c => 
        new Date(c.date) >= lastWeek && c.completed
      );
    });

    if (activeHabits.length < 3) {
      results.push({
        icon: '🎯',
        title: 'Habit Building',
        description: 'Consider adding one new habit to your routine. Start small and build gradually.',
        priority: 'medium'
      });
    }

    // Task priority management
    const highPriorityTasks = tasks.filter(t => t.priority === 'high' && !t.completed);
    if (highPriorityTasks.length > 3) {
      results.push({
        icon: '🔝',
        title: 'Priority Focus',
        description: 'You have several high-priority tasks. Consider the Eisenhower Matrix to determine what to focus on first.',
        priority: 'high'
      });
    }

    // Task deadline management
    const tasksWithDeadlines = tasks.filter(t => t.deadline && !t.completed);
    const upcomingDeadlines = tasksWithDeadlines.filter(t => {
      const deadline = new Date(t.deadline!);
      const today = new Date();
      const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 3 && diffDays >= 0;
    });

    if (upcomingDeadlines.length > 0) {
      results.push({
        icon: '⏳',
        title: 'Upcoming Deadlines',
        description: `You have ${upcomingDeadlines.length} task${upcomingDeadlines.length > 1 ? 's' : ''} due within 3 days. Plan your time accordingly.`,
        priority: 'high'
      });
    }

    // General productivity recommendations
    results.push({
      icon: '🧘',
      title: 'Wellness',
      description: 'Remember to take regular breaks. The 20-20-20 rule: Every 20 minutes, look at something 20 feet away for 20 seconds.',
      priority: 'medium'
    });

    return results;
  }, [tasks, habits, focusMinutes, timeRange]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Insights Panel */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Performance Insights
        </h2>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                insight.type === 'success'
                  ? 'bg-green-50 border-green-200'
                  : insight.type === 'warning'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-blue-50 border-blue-200'
              }`}
            >
              <div className="flex items-start">
                <span className="text-2xl mr-3">{insight.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{insight.title}</h3>
                  <p className="text-sm text-gray-600">{insight.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations Panel */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Recommendations
        </h2>
        <div className="space-y-4">
          {recommendations.map((recommendation, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                recommendation.priority === 'high'
                  ? 'bg-red-50 border-red-200'
                  : recommendation.priority === 'medium'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-green-50 border-green-200'
              }`}
            >
              <div className="flex items-start">
                <span className="text-2xl mr-3">{recommendation.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{recommendation.title}</h3>
                  <p className="text-sm text-gray-600">{recommendation.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel; 