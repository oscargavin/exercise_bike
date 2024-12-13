import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import _ from 'lodash';

const StatsTracking = ({ sessions }) => {
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

  return (
    <div className="space-y-6">
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
  );
};

export default StatsTracking;