// src/components/DeviceMessage.jsx
import { detectEnvironment } from '../utils/environment';
import { Bluetooth } from 'lucide-react';

export const DeviceMessage = () => {
  const env = detectEnvironment();
  
  // Determine color based on support
  const getStatusColor = () => {
    if (env.isBluefy || (env.isIOS && env.hasWebBluetooth)) {
      return "text-green-400";
    }
    if (env.isIOS && !env.hasWebBluetooth) {
      return "text-yellow-400";
    }
    if (!env.hasWebBluetooth) {
      return "text-red-400";
    }
    return "text-green-400";
  };

  return (
    <div className="relative">
      <Bluetooth className={`w-6 h-6 ${getStatusColor()}`} />
    </div>
  );
};