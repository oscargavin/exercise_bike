import React, { useState, useCallback } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Info, ExternalLink, X } from 'lucide-react';
import { detectEnvironment } from '../utils/environment';

// Hook for managing Bluetooth dialog state
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
      <AlertDialogContent className="bg-gray-900 border-gray-800">
        <AlertDialogCancel 
          className="absolute right-4 top-4 p-1 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
          aria-label="Close"
        >
          <X className="h-4 w-2" />
        </AlertDialogCancel>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg text-white pr-6">
            {content.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-400">
            {content.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={content.onAction}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {content.actionText}
            {content.showExternalLinkIcon && (
              <ExternalLink className="w-4 h-4 ml-2" />
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BluetoothSupportDialog;