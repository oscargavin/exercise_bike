import { useState, useRef, useCallback } from "react";

export const useSessionManager = () => {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [currentSession, setCurrentSession] = useState(null);
  const [previousSessions, setPreviousSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
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

  const endSession = () => {
    if (currentSession) {
      const endedSession = {
        ...currentSession,
        endTime: new Date(),
        data: timeSeriesData,
      };
      setPreviousSessions((prev) => [endedSession, ...prev]);
    }

    setIsSessionActive(false);
    setCurrentSession(null);
    sessionActiveRef.current = false;
  };

  return {
    isSessionActive,
    currentSession,
    previousSessions,
    selectedSession,
    timeSeriesData,
    setSelectedSession,
    updateMetric,
    startNewSession,
    endSession,
  };
};
