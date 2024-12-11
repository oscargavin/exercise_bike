import { useState, useCallback } from "react";
import {
  BLUETOOTH_SERVICES,
  CSC_CHARACTERISTICS,
} from "../constants/bluetoothConstants";
import { detectEnvironment } from "../utils/environment";

export const useBluetoothDevice = (onDataReceived) => {
  const [isConnected, setIsConnected] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [status, setStatus] = useState("Not connected");

  const handleFitnessService = async (service) => {
    const characteristics = await service.getCharacteristics();

    for (const characteristic of characteristics) {
      if (characteristic.properties.notify) {
        await characteristic.startNotifications();
        characteristic.addEventListener("characteristicvaluechanged", (event) =>
          onDataReceived(event.target.value)
        );
      }
    }
  };

  const handleCscService = async (service) => {
    const characteristic = await service.getCharacteristic(
      CSC_CHARACTERISTICS.MEASUREMENT
    );
    await characteristic.startNotifications();
    characteristic.addEventListener("characteristicvaluechanged", (event) =>
      onDataReceived(event.target.value)
    );
  };

  const connect = async () => {
    try {
      const env = detectEnvironment();
      setStatus("Requesting Bluetooth device...");

      if (!env.bluetoothAPI) {
        throw new Error("Bluetooth API not available");
      }

      const device = await env.bluetoothAPI.requestDevice({
        filters: [{ namePrefix: "iConsole" }],
        optionalServices: [
          BLUETOOTH_SERVICES.FITNESS_MACHINE,
          BLUETOOTH_SERVICES.CYCLING_SPEED_CADENCE,
        ],
      });

      const server = await device.gatt.connect();
      let serviceType;

      try {
        const service = await server.getPrimaryService(
          BLUETOOTH_SERVICES.FITNESS_MACHINE
        );
        await handleFitnessService(service);
        serviceType = "Fitness Machine";
      } catch (e) {
        const service = await server.getPrimaryService(
          BLUETOOTH_SERVICES.CYCLING_SPEED_CADENCE
        );
        await handleCscService(service);
        serviceType = "Cycling Speed and Cadence";
      }

      setDeviceInfo({
        name: device.name || "Unknown device",
        id: device.id,
        connected: true,
        serviceType,
        device,
      });

      setIsConnected(true);
      setStatus(`Connected to ${serviceType} Service`);
    } catch (error) {
      setStatus(`Connection failed: ${error.message}`);
      setIsConnected(false);
      setDeviceInfo(null);
    }
  };

  const disconnect = async () => {
    try {
      if (deviceInfo?.device?.gatt?.connected) {
        await deviceInfo.device.gatt.disconnect();
      }
    } finally {
      setStatus("Device disconnected");
      setIsConnected(false);
      setDeviceInfo(null);
    }
  };

  return {
    isConnected,
    deviceInfo,
    status,
    connect,
    disconnect,
  };
};
