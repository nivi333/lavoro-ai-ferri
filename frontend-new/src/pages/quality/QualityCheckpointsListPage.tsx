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

interface QualityCheckpoint {
  id: string;
  checkpointId: string;
  checkpointType: string;
  checkpointName: string;
  inspectorName: string;
  inspectionDate: string;
  status: string;
  overallScore?: number;
  defectCount: number;
  metricCount: number;
  createdAt: string;
}

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  PASSED: 'success',
  FAILED: 'error',
  PENDING: 'warning',
  IN_PROGRESS: 'info',
};

const QualityCheckpointsListPage = () => {
  const { currentCompany } = useAuth();
  const [checkpoints, setCheckpoints] = useState<QualityCheckpoint[]>([]);
  const {
    sortedData: sortedCheckpoints,
    sortColumn,
    sortDirection,
    handleSort,
  } = useSortableTable({
    data: checkpoints,
    defaultSortColumn: 'inspectionDate',
    defaultSortDirection: 'desc',
  });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    if (currentCompany) {
      fetchCheckpoints();
    }
  }, [currentCompany, searchText, selectedType, selectedStatus]);

  const fetchCheckpoints = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);

      const params: any = {};
      if (searchText) params.search = searchText;
      if (selectedType && selectedType !== 'all') params.checkpointType = selectedType;
      if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;

      const data = await qualityService.getCheckpoints(params);
      setCheckpoints(data);
    } catch (error: any) {
      console.error('Error fetching checkpoints:', error);
      toast.error(error.message || 'Failed to fetch quality checkpoints');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const handleEditCheckpoint = (checkpoint: QualityCheckpoint) => {
    toast.info(`Edit checkpoint ${checkpoint.checkpointId}`);
  };

  const handleDeleteCheckpoint = async (checkpoint: QualityCheckpoint) => {
    try {
      await qualityService.deleteCheckpoint(checkpoint.id);
      toast.success('Quality checkpoint deleted successfully');
      fetchCheckpoints();
    } catch (error: any) {
      console.error('Error deleting checkpoint:', error);
      toast.error(error.message || 'Failed to delete quality checkpoint');
    }
  };

  const handleCreateCheckpoint = () => {
    toast.info('Create checkpoint functionality');
  };

  if (!currentCompany) {
    return (
      <PageContainer>
        <div className='text-center text-muted-foreground'>
          Please select a company to manage quality checkpoints.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Quality Checkpoints</PageTitle>
        <PrimaryButton size='sm' onClick={handleCreateCheckpoint}>
          <Plus className='h-4 w-4 mr-2' />
          Create Checkpoint
        </PrimaryButton>
      </PageHeader>

      {/* Filters */}
      <div className='flex flex-wrap gap-3 mb-6'>
        <SearchInput
          placeholder='Search checkpoints...'
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className='w-[250px]'
        />

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='All Types' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Types</SelectItem>
            <SelectItem value='INCOMING'>Incoming Material</SelectItem>
            <SelectItem value='IN_PROCESS'>In-Process</SelectItem>
            <SelectItem value='FINAL'>Final Product</SelectItem>
            <SelectItem value='RANDOM'>Random Check</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='All Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='PENDING'>Pending</SelectItem>
            <SelectItem value='IN_PROGRESS'>In Progress</SelectItem>
            <SelectItem value='PASSED'>Passed</SelectItem>
            <SelectItem value='FAILED'>Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className='flex items-center justify-center min-h-[300px]'>
          <LoadingSpinner />
        </div>
      ) : checkpoints.length === 0 ? (
        <EmptyState
          message='No quality checkpoints found'
          action={
            <PrimaryButton size='sm' onClick={handleCreateCheckpoint}>
              Create First Checkpoint
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
                <TableHead className='w-[140px]' sortable sortKey='checkpointId'>
                  Checkpoint ID
                </TableHead>
                <TableHead sortable sortKey='checkpointName'>
                  Checkpoint Name
                </TableHead>
                <TableHead className='w-[150px]' sortable sortKey='inspectorName'>
                  Inspector
                </TableHead>
                <TableHead className='w-[140px]' sortable sortKey='inspectionDate'>
                  Inspection Date
                </TableHead>
                <TableHead className='w-[120px]' sortable sortKey='status'>
                  Status
                </TableHead>
                <TableHead className='w-[100px] text-center' sortable sortKey='overallScore'>
                  Score
                </TableHead>
                <TableHead className='w-[100px] text-center' sortable sortKey='defectCount'>
                  Defects
                </TableHead>
                <TableHead className='w-[100px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCheckpoints.map(checkpoint => (
                <TableRow key={checkpoint.id}>
                  <TableCell>
                    <span className='font-semibold'>{checkpoint.checkpointId}</span>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className='font-medium truncate'>{checkpoint.checkpointName}</div>
                      <div className='text-xs text-muted-foreground truncate'>
                        {checkpoint.checkpointType}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='truncate'>{checkpoint.inspectorName}</TableCell>
                  <TableCell>
                    {format(new Date(checkpoint.inspectionDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={STATUS_COLORS[checkpoint.status] || 'default'}>
                      {checkpoint.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className='text-center'>
                    {checkpoint.overallScore !== undefined ? (
                      <span className='font-medium'>{checkpoint.overallScore}%</span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className='text-center'>
                    <StatusBadge variant={checkpoint.defectCount > 0 ? 'error' : 'success'}>
                      {checkpoint.defectCount}
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
                        <DropdownMenuItem onClick={() => handleEditCheckpoint(checkpoint)}>
                          <Edit className='h-4 w-4 mr-2' />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteCheckpoint(checkpoint)}
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

export default QualityCheckpointsListPage;
