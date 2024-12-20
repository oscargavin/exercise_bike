import React, { useMemo, useState } from 'react';
import { calculateSessionStats, formatTimeAgo, formatDuration } from '@/utils/stats';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SESSIONS_PER_PAGE = 5;

const SessionsList = ({ sessions, selectedSession, onSelectSession }) => {
  const [currentPage, setCurrentPage] = useState(1);
  
  const safeFixed = (value) => {
    if (typeof value !== 'number' || isNaN(value)) return '0.0';
    return value.toFixed(1);
  };

  // Calculate total pages
  const totalPages = Math.ceil(sessions.length / SESSIONS_PER_PAGE);

  // Get current page's sessions
  const currentSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * SESSIONS_PER_PAGE;
    return sessions.slice(startIndex, startIndex + SESSIONS_PER_PAGE);
  }, [sessions, currentPage]);

  // Calculate overall statistics based on all sessions
  const overallStats = useMemo(() => {
    if (!sessions.length) return {};
    
    const totals = sessions.reduce((acc, session) => {
      const stats = calculateSessionStats(session.data);
      return {
        speed: acc.speed + stats.avgSpeed,
        resistance: acc.resistance + stats.avgResistance,
        cadence: acc.cadence + stats.avgCadence,
        heartRate: acc.heartRate + stats.avgHeartRate
      };
    }, { speed: 0, resistance: 0, cadence: 0, heartRate: 0 });

    return {
      avgSpeed: totals.speed / sessions.length,
      avgResistance: totals.resistance / sessions.length,
      avgCadence: totals.cadence / sessions.length,
      avgHeartRate: totals.heartRate / sessions.length
    };
  }, [sessions]);

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-400">Avg Speed</div>
          <div className="text-lg sm:text-xl font-bold text-white mt-0.5">
            {safeFixed(overallStats.avgSpeed)} km/h
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-400">Avg Resistance</div>
          <div className="text-lg sm:text-xl font-bold text-white mt-0.5">
            {safeFixed(stats.avgResistance)}
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-400">Avg Cadence</div>
          <div className="text-lg sm:text-xl font-bold text-white mt-0.5">
            {safeFixed(overallStats.avgCadence)} rpm
          </div>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-400">Avg Heart Rate</div>
          <div className="text-lg sm:text-xl font-bold text-white mt-0.5">
            {safeFixed(overallStats.avgHeartRate)} bpm
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-3">
          <div className="text-xs sm:text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`p-1 rounded-lg transition-colors ${
                currentPage === 1
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`p-1 rounded-lg transition-colors ${
                currentPage === totalPages
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Session List */}
      <div className="space-y-3">
        {currentSessions.map((session) => {
          const isSelected = selectedSession?.id === session.id;
          const stats = calculateSessionStats(session.data);
          const timeAgo = formatTimeAgo(session.startTime);
          const duration = formatDuration(session.startTime, session.endTime);

          return (
            <div
              key={session.id}
              className={`p-3 sm:p-4 rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-blue-500/10 border border-blue-500/50'
                  : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => onSelectSession(isSelected ? null : session)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                <div className="text-xs sm:text-sm text-gray-400">{timeAgo}</div>
                <div className="text-xs sm:text-sm text-gray-400 mt-1 sm:mt-0">{duration}</div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <div className="text-xs sm:text-sm text-gray-400">Speed</div>
                  <div className="text-sm sm:text-base font-medium text-white mt-0.5">
                    {safeFixed(stats.avgSpeed)} km/h
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-400">Resistance</div>
                  <div className="text-sm sm:text-base font-medium text-white mt-0.5">
                    {safeFixed(stats.avgResistance)}
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-400">Cadence</div>
                  <div className="text-sm sm:text-base font-medium text-white mt-0.5">
                    {safeFixed(stats.avgCadence)} rpm
                  </div>
                </div>
                <div>
                  <div className="text-xs sm:text-sm text-gray-400">Heart Rate</div>
                  <div className="text-sm sm:text-base font-medium text-white mt-0.5">
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