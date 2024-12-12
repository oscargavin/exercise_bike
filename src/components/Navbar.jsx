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
      <div className="w-full">
        {/* Main navbar content */}
        <div className="px-2 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link to="/dashboard" className="flex items-center">
                <div className="w-8 h-8 sm:w-10 sm:h-10 relative">
                  <img
                    src="/favicon.png"
                    alt="OrbitalCycle"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white ml-2">OrbitalCycle</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <DeviceMessage />
              <div className="h-6 w-px bg-gray-700" />
              <ProfileMenu />
            </div>
          </div>
        </div>

        {/* Secondary bar with connection info */}
        <div className="px-2 sm:px-6 py-3 sm:py-4 bg-gray-800/50">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2">
              <Bluetooth className={`w-5 h-5 ${isConnected ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className="text-sm sm:text-base text-gray-400">Status</span>
              {isConnected ? (
                <Badge className="bg-green-500/10 text-green-500">
                  Connected
                </Badge>
              ) : (
                <span className="text-gray-300">Not Connected</span>
              )}
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={isConnected ? handleDisconnect : connect}
                className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${
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
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all ${
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

          {/* Device Info - Only show when connected */}
          {deviceInfo && (
            <div className="mt-3 flex flex-col space-y-2 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm sm:text-base text-gray-400">Device</span>
                <span className="text-sm sm:text-base text-white truncate">{deviceInfo.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm sm:text-base text-gray-400">ID</span>
                <span className="text-xs sm:text-sm text-gray-300 font-mono truncate">
                  {deviceInfo.id}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;