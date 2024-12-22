export const detectEnvironment = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);

  // More comprehensive Bluefy detection
  const isBluefy =
    // Check for WebBLE API
    typeof navigator.WebBLE !== "undefined" ||
    // Check for webkit message handlers
    window.webkit?.messageHandlers?.bluetooth !== undefined ||
    // Check for Bluefy in user agent
    userAgent.includes("bluefy");

  const hasWebBluetooth =
    typeof navigator.bluetooth !== "undefined" || isBluefy;

  return {
    isIOS,
    isBluefy,
    hasWebBluetooth,
    bluetoothAPI: isBluefy
      ? navigator.WebBLE ||
        window.webkit?.messageHandlers?.bluetooth ||
        navigator.bluetooth
      : navigator.bluetooth,
  };
};
