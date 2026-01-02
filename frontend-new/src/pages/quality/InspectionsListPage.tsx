import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MoreVertical, Eye, Edit, Trash2, Plus } from 'lucide-react';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  ActionBar,
  Card,
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
import { inspectionService, Inspection } from '@/services/inspectionService';
import useAuth from '@/contexts/AuthContext';
import { format } from 'date-fns';

type InspectionType = 'INCOMING_MATERIAL' | 'IN_PROCESS' | 'FINAL_PRODUCT' | 'RANDOM_CHECK';
type InspectionStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'CONDITIONAL';

const TYPE_COLORS: Record<InspectionType, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  INCOMING_MATERIAL: 'info',
  IN_PROCESS: 'warning',
  FINAL_PRODUCT: 'success',
  RANDOM_CHECK: 'default',
};

const STATUS_COLORS: Record<
  InspectionStatus,
  'default' | 'success' | 'warning' | 'error' | 'info'
> = {
  PENDING: 'default',
  IN_PROGRESS: 'info',
  PASSED: 'success',
  FAILED: 'error',
  CONDITIONAL: 'warning',
};

const TYPE_LABELS: Record<InspectionType, string> = {
  INCOMING_MATERIAL: 'Incoming Material',
  IN_PROCESS: 'In Process',
  FINAL_PRODUCT: 'Final Product',
  RANDOM_CHECK: 'Random Check',
};

const InspectionsListPage = () => {
  const navigate = useNavigate();
  const { currentCompany } = useAuth();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedReferenceType, setSelectedReferenceType] = useState<string>('');
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    if (currentCompany) {
      fetchInspections();
    }
  }, [currentCompany, searchText, selectedType, selectedStatus, selectedReferenceType]);

  const fetchInspections = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);

      const filters: any = {};
      if (searchText) filters.search = searchText;
      if (selectedType) filters.inspectionType = selectedType;
      if (selectedStatus) filters.status = selectedStatus;
      if (selectedReferenceType) filters.referenceType = selectedReferenceType;

      const data = await inspectionService.getInspections(filters);
      setInspections(data);
    } catch (error: any) {
      console.error('Error fetching inspections:', error);
      toast.error(error.message || 'Failed to fetch inspections');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const handleViewInspection = (inspection: Inspection) => {
    navigate(`/inspections/${inspection.id}`);
  };

  const handleEditInspection = (inspection: Inspection) => {
    toast.info(`Edit inspection ${inspection.inspectionNumber}`);
  };

  const handleDeleteInspection = async (inspection: Inspection) => {
    try {
      await inspectionService.deleteInspection(inspection.id);
      toast.success('Inspection deleted successfully');
      fetchInspections();
    } catch (error: any) {
      console.error('Error deleting inspection:', error);
      toast.error(error.message || 'Failed to delete inspection');
    }
  };

  const handleCreateInspection = () => {
    toast.info('Create inspection functionality');
  };

  if (!currentCompany) {
    return (
      <PageContainer>
        <div className='text-center text-muted-foreground'>
          Please select a company to manage quality inspections.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Quality Inspections</PageTitle>
        <PrimaryButton size='sm' onClick={handleCreateInspection}>
          <Plus className='h-4 w-4 mr-2' />
          Create Inspection
        </PrimaryButton>
      </PageHeader>

      {/* Filters */}
      <ActionBar>
        <div className='flex-1 max-w-md'>
          <SearchInput
            placeholder='Search by code or reference...'
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            onClear={() => setSearchText('')}
          />
        </div>

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Inspection Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Types</SelectItem>
            <SelectItem value='INCOMING_MATERIAL'>Incoming Material</SelectItem>
            <SelectItem value='IN_PROCESS'>In Process</SelectItem>
            <SelectItem value='FINAL_PRODUCT'>Final Product</SelectItem>
            <SelectItem value='RANDOM_CHECK'>Random Check</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='PENDING'>Pending</SelectItem>
            <SelectItem value='IN_PROGRESS'>In Progress</SelectItem>
            <SelectItem value='PASSED'>Passed</SelectItem>
            <SelectItem value='FAILED'>Failed</SelectItem>
            <SelectItem value='CONDITIONAL'>Conditional</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedReferenceType} onValueChange={setSelectedReferenceType}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='Reference Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All References</SelectItem>
            <SelectItem value='PRODUCT'>Product</SelectItem>
            <SelectItem value='ORDER'>Order</SelectItem>
            <SelectItem value='BATCH'>Batch</SelectItem>
          </SelectContent>
        </Select>
      </ActionBar>

      {/* Table */}
      {loading ? (
        <div className='flex items-center justify-center min-h-[300px]'>
          <LoadingSpinner />
        </div>
      ) : inspections.length === 0 ? (
        <EmptyState
          message='No inspections found'
          action={
            <PrimaryButton size='sm' onClick={handleCreateInspection}>
              Create First Inspection
            </PrimaryButton>
          }
        />
      ) : (
        <Card>
          <DataTable>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[80px]'>Code</TableHead>
                <TableHead className='w-[120px]'>Type</TableHead>
                <TableHead className='w-[120px]'>Reference</TableHead>
                <TableHead className='w-[120px]'>Status</TableHead>
                <TableHead className='w-[120px]'>Quality Score</TableHead>
                <TableHead className='w-[150px]'>Inspector</TableHead>
                <TableHead className='w-[150px]'>Inspection Date</TableHead>
                <TableHead className='w-[120px]'>Next Schedule</TableHead>
                <TableHead className='w-[80px]'>Active</TableHead>
                <TableHead className='w-[100px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inspections.map(inspection => {
                const inspectorName =
                  inspection.inspectorName ||
                  (inspection.inspector
                    ? `${inspection.inspector.firstName} ${inspection.inspector.lastName}`
                    : '-');
                const inspectionDate = inspection.inspectionDate || inspection.scheduledDate;

                return (
                  <TableRow key={inspection.id}>
                    <TableCell>
                      <span className='font-semibold text-xs'>{inspection.inspectionNumber}</span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant={TYPE_COLORS[inspection.inspectionType]}>
                        {TYPE_LABELS[inspection.inspectionType]}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <span
                        className='text-sm font-medium truncate block'
                        title={`${inspection.referenceType}: ${inspection.referenceId}`}
                      >
                        {inspection.referenceType}: {inspection.referenceId}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant={STATUS_COLORS[inspection.status]}>
                        {inspection.status.replace('_', ' ')}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      {inspection.qualityScore !== undefined && inspection.qualityScore !== null
                        ? `${Number(inspection.qualityScore).toFixed(1)}%`
                        : '-'}
                    </TableCell>
                    <TableCell>{inspectorName}</TableCell>
                    <TableCell>
                      {inspectionDate ? format(new Date(inspectionDate), 'dd MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {inspection.nextInspectionDate
                        ? format(new Date(inspection.nextInspectionDate), 'dd MMM yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge variant={inspection.isActive ? 'success' : 'error'}>
                        {inspection.isActive ? 'Active' : 'Inactive'}
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
                          <DropdownMenuItem onClick={() => handleViewInspection(inspection)}>
                            <Eye className='h-4 w-4 mr-2' />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditInspection(inspection)}>
                            <Edit className='h-4 w-4 mr-2' />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteInspection(inspection)}
                            className='text-destructive'
                          >
                            <Trash2 className='h-4 w-4 mr-2' />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </DataTable>
        </Card>
      )}
    </PageContainer>
  );
};

export default InspectionsListPage;
