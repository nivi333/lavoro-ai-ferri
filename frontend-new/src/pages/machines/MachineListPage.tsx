import { useEffect, useState, useRef } from 'react';
import {
  Cog,
  Edit,
  Trash2,
  Calendar,
  AlertTriangle,
  History,
  UserPlus,
  MoreVertical,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import useAuth from '@/contexts/AuthContext';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  SearchInput,
  PrimaryButton,
  LoadingSpinner,
  EmptyState,
} from '@/components/globalComponents';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  machineService,
  Machine,
  MachineStatus,
  OperationalStatus,
} from '@/services/machineService';
import { locationService, Location } from '@/services/locationService';
import { MachineFormSheet } from '@/components/machines/MachineFormSheet';
import { MachineHistoryDialog } from '@/components/machines/MachineHistoryDialog';
import { BreakdownReportSheet } from '@/components/machines/BreakdownReportSheet';
import { MaintenanceScheduleSheet } from '@/components/machines/MaintenanceScheduleSheet';
import { AssignOperatorSheet } from '@/components/machines/AssignOperatorSheet';

export default function MachineListPage() {
  const { currentCompany } = useAuth();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingMachineId, setEditingMachineId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [machineToDelete, setMachineToDelete] = useState<Machine | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string | undefined>(undefined);

  // New feature dialogs/sheets
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [breakdownSheetOpen, setBreakdownSheetOpen] = useState(false);
  const [maintenanceSheetOpen, setMaintenanceSheetOpen] = useState(false);
  const [assignOperatorSheetOpen, setAssignOperatorSheetOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const fetchInProgressRef = useRef(false);

  const isEmployee = currentCompany?.role === 'EMPLOYEE';

  useEffect(() => {
    if (currentCompany) {
      fetchData();
    }
  }, [currentCompany, searchText, selectedLocation, statusFilter]);

  const fetchData = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const [machinesData, locationsData] = await Promise.all([
        machineService.getMachines({
          search: searchText || undefined,
          locationId: selectedLocation,
          status: statusFilter as MachineStatus,
        }),
        locationService.getLocations(),
      ]);

      setMachines(machinesData.data || []);
      setLocations(locationsData || []);
    } catch (error: any) {
      console.error('Error fetching machines:', error);
      toast.error(error.message || 'Failed to fetch machines');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const refreshMachines = async () => {
    try {
      setLoading(true);
      const machinesData = await machineService.getMachines({
        search: searchText || undefined,
        locationId: selectedLocation,
        status: statusFilter as MachineStatus,
      });
      setMachines(machinesData.data || []);
    } catch (error: any) {
      console.error('Error refreshing machines:', error);
      toast.error(error.message || 'Failed to refresh machines');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMachine = () => {
    setEditingMachineId(null);
    setSheetOpen(true);
  };

  const handleEditMachine = (machine: Machine) => {
    setEditingMachineId(machine.id);
    setSheetOpen(true);
  };

  const handleDeleteMachine = (machine: Machine) => {
    setMachineToDelete(machine);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!machineToDelete) return;

    try {
      setLoading(true);
      const result = await machineService.deleteMachine(machineToDelete.id);
      if (result.success) {
        toast.success('Machine deleted successfully');
        refreshMachines();
      } else {
        toast.error(result.message || 'Failed to delete machine');
      }
    } catch (error: any) {
      console.error('Error deleting machine:', error);
      toast.error(error.message || 'Failed to delete machine');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setMachineToDelete(null);
    }
  };

  const handleSheetClose = () => {
    setSheetOpen(false);
    setEditingMachineId(null);
  };

  const handleMachineSaved = () => {
    refreshMachines();
  };

  const getStatusColor = (
    status: MachineStatus
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'NEW':
        return 'default';
      case 'IN_USE':
        return 'secondary';
      case 'UNDER_MAINTENANCE':
        return 'outline';
      case 'UNDER_REPAIR':
        return 'destructive';
      case 'IDLE':
        return 'outline';
      case 'DECOMMISSIONED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getOperationalStatusColor = (
    status: OperationalStatus
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'FREE':
        return 'secondary';
      case 'BUSY':
        return 'outline';
      case 'RESERVED':
        return 'default';
      case 'UNAVAILABLE':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (!currentCompany) {
    return (
      <PageContainer>
        <EmptyState
          icon={<Cog className='h-12 w-12' />}
          message='Please select a company to manage machines.'
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <PageTitle>Machine Management</PageTitle>
        </div>
        <PrimaryButton onClick={handleCreateMachine} disabled={isEmployee}>
          Add Machine
        </PrimaryButton>
      </PageHeader>

      <div className='flex items-center gap-4 mb-6'>
        <SearchInput
          placeholder='Search machines...'
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          className='w-64'
        />
        <Select value={selectedLocation} onValueChange={setSelectedLocation}>
          <SelectTrigger className='w-48'>
            <SelectValue placeholder='All Locations' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Locations</SelectItem>
            {locations.map(location => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-48'>
            <SelectValue placeholder='All Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='NEW'>New</SelectItem>
            <SelectItem value='IN_USE'>In Use</SelectItem>
            <SelectItem value='UNDER_MAINTENANCE'>Under Maintenance</SelectItem>
            <SelectItem value='UNDER_REPAIR'>Under Repair</SelectItem>
            <SelectItem value='IDLE'>Idle</SelectItem>
            <SelectItem value='DECOMMISSIONED'>Decommissioned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <LoadingSpinner />
        </div>
      ) : machines.length === 0 ? (
        <EmptyState
          message='No machines found. Get started by adding your first machine.'
          action={
            <PrimaryButton onClick={handleCreateMachine} disabled={isEmployee}>
              Add First Machine
            </PrimaryButton>
          }
        />
      ) : (
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead>Machine Type</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Warranty Expiry</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Current Operator</TableHead>
                <TableHead>Operational Status</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {machines.map(machine => (
                <TableRow key={machine.id}>
                  <TableCell className='font-mono text-sm'>{machine.machineCode}</TableCell>
                  <TableCell>
                    <div className='flex items-center gap-3'>
                      <Avatar className='h-10 w-10'>
                        <AvatarImage src={machine.imageUrl} alt={machine.name} />
                        <AvatarFallback className='bg-primary text-primary-foreground'>
                          <Cog className='h-5 w-5' />
                        </AvatarFallback>
                      </Avatar>
                      <span className='font-medium'>{machine.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{machine.machineType || '—'}</TableCell>
                  <TableCell>
                    {machine.purchaseDate ? format(new Date(machine.purchaseDate), 'PP') : '—'}
                  </TableCell>
                  <TableCell>
                    {machine.warrantyExpiry ? format(new Date(machine.warrantyExpiry), 'PP') : '—'}
                  </TableCell>
                  <TableCell>{machine.location?.name || '—'}</TableCell>
                  <TableCell>
                    {machine.currentOperator ? (
                      <div
                        className='flex items-center gap-2'
                        title={`Operator: ${machine.currentOperator.firstName} ${machine.currentOperator.lastName}`}
                      >
                        <Avatar className='h-6 w-6'>
                          <AvatarFallback className='text-xs'>
                            {machine.currentOperator.firstName[0]}
                            {machine.currentOperator.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className='text-sm'>{`${machine.currentOperator.firstName} ${machine.currentOperator.lastName}`}</span>
                      </div>
                    ) : (
                      '—'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getOperationalStatusColor(machine.operationalStatus)}>
                      {machine.operationalStatus || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(machine.status)}>
                      {machine.status?.replace('_', ' ') || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='sm'>
                          <MoreVertical className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem
                          onClick={() => handleEditMachine(machine)}
                          disabled={isEmployee}
                        >
                          <Edit className='mr-2 h-4 w-4' />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMachine(machine);
                            setMaintenanceSheetOpen(true);
                          }}
                          disabled={isEmployee}
                        >
                          <Calendar className='mr-2 h-4 w-4' />
                          Schedule Maintenance
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMachine(machine);
                            setBreakdownSheetOpen(true);
                          }}
                        >
                          <AlertTriangle className='mr-2 h-4 w-4' />
                          Report Breakdown
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMachine(machine);
                            setHistoryDialogOpen(true);
                          }}
                        >
                          <History className='mr-2 h-4 w-4' />
                          View History
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMachine(machine);
                            setAssignOperatorSheetOpen(true);
                          }}
                        >
                          <UserPlus className='mr-2 h-4 w-4' />
                          Assign Operator
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteMachine(machine)}
                          className='text-destructive focus:text-destructive'
                          disabled={isEmployee}
                        >
                          <Trash2 className='mr-2 h-4 w-4' />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <MachineFormSheet
        open={sheetOpen}
        onClose={handleSheetClose}
        onSaved={handleMachineSaved}
        mode={editingMachineId ? 'edit' : 'create'}
        editingMachineId={editingMachineId}
        locations={locations}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Machine</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete machine <strong>{machineToDelete?.name}</strong> (
              {machineToDelete?.machineCode})?
              <br />
              <span className='text-destructive text-xs mt-2 block'>
                This will decommission the machine and mark it as inactive. This action cannot be
                undone.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Machine Feature Dialogs/Sheets */}
      <MachineHistoryDialog
        machine={selectedMachine}
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
      />

      <BreakdownReportSheet
        machine={selectedMachine}
        open={breakdownSheetOpen}
        onOpenChange={setBreakdownSheetOpen}
        onSuccess={refreshMachines}
      />

      <MaintenanceScheduleSheet
        machine={selectedMachine}
        open={maintenanceSheetOpen}
        onOpenChange={setMaintenanceSheetOpen}
        onSuccess={refreshMachines}
      />

      <AssignOperatorSheet
        machine={selectedMachine}
        open={assignOperatorSheetOpen}
        onOpenChange={setAssignOperatorSheetOpen}
        onSuccess={refreshMachines}
      />
    </PageContainer>
  );
}
