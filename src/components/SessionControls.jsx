export const SessionControls = ({ 
    isConnected, 
    isSessionActive, 
    onConnect, 
    onDisconnect, 
    onStartSession, 
    onEndSession 
  }) => (
    <div className="mt-4 flex gap-4">
      <button
        onClick={isConnected ? onDisconnect : onConnect}
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
          onClick={isSessionActive ? onEndSession : onStartSession}
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
  );
  