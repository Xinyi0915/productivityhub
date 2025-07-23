import React, { useState, useEffect } from 'react';
import { TimerSession } from '../../store/slices/timerSlice';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface SessionHistoryProps {
  sessions: TimerSession[];
}

const SessionHistory = ({ sessions }: SessionHistoryProps) => {
  const [debugInfo, setDebugInfo] = useState('');
  const userCoins = useSelector((state: RootState) => state.auth.user?.coins || 0);
  const totalCoinsEarned = useSelector((state: RootState) => state.timer.totalCoinsEarned);
  const totalFocusMinutes = useSelector((state: RootState) => state.timer.totalFocusMinutes);

  // Update debug info when sessions change or coins change
  useEffect(() => {
    setDebugInfo(JSON.stringify({
      userCoins,
      totalCoinsEarned,
      totalFocusMinutes,
      sessionsCount: sessions.length,
      sessions: sessions.map(s => ({
        id: s.id,
        duration: s.duration,
        startTime: s.startTime,
        endTime: s.endTime,
        coinsEarned: s.coinsEarned
      }))
    }, null, 2));
  }, [sessions, userCoins, totalCoinsEarned, totalFocusMinutes]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationInMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
    return `${durationInMinutes} min`;
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Session History
        </h3>
        <details className="mt-2 text-xs">
          <summary className="text-gray-500 cursor-pointer">Debug Info</summary>
          <pre className="p-2 mt-2 bg-gray-100 rounded text-gray-700 overflow-auto max-h-40">
            {debugInfo}
          </pre>
        </details>
      </div>
      <div className="overflow-hidden">
        {sessions.length === 0 ? (
          <p className="p-4 text-gray-500 text-center">
            No sessions completed yet. Start your first focus session!
          </p>
        ) : (
          <div className="flow-root">
            <ul className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <li key={session.id} className="px-4 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(session.startTime)}
                      </p>
                      {session.endTime && (
                        <p className="text-sm text-gray-500">
                          Duration: {calculateDuration(session.startTime, session.endTime)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        +{session.coinsEarned} 🪙
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionHistory; 