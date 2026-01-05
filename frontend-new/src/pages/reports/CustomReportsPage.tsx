import React from 'react';
import { PageContainer, PageHeader, EmptyState } from '@/components/globalComponents';
import { FileText } from 'lucide-react';

const CustomReportsPage = () => {
  return (
    <PageContainer>
      <PageHeader>
        <div className='flex flex-col gap-1'>
          <h2 className='text-2xl font-bold tracking-tight'>Custom Reports</h2>
          <p className='text-muted-foreground'>Build and save your own custom reports.</p>
        </div>
      </PageHeader>

      <EmptyState
        icon={<FileText className='h-12 w-12' />}
        message='Custom Reports Coming Soon'
        action={
          <div className='text-muted-foreground text-sm mt-2'>
            This feature is under development. You will be able to create custom reports based on
            specific metrics and data points.
          </div>
        }
      />
    </PageContainer>
  );
};

export default CustomReportsPage;
