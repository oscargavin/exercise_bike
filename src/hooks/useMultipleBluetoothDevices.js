import { useState, useCallback } from "react";
import {
  BLUETOOTH_SERVICES,
  CHARACTERISTICS,
  DEVICE_TYPES,
} from "../constants/bluetoothConstants";
import { detectEnvironment } from "../utils/environment";

export const useMultipleBluetoothDevices = (
  onBikeDataReceived,
  onHeartRateDataReceived
) => {
  const [connectedDevices, setConnectedDevices] = useState({
    [DEVICE_TYPES.BIKE]: null,
    [DEVICE_TYPES.HEART_RATE]: null,
  });

  const [connectionStatus, setConnectionStatus] = useState({
    [DEVICE_TYPES.BIKE]: false,
    [DEVICE_TYPES.HEART_RATE]: false,
  });

  const handleHeartRateData = (event) => {
    const value = event.target.value;
    if (!(value instanceof DataView)) return;

    // The first byte contains the flags
    const flags = value.getUint8(0);
    const rate16Bits = flags & 0x1;

    // Heart rate is in the second byte if the flag is not set
    // or in the second and third bytes if the flag is set
    let heartRate;
    if (rate16Bits) {
      heartRate = value.getUint16(1, true);
    } else {
      heartRate = value.getUint8(1);
    }

    onHeartRateDataReceived(heartRate);
  };

  const connectToDevice = async (deviceType) => {
    try {
      const env = detectEnvironment();
      if (!env.bluetoothAPI) {
        throw new Error("Bluetooth API not available");
      }

      let requestOptions;
      if (deviceType === DEVICE_TYPES.BIKE) {
        requestOptions = {
          filters: [{ namePrefix: "iConsole" }],
          optionalServices: [
            BLUETOOTH_SERVICES.FITNESS_MACHINE,
            BLUETOOTH_SERVICES.CYCLING_SPEED_CADENCE,
          ],
        };
      } else {
        requestOptions = {
          filters: [
            { services: [BLUETOOTH_SERVICES.HEART_RATE] },
            { namePrefix: "Polar" },
          ],
        };
      }

      const device = await env.bluetoothAPI.requestDevice(requestOptions);
      const server = await device.gatt.connect();

      if (deviceType === DEVICE_TYPES.BIKE) {
        try {
          const service = await server.getPrimaryService(
            BLUETOOTH_SERVICES.FITNESS_MACHINE
          );
          const characteristics = await service.getCharacteristics();

          for (const characteristic of characteristics) {
            if (characteristic.properties.notify) {
              await characteristic.startNotifications();
              characteristic.addEventListener(
                "characteristicvaluechanged",
                (event) => onBikeDataReceived(event.target.value)
              );
            }
          }
        } catch (e) {
          // Fallback to CSC service if fitness machine service is not available
          const service = await server.getPrimaryService(
            BLUETOOTH_SERVICES.CYCLING_SPEED_CADENCE
          );
          const characteristic = await service.getCharacteristic(
            CHARACTERISTICS.CSC_MEASUREMENT
          );
          await characteristic.startNotifications();
          characteristic.addEventListener(
            "characteristicvaluechanged",
            (event) => onBikeDataReceived(event.target.value)
          );
        }
      } else {
        const service = await server.getPrimaryService(
          BLUETOOTH_SERVICES.HEART_RATE
        );
        const characteristic = await service.getCharacteristic(
          CHARACTERISTICS.HEART_RATE_MEASUREMENT
        );
        await characteristic.startNotifications();
        characteristic.addEventListener(
          "characteristicvaluechanged",
          handleHeartRateData
        );
      }

      setConnectedDevices((prev) => ({
        ...prev,
        [deviceType]: {
          device,
          name: device.name || "Unknown device",
          id: device.id,
        },
      }));

      setConnectionStatus((prev) => ({
        ...prev,
        [deviceType]: true,
      }));

      // Add disconnect listener
      device.addEventListener("gattserverdisconnected", () => {
        setConnectionStatus((prev) => ({
          ...prev,
          [deviceType]: false,
        }));
        setConnectedDevices((prev) => ({
          ...prev,
          [deviceType]: null,
        }));
      });
    } catch (error) {
      console.error(`Failed to connect to ${deviceType}:`, error);
      setConnectionStatus((prev) => ({
        ...prev,
        [deviceType]: false,
      }));
      // Don't throw the error if user cancelled
      if (error.name !== "NotFoundError") {
        throw error;
      }
    }
  };

  const disconnectDevice = async (deviceType) => {
    const deviceInfo = connectedDevices[deviceType];
    if (deviceInfo?.device?.gatt?.connected) {
      await deviceInfo.device.gatt.disconnect();
    }

    setConnectionStatus((prev) => ({
      ...prev,
      [deviceType]: false,
    }));

    setConnectedDevices((prev) => ({
      ...prev,
      [deviceType]: null,
    }));
  };

  return {
    connectedDevices,
    connectionStatus,
    connectToDevice,
    disconnectDevice,
    isBikeConnected: connectionStatus[DEVICE_TYPES.BIKE],
    isHeartRateConnected: connectionStatus[DEVICE_TYPES.HEART_RATE],
  };
};
