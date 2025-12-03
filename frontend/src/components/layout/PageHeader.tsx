import React from 'react';
import { Typography, Space } from 'antd';

const { Title, Text } = Typography;

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  extra?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, extra }) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start',
      marginBottom: 24,
    }}>
      <div>
        <Title level={3} style={{ margin: 0 }}>{title}</Title>
        {subtitle && (
          <Text type="secondary" style={{ marginTop: 4, display: 'block' }}>
            {subtitle}
          </Text>
        )}
      </div>
      {extra && <Space>{extra}</Space>}
    </div>
  );
};

export default PageHeader;
