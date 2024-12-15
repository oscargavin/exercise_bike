import React from 'react';
import { Link } from 'react-router-dom';
import { DeviceMessage } from './DeviceMessage';
import ProfileMenu from './ProfileMenu';
import { 
  Bluetooth, 
  Power, 
  PlayCircle, 
  StopCircle, 
  Smartphone,
  Heart
} from 'lucide-react';

const NavBar = ({
  isBikeConnected,
  isHeartRateConnected,
  bikeDeviceInfo,
  heartRateDeviceInfo,
  isSessionActive,
  onConnectBike,
  onConnectHeartRate,
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
          {/* Device Status Indicators */}
          <div className="flex items-center space-x-4">
            {/* Bike Status */}
            <div className="flex items-center space-x-2">
              <Bluetooth 
                className={`w-4 h-4 ${isBikeConnected ? 'text-blue-500' : 'text-gray-400'}`} 
              />
              <span className={`text-sm ${isBikeConnected ? 'text-blue-500' : 'text-gray-400'}`}>
                Bike
              </span>
            </div>

            {/* Heart Rate Status */}
            <div className="flex items-center space-x-2">
              <Heart 
                className={`w-4 h-4 ${isHeartRateConnected ? 'text-red-500' : 'text-gray-400'}`} 
              />
              <span className={`text-sm ${isHeartRateConnected ? 'text-red-500' : 'text-gray-400'}`}>
                Heart Rate
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* Bike Connection Button */}
            <button
              onClick={isBikeConnected ? handleDisconnect : onConnectBike}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-md flex items-center space-x-1 transition-all ${
                isBikeConnected
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                  : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
              }`}
            >
              <Bluetooth className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">
                {isBikeConnected ? 'Disconnect Bike' : 'Connect Bike'}
              </span>
            </button>

            {/* Heart Rate Connection Button */}
            <button
              onClick={isHeartRateConnected ? handleDisconnect : onConnectHeartRate}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-md flex items-center space-x-1 transition-all ${
                isHeartRateConnected
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                  : 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline text-sm font-medium">
                {isHeartRateConnected ? 'Disconnect HR' : 'Connect HR'}
              </span>
            </button>
            
            {/* Session Control Button */}
            {isBikeConnected && (
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

        {/* Connected Device Info */}
        <div className="mt-1.5 flex flex-col space-y-1">
          {bikeDeviceInfo && (
            <span className="text-xs text-gray-500 font-mono truncate">
              Bike: {bikeDeviceInfo.id}
            </span>
          )}
          {heartRateDeviceInfo && (
            <span className="text-xs text-gray-500 font-mono truncate">
              HR: {heartRateDeviceInfo.id}
            </span>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavBar;