import { useBluetoothDevice } from '../hooks/useBluetoothDevice';
import { useSessionManager } from '../hooks/useSessionManager';
import { processBluetoothData } from '../utils/dataProcessing';
import Navbar from '../components/Navbar';
import MetricCard from '../components/MetricCard';
import SessionsList from '../components/SessionsList';
import { Loader2 } from 'lucide-react';

function Dashboard() {
  const {
    isSessionActive,
    currentSession,
    previousSessions,
    selectedSession,
    timeSeriesData,
    isLoading,
    error,
    setSelectedSession,
    updateMetric,
    startNewSession,
    endSession,
  } = useSessionManager();

  const { isConnected, deviceInfo, connect, disconnect } = useBluetoothDevice((data) => {
    const processedData = processBluetoothData(data);
    if (processedData) {
      Object.entries(processedData).forEach(([metric, value]) => {
        if (value > 0) updateMetric(metric, value);
      });
    }
  });

  const handleDisconnect = () => {
    if (isSessionActive) {
      endSession();
    }
    disconnect();
  };

  // Helper function to safely get session data
  const getSessionData = (session) => {
    if (!session) return null;
    if (session.data) return session.data;
    if (session.metrics_data) return session.metrics_data;
    return {
      speed: [],
      cadence: [],
      power: [],
      calories: []
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <Navbar
        isConnected={isConnected}
        deviceInfo={deviceInfo}
        isSessionActive={isSessionActive}
        connect={connect}
        handleDisconnect={handleDisconnect}
        startNewSession={startNewSession}
        endSession={endSession}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Previous Sessions */}
        <div className="mb-8 bg-gray-800/50 border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Previous Sessions</h2>
            {isLoading && (
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {previousSessions.length === 0 && !isLoading ? (
            <p className="text-gray-400">No previous sessions found</p>
          ) : (
            <SessionsList
              sessions={previousSessions}
              selectedSession={selectedSession}
              onSelectSession={setSelectedSession}
            />
          )}
        </div>

        {previousSessions.length > 0 && (
            <div className="mb-8">
                <StatsTracking sessions={previousSessions} />
            </div>
        )}

        {/* Metrics Grid */}
        {(isSessionActive || selectedSession) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Speed"
              emoji="🏃"
              data={selectedSession ? getSessionData(selectedSession).speed : timeSeriesData.speed}
              color="#3b82f6"
              unit="km/h"
              isLive={!selectedSession}
            />
            <MetricCard
              title="Cadence"
              emoji="⚙️"
              data={selectedSession ? getSessionData(selectedSession).cadence : timeSeriesData.cadence}
              color="#10b981"
              unit="rpm"
              isLive={!selectedSession}
            />
            <MetricCard
              title="Power"
              emoji="⚡"
              data={selectedSession ? getSessionData(selectedSession).power : timeSeriesData.power}
              color="#ef4444"
              unit="W"
              isLive={!selectedSession}
            />
            <MetricCard
              title="Calories"
              emoji="🔥"
              data={selectedSession ? getSessionData(selectedSession).calories : timeSeriesData.calories}
              color="#f97316"
              unit="kcal"
              isLive={!selectedSession}
            />
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;