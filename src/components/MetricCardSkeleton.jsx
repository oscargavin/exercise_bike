import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Skeleton from '@/components/ui/skeleton';

const MetricCardSkeleton = () => {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Skeleton className="h-6 w-6" />
          <Skeleton className="h-6 w-24" />
        </CardTitle>
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <Skeleton className="h-full w-full" />
        </div>
      </CardContent>
    </Card>
  );
};

export default MetricCardSkeleton;