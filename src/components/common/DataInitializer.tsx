import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPlants } from '../../store/slices/gardenSlice';
import { fetchTimerSessions } from '../../store/slices/timerSlice';
import { RootState } from '../../store';

const DataInitializer: React.FC = () => {
  const dispatch = useDispatch();
  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    // Only fetch data if the user is authenticated (has a token)
    if (token) {
      console.log('DataInitializer: User is authenticated, fetching data...');
      
      // Fetch garden plants
      dispatch(fetchPlants());
      
      // Fetch timer sessions
      dispatch(fetchTimerSessions());
    }
  }, [dispatch, token]);

  // This component doesn't render anything
  return null;
};

export default DataInitializer; 