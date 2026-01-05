import { DateRange } from 'react-day-picker';
import { FileText, Save } from 'lucide-react';
import {
  PrimaryButton,
  OutlinedButton,
  SearchInput,
  ActionBar,
} from '@/components/globalComponents';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';

interface ReportFiltersProps {
  dateRange?: DateRange | undefined;
  setDateRange?: (date: DateRange | undefined) => void;
  singleDate?: Date | undefined;
  setSingleDate?: (date: Date | undefined) => void;
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
    <ActionBar className='justify-between flex-wrap gap-4'>
      <div className='flex items-center gap-4 flex-wrap'>
        {dateMode === 'range' && setDateRange && (
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        )}

        {dateMode === 'single' && setSingleDate && (
          <DatePicker date={singleDate} setDate={setSingleDate} placeholder='As of Date' />
        )}

        {showPeriodSelect && setPeriod && (
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className='w-[120px] bg-white'>
              <SelectValue placeholder='Period' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='week'>Weekly</SelectItem>
              <SelectItem value='month'>Monthly</SelectItem>
              <SelectItem value='quarter'>Quarterly</SelectItem>
              <SelectItem value='year'>Yearly</SelectItem>
            </SelectContent>
          </Select>
        )}

        <SearchInput
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          onClear={() => setSearchText('')}
          placeholder={searchPlaceholder}
          className='w-[250px] bg-white'
        />
      </div>

      <div className='flex items-center gap-2'>
        <OutlinedButton variant='whiteBg'>
          <Save className='mr-2 h-4 w-4' />
          Save Configuration
        </OutlinedButton>
        <OutlinedButton variant='whiteBg'>
          <FileText className='mr-2 h-4 w-4' />
          PDF
        </OutlinedButton>
        <PrimaryButton onClick={onGenerate} loading={loading}>
          Generate Report
        </PrimaryButton>
      </div>
    </ActionBar>
  );
};

export default ReportFilters;
