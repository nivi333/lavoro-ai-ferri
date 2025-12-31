import { useState, useEffect, useRef } from 'react';
import { MoreHorizontal, Edit, Trash2, MapPin, Plus, Loader2 } from 'lucide-react';
import useAuth from '@/contexts/AuthContext';
import { locationService, Location } from '@/services/locationService';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { LocationFormSheet } from '@/components/location/LocationFormSheet';
import { toast } from 'sonner';

export default function LocationListPage() {
  const { currentCompany } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    if (currentCompany) {
      fetchLocations();
    }
  }, [currentCompany]);

  const fetchLocations = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const data = await locationService.getLocations();
      setLocations(data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to fetch locations');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const handleAddLocation = () => {
    setEditingLocation(null);
    setSheetVisible(true);
  };

  const handleEditLocation = (location: Location) => {
    setEditingLocation(location);
    setSheetVisible(true);
  };

  const handleDeleteClick = (location: Location) => {
    setLocationToDelete(location);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!locationToDelete) return;

    try {
      setLoading(true);
      await locationService.deleteLocation(locationToDelete.id);
      toast.success('Location deleted successfully');
      fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      toast.error('Failed to delete location');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setLocationToDelete(null);
    }
  };

  const handleSheetClose = () => {
    setSheetVisible(false);
    setEditingLocation(null);
  };

  const handleLocationSaved = () => {
    fetchLocations();
    handleSheetClose();
  };

  if (!currentCompany) {
    return (
      <div className='flex items-center justify-center h-96'>
        <p className='text-muted-foreground'>Please select a company to manage locations.</p>
      </div>
    );
  }

  return (
    <>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <h2 className='text-heading-3 font-heading font-semibold'>Company Locations</h2>
          <Button onClick={handleAddLocation} disabled={currentCompany?.role === 'EMPLOYEE'}>
            <Plus className='mr-2 h-4 w-4' />
            Add Location
          </Button>
        </div>

        {/* Table */}
        {loading ? (
          <div className='flex items-center justify-center h-96'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
          </div>
        ) : locations.length === 0 ? (
          <div className='flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-lg'>
            <MapPin className='h-12 w-12 text-muted-foreground mb-4' />
            <p className='text-lg font-medium mb-2'>No locations found</p>
            <p className='text-sm text-muted-foreground mb-4'>
              Get started by creating your first location
            </p>
            <Button onClick={handleAddLocation}>
              <Plus className='mr-2 h-4 w-4' />
              Add Location
            </Button>
          </div>
        ) : (
          <div className='border rounded-lg'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[300px]'>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className='w-[180px]'>Contact</TableHead>
                  <TableHead className='w-[80px] text-center'>Default</TableHead>
                  <TableHead className='w-[100px] text-center'>Headquarters</TableHead>
                  <TableHead className='w-[100px]'>Status</TableHead>
                  <TableHead className='w-[120px]'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locations.map(location => (
                  <TableRow key={location.id}>
                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold border'>
                          {location.imageUrl ? (
                            <img
                              src={location.imageUrl}
                              alt={location.name}
                              className='w-full h-full rounded-full object-cover'
                            />
                          ) : (
                            <MapPin className='h-5 w-5' />
                          )}
                        </div>
                        <div className='min-w-0 flex-1'>
                          <div className='font-medium truncate'>{location.name}</div>
                          <div className='text-sm text-muted-foreground truncate'>
                            {location.addressLine1}
                            {location.addressLine2 ? `, ${location.addressLine2}` : ''},{' '}
                            {location.city}, {location.state}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{location.locationType}</TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        {location.email && <div className='text-xs'>{location.email}</div>}
                        {location.phone && (
                          <div className='text-xs text-muted-foreground'>{location.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className='text-center'>
                      <Checkbox checked={location.isDefault} disabled />
                    </TableCell>
                    <TableCell className='text-center'>
                      <Checkbox checked={location.isHeadquarters} disabled />
                    </TableCell>
                    <TableCell>
                      <Badge variant={location.isActive ? 'default' : 'secondary'}>
                        {location.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='sm'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => handleEditLocation(location)}
                            disabled={currentCompany?.role === 'EMPLOYEE'}
                          >
                            <Edit className='mr-2 h-4 w-4' />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(location)}
                            disabled={
                              location.isHeadquarters || currentCompany?.role === 'EMPLOYEE'
                            }
                            className='text-destructive'
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
      </div>

      <LocationFormSheet
        visible={sheetVisible}
        onClose={handleSheetClose}
        onSave={handleLocationSaved}
        editingLocation={editingLocation}
        locations={locations}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{locationToDelete?.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
