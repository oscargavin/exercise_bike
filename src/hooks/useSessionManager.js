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
    power: [],
    heartRate: [],
    resistance: [],
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
        power: [],
        heartRate: [],
        resistance: [],
      },
    };

    setTimeSeriesData({
      speed: [],
      cadence: [],
      power: [],
      heartRate: [],
      resistance: [],
    });

    setIsSessionActive(true);
    setCurrentSession(newSession);
    sessionActiveRef.current = true;
  };

  const endSession = async () => {
    if (!currentSession) return;

    try {
      if (!user?.token) {
        throw new Error("Authentication required");
      }

      const sessionData = {
        startTime: currentSession.startTime.toISOString(),
        endTime: new Date().toISOString(),
        metricsData: timeSeriesData,
      };

      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(sessionData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to save session");
      }

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
      setError("Failed to save session: " + (err.message || "Network error"));
    } finally {
      setIsSessionActive(false);
      setCurrentSession(null);
      sessionActiveRef.current = false;
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
  }, [user, authLoading]); // Add authLoading to dependencies

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
