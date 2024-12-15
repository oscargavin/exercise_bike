// src/utils/dataProcessing.js

export const processBikeData = (value) => {
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

  // Validate ranges
  return {
    speed: data.speed <= 50 ? data.speed : 0,
    cadence: data.cadence <= 150 ? data.cadence : 0,
    power: data.power <= 1000 ? data.power : 0,
  };
};

export const processHeartRateData = (dataView) => {
  const flags = dataView.getUint8(0);
  const rate16Bits = flags & 0x1;

  // Heart rate is in the second byte if the flag is not set
  // or in the second and third bytes if the flag is set
  let heartRate;
  if (rate16Bits) {
    heartRate = dataView.getUint16(1, true);
  } else {
    heartRate = dataView.getUint8(1);
  }

  // Validate range (typical heart rate range: 30-220 bpm)
  return heartRate >= 30 && heartRate <= 220 ? heartRate : 0;
};

export const calculateSessionStats = (sessionData) => {
  const stats = {
    avgSpeed: 0,
    avgCadence: 0,
    avgPower: 0,
    avgHeartRate: 0,
    maxSpeed: 0,
    maxCadence: 0,
    maxPower: 0,
    maxHeartRate: 0,
    duration: 0,
  };

  if (!sessionData) return stats;

  // Calculate averages and maximums for each metric
  Object.entries(sessionData).forEach(([metric, data]) => {
    if (Array.isArray(data) && data.length > 0) {
      const values = data.map((point) => point.value);
      stats[`avg${metric.charAt(0).toUpperCase() + metric.slice(1)}`] =
        values.reduce((a, b) => a + b, 0) / values.length;
      stats[`max${metric.charAt(0).toUpperCase() + metric.slice(1)}`] =
        Math.max(...values);
    }
  });

  // Calculate session duration if start and end times exist
  if (sessionData.startTime && sessionData.endTime) {
    stats.duration =
      new Date(sessionData.endTime) - new Date(sessionData.startTime);
  }

  return stats;
};
