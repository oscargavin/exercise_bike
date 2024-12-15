// src/utils/sessionStats.js

export const calculateSessionStats = (sessionData) => {
  if (!sessionData) return {};

  const calculateMetricStats = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      return {
        avg: 0,
        max: 0,
        min: 0,
      };
    }

    const values = data.map((point) => point.value || 0);
    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
    };
  };

  const stats = {};

  // Calculate stats for each metric
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

export const calculateTrendStats = (sessions) => {
  if (!sessions.length) return [];

  return sessions
    .map((session) => {
      const stats = calculateSessionStats(session.data);
      return {
        date: new Date(session.startTime).toLocaleDateString(),
        ...stats,
      };
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

export const calculatePercentileRankings = (sessions, currentSession) => {
  if (sessions.length < 2) return null;

  const metrics = ["speed", "power", "cadence", "heartRate", "resistance"];
  const rankings = {};

  metrics.forEach((metric) => {
    const allValues = sessions.map((session) => {
      const stats = calculateSessionStats(session.data);
      return stats[`avg${metric.charAt(0).toUpperCase() + metric.slice(1)}`];
    });

    const currentStats = calculateSessionStats(currentSession.data);
    const currentValue =
      currentStats[`avg${metric.charAt(0).toUpperCase() + metric.slice(1)}`];

    const sortedValues = [...allValues].sort((a, b) => a - b);
    const rank = sortedValues.indexOf(currentValue);
    rankings[metric] = ((rank / (sortedValues.length - 1)) * 100).toFixed(1);
  });

  return rankings;
};
