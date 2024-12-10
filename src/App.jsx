import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [status, setStatus] = useState('Not connected');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [previousSessions, setPreviousSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  
  const [timeSeriesData, setTimeSeriesData] = useState({
    speed: [],
    cadence: [],
    power: [],
    calories: []
  });

  const startNewSession = () => {
    if (!isConnected) {
      setStatus('Please connect to bike first');
      return;
    }
    
    const newSession = {
      id: Date.now(),
      startTime: new Date(),
      data: {
        speed: [],
        cadence: [],
        power: [],
        calories: []
      }
    };
    
    setCurrentSession(newSession);
    setTimeSeriesData({
      speed: [],
      cadence: [],
      power: [],
      calories: []
    });
    setIsSessionActive(true);
    setStatus('Session started');
  };

  const endSession = () => {
    if (currentSession) {
      const endedSession = {
        ...currentSession,
        endTime: new Date(),
        data: timeSeriesData
      };
      setPreviousSessions(prev => [endedSession, ...prev]);
      setCurrentSession(null);
    }
    setIsSessionActive(false);
    setStatus('Session ended');
  };

  const updateMetric = useCallback((metric, value) => {
    if (!isSessionActive) return;
    
    const now = new Date();
    setTimeSeriesData(prev => {
      const newData = {
        ...prev,
        [metric]: [...prev[metric], {
          time: now.toLocaleTimeString(),
          value: value
        }]
      };
      return newData;
    });
  }, [isSessionActive]);

  const detectEnvironment = () => {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isBluefy = navigator.WebBLE !== undefined;
    const hasWebBluetooth = navigator.bluetooth !== undefined;
    
    return {
      isIOS,
      isBluefy,
      hasWebBluetooth,
      // Return the appropriate Bluetooth API to use
      bluetoothAPI: isBluefy ? navigator.WebBLE : navigator.bluetooth
    };
  };

  const connectToBike = async () => {
    try {
      const env = detectEnvironment();
      setStatus('Requesting Bluetooth device...');
      
      if (!env.bluetoothAPI) {
        if (env.isIOS) {
          setStatus('Please use Bluefy browser for iOS Bluetooth support');
        } else {
          setStatus('Bluetooth not supported in this browser');
        }
        return;
      }
  
      console.log('Connection attempt with:', {
        isIOS: env.isIOS,
        isBluefy: env.isBluefy,
        hasWebBluetooth: env.hasWebBluetooth,
        usingAPI: env.isBluefy ? 'WebBLE' : 'Web Bluetooth'
      });
  
      const device = await env.bluetoothAPI.requestDevice({
        filters: [
          { namePrefix: 'iConsole' }
        ],
        optionalServices: [
          0x1826,  // Fitness Machine Service
          0x1818,  // Cycling Speed and Cadence
          0x2A5B,  // CSC Measurement
          'fitness_machine',
          'cycling_speed_and_cadence'
        ]
      });
  
      setStatus(`Device selected: ${device.name}`);
      
      device.addEventListener('gattserverdisconnected', handleDisconnect);
  
      setStatus('Connecting to device...');
      const server = await device.gatt.connect();
      
      let serviceType;
      try {
        const service = await server.getPrimaryService(0x1826);
        await handleFitnessService(service);
        serviceType = 'Fitness Machine';
        setStatus('Connected to Fitness Machine Service');
      } catch (e) {
        console.log('FTMS not found, trying CSC service...', e);
        try {
          const service = await server.getPrimaryService(0x1818);
          await handleCscService(service);
          serviceType = 'Cycling Speed and Cadence';
          setStatus('Connected to Cycling Speed and Cadence Service');
        } catch (e) {
          console.error('No compatible services found:', e);
          throw new Error('No compatible fitness services found on device');
        }
      }
  
      setDeviceInfo({
        name: device.name,
        id: device.id,
        connected: true,
        serviceType,
        device // Store the device object for disconnecting later
      });
      
      setIsConnected(true);
  
    } catch (error) {
      console.error('Connection error:', error);
      setStatus(`Error: ${error.message}`);
      setIsConnected(false);
      setDeviceInfo(null);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      if (deviceInfo?.device?.gatt?.connected) {
        await deviceInfo.device.gatt.disconnect();
      }
    } catch (error) {
      console.error('Error disconnecting:', error);
    } finally {
      setStatus('Device disconnected');
      setIsConnected(false);
      setDeviceInfo(null);
      if (isSessionActive) {
        endSession();
      }
    }
  };

  const handleFitnessService = async (service) => {
    const characteristics = await service.getCharacteristics();
    
    for (const characteristic of characteristics) {
      if (characteristic.properties.notify) {
        await characteristic.startNotifications();
        characteristic.addEventListener('characteristicvaluechanged', (event) => {
          const value = event.target.value;
          updateBikeData(value);
        });
      }
    }
  };

  const disconnect = async () => {
    if (deviceInfo?.gatt) {
      await deviceInfo.gatt.disconnect();
    }
    handleDisconnect();
  };

  const handleCscService = async (service) => {
    const characteristic = await service.getCharacteristic(0x2A5B);
    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
      const value = event.target.value;
      updateBikeData(value);
    });
  };

  const updateBikeData = (value) => {
    const speed = value.getUint16(1, true) / 100;
    const cadence = value.getUint16(3, true);
    const power = value.getUint16(5, true);
    const calories = value.getUint16(7, true);

    updateMetric('speed', speed);
    updateMetric('cadence', cadence);
    updateMetric('power', power);
    updateMetric('calories', calories);
  };

  const MetricGraph = ({ title, data, color, unit, isLive = true }) => (
    <div className="bg-white rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-semibold mb-2 text-gray-800">{title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            isAnimationActive={false}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis unit={unit} />
            <Tooltip />
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
    </div>
  );

  // In your render method, add a device-specific message
const DeviceMessage = () => {
  const env = detectEnvironment();
  
  if (env.isBluefy) {
    return (
      <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
        <p>Using Bluefy - Web Bluetooth is supported! ✅</p>
      </div>
    );
  }
  
  if (env.isIOS && !env.isBluefy) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
        <p className="font-bold">iOS Device Detected</p>
        <p>To connect to your bike:</p>
        <ol className="list-decimal ml-4 mt-2">
          <li>Download Bluefy browser (free) from the App Store</li>
          <li>Open this page in Bluefy</li>
          <li>Enable Web Bluetooth in Bluefy settings</li>
        </ol>
      </div>
    );
  }
  
  if (!env.hasWebBluetooth && !env.isBluefy) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
        <p>Your browser doesn't support Web Bluetooth.</p>
        <p>Please use Chrome, Edge, or Bluefy (iOS).</p>
      </div>
    );
  }
  
  return (
    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
      <p>Web Bluetooth is supported in your browser! ✅</p>
    </div>
  );
};

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">Bike Connect</h1>
        
        <DeviceMessage />
        {/* Status and Controls */}
        <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">Status</h2>
          <p className="text-gray-600">{status}</p>
          {deviceInfo && (
            <div className="mt-2">
              <p className="text-gray-600">Connected Device: {deviceInfo.name}</p>
              <p className="text-gray-600">Device ID: {deviceInfo.id}</p>
            </div>
          )}
          
          <div className="mt-4 flex gap-4">
            <button
              onClick={isConnected ? handleDisconnect : connectToBike}
              className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                isConnected 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {isConnected ? 'Disconnect' : 'Connect to Bike'}
            </button>
            
            {isConnected && (
              <button
                onClick={isSessionActive ? endSession : startNewSession}
                className={`px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                  isSessionActive 
                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {isSessionActive ? 'End Session' : 'Start Session'}
              </button>
            )}
          </div>
        </div>

        {/* Session Selection */}
        {previousSessions.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-lg mb-6">
            <h2 className="text-xl font-semibold mb-4">Previous Sessions</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {previousSessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`px-4 py-2 rounded transition-colors ${
                    selectedSession?.id === session.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {new Date(session.startTime).toLocaleDateString()} 
                  {new Date(session.startTime).toLocaleTimeString()}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Current Session or Selected Session Graphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(isSessionActive || selectedSession) && (
            <>
              <MetricGraph
                title="Speed"
                data={selectedSession ? selectedSession.data.speed : timeSeriesData.speed}
                color="#2563eb"
                unit=" km/h"
                isLive={!selectedSession}
              />
              <MetricGraph
                title="Cadence"
                data={selectedSession ? selectedSession.data.cadence : timeSeriesData.cadence}
                color="#16a34a"
                unit=" rpm"
                isLive={!selectedSession}
              />
              <MetricGraph
                title="Power"
                data={selectedSession ? selectedSession.data.power : timeSeriesData.power}
                color="#dc2626"
                unit=" W"
                isLive={!selectedSession}
              />
              <MetricGraph
                title="Calories"
                data={selectedSession ? selectedSession.data.calories : timeSeriesData.calories}
                color="#ea580c"
                unit=" kcal"
                isLive={!selectedSession}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;