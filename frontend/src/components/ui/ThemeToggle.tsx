import React from 'react';
import { Switch } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTheme } from '../../contexts/ThemeContext';
import './ThemeToggle.scss';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggle } = useTheme();

  return (
    <div className={`theme-toggle ${className}`}>
      <Switch
        checked={theme === 'dark'}
        onChange={toggle}
        checkedChildren={<MoonOutlined />}
        unCheckedChildren={<SunOutlined />}
        className='theme-toggle-switch'
      />
    </div>
  );
};
