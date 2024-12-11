// src/App.jsx
import { useBluetoothDevice } from './hooks/useBluetoothDevice';
import { useSessionManager } from './hooks/useSessionManager';
import { processBluetoothData } from './utils/dataProcessing';
import Navbar from './components/Navbar';
import MetricCard from './components/MetricCard';

function App() {
  const {
    isSessionActive,
    currentSession,
    previousSessions,
    selectedSession,
    timeSeriesData,
    setSelectedSession,
    updateMetric,
    startNewSession,
    endSession
  } = useSessionManager();

  const { isConnected, deviceInfo, status, connect, disconnect } = 
    useBluetoothDevice((data) => {
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
        {previousSessions.length > 0 && (
          <div className="mb-8 bg-gray-800/50 border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Previous Sessions</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {previousSessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                    selectedSession?.id === session.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  {new Date(session.startTime).toLocaleDateString()} 
                  {new Date(session.startTime).toLocaleTimeString()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        {(isSessionActive || selectedSession) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MetricCard
              title="Speed"
              emoji="🏃"
              data={selectedSession ? selectedSession.data.speed : timeSeriesData.speed}
              color="#3b82f6"
              unit="km/h"
              isLive={!selectedSession}
            />
            <MetricCard
              title="Cadence"
              emoji="⚙️"
              data={selectedSession ? selectedSession.data.cadence : timeSeriesData.cadence}
              color="#10b981"
              unit="rpm"
              isLive={!selectedSession}
            />
            <MetricCard
              title="Power"
              emoji="⚡"
              data={selectedSession ? selectedSession.data.power : timeSeriesData.power}
              color="#ef4444"
              unit="W"
              isLive={!selectedSession}
            />
            <MetricCard
              title="Calories"
              emoji="🔥"
              data={selectedSession ? selectedSession.data.calories : timeSeriesData.calories}
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

export default App;