import { useBluetoothDevice } from '../hooks/useBluetoothDevice';
import { useSessionManager } from '../hooks/useSessionManager';
import { processBluetoothData } from '../utils/dataProcessing';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import MetricCard from '../components/MetricCard';
import SessionsList from '../components/SessionsList';
import StatsTracking from '@/components/StatsTracking';
import { Loader2 } from 'lucide-react';
import { useMultipleBluetoothDevices } from '../hooks/useMultipleBluetoothDevices';
import { DEVICE_TYPES } from '../constants/bluetoothConstants';

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

  const { user } = useAuth();

  const handleBikeData = (data) => {
    const processedData = processBluetoothData(data);
    if (processedData) {
      Object.entries(processedData).forEach(([metric, value]) => {
        if (value > 0) updateMetric(metric, value);
      });
    }
  };

  const handleHeartRateData = (heartRate) => {
    if (heartRate > 0) {
      updateMetric('heartRate', heartRate);
    }
  };

  const {
    connectedDevices,
    connectionStatus,
    connectToDevice,
    disconnectDevice,
    isBikeConnected,
    isHeartRateConnected
  } = useMultipleBluetoothDevices(handleBikeData, handleHeartRateData);

  const handleDisconnect = async () => {
    if (isSessionActive) {
      endSession();
    }
    await disconnectDevice(DEVICE_TYPES.BIKE);
    await disconnectDevice(DEVICE_TYPES.HEART_RATE);
  };

  // Helper function to safely get session data
  const getSessionData = (session) => {
    if (!session) return null;
    if (session.data) return session.data;
    if (session.metrics_data) return session.metrics_data;
    return {
      speed: [],
      cadence: [],
      resistance: [],
      heartRate: []
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <Navbar
        isBikeConnected={isBikeConnected}
        isHeartRateConnected={isHeartRateConnected}
        deviceInfo={connectedDevices[DEVICE_TYPES.BIKE]}
        isSessionActive={isSessionActive}
        onConnectBike={() => connectToDevice(DEVICE_TYPES.BIKE)}
        onConnectHeartRate={() => connectToDevice(DEVICE_TYPES.HEART_RATE)}
        handleDisconnect={handleDisconnect}
        startNewSession={startNewSession}
        endSession={endSession}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {previousSessions.length > 0 && (
          <div className="mb-8">
            <StatsTracking
              sessions={previousSessions}
              userName={user?.name}
            />
          </div>
        )}

        {/* Metrics Grid with smooth transition */}
        <div 
          className={`transform transition-all duration-300 ease-in-out origin-top ${
            isSessionActive || selectedSession 
              ? 'opacity-100 scale-100 translate-y-0 h-auto mb-8' 
              : 'opacity-0 scale-95 -translate-y-4 h-0 overflow-hidden mb-0'
          }`}
        >
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
              title="Resistance"
              emoji="💪"
              data={selectedSession ? getSessionData(selectedSession).resistance : timeSeriesData.resistance}
              color="#ef4444"
              unit="%"
              isLive={!selectedSession}
              isResistance={true}
            />
            <MetricCard
              title="Heart Rate"
              emoji="❤️"
              data={selectedSession ? getSessionData(selectedSession).heartRate : timeSeriesData.heartRate}
              color="#f97316"
              unit="bpm"
              isLive={!selectedSession}
              isHeartRate={true}
            />
          </div>
        </div>

        {/* Previous Sessions */}
        <div className="bg-gray-800/50 border-gray-700 rounded-lg p-6">
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
      </main>
    </div>
  );
}

export default Dashboard;