import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  PageContainer,
  PageHeader,
  PageTitle,
  ActionBar,
  SearchInput,
  Select,
  PrimaryButton,
} from '@/components/globalComponents';
import { SupplierTable } from '@/components/purchase/SupplierTable';
import { SupplierFormSheet } from '@/components/purchase/SupplierFormSheet';
import { supplierService, Supplier, SupplierFilters } from '@/services/supplierService';
import { toast } from 'sonner';
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

export default function SupplierListPage() {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<SupplierFilters>({});

  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isDeleting, setIsDeleting] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const { suppliers: data } = await supplierService.getSuppliers({
        ...filters,
        search: searchQuery,
      });
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast.error('Failed to fetch suppliers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [filters, searchQuery]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedSuppliers = [...suppliers].sort((a: any, b: any) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (!aValue && !bValue) return 0;
    if (!aValue) return 1;
    if (!bValue) return -1;

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleCreate = () => {
    setEditingSupplier(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsSheetOpen(true);
  };

  const handleDelete = (supplier: Supplier) => {
    setIsDeleting(supplier);
  };

  const confirmDelete = async () => {
    if (!isDeleting) return;

    try {
      await supplierService.deleteSupplier(isDeleting.id);
      toast.success('Supplier deleted successfully');
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      toast.error('Failed to delete supplier');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (editingSupplier) {
        await supplierService.updateSupplier(editingSupplier.id, data);
        toast.success('Supplier updated successfully');
      } else {
        await supplierService.createSupplier(data);
        toast.success('Supplier created successfully');
      }
      setIsSheetOpen(false);
      fetchSuppliers();
    } catch (error) {
      console.error('Error saving supplier:', error);
      toast.error('Failed to save supplier');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreatePO = (supplier: Supplier) => {
    navigate(`/purchase/orders?action=create&supplierId=${supplier.id}&supplierName=${encodeURIComponent(supplier.name)}`);
  };

  const handleViewPOs = (supplier: Supplier) => {
    navigate(`/purchase/orders?supplierId=${supplier.id}&supplierName=${encodeURIComponent(supplier.name)}`);
  };

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Suppliers</PageTitle>
        <PrimaryButton onClick={handleCreate}>
          <Plus className='mr-2 h-4 w-4' /> Add Supplier
        </PrimaryButton>
      </PageHeader>

      <ActionBar>
        <SearchInput
          placeholder='Search name, code, email, phone...'
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='w-64'
        />
        <Select
          value={filters.supplierType || 'ALL'}
          onChange={value =>
            setFilters(prev => ({ ...prev, supplierType: value === 'ALL' ? undefined : value }))
          }
          options={[
            { label: 'All Types', value: 'ALL' },
            { label: 'Manufacturer', value: 'MANUFACTURER' },
            { label: 'Distributor', value: 'DISTRIBUTOR' },
            { label: 'Wholesaler', value: 'WHOLESALER' },
            { label: 'Importer', value: 'IMPORTER' },
            { label: 'Local Vendor', value: 'LOCAL_VENDOR' },
          ]}
          className='w-40'
        />
        <Select
          value={filters.supplierCategory || 'ALL'}
          onChange={value =>
            setFilters(prev => ({ ...prev, supplierCategory: value === 'ALL' ? undefined : value }))
          }
          options={[
            { label: 'All Categories', value: 'ALL' },
            { label: 'Preferred', value: 'PREFERRED' },
            { label: 'Approved', value: 'APPROVED' },
            { label: 'Trial', value: 'TRIAL' },
            { label: 'Blacklisted', value: 'BLACKLISTED' },
          ]}
          className='w-40'
        />
        <Select
          value={filters.isActive === undefined ? 'ALL' : filters.isActive.toString()}
          onChange={value =>
            setFilters(prev => ({
              ...prev,
              isActive: value === 'ALL' ? undefined : value === 'true',
            }))
          }
          options={[
            { label: 'All Status', value: 'ALL' },
            { label: 'Active', value: 'true' },
            { label: 'Inactive', value: 'false' },
          ]}
          className='w-32'
        />
      </ActionBar>

      <SupplierTable
        suppliers={sortedSuppliers}
        loading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreatePO={handleCreatePO}
        onViewPOs={handleViewPOs}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={handleSort}
      />

      <SupplierFormSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingSupplier}
        isSubmitting={isSubmitting}
      />

      <AlertDialog open={!!isDeleting} onOpenChange={open => !open && setIsDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the supplier
              <span className='font-medium text-foreground'> {isDeleting?.name} </span>
              and remove their data from our servers.
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
    </PageContainer>
  );
}
