import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from './ui/badge';
import { DeviceMessage } from './DeviceMessage';
import ProfileMenu from './ProfileMenu';
import { Bluetooth } from 'lucide-react';

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
    <nav className="bg-gray-900/50 backdrop-blur-lg border-b border-gray-800 w-full">
      {/* Main navbar */}
      <div className="px-3 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8">
              <img
                src="/favicon.png"
                alt="OrbitalCycle"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">OrbitalCycle</h1>
          </Link>
          <div className="flex items-center space-x-3">
            <DeviceMessage />
            <div className="h-5 w-px bg-gray-700 hidden sm:block" />
            <ProfileMenu />
          </div>
        </div>
      </div>

      {/* Connection status bar */}
      <div className="px-3 py-2.5 sm:px-6 sm:py-3 bg-gray-800/50">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Status section */}
          <div className="flex items-center space-x-3 min-w-0">
            <div className="flex items-center space-x-2">
              <Bluetooth className={`w-4 h-4 ${isConnected ? 'text-blue-500' : 'text-gray-400'}`} />
              {isConnected ? (
                <Badge variant="default" className="bg-green-500/10 text-green-500 text-xs px-2 py-0.5">
                  Connected
                </Badge>
              ) : (
                <span className="text-sm text-gray-400">Not Connected</span>
              )}
            </div>
            
            {deviceInfo && (
              <div className="flex items-center space-x-2 overflow-hidden">
                <span className="text-gray-400 text-sm hidden sm:inline">|</span>
                <span className="text-sm text-gray-300 truncate">{deviceInfo.name}</span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={isConnected ? handleDisconnect : connect}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isConnected
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                  : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
              }`}
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>
            {isConnected && (
              <button
                onClick={isSessionActive ? endSession : startNewSession}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isSessionActive
                    ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                }`}
              >
                {isSessionActive ? 'End' : 'Start'}
              </button>
            )}
          </div>
        </div>

        {/* Device ID - Only show when connected */}
        {deviceInfo && (
          <div className="mt-2 sm:mt-1.5">
            <span className="text-xs text-gray-500 font-mono truncate">
              {deviceInfo.id}
            </span>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;