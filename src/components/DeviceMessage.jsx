import { detectEnvironment } from '../utils/environment';
import { Bluetooth, XCircle, CheckCircle } from 'lucide-react';

export const DeviceMessage = () => {
  const env = detectEnvironment();
  
  const getStatusInfo = () => {
    if (env.isBluefy || (env.isIOS && env.hasWebBluetooth)) {
      return {
        icon: <CheckCircle className="w-4 h-4 text-green-500" />,
        message: "Bluetooth support detected! Ready to connect",
        color: "text-green-500",
        tooltipColor: "bg-green-900"
      };
    }
    
    if (env.isIOS && !env.hasWebBluetooth) {
      return {
        icon: <XCircle className="w-4 h-4 text-yellow-500" />,
        message: "Enable Bluetooth in device settings and Web Bluetooth in Bluefy settings",
        color: "text-yellow-500",
        tooltipColor: "bg-yellow-900"
      };
    }
    
    if (!env.hasWebBluetooth) {
      return {
        icon: <XCircle className="w-4 h-4 text-red-500" />,
        message: "Browser doesn't support Web Bluetooth. Use Chrome, Edge, or Bluefy (iOS)",
        color: "text-red-500",
        tooltipColor: "bg-red-900"
      };
    }
    
    return {
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      message: "Web Bluetooth is supported in your browser",
      color: "text-green-500",
      tooltipColor: "bg-green-900"
    };
  };

  const status = getStatusInfo();

  return (
    <div className="relative flex items-center group">
      <Bluetooth className={`w-5 h-5 ${status.color}`} />
      {status.icon}
      
      {/* Tooltip */}
      <div className={`absolute hidden group-hover:block right-0 top-full mt-2 p-2 ${status.tooltipColor} text-white text-sm rounded-md whitespace-nowrap z-50`}>
        {status.message}
        {/* Tooltip arrow */}
        <div className={`absolute -top-1 right-4 w-2 h-2 ${status.tooltipColor} transform rotate-45`}></div>
      </div>
    </div>
  );
};