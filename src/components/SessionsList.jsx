// src/components/SessionsList.jsx
import React from 'react';

const SessionsList = ({ sessions, selectedSession, onSelectSession }) => {
  // Safe number formatting helper
  const safeFixed = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '0.0';
    return value.toFixed(1);
  };

  // Calculate averages across all sessions
  const averages = sessions.reduce(
    (acc, session) => {
      const data = session.data || session.metrics_data || {};
      const getAverage = (metric) => {
        const metricData = data[metric] || [];
        if (metricData.length === 0) return 0;
        const sum = metricData.reduce((sum, point) => sum + (point.value || 0), 0);
        return sum / metricData.length;
      };

      return {
        speed: acc.speed + getAverage('speed'),
        power: acc.power + getAverage('power'),
        cadence: acc.cadence + getAverage('cadence'),
        heartRate: acc.heartRate + (session.stats?.avgHeartRate || getAverage('heartRate') || 0)
      };
    },
    { speed: 0, power: 0, cadence: 0, heartRate: 0 }
  );

  const sessionCount = Math.max(sessions.length, 1);
  const avgSpeed = safeFixed(averages.speed / sessionCount);
  const avgPower = safeFixed(averages.power / sessionCount);
  const avgCadence = safeFixed(averages.cadence / sessionCount);
  const avgHeartRate = safeFixed(averages.heartRate / sessionCount);

  const formatTimeAgo = (date) => {
    const now = new Date();
    const sessionDate = new Date(date);
    const diffInSeconds = Math.floor((now - sessionDate) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return sessionDate.toLocaleDateString();
  };

  const formatDuration = (startTime, endTime) => {
    const duration = new Date(endTime) - new Date(startTime);
    const minutes = Math.floor(duration / (1000 * 60));
    return `${minutes} min`;
  };

  const getSessionAverages = (session) => {
    const data = session.data || session.metrics_data || {};
    const getAverage = (metric) => {
      const metricData = data[metric] || [];
      if (metricData.length === 0) return 0;
      const sum = metricData.reduce((sum, point) => sum + (point.value || 0), 0);
      return sum / metricData.length;
    };

    // Special handling for heart rate since it can come from two places
    const heartRateFromMetrics = getAverage('heartRate');
    const heartRateFromStats = session.stats?.avgHeartRate;
    const finalHeartRate = heartRateFromStats || heartRateFromMetrics;

    console.log('Heart Rate Calculation:', {
      fromStats: heartRateFromStats,
      fromMetrics: heartRateFromMetrics,
      final: finalHeartRate
    });

    return {
      speed: safeFixed(getAverage('speed')),
      power: safeFixed(getAverage('power')),
      cadence: safeFixed(getAverage('cadence')),
      heartRate: safeFixed(finalHeartRate)
    };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400">Avg Speed</div>
          <div className="text-xl font-bold text-white">{avgSpeed} km/h</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400">Avg Power</div>
          <div className="text-xl font-bold text-white">{avgPower} W</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400">Avg Cadence</div>
          <div className="text-xl font-bold text-white">{avgCadence} rpm</div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400">Avg Heart Rate</div>
          <div className="text-xl font-bold text-white">{avgHeartRate} bpm</div>
        </div>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => {
          const isSelected = selectedSession?.id === session.id;
          const averages = getSessionAverages(session);
          const timeAgo = formatTimeAgo(session.startTime || session.start_time);
          const duration = formatDuration(
            session.startTime || session.start_time,
            session.endTime || session.end_time
          );

          return (
            <div
              key={session.id}
              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-500/10 border border-blue-500/50'
                  : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => onSelectSession(isSelected ? null : session)}
            >
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                  <div className="text-gray-400">{timeAgo}</div>
                </div>
                <div className="text-gray-400">{duration}</div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Speed</div>
                  <div className="font-medium text-white">{averages.speed} km/h</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Power</div>
                  <div className="font-medium text-white">{averages.power} W</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Cadence</div>
                  <div className="font-medium text-white">{averages.cadence} rpm</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Heart Rate</div>
                  <div className="font-medium text-white">{averages.heartRate} bpm</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SessionsList;