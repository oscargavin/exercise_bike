import React, { useMemo } from 'react';
import { calculateSessionStats, formatTimeAgo, formatDuration } from '@/utils/stats';

const SessionsList = ({ sessions, selectedSession, onSelectSession }) => {
  const safeFixed = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '0.0';
    return value.toFixed(1);
  };

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    if (!sessions.length) return {};
    
    const totals = sessions.reduce((acc, session) => {
      const stats = calculateSessionStats(session.data);
      return {
        speed: acc.speed + stats.avgSpeed,
        power: acc.power + stats.avgPower,
        cadence: acc.cadence + stats.avgCadence,
        heartRate: acc.heartRate + stats.avgHeartRate
      };
    }, { speed: 0, power: 0, cadence: 0, heartRate: 0 });

    return {
      avgSpeed: totals.speed / sessions.length,
      avgPower: totals.power / sessions.length,
      avgCadence: totals.cadence / sessions.length,
      avgHeartRate: totals.heartRate / sessions.length
    };
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400">Avg Speed</div>
          <div className="text-xl font-bold text-white">
            {safeFixed(overallStats.avgSpeed)} km/h
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400">Avg Power</div>
          <div className="text-xl font-bold text-white">
            {safeFixed(overallStats.avgPower)} W
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400">Avg Cadence</div>
          <div className="text-xl font-bold text-white">
            {safeFixed(overallStats.avgCadence)} rpm
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-sm text-gray-400">Avg Heart Rate</div>
          <div className="text-xl font-bold text-white">
            {safeFixed(overallStats.avgHeartRate)} bpm
          </div>
        </div>
      </div>

      {/* Session List */}
      <div className="space-y-4">
        {sessions.map((session) => {
          const isSelected = selectedSession?.id === session.id;
          const stats = calculateSessionStats(session.data);
          const timeAgo = formatTimeAgo(session.startTime);
          const duration = formatDuration(session.startTime, session.endTime);

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
                  <div className="font-medium text-white">
                    {safeFixed(stats.avgSpeed)} km/h
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Power</div>
                  <div className="font-medium text-white">
                    {safeFixed(stats.avgPower)} W
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Cadence</div>
                  <div className="font-medium text-white">
                    {safeFixed(stats.avgCadence)} rpm
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Heart Rate</div>
                  <div className="font-medium text-white">
                    {safeFixed(stats.avgHeartRate)} bpm
                  </div>
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