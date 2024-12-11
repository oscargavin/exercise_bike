export const processBluetoothData = (value) => {
  if (value.byteLength < 21) {
    console.warn("DataView too small:", value.byteLength);
    return null;
  }

  const buffer = new Uint8Array(value.buffer);
  const flags = value.getUint16(0, true);

  let offset = 2;
  const data = {
    speed: value.getUint16(offset, true) * 0.01,
    cadence: 0,
    power: 0,
    calories: 0,
  };
  offset += 2;

  if (flags & 0x02) offset += 2; // Skip average speed

  if (flags & 0x04) {
    data.cadence = value.getUint16(offset, true) * 0.5;
    offset += 2;
  }

  if (flags & 0x08) offset += 2; // Skip average cadence
  if (flags & 0x10) offset += 3; // Skip total distance

  if (flags & 0x40) {
    const rawPower = value.getInt16(offset, true);
    data.power =
      Math.abs(rawPower) > 1000
        ? rawPower / 100
        : Math.abs(rawPower) < 10
        ? rawPower * 100
        : rawPower;
  }

  if (data.power > 0) {
    data.calories = (data.power * 0.86) / 3600;
  }

  // Validate ranges
  return {
    speed: data.speed <= 50 ? data.speed : 0,
    cadence: data.cadence <= 150 ? data.cadence : 0,
    power: data.power <= 1000 ? data.power : 0,
    calories: data.calories <= 20 ? data.calories : 0,
  };
};
