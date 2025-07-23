// This is a test file to verify the weekly habit streak calculation
// You can run this with ts-node src/utils/habitStreakTest.ts

interface HabitCompletion {
  date: string; // ISO date string (YYYY-MM-DD)
  completed: boolean;
  completedAt?: string; // ISO datetime string
}

interface Habit {
  id: string;
  title: string;
  frequency: 'daily' | 'weekly';
  schedule: number[]; // Array of days (1-7 for weekly habits, empty for daily)
  completions: HabitCompletion[];
}

// Helper function to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Weekly habit streak calculation function
const calculateWeeklyHabitStreak = (sortedCompletions: HabitCompletion[], habit: Habit): number => {
  // Get current date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Group completions by week
  const completionsByWeek = new Map<string, HabitCompletion[]>();
  
  // Process all completions and group by week
  for (const completion of sortedCompletions) {
    const completionDate = new Date(completion.date);
    // Get the start of the week for this completion (Sunday)
    const weekStart = new Date(completionDate);
    weekStart.setDate(completionDate.getDate() - completionDate.getDay()); // Set to Sunday
    weekStart.setHours(0, 0, 0, 0);
    
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!completionsByWeek.has(weekKey)) {
      completionsByWeek.set(weekKey, []);
    }
    
    completionsByWeek.get(weekKey)!.push(completion);
  }
  
  // Sort weeks chronologically (newest first for streak calculation)
  const sortedWeeks = [...completionsByWeek.keys()].sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );
  
  if (sortedWeeks.length === 0) {
    return 0;
  }
  
  // Get the current week's start date
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay()); // Set to Sunday
  currentWeekStart.setHours(0, 0, 0, 0);
  const currentWeekKey = currentWeekStart.toISOString().split('T')[0];
  
  // For each week, check if all scheduled days were completed
  let streak = 0;
  let consecutiveWeeks = true;
  
  // Process weeks from newest to oldest
  for (let i = 0; i < sortedWeeks.length; i++) {
    const weekKey = sortedWeeks[i];
    const weekStart = new Date(weekKey);
    const weekCompletions = completionsByWeek.get(weekKey)!;
    
    // For the current week, we only check days that have already passed
    const isCurrentWeek = weekKey === currentWeekKey;
    
    // Check if all scheduled days for this week were completed
    let allScheduledDaysCompleted = true;
    
    for (const scheduledDay of habit.schedule) {
      // Convert scheduled day to date in this week
      const scheduledDate = new Date(weekStart);
      // Adjust for our day format (1-7) vs JS day format (0-6)
      const dayOffset = scheduledDay === 7 ? 0 : scheduledDay;
      scheduledDate.setDate(weekStart.getDate() + dayOffset);
      
      // For current week, skip days that haven't happened yet
      if (isCurrentWeek && scheduledDate > today) {
        continue;
      }
      
      // Format as YYYY-MM-DD for comparison
      const scheduledDateStr = scheduledDate.toISOString().split('T')[0];
      
      // Check if this day was completed
      const wasCompleted = weekCompletions.some(c => 
        c.date.split('T')[0] === scheduledDateStr
      );
      
      if (!wasCompleted) {
        allScheduledDaysCompleted = false;
        break;
      }
    }
    
    if (allScheduledDaysCompleted) {
      streak++;
      
      // If not the first week we're checking, verify it's consecutive with the previous week
      if (i > 0) {
        const prevWeekKey = sortedWeeks[i - 1];
        const prevWeekStart = new Date(prevWeekKey);
        const thisWeekStart = new Date(weekKey);
        
        // Check if weeks are consecutive (7 days apart)
        const diffTime = prevWeekStart.getTime() - thisWeekStart.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (Math.round(diffDays) !== 7) {
          consecutiveWeeks = false;
          break;
        }
      }
    } else {
      // If a week is not fully completed (except current week), break the streak
      if (!isCurrentWeek) {
        break;
      }
    }
  }
  
  return streak;
};

// Test cases
function runTests() {
  console.log('Running weekly habit streak tests...');
  
  // Get current date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get day of week (0-6, 0 = Sunday)
  const todayDayOfWeek = today.getDay();
  
  // Convert to our format (1-7, 1 = Monday, 7 = Sunday)
  const adjustedTodayDay = todayOfWeek === 0 ? 7 : todayOfWeek;
  
  console.log(`Today is ${formatDate(today)}, day of week: ${adjustedTodayDay}`);
  
  // Create a weekly habit that occurs on Mondays and Wednesdays (1 and 3)
  const weeklyHabit: Habit = {
    id: '1',
    title: 'Test Weekly Habit',
    frequency: 'weekly',
    schedule: [1, 3], // Monday and Wednesday
    completions: []
  };
  
  // Test case 1: No completions
  console.log('\nTest case 1: No completions');
  console.log(`Streak: ${calculateWeeklyHabitStreak(weeklyHabit.completions, weeklyHabit)}`);
  console.log('Expected: 0');
  
  // Test case 2: Completed this week's Monday and Wednesday
  console.log('\nTest case 2: Completed this week\'s Monday and Wednesday');
  
  // Get this week's Monday and Wednesday
  const thisWeekMonday = new Date(today);
  thisWeekMonday.setDate(today.getDate() - todayDayOfWeek + 1); // Monday is 1
  
  const thisWeekWednesday = new Date(today);
  thisWeekWednesday.setDate(today.getDate() - todayDayOfWeek + 3); // Wednesday is 3
  
  // Only add completions if these days are in the past
  const completions: HabitCompletion[] = [];
  if (thisWeekMonday <= today) {
    completions.push({
      date: formatDate(thisWeekMonday),
      completed: true,
      completedAt: thisWeekMonday.toISOString()
    });
  }
  
  if (thisWeekWednesday <= today) {
    completions.push({
      date: formatDate(thisWeekWednesday),
      completed: true,
      completedAt: thisWeekWednesday.toISOString()
    });
  }
  
  weeklyHabit.completions = completions;
  
  console.log(`Completions: ${completions.map(c => c.date).join(', ')}`);
  console.log(`Streak: ${calculateWeeklyHabitStreak(weeklyHabit.completions, weeklyHabit)}`);
  console.log('Expected: 1 (if both Monday and Wednesday have passed this week)');
  
  // Test case 3: Completed this week and last week
  console.log('\nTest case 3: Completed this week and last week');
  
  // Get last week's Monday and Wednesday
  const lastWeekMonday = new Date(thisWeekMonday);
  lastWeekMonday.setDate(lastWeekMonday.getDate() - 7);
  
  const lastWeekWednesday = new Date(thisWeekWednesday);
  lastWeekWednesday.setDate(lastWeekWednesday.getDate() - 7);
  
  completions.push({
    date: formatDate(lastWeekMonday),
    completed: true,
    completedAt: lastWeekMonday.toISOString()
  });
  
  completions.push({
    date: formatDate(lastWeekWednesday),
    completed: true,
    completedAt: lastWeekWednesday.toISOString()
  });
  
  weeklyHabit.completions = completions;
  
  console.log(`Completions: ${completions.map(c => c.date).join(', ')}`);
  console.log(`Streak: ${calculateWeeklyHabitStreak(weeklyHabit.completions, weeklyHabit)}`);
  console.log('Expected: 2 (if both Monday and Wednesday have passed this week)');
  
  // Test case 4: Completed this week and two weeks ago (skipped last week)
  console.log('\nTest case 4: Completed this week and two weeks ago (skipped last week)');
  
  // Remove last week's completions
  completions.splice(2, 2);
  
  // Add completions from two weeks ago
  const twoWeeksAgoMonday = new Date(lastWeekMonday);
  twoWeeksAgoMonday.setDate(twoWeeksAgoMonday.getDate() - 7);
  
  const twoWeeksAgoWednesday = new Date(lastWeekWednesday);
  twoWeeksAgoWednesday.setDate(twoWeeksAgoWednesday.getDate() - 7);
  
  completions.push({
    date: formatDate(twoWeeksAgoMonday),
    completed: true,
    completedAt: twoWeeksAgoMonday.toISOString()
  });
  
  completions.push({
    date: formatDate(twoWeeksAgoWednesday),
    completed: true,
    completedAt: twoWeeksAgoWednesday.toISOString()
  });
  
  weeklyHabit.completions = completions;
  
  console.log(`Completions: ${completions.map(c => c.date).join(', ')}`);
  console.log(`Streak: ${calculateWeeklyHabitStreak(weeklyHabit.completions, weeklyHabit)}`);
  console.log('Expected: 1 (if both Monday and Wednesday have passed this week)');
}

// Run the tests
runTests(); 