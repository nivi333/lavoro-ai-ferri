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

  const handleToggle = (
    _checked: boolean,
    event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>
  ) => {
    // Fallback for browsers that don't support View Transitions
    if (!document.startViewTransition) {
      toggle();
      return;
    }

    let x = 0;
    let y = 0;

    // Check if it's a mouse event with coordinates
    if ('clientX' in event) {
      x = (event as React.MouseEvent).clientX;
      y = (event as React.MouseEvent).clientY;
    } else {
      // For keyboard events, start from the center of the switch
      const rect = (event.target as HTMLElement).getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      // We must update the DOM immediately for the snapshot to be correct.
      // Since React's toggle relies on useTheme's useEffect which is async,
      // we manually update the class on the document element here.
      const root = document.documentElement;
      const nextTheme = theme === 'light' ? 'dark' : 'light';

      root.setAttribute('data-theme', nextTheme);
      if (nextTheme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      // Also trigger the React state update so uniformity is maintained
      toggle();
    });

    transition.ready.then(() => {
      const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];

      document.documentElement.animate(
        {
          clipPath: theme === 'dark' ? [...clipPath].reverse() : clipPath,
        },
        {
          duration: 500,
          easing: 'ease-in-out',
          pseudoElement:
            theme === 'dark' ? '::view-transition-old(root)' : '::view-transition-new(root)',
        }
      );
    });
  };

  return (
    <div className={`theme-toggle ${className}`}>
      <Switch
        checked={theme === 'dark'}
        onChange={handleToggle}
        checkedChildren={<MoonOutlined />}
        unCheckedChildren={<SunOutlined />}
        className='theme-toggle-switch'
      />
    </div>
  );
};
