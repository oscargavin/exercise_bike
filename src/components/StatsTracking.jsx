import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Sparkles, TrendingUp, ChevronRight, LightbulbIcon, X } from 'lucide-react';
import _ from 'lodash';

const StatsTracking = ({ sessions, userName }) => {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showInsights, setShowInsights] = useState(true);

  // Get session dates for welcome message
  const lastSessionDate = useMemo(() => {
    if (!sessions.length) return null;
    const date = new Date(sessions[sessions.length - 1].startTime || sessions[sessions.length - 1].start_time);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }, [sessions]);

  // Process session data for trend analysis
  const trendData = useMemo(() => {
    if (!sessions.length) return [];

    return sessions.map(session => {
      const data = session.data || session.metrics_data || {};
      const avgSpeed = data.speed?.reduce((sum, point) => sum + point.value, 0) / data.speed?.length || 0;
      const avgPower = data.power?.reduce((sum, point) => sum + point.value, 0) / data.power?.length || 0;
      const avgCadence = data.cadence?.reduce((sum, point) => sum + point.value, 0) / data.cadence?.length || 0;
      const avgCalories = data.calories?.reduce((sum, point) => sum + point.value, 0) / data.calories?.length || 0;

      return {
        date: new Date(session.startTime || session.start_time).toLocaleDateString(),
        speed: avgSpeed,
        power: avgPower,
        cadence: avgCadence,
        calories: avgCalories,
      };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [sessions]);

  // Calculate percentile rankings for the latest session
  const percentileRankings = useMemo(() => {
    if (sessions.length < 2) return null;

    const metrics = ['speed', 'power', 'cadence', 'calories'];
    const rankings = {};

    metrics.forEach(metric => {
      const allValues = sessions.map(session => {
        const data = session.data || session.metrics_data || {};
        return data[metric]?.reduce((sum, point) => sum + point.value, 0) / data[metric]?.length || 0;
      });

      const latestValue = allValues[allValues.length - 1];
      const sortedValues = [...allValues].sort((a, b) => a - b);
      const rank = sortedValues.indexOf(latestValue);
      rankings[metric] = ((rank / (sortedValues.length - 1)) * 100).toFixed(1);
    });

    return rankings;
  }, [sessions]);

  // Calculate progress indicators
  const progressIndicators = useMemo(() => {
    if (sessions.length < 2) return null;
    
    const latestSession = trendData[trendData.length - 1];
    const previousSession = trendData[trendData.length - 2];
    
    return {
      speed: ((latestSession.speed - previousSession.speed) / previousSession.speed * 100).toFixed(1),
      power: ((latestSession.power - previousSession.power) / previousSession.power * 100).toFixed(1),
      cadence: ((latestSession.cadence - previousSession.cadence) / previousSession.cadence * 100).toFixed(1),
      calories: ((latestSession.calories - previousSession.calories) / previousSession.calories * 100).toFixed(1)
    };
  }, [trendData]);

  return (
    <div>
      {/* Collapsible Header */}
      <button
        onClick={() => setShowInsights(!showInsights)}
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

      {/* Collapsible Content */}
      <div
        className={`transition-all duration-300 ease-in-out space-y-8 overflow-hidden ${
          showInsights ? 'opacity-100 max-h-[5000px]' : 'opacity-0 max-h-0'
        }`}
      >
        {/* Welcome Section */}
        {showWelcome && (
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-blue-500/20 relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowWelcome(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-400 hover:text-gray-200"
              aria-label="Dismiss welcome message"
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
                    {Object.entries(progressIndicators).map(([metric, change]) => (
                      <div key={metric} className="bg-gray-800/40 rounded-lg p-4">
                        <div className="text-sm text-gray-400 capitalize mb-1">{metric}</div>
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
                    ))}
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
                    dataKey="cadence"
                    name="Cadence (rpm)"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="power"
                    name="Power (W)"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="calories"
                    name="Calories (kcal)"
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
                  <div className="text-sm text-gray-400">Power Ranking</div>
                  <div className="text-xl font-bold text-white">
                    {percentileRankings.power}%
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
                  <div className="text-sm text-gray-400">Calories Ranking</div>
                  <div className="text-xl font-bold text-white">
                    {percentileRankings.calories}%
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