import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { MoreVertical, Eye, Edit, Trash2, Plus } from 'lucide-react';
import {
  PageContainer,
  PageHeader,
  PageTitle,
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
import { qualityService } from '@/services/qualityService';
import useAuth from '@/contexts/AuthContext';
import { format } from 'date-fns';

import { useSortableTable } from '@/hooks/useSortableTable';

interface ComplianceReport {
  id: string;
  reportId: string;
  reportType: string;
  reportDate: string;
  auditorName: string;
  certification?: string;
  status: string;
  findings?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  DRAFT: 'default',
  SUBMITTED: 'info',
  UNDER_REVIEW: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
};

const ComplianceReportsListPage = () => {
  const { currentCompany } = useAuth();
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const {
    sortedData: sortedReports,
    sortColumn,
    sortDirection,
    handleSort,
  } = useSortableTable({
    data: reports,
    defaultSortColumn: 'reportDate',
    defaultSortDirection: 'desc',
  });
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    if (currentCompany) {
      fetchReports();
    }
  }, [currentCompany, searchText, selectedType, selectedStatus]);

  const fetchReports = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);

      const params: any = {};
      if (searchText) params.search = searchText;
      if (selectedType && selectedType !== 'all') params.reportType = selectedType;
      if (selectedStatus && selectedStatus !== 'all') params.status = selectedStatus;

      const data = await qualityService.getComplianceReports(params);
      setReports(data);
    } catch (error: any) {
      console.error('Error fetching compliance reports:', error);
      toast.error(error.message || 'Failed to fetch compliance reports');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const handleViewReport = (report: ComplianceReport) => {
    toast.info(`View report ${report.reportId}`);
  };

  const handleEditReport = (report: ComplianceReport) => {
    toast.info(`Edit report ${report.reportId}`);
  };

  const handleDeleteReport = async (report: ComplianceReport) => {
    try {
      await qualityService.deleteComplianceReport(report.id);
      toast.success('Compliance report deleted successfully');
      fetchReports();
    } catch (error: any) {
      console.error('Error deleting report:', error);
      toast.error(error.message || 'Failed to delete compliance report');
    }
  };

  const handleCreateReport = () => {
    toast.info('Create compliance report functionality');
  };

  if (!currentCompany) {
    return (
      <PageContainer>
        <div className='text-center text-muted-foreground'>
          Please select a company to manage compliance reports.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Compliance Reports</PageTitle>
        <PrimaryButton size='sm' onClick={handleCreateReport}>
          <Plus className='h-4 w-4 mr-2' />
          Create Report
        </PrimaryButton>
      </PageHeader>

      {/* Filters */}
      <div className='flex flex-wrap gap-3 mb-6'>
        <SearchInput
          placeholder='Search reports...'
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className='w-[250px]'
        />

        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Report Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Types</SelectItem>
            <SelectItem value='ISO_9001'>ISO 9001</SelectItem>
            <SelectItem value='ISO_14001'>ISO 14001</SelectItem>
            <SelectItem value='OEKO_TEX'>OEKO-TEX</SelectItem>
            <SelectItem value='GOTS'>GOTS</SelectItem>
            <SelectItem value='INTERNAL'>Internal Audit</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='DRAFT'>Draft</SelectItem>
            <SelectItem value='SUBMITTED'>Submitted</SelectItem>
            <SelectItem value='UNDER_REVIEW'>Under Review</SelectItem>
            <SelectItem value='APPROVED'>Approved</SelectItem>
            <SelectItem value='REJECTED'>Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {loading ? (
        <div className='flex items-center justify-center min-h-[300px]'>
          <LoadingSpinner />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          message='No compliance reports found'
          action={
            <PrimaryButton size='sm' onClick={handleCreateReport}>
              Create First Report
            </PrimaryButton>
          }
        />
      ) : (
        <Card>
          <DataTable sortColumn={sortColumn} sortDirection={sortDirection} onSort={handleSort}>
            <TableHeader>
              <TableRow>
                <TableHead className='w-[120px]' sortable sortKey='reportId'>
                  Report ID
                </TableHead>
                <TableHead className='w-[150px]' sortable sortKey='reportType'>
                  Report Type
                </TableHead>
                <TableHead className='w-[150px]' sortable sortKey='auditorName'>
                  Auditor
                </TableHead>
                <TableHead className='w-[140px]' sortable sortKey='reportDate'>
                  Report Date
                </TableHead>
                <TableHead className='w-[150px]' sortable sortKey='certification'>
                  Certification
                </TableHead>
                <TableHead className='w-[120px]' sortable sortKey='status'>
                  Status
                </TableHead>
                <TableHead sortable sortKey='findings'>
                  Findings
                </TableHead>
                <TableHead className='w-[100px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReports.map(report => (
                <TableRow key={report.id}>
                  <TableCell>
                    <span className='font-semibold'>{report.reportId}</span>
                  </TableCell>
                  <TableCell>{report.reportType}</TableCell>
                  <TableCell>{report.auditorName}</TableCell>
                  <TableCell>{format(new Date(report.reportDate), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>{report.certification || '-'}</TableCell>
                  <TableCell>
                    <StatusBadge variant={STATUS_COLORS[report.status] || 'default'}>
                      {report.status.replace('_', ' ')}
                    </StatusBadge>
                  </TableCell>
                  <TableCell className='truncate max-w-[200px]'>{report.findings || '-'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='sm'>
                          <MoreVertical className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem onClick={() => handleViewReport(report)}>
                          <Eye className='h-4 w-4 mr-2' />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditReport(report)}>
                          <Edit className='h-4 w-4 mr-2' />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteReport(report)}
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
        </Card>
      )}
    </PageContainer>
  );
};

export default ComplianceReportsListPage;
