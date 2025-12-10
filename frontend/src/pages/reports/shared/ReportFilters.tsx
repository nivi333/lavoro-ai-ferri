import React from 'react';
import { DatePicker, Input, Button, Space, Select } from 'antd';
import { SearchOutlined, FileTextOutlined, SaveOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';

import './ReportStyles.scss';

const { RangePicker } = DatePicker;

interface ReportFiltersProps {
  dateRange?: [Dayjs, Dayjs] | null;
  setDateRange?: (dates: [Dayjs, Dayjs] | null) => void;
  singleDate?: Dayjs | null;
  setSingleDate?: (date: Dayjs | null) => void;
  dateMode?: 'range' | 'single';
  searchText: string;
  setSearchText: (text: string) => void;
  onGenerate: () => void;
  loading: boolean;
  showPeriodSelect?: boolean;
  period?: string;
  setPeriod?: (period: string) => void;
  searchPlaceholder?: string;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  dateRange,
  setDateRange,
  singleDate,
  setSingleDate,
  dateMode = 'range',
  searchText,
  setSearchText,
  onGenerate,
  loading,
  showPeriodSelect = false,
  period,
  setPeriod,
  searchPlaceholder = 'Search...',
}) => {
  return (
    <div className='filters-section'>
      <div>
        <Space size='middle'>
          {dateMode === 'range' && setDateRange ? (
            <RangePicker
              value={dateRange}
              onChange={dates => setDateRange(dates as [Dayjs, Dayjs] | null)}
              format='YYYY-MM-DD'
            />
          ) : dateMode === 'single' && setSingleDate ? (
            <DatePicker
              value={singleDate}
              onChange={setSingleDate}
              format='YYYY-MM-DD'
              placeholder='As of Date'
            />
          ) : null}

          {showPeriodSelect && setPeriod && (
            <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
              <Select.Option value='week'>Weekly</Select.Option>
              <Select.Option value='month'>Monthly</Select.Option>
              <Select.Option value='quarter'>Quarterly</Select.Option>
              <Select.Option value='year'>Yearly</Select.Option>
            </Select>
          )}
          <Input
            placeholder={searchPlaceholder}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 200 }}
            allowClear
          />
        </Space>
      </div>
      <div>
        <Space size='middle'>
          <Button icon={<SaveOutlined />}>Save Configuration</Button>
          <Button icon={<FileTextOutlined />}>PDF</Button>
          <Button type='primary' onClick={onGenerate} loading={loading}>
            Generate Report
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default ReportFilters;
