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

  const [timeSeriesData, setTimeSeriesData] = useState({
    speed: [],
    cadence: [],
    power: [],
    calories: [],
  });

  const updateMetric = useCallback((metric, value) => {
    if (!sessionActiveRef.current) return;
    setTimeSeriesData((prev) => ({
      ...prev,
      [metric]: [
        ...prev[metric],
        {
          time: new Date().toLocaleTimeString(),
          value,
        },
      ],
    }));
  }, []);

  const startNewSession = () => {
    console.log("Starting new session");
    // Clear selected session when starting a new one
    setSelectedSession(null);

    const newSession = {
      id: Date.now(),
      startTime: new Date(),
      data: {
        speed: [],
        cadence: [],
        power: [],
        calories: [],
      },
    };

    setTimeSeriesData({
      speed: [],
      cadence: [],
      power: [],
      calories: [],
    });

    setIsSessionActive(true);
    setCurrentSession(newSession);
    sessionActiveRef.current = true;
  };

  const endSession = async () => {
    if (currentSession) {
      console.log("Current session data at end:", {
        currentSession,
        timeSeriesData,
      });

      const endedSession = {
        ...currentSession,
        endTime: new Date(),
        data: timeSeriesData,
      };

      try {
        if (!user?.token) {
          console.error("No auth token available");
          throw new Error("Authentication required");
        }

        const sessionData = {
          startTime: endedSession.startTime,
          endTime: endedSession.endTime,
          metricsData: endedSession.data,
        };

        console.log("Sending session data:", sessionData);

        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
          body: JSON.stringify(sessionData),
        });

        console.log("Save session response status:", response.status);

        const responseData = await response.json();
        console.log("Save session response:", responseData);

        if (!response.ok) {
          throw new Error(responseData.message || "Failed to save session");
        }

        setPreviousSessions((prev) => [endedSession, ...prev]);
      } catch (err) {
        console.error("Error saving session:", err);
        setError("Failed to save session: " + err.message);
      }
    }

    setIsSessionActive(false);
    setCurrentSession(null);
    sessionActiveRef.current = false;
  };

  // Load previous sessions when component mounts
  useEffect(() => {
    const fetchSessions = async () => {
      if (!user?.token) {
        console.log("No auth token available, skipping session fetch");
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch("/api/sessions", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        console.log("Fetch sessions response status:", response.status);

        if (!response.ok) {
          throw new Error("Failed to fetch sessions");
        }

        const data = await response.json();
        console.log("Fetched sessions:", data);
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
