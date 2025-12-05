import React from 'react';
import { Breadcrumb } from 'antd';
import { useNavigate } from 'react-router-dom';
import './PageBreadcrumb.scss';

export interface BreadcrumbItem {
  title: string;
  path?: string;
  icon?: React.ReactNode;
}

interface PageBreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const PageBreadcrumb: React.FC<PageBreadcrumbProps> = ({ items, className }) => {
  const navigate = useNavigate();

  const breadcrumbItems = items.map((item, index) => {
    const isLast = index === items.length - 1;

    return {
      title:
        item.path && !isLast ? (
          <a onClick={() => navigate(item.path!)} className='breadcrumb-link'>
            {item.icon && <span className='breadcrumb-icon'>{item.icon}</span>}
            {item.title}
          </a>
        ) : (
          <span className='breadcrumb-current'>
            {item.icon && <span className='breadcrumb-icon'>{item.icon}</span>}
            {item.title}
          </span>
        ),
    };
  });

  return <Breadcrumb items={breadcrumbItems} className={`page-breadcrumb ${className || ''}`} />;
};
