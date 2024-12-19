import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";

export const useSessionManager = () => {
  const { user, loading: authLoading } = useAuth();
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [previousSessions, setPreviousSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const sessionActiveRef = useRef(false);

  const [timeSeriesData, setTimeSeriesData] = useState(() => ({
    speed: [],
    cadence: [],
    resistance: [],
    heartRate: [],
  }));

  const updateMetric = useCallback((metric, value) => {
    if (!sessionActiveRef.current) return;

    setTimeSeriesData((prev) => {
      const prevMetricData = prev[metric] || [];
      return {
        ...prev,
        [metric]: [
          ...prevMetricData,
          {
            time: new Date().toLocaleTimeString(),
            value: Number(value) || 0,
          },
        ], // Keep all data points for complete data collection
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
        resistance: [],
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

    // Immediately stop data collection
    setIsSessionActive(false);
    sessionActiveRef.current = false;

    try {
      if (!user?.token) {
        throw new Error("Authentication required");
      }

      console.log("Current timeSeriesData:", timeSeriesData);

      // Transform time series data into arrays of just values
      const speedData = timeSeriesData.speed.map((d) => Math.round(d.value));
      const cadenceData = timeSeriesData.cadence.map((d) =>
        Math.round(d.value)
      );
      const resistanceData = timeSeriesData.resistance.map((d) =>
        Math.round(d.value)
      );
      const heartRateData = timeSeriesData.heartRate.map((d) =>
        Math.round(d.value)
      );

      const exerciseTime = Math.round(
        (new Date() - new Date(currentSession.startTime)) / 1000
      );

      const sessionData = {
        speedData,
        cadenceData,
        resistanceData,
        heartRateData,
        exerciseTime,
        startedAt: currentSession.startTime.toISOString(),
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
        throw new Error("Failed to save session");
      }

      // Update previous sessions
      setPreviousSessions((prev) => [
        {
          ...currentSession,
          endTime: new Date(),
          data: timeSeriesData,
        },
        ...prev,
      ]);
    } catch (err) {
      console.error("Error saving session:", err);
      setError("Failed to save session: " + err.message);
    } finally {
      // Clean up session state
      setCurrentSession(null);
      setTimeSeriesData({
        speed: [],
        cadence: [],
        resistance: [],
        heartRate: [],
      });
    }
  };

  // Load previous sessions
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.token || authLoading) return;

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
  }, [user, authLoading]);

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