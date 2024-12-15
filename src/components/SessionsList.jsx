// src/components/SessionsList.jsx
import React from 'react';
import { formatDistanceToNow } from 'date-fns';

const SessionsList = ({ sessions, selectedSession, onSelectSession }) => {
  // Calculate averages across all sessions
  const averages = sessions.reduce(
    (acc, session) => {
      const data = session.data || session.metrics_data || {};
      const getAverage = (metric) =>
        data[metric]?.reduce((sum, point) => sum + point.value, 0) / (data[metric]?.length || 1);

      return {
        speed: acc.speed + getAverage('speed'),
        power: acc.power + getAverage('power'),
        cadence: acc.cadence + getAverage('cadence'),
        heartRate: acc.heartRate + (session.stats?.avgHeartRate || getAverage('heartRate') || 0)
      };
    },
    { speed: 0, power: 0, cadence: 0, heartRate: 0 }
  );

  const sessionCount = sessions.length;
  const avgSpeed = (averages.speed / sessionCount).toFixed(1);
  const avgPower = (averages.power / sessionCount).toFixed(1);
  const avgCadence = (averages.cadence / sessionCount).toFixed(1);
  const avgHeartRate = (averages.heartRate / sessionCount).toFixed(1);

  const formatDuration = (startTime, endTime) => {
    const duration = new Date(endTime) - new Date(startTime);
    const minutes = Math.floor(duration / (1000 * 60));
    return `${minutes} min`;
  };

  const getSessionAverages = (session) => {
    const data = session.data || session.metrics_data || {};
    const getAverage = (metric) =>
      data[metric]?.reduce((sum, point) => sum + point.value, 0) / (data[metric]?.length || 1);

    return {
      speed: getAverage('speed').toFixed(1),
      power: getAverage('power').toFixed(1),
      cadence: getAverage('cadence').toFixed(1),
      heartRate: (session.stats?.avgHeartRate || getAverage('heartRate') || 0).toFixed(1)
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
          const timeAgo = formatDistanceToNow(new Date(session.startTime || session.start_time), {
            addSuffix: true,
          });
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