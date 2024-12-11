import { detectEnvironment } from '../utils/environment';

export const DeviceMessage = () => {
  const env = detectEnvironment();
  
  if (env.isBluefy || (env.isIOS && env.hasWebBluetooth)) {
    return (
      <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
        <p>Bluetooth support detected! Ready to connect ✅</p>
      </div>
    );
  }
  
  if (env.isIOS && !env.hasWebBluetooth) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
        <p className="font-bold">Enable Bluetooth</p>
        <p>Please ensure Bluetooth is enabled in your device settings and Web Bluetooth is enabled in Bluefy settings.</p>
      </div>
    );
  }
  
  if (!env.hasWebBluetooth) {
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