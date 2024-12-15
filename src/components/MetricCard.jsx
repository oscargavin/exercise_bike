import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Heart } from 'lucide-react';

const MetricCard = ({ title, emoji, data, color, unit, isLive, isHeartRate = false }) => {
  const latestValue = data[data.length - 1]?.value || 0;
  
  // Helper function to determine heart rate zone color
  const getHeartRateColor = (bpm) => {
    if (bpm < 60) return '#3b82f6'; // Very Light - Blue
    if (bpm < 100) return '#10b981'; // Light - Green
    if (bpm < 140) return '#f59e0b'; // Moderate - Yellow
    if (bpm < 170) return '#f97316'; // Hard - Orange
    return '#ef4444'; // Maximum - Red
  };

  const getHeartRateZone = (bpm) => {
    if (bpm < 60) return 'Rest';
    if (bpm < 100) return 'Light';
    if (bpm < 140) return 'Moderate';
    if (bpm < 170) return 'Hard';
    return 'Maximum';
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white flex items-center space-x-2">
          {isHeartRate ? (
            <Heart className="w-5 h-5 text-red-500" />
          ) : (
            <span>{emoji}</span>
          )}
          <span>{title}</span>
          {isLive && (
            <Badge className="ml-2 border border-gray-700 bg-transparent">
              Live
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center">
          <div className="text-2xl font-bold text-white">
            {latestValue.toFixed(1)}{unit}
          </div>
          {isHeartRate && (
            <span
              className="ml-2 px-2 py-0.5 rounded text-sm"
              style={{ color: getHeartRateColor(latestValue) }}
            >
              {getHeartRateZone(latestValue)}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} isAnimationActive={false}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                stroke="#4B5563"
              />
              <YAxis 
                unit={unit}
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                stroke="#4B5563"
                domain={isHeartRate ? [30, 200] : ['auto', 'auto']}
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
              <Line
                type="monotone"
                dataKey="value"
                stroke={isHeartRate ? "#ef4444" : color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCard;