import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  startTimer,
  pauseTimer,
  resetTimer,
  tick,
  completeTimerSession,
  setDuration,
  addCustomDuration,
  startBackgroundTimer,
  completeSessionWithDuration,
  handleTimerCompletion,
  setWhiteNoiseEnabled,
  setWhiteNoiseVolume,
  setNoiseType,
  fetchTimerSessions,
} from '../store/slices/timerSlice';
import CircularProgress from '../components/timer/CircularProgress';
import { AppDispatch } from '../store';
import SessionHistory from '../components/timer/SessionHistory';
import { NoiseType, stopNotificationSound } from '../utils/sounds';

const TimerPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    isRunning,
    timeRemaining,
    selectedDuration,
    presetDurations,
    sessions,
    totalCoinsEarned,
    totalFocusMinutes,
    currentSession,
    whiteNoiseEnabled,
    whiteNoiseVolume,
    noiseType,
    loading,
    error,
  } = useSelector((state: RootState) => state.timer);

  const [customMinutes, setCustomMinutes] = useState('');
  const prevTimeRef = useRef(timeRemaining);

  useEffect(() => {
    // Start background timer if timer is running
    if (isRunning) {
      dispatch(startBackgroundTimer());
    }
  }, [isRunning, dispatch]);

  // Fetch timer sessions on component mount
  useEffect(() => {
    dispatch(fetchTimerSessions());
  }, [dispatch]);

  // Check if timer has reached zero
  useEffect(() => {
    // If timer was running (not at zero) and now is at zero
    if (prevTimeRef.current > 0 && timeRemaining === 0 && currentSession) {
      // Timer has just reached zero - complete the session
      dispatch(handleTimerCompletion());
      
      // Force a re-render to update focus time in the UI
      setTimeout(() => {
        window.dispatchEvent(new Event('storage'));
      }, 100);
    }
    
    // Update the previous time ref for future comparisons
    prevTimeRef.current = timeRemaining;
  }, [timeRemaining, currentSession, dispatch]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      // Stop notification sounds when component unmounts
      stopNotificationSound();
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCustomDuration = (e: React.FormEvent) => {
    e.preventDefault();
    const minutes = parseInt(customMinutes);
    if (!isNaN(minutes) && minutes > 0 && minutes <= 120) {
      dispatch(addCustomDuration(minutes));
      dispatch(setDuration(minutes));
      setCustomMinutes('');
    }
  };

  const progress = ((selectedDuration * 60 - timeRemaining) / (selectedDuration * 60)) * 100;

  const handleStartPause = () => {
    // Stop any notification sounds when user interacts with timer controls
    stopNotificationSound();
    
    if (isRunning) {
      dispatch(pauseTimer());
    } else {
      dispatch(startTimer());
    }
  };

  const handleComplete = () => {
    // Stop any notification sounds when user interacts with timer controls
    stopNotificationSound();
    
    dispatch(completeTimerSession());
    
    // Force a re-render to update focus time in the UI
    setTimeout(() => {
      window.dispatchEvent(new Event('storage'));
    }, 100);
  };
  
  const handleReset = () => {
    // Stop any notification sounds when user interacts with timer controls
    stopNotificationSound();
    
    dispatch(resetTimer());
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Timer Display */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-80 h-80">
              <CircularProgress progress={progress} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-medium text-gray-700" style={{ fontFamily: 'monospace' }}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
            <div className="mt-8 space-x-4">
              <button
                onClick={handleStartPause}
                className="text-gray-600 hover:text-gray-900 font-medium text-lg"
              >
                {isRunning ? 'Pause' : 'Start'}
              </button>
              <button
                onClick={handleReset}
                className="text-gray-600 hover:text-gray-900 font-medium text-lg"
              >
                Reset
              </button>
              {isRunning && (
                <button
                  onClick={handleComplete}
                  className="text-green-600 hover:text-green-800 font-medium text-lg"
                >
                  Complete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Timer Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Timer Settings</h2>
          
          {/* White Noise Controls */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Background Noise
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => dispatch(setWhiteNoiseEnabled(!whiteNoiseEnabled))}
                  className={`px-4 py-2 rounded-lg ${
                    whiteNoiseEnabled
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {whiteNoiseEnabled ? 'Disable' : 'Enable'} Background Noise
                </button>
              </div>
              
              {whiteNoiseEnabled && (
                <div className="space-y-4">
                  <div className="flex flex-col space-y-4">
                    <span className="text-sm font-medium text-gray-600">Ambient Sound:</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {([
                        { type: 'ocean', icon: '🌊', label: 'Ocean' },
                        { type: 'rain', icon: '🌧️', label: 'Rain' },
                        { type: 'forest', icon: '🌲', label: 'Forest' },
                        { type: 'cafe', icon: '☕', label: 'Cafe' },
                        { type: 'fireplace', icon: '🔥', label: 'Fireplace' }
                      ] as { type: NoiseType; icon: string; label: string }[]).map(({ type, icon, label }) => (
                        <button
                          key={type}
                          onClick={() => dispatch(setNoiseType(type))}
                          className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                            noiseType === type
                              ? 'bg-primary-500 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <span>{icon}</span>
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-600 w-16">Volume:</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={whiteNoiseVolume}
                      onChange={(e) => dispatch(setWhiteNoiseVolume(parseFloat(e.target.value)))}
                      className="flex-grow max-w-md"
                    />
                    <span className="text-sm text-gray-600 w-12">
                      {Math.round(whiteNoiseVolume * 100)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Preset Durations */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Preset Durations
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {presetDurations.map((duration) => (
                <button
                  key={duration}
                  onClick={() => dispatch(setDuration(duration))}
                  className={`p-3 rounded-lg border ${
                    selectedDuration === duration
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-primary-300'
                  }`}
                >
                  {duration} minutes
                </button>
              ))}
            </div>
          </div>

          {/* Custom Duration */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Custom Duration
            </h3>
            <form onSubmit={handleCustomDuration} className="flex space-x-3">
              <input
                type="number"
                min="1"
                max="120"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                placeholder="Enter minutes (1-120)"
                className="input-primary flex-1"
              />
              <button type="submit" className="btn-primary">
                Set Time
              </button>
            </form>
            <p className="text-sm text-gray-500 mt-2">
              You can set a custom duration between 1 and 120 minutes
            </p>
          </div>
        </div>

        {/* Session History */}
        <div className="mb-8">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-700"></div>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow p-8">
              <p className="text-red-500">Error loading sessions: {error}</p>
            </div>
          ) : (
            <SessionHistory sessions={sessions} />
          )}
        </div>
      </div>
    </div>
  );
};

export default TimerPage; 