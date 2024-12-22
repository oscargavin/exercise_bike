import { useSessionManager } from '../hooks/useSessionManager';
import { processBluetoothData } from '../utils/dataProcessing';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import MetricCard from '../components/MetricCard';
import MetricCardSkeleton from '../components/MetricCardSkeleton';
import SessionsListSkeleton from '../components/SessionsListSkeleton';
import SessionsList from '../components/SessionsList';
import StatsTracking from '@/components/StatsTracking';
import { useMultipleBluetoothDevices } from '../hooks/useMultipleBluetoothDevices';
import { DEVICE_TYPES } from '../constants/bluetoothConstants';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
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

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
        <Navbar
          isBikeConnected={false}
          isHeartRateConnected={false}
          deviceInfo={null}
          isSessionActive={false}
        />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        </main>
      </div>
    );
  }

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

  const currentHeartRate = timeSeriesData?.heartRate?.length > 0 
    ? Math.round(timeSeriesData.heartRate[timeSeriesData.heartRate.length - 1].value)
    : null;
    
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
        currentHeartRate={currentHeartRate} 
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

        {/* Metrics Grid with loading state */}
        <div 
          className={`transform transition-all duration-300 ease-in-out origin-top ${
            isSessionActive || selectedSession 
              ? 'opacity-100 scale-100 translate-y-0 h-auto mb-8' 
              : 'opacity-0 scale-95 -translate-y-4 h-0 overflow-hidden mb-0'
          }`}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <MetricCardSkeleton key={i} />
              ))}
            </div>
          ) : (
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
          )}
        </div>

        {/* Previous Sessions with loading state */}
        <div className="bg-gray-800/50 border-gray-700 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Previous Sessions</h2>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <SessionsListSkeleton />
          ) : previousSessions.length === 0 ? (
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
};

export default Dashboard;