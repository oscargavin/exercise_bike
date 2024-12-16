import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Heart, Maximize2, Minimize2, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { getHeartRateZone } from '@/utils/stats';
import { cn } from '@/lib/utils';

const ExpandedView = ({ children, onClose }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        // Only close if clicking the backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-4xl animate-in fade-in zoom-in duration-300">
        {children}
      </div>
    </div>,
    document.body
  );
};

const MetricChart = ({ 
  data, 
  color, 
  unit, 
  isHeartRate, 
  isResistance 
}) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart
      data={data}
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
);

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
  const [isExpanded, setIsExpanded] = useState(false);
  const safeData = Array.isArray(data) ? data : [];
  const latestValue = safeData.length > 0 ? (safeData[safeData.length - 1]?.value || 0) : 0;
  const heartRateInfo = isHeartRate ? getHeartRateZone(latestValue) : null;

  const renderCard = (expanded = false) => (
    <Card className={cn(
      "transition-all duration-300",
      expanded 
        ? "h-[80vh] bg-gray-800/75 border-gray-700" 
        : "h-auto bg-gray-800/50 border-gray-700"
    )}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
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
          <button
            onClick={() => setIsExpanded(!expanded)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
          >
            {expanded ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>
        </div>
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
        <div className={cn(
          "transition-all duration-300",
          expanded ? "h-[calc(80vh-10rem)]" : "h-48"
        )}>
          <MetricChart 
            data={safeData}
            color={color}
            unit={unit}
            isHeartRate={isHeartRate}
            isResistance={isResistance}
          />
        </div>
      </CardContent>
    </Card>
  );

  if (isExpanded) {
    return (
      <ExpandedView onClose={() => setIsExpanded(false)}>
        {renderCard(true)}
      </ExpandedView>
    );
  }

  return renderCard(false);
};

export default MetricCard;