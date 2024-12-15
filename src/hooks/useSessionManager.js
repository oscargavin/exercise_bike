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
    console.log("Starting new session");
    setSelectedSession(null);

    const newSession = {
      id: Date.now(),
      startTime: new Date(),
      data: {
        speed: [],
        cadence: [],
        power: [],
        heartRate: [],
      },
    };

    // Reset all metrics to empty arrays
    setTimeSeriesData({
      speed: [],
      cadence: [],
      power: [],
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

      // Calculate statistics before ending session
      const stats = {
        avgHeartRate: calculateAverage(timeSeriesData.heartRate),
        maxHeartRate: calculateMax(timeSeriesData.heartRate),
        minHeartRate: calculateMin(timeSeriesData.heartRate),
      };

      const sessionData = {
        startTime: currentSession.startTime,
        endTime: new Date(),
        metricsData: timeSeriesData,
        ...stats,
      };

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to save session");
      }

      setPreviousSessions((prev) => [
        {
          ...currentSession,
          endTime: new Date(),
          data: timeSeriesData,
          ...stats,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error("Error saving session:", err);
      setError("Failed to save session: " + err.message);
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
