import { useEffect } from 'react';
import { useBluetoothDevice } from './hooks/useBluetoothDevice';
import { useSessionManager } from './hooks/useSessionManager';
import { processBluetoothData } from './utils/dataProcessing';
import { DeviceMessage } from './components/DeviceMessage';
import { MetricGraph } from './components/MetricGraph';
import { SessionControls } from './components/SessionControls';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Activity, Power, Gauge, Flame } from 'lucide-react';
import { LineChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
      {/* Modern Nav Bar */}
      <nav className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-blue-500 text-2xl">⚡</span>
              <h1 className="text-2xl font-bold text-white">Orbital</h1>
            </div>
            <DeviceMessage />
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <Card className="mb-8 bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-xl text-white flex items-center space-x-2">
              <div className="flex-1">Status</div>
              {isConnected && (
                <Badge className="bg-green-500/10 text-green-500">
                  Connected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-gray-300">
              {deviceInfo && (
                <>
                  <p>Connected to {deviceInfo.name}</p>
                  <p className="text-sm text-gray-400">ID: {deviceInfo.id}</p>
                  <div className="flex items-center space-x-2 mt-4">
                    <Badge className={isSessionActive ? 
                      "bg-blue-500/10 text-blue-500" : 
                      "bg-gray-500/10 text-gray-400"}>
                      {isSessionActive ? "Session Active" : "Session Inactive"}
                    </Badge>
                    {currentSession && (
                      <Badge className="border border-gray-700 bg-transparent">
                        Started at {new Date(currentSession.startTime).toLocaleTimeString()}
                      </Badge>
                    )}
                  </div>
                </>
              )}
              
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={isConnected ? handleDisconnect : connect}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isConnected 
                      ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                      : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                  }`}
                >
                  {isConnected ? 'Disconnect' : 'Connect to Bike'}
                </button>
                
                {isConnected && (
                  <button
                    onClick={isSessionActive ? endSession : startNewSession}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      isSessionActive 
                        ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' 
                        : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                    }`}
                  >
                    {isSessionActive ? 'End Session' : 'Start Session'}
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Previous Sessions */}
        {previousSessions.length > 0 && (
          <Card className="mb-8 bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Previous Sessions</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
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

// Updated MetricCard component with modern design
const MetricCard = ({ title, emoji, data, color, unit, isLive }) => {
  const latestValue = data[data.length - 1]?.value || 0;

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white flex items-center space-x-2">
          <span>{emoji}</span>
          <span>{title}</span>
          {isLive && (
            <Badge className="ml-2 border border-gray-700 bg-transparent">
              Live
            </Badge>
          )}
        </CardTitle>
        <div className="text-2xl font-bold text-white">
          {latestValue.toFixed(1)}{unit}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} isAnimationActive={false}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                stroke="#4B5563"
              />
              <YAxis 
                unit={unit}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                stroke="#4B5563"
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem'
                }}
                labelStyle={{ color: '#9CA3AF' }}
                itemStyle={{ color: '#F3F4F6' }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default App;