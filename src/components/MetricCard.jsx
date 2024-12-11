// src/components/MetricCard.jsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MetricCard = ({ title, emoji, data, color, unit, isLive }) => {
  const latestValue = data[data.length - 1]?.value || 0;

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white flex items-center space-x-2">
          <span>{emoji}</span>
          <span>{title}</span>
          {isLive && (
            <Badge className="ml-2 border border-gray-700 bg-transparent">
              Live
            </Badge>
          )}
        </CardTitle>
        <div className="text-2xl font-bold text-white">
          {latestValue.toFixed(1)}{unit}
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
                stroke={color}
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