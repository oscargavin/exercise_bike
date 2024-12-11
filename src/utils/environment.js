export const detectEnvironment = () => {
  const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isBluefy =
    navigator.WebBLE !== undefined ||
    (window.webkit &&
      window.webkit.messageHandlers &&
      window.webkit.messageHandlers.bluetooth !== undefined);
  const hasWebBluetooth = navigator.bluetooth !== undefined;

  return {
    isIOS,
    isBluefy,
    hasWebBluetooth,
    bluetoothAPI: isBluefy
      ? navigator.WebBLE || window.webkit.messageHandlers.bluetooth
      : navigator.bluetooth,
  };
};
