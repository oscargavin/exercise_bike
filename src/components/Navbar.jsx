import React from 'react';
import { Link } from 'react-router-dom';
import { DeviceMessage } from './DeviceMessage';
import ProfileMenu from './ProfileMenu';
import { Bluetooth, Power, PlayCircle, StopCircle, Smartphone } from 'lucide-react';

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
      <div className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-800/50">
        <div className="flex items-center justify-between w-full">
          {/* Status & Device Info - Mobile */}
          <div className="flex sm:hidden items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Bluetooth 
                className={`w-4 h-4 ${isConnected ? 'text-blue-500' : 'text-gray-400'}`} 
              />
              {deviceInfo && (
                <Smartphone className="w-4 h-4 text-gray-400" />
              )}
            </div>
            {deviceInfo && (
              <span className="text-sm text-gray-300 truncate max-w-[100px]">
                {deviceInfo.name}
              </span>
            )}
          </div>

          {/* Status & Device Info - Desktop */}
          <div className="hidden sm:flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Bluetooth 
                className={`w-4 h-4 ${isConnected ? 'text-blue-500' : 'text-gray-400'}`} 
              />
              <span className={`text-sm ${isConnected ? 'text-blue-500' : 'text-gray-400'}`}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            {deviceInfo && (
              <>
                <span className="text-gray-400">|</span>
                <span className="text-sm text-gray-300">{deviceInfo.name}</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={isConnected ? handleDisconnect : connect}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-md flex items-center space-x-1 transition-all ${
                isConnected
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                  : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
              }`}
            >
              <Power className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">
                {isConnected ? 'Disconnect' : 'Connect'}
              </span>
            </button>
            
            {isConnected && (
              <button
                onClick={isSessionActive ? endSession : startNewSession}
                className={`p-1.5 sm:px-3 sm:py-1.5 rounded-md flex items-center space-x-1 transition-all ${
                  isSessionActive
                    ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                    : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                }`}
              >
                {isSessionActive ? (
                  <StopCircle className="w-4 h-4" />
                ) : (
                  <PlayCircle className="w-4 h-4" />
                )}
                <span className="hidden sm:inline text-sm font-medium">
                  {isSessionActive ? 'End' : 'Start'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Device ID - Only show when connected */}
        {deviceInfo && (
          <div className="mt-1.5">
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