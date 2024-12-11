// src/components/Navbar.jsx
import React from 'react';
import { Activity } from 'lucide-react';
import { Badge } from './ui/badge';
import { DeviceMessage } from './DeviceMessage';

const Navbar = ({ 
  isConnected, 
  deviceInfo, 
  isSessionActive,
  connect,
  handleDisconnect,
  startNewSession,
  endSession
}) => {
  return (
    <nav className="bg-gray-900/50 backdrop-blur-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto">
        {/* Main navbar content */}
        <div className="px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-500/10 rounded-xl">
                  <Activity className="h-7 w-7 text-yellow-500" />
                </div>
                <h1 className="text-3xl font-bold text-white">Orbital</h1>
              </div>
            </div>
            <DeviceMessage />
          </div>
        </div>

        {/* Secondary bar with connection info */}
        <div className="px-6 py-4 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Status</span>
                {isConnected ? (
                  <Badge className="bg-green-500/10 text-green-500">
                    Connected
                  </Badge>
                ) : (
                  <Badge className="bg-gray-500/10 text-gray-400">
                    Not Connected
                  </Badge>
                )}
              </div>
              
              {deviceInfo && (
                <>
                  <div className="w-px h-4 bg-gray-700" /> {/* Vertical divider */}
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Device</span>
                    <span className="text-white">{deviceInfo.name}</span>
                  </div>
                  <div className="w-px h-4 bg-gray-700" />
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">ID</span>
                    <span className="text-gray-300 text-sm font-mono">{deviceInfo.id}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center space-x-3">
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
        </div>
      </div>
    </nav>
  );
};

export default Navbar;