import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Sparkles, TrendingUp, ChevronRight, LightbulbIcon, X } from 'lucide-react';
import { calculateSessionStats } from '@/utils/stats';
import { useAuth } from '@/contexts/AuthContext';

const StatsTracking = ({ sessions, userName }) => {
  const { user, updateUser } = useAuth();
  const [showWelcome, setShowWelcome] = useState(true);
  const [showInsights, setShowInsights] = useState(user?.show_insights ?? true);

  const lastSessionDate = useMemo(() => {
    if (!sessions.length) return null;
    const date = new Date(sessions[0].startTime);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }, [sessions]);

  // Process session data for trend analysis
  const trendData = useMemo(() => {
    if (!sessions.length) return [];

    return sessions.map(session => {
      const stats = calculateSessionStats(session.data);
      return {
        date: new Date(session.startTime).toLocaleDateString(),
        speed: stats.avgSpeed,
        resistance: stats.avgResistance,
        cadence: stats.avgCadence,
        heartRate: stats.avgHeartRate
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [sessions]);

  // Calculate percentile rankings for the latest session
  const percentileRankings = useMemo(() => {
    if (sessions.length < 2) return null;

    const metrics = ['speed', 'resistance', 'cadence', 'heartRate'];
    const rankings = {};

    metrics.forEach(metric => {
      const allValues = sessions.map(session => {
        const stats = calculateSessionStats(session.data);
        return stats[`avg${metric.charAt(0).toUpperCase() + metric.slice(1)}`];
      });

      const currentStats = calculateSessionStats(sessions[0].data);
      const currentValue = currentStats[`avg${metric.charAt(0).toUpperCase() + metric.slice(1)}`];
      
      const sortedValues = [...allValues].sort((a, b) => a - b);
      const rank = sortedValues.indexOf(currentValue);
      rankings[metric] = ((rank / (sortedValues.length - 1)) * 100).toFixed(1);
    });

    return rankings;
  }, [sessions]);

  // Calculate progress indicators
  const progressIndicators = useMemo(() => {
    if (sessions.length < 2) return null;
    
    // test
    const latestStats = calculateSessionStats(sessions[0].data);
    const previousStats = calculateSessionStats(sessions[1].data);
    
    const calculateChange = (current, previous) => {
      if (!previous) return 0;
      return ((current - previous) / previous * 100).toFixed(1);
    };
    
    return {
      speed: calculateChange(latestStats.avgSpeed, previousStats.avgSpeed),
      resistance: calculateChange(latestStats.avgResistance, previousStats.avgResistance),
      cadence: calculateChange(latestStats.avgCadence, previousStats.avgCadence),
      heartRate: calculateChange(latestStats.avgHeartRate, previousStats.avgHeartRate)
    };
  }, [sessions]);

  const handleInsightsToggle = () => {
    // Update local state immediately for responsive UI
    setShowInsights(prev => !prev);
    
    // Also update user context immediately
    updateUser({
      ...user,
      show_insights: !showInsights
    });
  
    // Send update to server in background
    fetch('/api/user/preferences', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({
        show_insights: !showInsights
      }),
    }).catch(error => {
      console.error('Failed to update insights preference:', error);
      // Optionally revert the change if the server update fails
      // setShowInsights(prev => !prev);
      // updateUser({
      //   ...user,
      //   show_insights: showInsights
      // });
    });
  };
  return (
    <div>
      {/* Header button remains the same */}
      <button
        onClick={handleInsightsToggle}
        className="w-full flex items-center space-x-2 mb-6 group"
      >
        <div className="flex items-center space-x-2 bg-blue-500/10 rounded-lg px-4 py-2">
          <LightbulbIcon className="w-5 h-5 text-blue-400" />
          <span className="text-lg font-semibold text-white">Insights</span>
          <ChevronRight
            className={`w-5 h-5 text-blue-400 transition-transform duration-200 ${
              showInsights ? 'rotate-90' : ''
            }`}
          />
        </div>
        <div className="h-px bg-blue-500/20 flex-grow" />
      </button>

      <div
        className={`transition-all duration-300 ease-in-out space-y-8 overflow-hidden ${
          showInsights ? 'opacity-100 max-h-[5000px]' : 'opacity-0 max-h-0'
        }`}
      >
        {/* Welcome Section remains the same */}
        {showWelcome && (
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/20 relative">
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-400 hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start space-x-3">
              <Sparkles className="w-8 h-8 text-blue-400 mt-1" />
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  Welcome back{userName ? ` ${userName.split(' ')[0]}` : ''}! 
                </h2>
                <p className="text-gray-400 text-lg">
                  {lastSessionDate ? (
                    <>Your last session was on {lastSessionDate}. Here's how you're progressing:</>
                  ) : (
                    <>Ready to track your fitness journey? Let's get started!</>
                  )}
                </p>
                
                {progressIndicators && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {Object.entries(progressIndicators).map(([metric, change]) => {
                      const getMetricDisplayName = (metricName) => {
                        switch(metricName) {
                          case 'heartRate': return 'Heart Rate';
                          case 'resistance': return 'Resistance';
                          case 'speed': return 'Speed';
                          case 'cadence': return 'Cadence';
                          default: return metricName;
                        }
                      };

                      return (
                        <div key={metric} className="bg-gray-800/40 rounded-lg p-4">
                          <div className="text-sm text-gray-400">
                            {getMetricDisplayName(metric)}
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-lg font-semibold ${
                              parseFloat(change) > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {change > 0 ? '+' : ''}{change}%
                            </span>
                            <TrendingUp className={`w-4 h-4 ${
                              parseFloat(change) > 0 ? 'text-green-400' : 'text-red-400'
                            }`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Trend Analysis Chart */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-lg text-white flex items-center space-x-2">
              <span>📈</span>
              <span>Performance Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    stroke="#4B5563"
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                    stroke="#4B5563"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: '1px solid #374151',
                      borderRadius: '0.5rem'
                    }}
                    labelStyle={{ color: '#9CA3AF' }}
                    itemStyle={{ color: '#F3F4F6' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="speed"
                    name="Speed (km/h)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="resistance"
                    name="Resistance (%)"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="cadence"
                    name="Cadence (rpm)"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="heartRate"
                    name="Heart Rate (bpm)"
                    stroke="#f97316"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Percentile Rankings */}
        {percentileRankings && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg text-white flex items-center space-x-2">
                <span>🏆</span>
                <span>Latest Session Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/70 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Speed Ranking</div>
                  <div className="text-xl font-bold text-white">
                    {percentileRankings.speed}%
                  </div>
                  <div className="text-xs text-gray-500">percentile</div>
                </div>
                <div className="bg-gray-800/70 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Resistance Ranking</div>
                  <div className="text-xl font-bold text-white">
                    {percentileRankings.resistance}%
                  </div>
                  <div className="text-xs text-gray-500">percentile</div>
                </div>
                <div className="bg-gray-800/70 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Cadence Ranking</div>
                  <div className="text-xl font-bold text-white">
                    {percentileRankings.cadence}%
                  </div>
                  <div className="text-xs text-gray-500">percentile</div>
                </div>
                <div className="bg-gray-800/70 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Heart Rate Ranking</div>
                  <div className="text-xl font-bold text-white">
                    {percentileRankings.heartRate}%
                  </div>
                  <div className="text-xs text-gray-500">percentile</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StatsTracking;