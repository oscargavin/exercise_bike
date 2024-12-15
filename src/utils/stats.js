export const calculateMetricStats = (data = []) => {
  if (!Array.isArray(data) || data.length === 0) {
    return { avg: 0, max: 0, min: 0 };
  }

  const values = data.map((point) => point.value || 0);
  return {
    avg: values.reduce((a, b) => a + b, 0) / values.length,
    max: Math.max(...values),
    min: Math.min(...values),
  };
};

export const calculateSessionStats = (sessionData) => {
  if (!sessionData) return {};

  const stats = {};
  for (const [metric, data] of Object.entries(sessionData)) {
    const metricStats = calculateMetricStats(data);
    stats[`avg${metric.charAt(0).toUpperCase() + metric.slice(1)}`] =
      metricStats.avg;
    stats[`max${metric.charAt(0).toUpperCase() + metric.slice(1)}`] =
      metricStats.max;
    stats[`min${metric.charAt(0).toUpperCase() + metric.slice(1)}`] =
      metricStats.min;
  }

  return stats;
};

export const getHeartRateZone = (bpm) => {
  if (bpm < 60) return { zone: "Rest", color: "#3b82f6" };
  if (bpm < 100) return { zone: "Light", color: "#10b981" };
  if (bpm < 140) return { zone: "Moderate", color: "#f59e0b" };
  if (bpm < 170) return { zone: "Hard", color: "#f97316" };
  return { zone: "Maximum", color: "#ef4444" };
};

export const formatDuration = (startTime, endTime) => {
  const duration = new Date(endTime) - new Date(startTime);
  const minutes = Math.floor(duration / (1000 * 60));
  return `${minutes} min`;
};

export const formatTimeAgo = (date) => {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now - then) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return then.toLocaleDateString();
};
