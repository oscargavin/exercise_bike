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
        <div className="px-2 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="p-1.5 sm:p-2 bg-yellow-500/10 rounded-xl">
                <Activity className="h-6 w-6 sm:h-7 sm:w-7 text-yellow-500" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Orbital</h1>
            </div>
            <DeviceMessage />
          </div>
        </div>

        {/* Secondary bar with connection info */}
        <div className="px-2 sm:px-6 py-3 sm:py-4 bg-gray-800/50">
          <div className="flex flex-col space-y-3">
            {/* Status and Device Info */}
            <div className="flex flex-col space-y-2">
              {/* Status Badge */}
              <div className="flex items-center space-x-2">
                <span className="text-sm sm:text-base text-gray-400">Status</span>
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
              
              {/* Device Info */}
              {deviceInfo && (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm sm:text-base text-gray-400">Device</span>
                    <span className="text-sm sm:text-base text-white">{deviceInfo.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm sm:text-base text-gray-400">ID</span>
                    <span className="text-xs sm:text-sm text-gray-300 font-mono break-all">
                      {deviceInfo.id}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={isConnected ? handleDisconnect : connect}
                className={`w-full px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${
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
                  className={`w-full px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${
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