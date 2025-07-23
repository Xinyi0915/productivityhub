import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { checkDueDates } from '../../utils/notifications';

const DueDateChecker: React.FC = () => {
  const dispatch = useDispatch();
  const tasks = useSelector((state: RootState) => state.tasks.tasks);
  const lastChecked = React.useRef<Date | null>(null);

  useEffect(() => {
    // Check due dates every hour
    const interval = setInterval(() => {
      const now = new Date();
      
      // Only check if we haven't checked in the last hour
      if (!lastChecked.current || (now.getTime() - lastChecked.current.getTime()) > 60 * 60 * 1000) {
        checkDueDates(dispatch, tasks);
        lastChecked.current = now;
      }
    }, 60 * 60 * 1000); // Check every hour

    // Initial check
    checkDueDates(dispatch, tasks);
    lastChecked.current = new Date();

    return () => clearInterval(interval);
  }, [dispatch, tasks]);

  return null; // This component doesn't render anything
};

export default DueDateChecker; 