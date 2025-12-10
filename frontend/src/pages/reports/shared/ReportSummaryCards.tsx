import React from 'react';
import { Card, Row, Col } from 'antd';

export interface SummaryCardProps {
  title: string;
  value: string | number;
  prefix?: React.ReactNode;
  suffix?: string;
  color?: string;
  subValue?: string; // e.g. growth %
}

interface ReportSummaryCardsProps {
  cards: SummaryCardProps[];
  loading?: boolean;
}

const ReportSummaryCards: React.FC<ReportSummaryCardsProps> = ({ cards, loading }) => {
  if (!cards || cards.length === 0) return null;

  // Determine column span based on number of cards to fit nicely
  const getColSpan = (count: number) => {
    if (count <= 3) return { xs: 24, sm: 12, md: 8 };
    if (count === 4) return { xs: 24, sm: 12, md: 6 };
    return { xs: 24, sm: 12, md: 8, lg: 6, xl: 4 }; // 5 or more cards
  };

  const colSpan = getColSpan(cards.length);

  return (
    <div className='report-summary-section'>
      <Row gutter={[16, 16]}>
        {cards.map((card, index) => (
          <Col {...colSpan} key={index}>
            <Card className='summary-card' loading={loading}>
              <div className='summary-title'>{card.title}</div>
              <div
                className='summary-value'
                style={{
                  color: card.color,
                  fontSize:
                    typeof card.value === 'string' && card.value.length > 10 ? '16px' : undefined,
                }}
              >
                {card.prefix}
                {card.value}
                {card.suffix}
              </div>
              {card.subValue && (
                <div className='summary-sub-value' style={{ fontSize: '12px', marginTop: '4px' }}>
                  {card.subValue}
                </div>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ReportSummaryCards;
