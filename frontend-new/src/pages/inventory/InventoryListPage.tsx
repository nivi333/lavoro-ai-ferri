import { useState, useEffect } from 'react';
import { Plus, Search, Filter, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
// import { Badge } from '@/components/ui/badge'; // Used in table, not here yet
import { toast } from 'sonner';

import MainLayout from '@/components/layout/MainLayout';
import { InventoryTable } from '@/components/inventory/InventoryTable';
import { InventoryFormSheet } from '@/components/inventory/InventoryFormSheet';
import { StockMovementDialog } from '@/components/inventory/StockMovementDialog';
// import { StockReservationDialog } from '@/components/inventory/StockReservationDialog';

import { inventoryService, LocationInventory, InventoryFilters } from '@/services/inventoryService';
import { locationService } from '@/services/locationService';
import { productService } from '@/services/productService'; // For product filter if needed
import useAuth from '@/contexts/AuthContext';

export default function InventoryListPage() {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<LocationInventory[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]); // For filters

  // Filters
  const [searchText, setSearchText] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  // Sheet/Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMovementOpen, setIsMovementOpen] = useState(false);
  // const [isReservationOpen, setIsReservationOpen] = useState(false); // Unused for now, maybe for future
  const [selectedRecord, setSelectedRecord] = useState<LocationInventory | null>(null);

  const { currentCompany } = useAuth();

  useEffect(() => {
    if (currentCompany?.id) {
      fetchLocations();
      fetchProducts();
    }
  }, [currentCompany?.id]);

  useEffect(() => {
    if (currentCompany?.id) {
      fetchInventory();
    }
  }, [currentCompany?.id, searchText, selectedLocation, selectedProduct]);

  const fetchLocations = async () => {
    try {
      const response = await locationService.getLocations();
      setLocations(response || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const filters: InventoryFilters = {
        search: searchText || undefined,
        locationId: selectedLocation !== 'all' ? selectedLocation : undefined,
        productId: selectedProduct !== 'all' ? selectedProduct : undefined,
      };

      const response = await inventoryService.getLocationInventory(filters);
      if (response.success) {
        setInventory(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchInventory();
  };

  const handleAddInventory = () => {
    setSelectedRecord(null);
    setIsFormOpen(true);
  };

  const handleEdit = (record: LocationInventory) => {
    // Inventory edit is often just stock adjustment or specific field edit.
    // The old frontend used InventoryFormDrawer for adding, but maybe for editing too?
    // Let's open the form with data populated if we update FormSheet to handle edits.
    // For now, let's assume Add/Edit uses same form.
    // I need to update InventoryFormSheet to accept initial data if I want edit support.
    // The previous implementation used it for "Add Inventory". Editing inventory usually implies adjustments.
    // But let's support opening it.
    // Wait, the previous code had `handleEditInventory`.
    setSelectedRecord(record);
    setIsFormOpen(true);
  };

  const handleRecordMovement = (record: LocationInventory) => {
    setSelectedRecord(record);
    setIsMovementOpen(true);
  };

  const handleViewHistory = (_record: LocationInventory) => {
    toast.info('Stock history feature coming soon');
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedLocation('all');
    setSelectedProduct('all');
  };

  return (
    <MainLayout>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Inventory</h1>
            <p className='text-muted-foreground'>Manage stock levels across all locations</p>
          </div>
          <Button onClick={handleAddInventory}>
            <Plus className='mr-2 h-4 w-4' /> Add Inventory
          </Button>
        </div>

        <Separator />

        {/* Filters */}
        <div className='flex flex-col sm:flex-row gap-4 items-end sm:items-center flex-wrap'>
          <div className='flex items-center gap-2 w-full sm:w-auto'>
            <div className='relative w-full sm:w-64'>
              <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Search products...'
                className='pl-8'
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
              />
            </div>
          </div>

          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className='w-full sm:w-48'>
              <SelectValue placeholder='All Locations' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Locations</SelectItem>
              {locations.map(loc => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className='w-full sm:w-48'>
              <SelectValue placeholder='All Products' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Products</SelectItem>
              {products.map(prod => (
                <SelectItem key={prod.id} value={prod.id}>
                  {prod.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className='flex items-center gap-2 ml-auto'>
            <Button variant='outline' size='icon' onClick={handleRefresh} title='Refresh'>
              <RefreshCcw className='h-4 w-4' />
            </Button>
            <Button
              variant='outline'
              onClick={clearFilters}
              disabled={!searchText && selectedLocation === 'all' && selectedProduct === 'all'}
            >
              <Filter className='mr-2 h-4 w-4' /> Clear
            </Button>
          </div>
        </div>

        {/* Table */}
        <InventoryTable
          data={inventory}
          loading={loading}
          onEdit={handleEdit}
          onRecordMovement={handleRecordMovement}
          onViewHistory={handleViewHistory}
          onRefresh={handleRefresh}
        />

        {/* Form Sheet */}
        <InventoryFormSheet
          open={isFormOpen}
          onClose={() => {
            setIsFormOpen(false);
            setSelectedRecord(null);
          }}
          onSaved={handleRefresh}
        />

        {/* Movement Dialog */}
        <StockMovementDialog
          open={isMovementOpen}
          onClose={() => {
            setIsMovementOpen(false);
            setSelectedRecord(null);
          }}
          onSuccess={handleRefresh}
          initialProductId={selectedRecord?.productId}
          initialLocationId={selectedRecord?.locationId}
        />

        {/* Reservation Dialog - Not integrated in list/actions yet, but available */}
        {/* <StockReservationDialog ... /> */}
      </div>
    </MainLayout>
  );
}
