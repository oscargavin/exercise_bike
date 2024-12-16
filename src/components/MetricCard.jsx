import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Heart, Maximize2, Minimize2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { getHeartRateZone } from '@/utils/stats';
import { cn } from '@/lib/utils';

const ExpandedView = ({ children, onClose, isClosing }) => {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return createPortal(
    <div 
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "transition-all duration-300 ease-in-out",
        isClosing 
          ? "bg-black/0 backdrop-blur-none" 
          : "bg-black/50 backdrop-blur-sm"
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className={cn(
        "w-full max-w-4xl transition-all duration-300 ease-in-out transform",
        isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
      )}>
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
  const [displayState, setDisplayState] = useState('normal'); // 'normal', 'expanding', 'expanded', 'closing'
  const [shouldRenderExpandedView, setShouldRenderExpandedView] = useState(false);

  useEffect(() => {
    let timeout;
    if (displayState === 'expanding') {
      setShouldRenderExpandedView(true);
      timeout = setTimeout(() => {
        setDisplayState('expanded');
      }, 50); // Small delay to ensure mounting is complete
    } else if (displayState === 'closing') {
      timeout = setTimeout(() => {
        setShouldRenderExpandedView(false);
        setDisplayState('normal');
      }, 300);
    }
    return () => clearTimeout(timeout);
  }, [displayState]);

  const handleExpand = () => {
    setDisplayState('expanding');
  };

  const handleClose = () => {
    setDisplayState('closing');
  };

  const renderCard = (isExpandedView = false) => (
    <Card className={cn(
      "transition-all duration-300 ease-in-out transform",
      {
        'h-[80vh] bg-gray-800/90 border-gray-700': isExpandedView,
        'h-auto bg-gray-800/50 border-gray-700': !isExpandedView,
        'scale-95 opacity-0': displayState === 'closing' && isExpandedView,
        'scale-100 opacity-100': displayState === 'expanded' && isExpandedView,
        'scale-95': displayState === 'expanding' && !isExpandedView,
      }
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
            onClick={isExpandedView ? handleClose : handleExpand}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
          >
            {isExpandedView ? (
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
          "transition-all duration-300 ease-in-out",
          isExpandedView ? "h-[calc(80vh-10rem)]" : "h-48",
          displayState === 'closing' && isExpandedView ? "opacity-0" : "opacity-100"
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

  return (
    <>
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        shouldRenderExpandedView && "opacity-0 scale-95"
      )}>
        {renderCard(false)}
      </div>
      
      {shouldRenderExpandedView && (
        <ExpandedView 
          onClose={handleClose} 
          isClosing={displayState === 'closing'}
        >
          {renderCard(true)}
        </ExpandedView>
      )}
    </>
  );
};

export default MetricCard;