import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { MoreVertical, Edit, Trash2, Plus } from 'lucide-react';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  StatusBadge,
  DataTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  PrimaryButton,
  EmptyState,
  SearchInput,
  LoadingSpinner,
} from '@/components/globalComponents';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { qualityService } from '@/services/qualityService';
import useAuth from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useSortableTable } from '@/hooks/useSortableTable';

interface QualityDefect {
  id: string;
  defectId: string;
  defectCategory: string;
  defectType: string;
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR' | 'COSMETIC';
  quantity: number;
  description?: string;
  detectedDate: string;
  status: string;
  resolvedDate?: string;
  resolvedBy?: string;
}

const SEVERITY_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  CRITICAL: 'error',
  MAJOR: 'warning',
  MINOR: 'info',
  COSMETIC: 'default',
};

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  OPEN: 'error',
  IN_PROGRESS: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
};

const QualityDefectsListPage = () => {
  const { currentCompany } = useAuth();
  const [defects, setDefects] = useState<QualityDefect[]>([]);
  const {
    sortedData: sortedDefects,
    sortColumn,
    sortDirection,
    handleSort,
  } = useSortableTable({
    data: defects,
    defaultSortColumn: 'detectedDate',
    defaultSortDirection: 'desc',
  });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    if (currentCompany) {
      fetchDefects();
    }
  }, [currentCompany, searchText, selectedSeverity, selectedCategory, selectedStatus]);

  const fetchDefects = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);

      const params: any = {};
      if (searchText) params.search = searchText;
      if (selectedSeverity && selectedSeverity !== 'all') params.severity = selectedSeverity;
      if (selectedCategory && selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;

      const data = await qualityService.getDefects(params);
      setDefects(data);
    } catch (error: any) {
      console.error('Error fetching defects:', error);
      toast.error(error.message || 'Failed to fetch quality defects');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const handleEditDefect = (defect: QualityDefect) => {
    toast.info(`Edit defect ${defect.defectId}`);
  };

  const handleDeleteDefect = async (defect: QualityDefect) => {
    try {
      await qualityService.deleteDefect(defect.id);
      toast.success('Quality defect deleted successfully');
      fetchDefects();
    } catch (error: any) {
      console.error('Error deleting defect:', error);
      toast.error(error.message || 'Failed to delete quality defect');
    }
  };

  const handleCreateDefect = () => {
    toast.info('Create defect functionality');
  };

  if (!currentCompany) {
    return (
      <PageContainer>
        <div className='text-center text-muted-foreground'>
          Please select a company to manage quality defects.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Quality Defects</PageTitle>
        <PrimaryButton size='sm' onClick={handleCreateDefect}>
          <Plus className='h-4 w-4 mr-2' />
          Create Defect
        </PrimaryButton>
      </PageHeader>

      {/* Filters */}
      <div className='flex flex-wrap gap-3 mb-6'>
        <SearchInput
          placeholder='Search defects...'
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className='w-[250px]'
        />

        <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='Severity' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Severity</SelectItem>
            <SelectItem value='CRITICAL'>Critical</SelectItem>
            <SelectItem value='MAJOR'>Major</SelectItem>
            <SelectItem value='MINOR'>Minor</SelectItem>
            <SelectItem value='COSMETIC'>Cosmetic</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Category' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Categories</SelectItem>
            <SelectItem value='DIMENSIONAL'>Dimensional</SelectItem>
            <SelectItem value='VISUAL'>Visual</SelectItem>
            <SelectItem value='FUNCTIONAL'>Functional</SelectItem>
            <SelectItem value='MATERIAL'>Material</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='OPEN'>Open</SelectItem>
            <SelectItem value='IN_PROGRESS'>In Progress</SelectItem>
            <SelectItem value='RESOLVED'>Resolved</SelectItem>
            <SelectItem value='CLOSED'>Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className='flex items-center justify-center min-h-[300px]'>
          <LoadingSpinner />
        </div>
      ) : defects.length === 0 ? (
        <EmptyState
          message='No quality defects found'
          action={
            <PrimaryButton size='sm' onClick={handleCreateDefect}>
              Create First Defect
            </PrimaryButton>
          }
        />
      ) : (
        <div className='rounded-base border bg-card'>
          <DataTable
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
            className='border-none'
          >
            <TableHeader>
              <TableRow>
                <TableHead className='w-[120px]' sortable sortKey='defectId'>
                  Defect ID
                </TableHead>
                <TableHead className='w-[150px]' sortable sortKey='defectCategory'>
                  Category
                </TableHead>
                <TableHead className='w-[120px]' sortable sortKey='severity'>
                  Severity
                </TableHead>
                <TableHead sortable sortKey='description'>
                  Description
                </TableHead>
                <TableHead className='w-[100px] text-center' sortable sortKey='quantity'>
                  Quantity
                </TableHead>
                <TableHead className='w-[140px]' sortable sortKey='detectedDate'>
                  Detected Date
                </TableHead>
                <TableHead className='w-[120px]' sortable sortKey='status'>
                  Status
                </TableHead>
                <TableHead className='w-[100px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedDefects.map(defect => (
                <TableRow key={defect.id}>
                  <TableCell>
                    <span className='font-semibold'>{defect.defectId}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className='font-medium'>{defect.defectCategory}</div>
                      <div className='text-xs text-muted-foreground'>{defect.defectType}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={SEVERITY_COLORS[defect.severity]}>
                      {defect.severity}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className='truncate max-w-[300px]'>
                    {defect.description || '-'}
                  </TableCell>
                  <TableCell className='text-center font-medium'>{defect.quantity}</TableCell>
                  <TableCell>{format(new Date(defect.detectedDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>
                    <StatusBadge variant={STATUS_COLORS[defect.status] || 'default'}>
                      {defect.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='sm'>
                          <MoreVertical className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => handleEditDefect(defect)}>
                          <Edit className='h-4 w-4 mr-2' />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteDefect(defect)}
                          className='text-destructive'
                        >
                          <Trash2 className='h-4 w-4 mr-2' />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </DataTable>
        </div>
      )}
    </PageContainer>
  );
};

export default QualityDefectsListPage;
