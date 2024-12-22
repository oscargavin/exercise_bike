import React, { useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Info, ExternalLink } from 'lucide-react';
import { detectEnvironment } from '../utils/environment';

export const useBluetoothDialog = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const env = detectEnvironment();

  const showDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const hideDialog = useCallback(() => {
    setIsDialogOpen(false);
  }, []);

  return {
    isDialogOpen,
    showDialog,
    hideDialog,
    environment: env
  };
};

const BluetoothSupportDialog = ({ isOpen, onClose, environment }) => {
  const { isIOS, isBluefy, hasWebBluetooth } = environment;

  const getDialogContent = () => {
    if (isIOS && !isBluefy) {
      return {
        title: "Bluetooth Not Available",
        description: (
          <div className="space-y-4">
            <p>
              Your current browser doesn't support Bluetooth connectivity. To use this feature on your iOS device, you have two options:
            </p>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-500">1</span>
                </div>
                <p>Download Bluefy Browser from the App Store (recommended)</p>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-500">2</span>
                </div>
                <p>Use Chrome on a desktop/laptop computer</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm p-3 rounded-lg bg-blue-500/10 text-blue-400">
              <Info className="w-4 h-4 flex-shrink-0" />
              <p>Bluefy is a specialized browser that enables Bluetooth connectivity on iOS devices.</p>
            </div>
          </div>
        ),
        actionText: "Open App Store",
        onAction: () => window.open('https://apps.apple.com/app/bluefy-web-ble-browser/id1492822055', '_blank'),
        showExternalLinkIcon: true
      };
    }
    
    if (!hasWebBluetooth) {
      return {
        title: "Bluetooth Not Supported",
        description: (
          <div className="space-y-4">
            <p>
              Your browser doesn't support the Web Bluetooth API. To use this feature, please:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use Google Chrome, Microsoft Edge, or another Chromium-based browser</li>
              <li>Make sure you're using the latest version of your browser</li>
              <li>Check that Bluetooth is enabled on your device</li>
            </ul>
            <div className="flex items-center space-x-2 text-sm p-3 rounded-lg bg-yellow-500/10 text-yellow-400">
              <Info className="w-4 h-4 flex-shrink-0" />
              <p>Safari on macOS currently doesn't support Web Bluetooth. Please use Chrome or Edge instead.</p>
            </div>
          </div>
        ),
        actionText: "Download Chrome",
        onAction: () => window.open('https://www.google.com/chrome/', '_blank'),
        showExternalLinkIcon: true
      };
    }

    return {
      title: "Bluetooth Error",
      description: "Unable to connect to Bluetooth. Please make sure Bluetooth is enabled on your device and try again.",
      actionText: "OK",
      onAction: onClose,
      showExternalLinkIcon: false
    };
  };

  const content = getDialogContent();

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="relative overflow-hidden bg-[#1f2937]/90 backdrop-blur-sm border border-gray-800 p-6 shadow-xl max-w-lg mx-4 rounded-2xl">
        <AlertDialogHeader className="space-y-4">
          <AlertDialogTitle className="text-xl text-white">
            {content.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            {content.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 !flex-row space-x-2">
          <AlertDialogAction
            onClick={content.onAction}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all duration-200"
          >
            {content.actionText}
            {content.showExternalLinkIcon && (
              <ExternalLink className="w-4 h-4 ml-2" />
            )}
          </AlertDialogAction>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-gray-800/50 hover:bg-gray-800 text-gray-300 font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BluetoothSupportDialog;