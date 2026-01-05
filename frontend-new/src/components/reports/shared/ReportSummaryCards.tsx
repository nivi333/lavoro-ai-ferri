import React from 'react';
import { Card } from '@/components/globalComponents';
import { Skeleton } from '@/components/ui/skeleton';

export interface SummaryCardProps {
  title: string;
  value: string | number;
  prefix?: React.ReactNode;
  suffix?: string;
  color?: string; // Hex color for styling value
  subValue?: string; // e.g. growth %
}

interface ReportSummaryCardsProps {
  cards: SummaryCardProps[];
  loading?: boolean;
}

const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({ cards, loading }) => {
  if (!cards || cards.length === 0) return null;

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6'>
      {cards.map((card, index) => (
        <React.Fragment key={index}>
          {loading ? (
            <Card className='p-6'>
              <Skeleton className='h-4 w-24 mb-2' />
              <Skeleton className='h-8 w-16 mb-2' />
              <Skeleton className='h-3 w-12' />
            </Card>
          ) : (
            <Card className='p-6 hover:shadow-secondary transition-shadow'>
              <p className='text-sm text-muted-foreground font-medium mb-1'>{card.title}</p>
              <div
                className='text-2xl font-bold'
                style={card.color ? { color: card.color } : undefined}
              >
                {card.prefix}
                {card.value}
                <span className='text-sm font-normal text-muted-foreground ml-0.5'>
                  {card.suffix}
                </span>
              </div>
              {card.subValue && (
                <p className='text-xs text-muted-foreground mt-1'>{card.subValue}</p>
              )}
            </Card>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ReportSummaryCards;
