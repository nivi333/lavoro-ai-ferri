import React from 'react';
import { ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';
import { Card } from '@/components/globalComponents';

interface ReportChartProps {
  title?: string;
  children: React.ReactElement;
  loading?: boolean;
  height?: number;
  className?: string;
}

const ReportChart: React.FC<ReportChartProps> = ({
  title,
  children,
  loading = false,
  height = 350,
  className,
}) => {
  return (
    <Card className={className}>
      {title && <h3 className='text-lg font-semibold mb-4'>{title}</h3>}
      <div style={{ width: '100%', height: height }} className='relative'>
        {loading ? (
          <div className='absolute inset-0 flex items-center justify-center bg-background/50 z-10'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        ) : (
          <ResponsiveContainer width='100%' height='100%'>
            {children}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
};

export default ReportChart;
