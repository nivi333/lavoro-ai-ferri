import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  BarChart,
  DollarSign,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react';
import { PageContainer, PageHeader, PageTitle, Card } from '@/components/globalComponents';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface ReportCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  reportCount: number;
}

const ReportsListPage: React.FC = () => {
  const categories: ReportCategory[] = [
    {
      id: 'financial',
      name: 'Financial Reports',
      description: 'Profit & Loss, Balance Sheet, and Cash Flow statements',
      icon: <DollarSign className='h-8 w-8 text-primary' />,
      path: '/reports/financial',
      reportCount: 3,
    },
    {
      id: 'sales',
      name: 'Sales Reports',
      description: 'Revenue analysis, customer insights, and sales trends',
      icon: <ShoppingCart className='h-8 w-8 text-[#722ed1]' />,
      path: '/reports/sales',
      reportCount: 3,
    },
    {
      id: 'inventory',
      name: 'Inventory Reports',
      description: 'Stock levels, valuation, and movement analysis',
      icon: <ShoppingBag className='h-8 w-8 text-[#1890ff]' />,
      path: '/reports/inventory',
      reportCount: 3,
    },
    {
      id: 'analytics',
      name: 'Analytics Dashboard',
      description: 'Business performance metrics and KPIs',
      icon: <BarChart className='h-8 w-8 text-[#2f54eb]' />,
      path: '/reports/analytics',
      reportCount: 2,
    },
  ];

  return (
    <PageContainer>
      <PageHeader>
        <div className='flex flex-col gap-1'>
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href='/'>Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Reports</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <PageTitle className='mt-2'>Reports</PageTitle>
          <p className='text-muted-foreground'>
            Access and generate reports across different business areas. Select a category to view
            available reports.
          </p>
        </div>
      </PageHeader>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
        {categories.map(category => (
          <Link to={category.path} key={category.id} className='block group'>
            <Card className='h-full hover:shadow-secondary transition-all hover:scale-[1.02] flex flex-col cursor-pointer'>
              <div className='mb-4 bg-muted/30 w-14 h-14 rounded-full flex items-center justify-center'>
                {category.icon}
              </div>
              <h3 className='font-semibold text-lg mb-2 group-hover:text-primary transition-colors'>
                {category.name}
              </h3>
              <p className='text-sm text-muted-foreground mb-4 flex-grow'>{category.description}</p>
              <div className='flex items-center gap-2 mt-auto pt-4 border-t border-border/50'>
                <FileText className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm font-medium'>{category.reportCount} reports</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </PageContainer>
  );
};

export default ReportsListPage;
