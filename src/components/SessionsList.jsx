import React, { useMemo } from 'react';
import { CalendarDays, Timer } from 'lucide-react';

const SessionsList = ({ sessions, selectedSession, onSelectSession }) => {
  // Helper function to safely get session data
  const getSessionData = (session) => {
    const data = session.data || session.metrics_data || {};
    return {
      speed: data.speed || [],
      power: data.power || [],
      cadence: data.cadence || [],
      calories: data.calories || []
    };
  };

  const calculateAverages = useMemo(() => {
    if (!sessions.length) return null;
    
    const totals = sessions.reduce((acc, session) => {
      const data = getSessionData(session);
      return {
        speed: acc.speed + (data.speed.reduce((sum, point) => sum + point.value, 0) / data.speed.length || 0),
        power: acc.power + (data.power.reduce((sum, point) => sum + point.value, 0) / data.power.length || 0),
        cadence: acc.cadence + (data.cadence.reduce((sum, point) => sum + point.value, 0) / data.cadence.length || 0),
        calories: acc.calories + (data.calories.reduce((sum, point) => sum + point.value, 0) / data.calories.length || 0)
      };
    }, { speed: 0, power: 0, cadence: 0, calories: 0 });

    return {
      speed: (totals.speed / sessions.length).toFixed(1),
      power: (totals.power / sessions.length).toFixed(1),
      cadence: (totals.cadence / sessions.length).toFixed(1),
      calories: (totals.calories / sessions.length).toFixed(1)
    };
  }, [sessions]);

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const getDuration = (session) => {
    const start = new Date(session.startTime || session.start_time);
    const end = new Date(session.endTime || session.end_time);
    const minutes = Math.floor((end - start) / 60000);
    return `${minutes} min`;
  };

  const getSessionAverages = (session) => {
    const data = getSessionData(session);
    return {
      speed: (data.speed.reduce((sum, point) => sum + point.value, 0) / data.speed.length || 0).toFixed(1),
      power: (data.power.reduce((sum, point) => sum + point.value, 0) / data.power.length || 0).toFixed(1),
      cadence: (data.cadence.reduce((sum, point) => sum + point.value, 0) / data.cadence.length || 0).toFixed(1),
      calories: (data.calories.reduce((sum, point) => sum + point.value, 0) / data.calories.length || 0).toFixed(1)
    };
  };

  return (
    <div className="space-y-6">
      {/* Averages Section */}
      {calculateAverages && (
        <div className="bg-gray-800/30 rounded-xl p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Session Averages</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">Avg Speed</div>
              <div className="text-lg text-white">{calculateAverages.speed} km/h</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">Avg Power</div>
              <div className="text-lg text-white">{calculateAverages.power} W</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">Avg Cadence</div>
              <div className="text-lg text-white">{calculateAverages.cadence} rpm</div>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="text-xs text-gray-400">Avg Calories</div>
              <div className="text-lg text-white">{calculateAverages.calories} kcal</div>
            </div>
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-2">
        {sessions.map(session => {
          const averages = getSessionAverages(session);
          return (
            <button
              key={session.id}
              onClick={() => onSelectSession(session)}
              className={`w-full text-left p-4 rounded-xl transition-all ${
                selectedSession?.id === session.id
                  ? 'bg-blue-500/10 border border-blue-500/50'
                  : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-sm">
                  <CalendarDays className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">
                    {formatTimeAgo(session.startTime || session.start_time)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Timer className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">{getDuration(session)}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-400">Speed</div>
                  <div className="text-sm text-white">{averages.speed} km/h</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-400">Power</div>
                  <div className="text-sm text-white">{averages.power} W</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-400">Cadence</div>
                  <div className="text-sm text-white">{averages.cadence} rpm</div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-400">Calories</div>
                  <div className="text-sm text-white">{averages.calories} kcal</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SessionsList;