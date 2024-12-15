import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Heart } from 'lucide-react';
import { calculateMetricStats, getHeartRateZone } from '@/utils/stats';

const MetricCard = ({
  title,
  emoji,
  data = [],
  color,
  unit,
  isLive,
  isHeartRate = false,
  isResistance = false
}) => {
  const safeData = Array.isArray(data) ? data : [];
  const latestValue = safeData.length > 0 ? (safeData[safeData.length - 1]?.value || 0) : 0;
  
  const stats = useMemo(() => calculateMetricStats(safeData), [safeData]);
  const heartRateInfo = isHeartRate ? getHeartRateZone(latestValue) : null;

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
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-white">
            {isResistance ? latestValue.toFixed(0) : latestValue.toFixed(1)}
            {unit}
          </div>
          {isHeartRate && (
            <span
              className="ml-2 px-2 py-0.5 rounded text-sm"
              style={{ color: heartRateInfo.color }}
            >
              {heartRateInfo.zone}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={safeData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12, fill: '#9CA3AF' }}
                stroke="#4B5563"
              />
              <YAxis
                domain={isHeartRate ? [30, 200] : isResistance ? [0, 100] : ['auto', 'auto']}
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