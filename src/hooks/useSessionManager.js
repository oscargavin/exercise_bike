// src/hooks/useSessionManager.js
import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export const useSessionManager = () => {
  const { user } = useAuth();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [previousSessions, setPreviousSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const sessionActiveRef = useRef(false);

  // Ensure all arrays are initialized
  const [timeSeriesData, setTimeSeriesData] = useState(() => ({
    speed: [],
    cadence: [],
    power: [],
    heartRate: [],
  }));

  const updateMetric = useCallback((metric, value) => {
    if (!sessionActiveRef.current) return;

    setTimeSeriesData((prev) => {
      // Ensure the metric exists in the previous state
      const prevMetricData = prev[metric] || [];

      return {
        ...prev,
        [metric]: [
          ...prevMetricData,
          {
            time: new Date().toLocaleTimeString(),
            value: Number(value) || 0,
          },
        ].slice(-100), // Keep only last 100 data points for performance
      };
    });
  }, []);

  const startNewSession = () => {
    const newSession = {
      id: Date.now(),
      startTime: new Date(),
      data: {
        speed: [],
        cadence: [],
        resistance: [], // Add resistance array
        heartRate: [],
      },
    };

    setTimeSeriesData({
      speed: [],
      cadence: [],
      resistance: [],
      heartRate: [],
    });

    setIsSessionActive(true);
    setCurrentSession(newSession);
    sessionActiveRef.current = true;
  };

  const endSession = async () => {
    if (!currentSession) return;

    try {
      if (!user?.token) {
        console.error("No auth token available");
        throw new Error("Authentication required");
      }

      const formattedMetricsData = {
        speed: timeSeriesData.speed || [],
        cadence: timeSeriesData.cadence || [],
        resistance: timeSeriesData.resistance || [], // Add resistance data
        heartRate: timeSeriesData.heartRate || [],
      };

      const stats = {
        avgHeartRate: calculateAverage(formattedMetricsData.heartRate),
        maxHeartRate: calculateMax(formattedMetricsData.heartRate),
        minHeartRate: calculateMin(formattedMetricsData.heartRate),
        avgResistance: calculateAverage(formattedMetricsData.resistance), // Add resistance stats
        maxResistance: calculateMax(formattedMetricsData.resistance),
      };

      const sessionData = {
        startTime: currentSession.startTime.toISOString(),
        endTime: new Date().toISOString(),
        metricsData: formattedMetricsData,
        stats: {
          ...stats,
          avgSpeed:
            formattedMetricsData.speed.length > 0
              ? formattedMetricsData.speed.reduce(
                  (sum, point) => sum + point.value,
                  0
                ) / formattedMetricsData.speed.length
              : 0,
          avgPower:
            formattedMetricsData.power.length > 0
              ? formattedMetricsData.power.reduce(
                  (sum, point) => sum + point.value,
                  0
                ) / formattedMetricsData.power.length
              : 0,
          avgCadence:
            formattedMetricsData.cadence.length > 0
              ? formattedMetricsData.cadence.reduce(
                  (sum, point) => sum + point.value,
                  0
                ) / formattedMetricsData.cadence.length
              : 0,
        },
      };

      console.log(
        "Sending session data:",
        JSON.stringify(sessionData, null, 2)
      );

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(sessionData),
      });

      const responseData = await response.json();
      console.log("Server response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to save session");
      }

      // Update previous sessions with the new session
      setPreviousSessions((prev) => [
        {
          ...currentSession,
          endTime: new Date(),
          data: formattedMetricsData,
          stats: sessionData.stats,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error("Error saving session:", err);
      setError("Failed to save session: " + (err.message || "Network error"));
    } finally {
      setIsSessionActive(false);
      setCurrentSession(null);
      sessionActiveRef.current = false;
    }
  };

  // Helper functions for statistics
  const calculateAverage = (data) => {
    if (!Array.isArray(data) || data.length === 0) return 0;
    const sum = data.reduce((acc, point) => acc + (point.value || 0), 0);
    return sum / data.length;
  };

  const calculateMax = (data) => {
    if (!Array.isArray(data) || data.length === 0) return 0;
    return Math.max(...data.map((point) => point.value || 0));
  };

  const calculateMin = (data) => {
    if (!Array.isArray(data) || data.length === 0) return 0;
    return Math.min(...data.map((point) => point.value || 0));
  };

  // Load previous sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.token) return;

      try {
        setIsLoading(true);
        const response = await fetch("/api/sessions", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch sessions");
        }

        const data = await response.json();
        setPreviousSessions(data.sessions || []);
      } catch (err) {
        console.error("Error fetching sessions:", err);
        setError("Failed to load sessions");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  return {
    isSessionActive,
    currentSession,
    previousSessions,
    selectedSession,
    timeSeriesData,
    isLoading,
    error,
    setSelectedSession,
    updateMetric,
    startNewSession,
    endSession,
  };
};
