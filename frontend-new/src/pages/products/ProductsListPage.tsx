import { useState, useEffect, useCallback } from 'react';
import { Plus, Filter } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import {
  PageContainer,
  PageHeader,
  PageTitle,
  ActionBar,
  SearchInput,
  PrimaryButton,
  EmptyState,
} from '@/components/globalComponents';
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

import { ProductTable } from '@/components/products/ProductTable';
import { ProductFormSheet } from '@/components/products/ProductFormSheet';
import { StockAdjustmentDialog } from '@/components/products/StockAdjustmentDialog';

import {
  productService,
  ProductSummary,
  ProductCategory,
  ListProductsParams,
} from '@/services/productService';
import useAuth from '@/contexts/AuthContext';

export default function ProductsListPage() {
  const { currentCompany } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Data State
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  // Filter State
  const [searchText, setSearchText] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(
    searchParams.get('category') || 'ALL'
  );
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || 'ALL');

  // UI State
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await productService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    if (!currentCompany) return;

    setLoading(true);
    try {
      const params: ListProductsParams = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchText || undefined,
        categoryId: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        isActive:
          statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      };

      const result = await productService.getProducts(params);
      setProducts(result.data);
      setPagination(result.pagination);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error(error.message || 'Failed to list products');
    } finally {
      setLoading(false);
    }
  }, [
    currentCompany,
    pagination.page,
    pagination.limit,
    searchText,
    selectedCategory,
    statusFilter,
  ]);

  // Initial Load
  useEffect(() => {
    if (currentCompany) {
      fetchCategories();
      fetchProducts();
    }
  }, [currentCompany, fetchCategories, fetchProducts]); // Dependencies causing re-fetch on filter change

  // Listen for search changes with debounce could be added, but manual for now or effect driven
  // The fetchProducts dependency array handles re-fetching when states change.

  const handleSearch = (value: string) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
    // URL params update
    const params = new URLSearchParams(searchParams);
    if (value) params.set('search', value);
    else params.delete('search');
    setSearchParams(params);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setPagination(prev => ({ ...prev, page: 1 }));
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'ALL') params.set('category', value);
    else params.delete('category');
    setSearchParams(params);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPagination(prev => ({ ...prev, page: 1 }));
    const params = new URLSearchParams(searchParams);
    if (value && value !== 'ALL') params.set('status', value);
    else params.delete('status');
    setSearchParams(params);
  };

  // Actions
  const handleCreate = () => {
    setEditingProductId(null);
    setSheetOpen(true);
  };

  const handleEdit = (product: ProductSummary) => {
    setEditingProductId(product.id);
    setSheetOpen(true);
  };

  const handleAdjustStock = (product: ProductSummary) => {
    setSelectedProduct(product);
    setStockDialogOpen(true);
  };

  const handleDeleteClick = (product: ProductSummary) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;
    try {
      await productService.deleteProduct(selectedProduct.id);
      toast.success('Product deleted successfully');
      setDeleteDialogOpen(false);
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleSheetSaved = () => {
    fetchProducts();
  };

  const handleStockAdjusted = () => {
    fetchProducts();
  };

  if (!currentCompany) {
    return (
      <PageContainer>
        <EmptyState message='Please select a company to view products.' />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <PageTitle>Products</PageTitle>
        <PrimaryButton onClick={handleCreate}>
          <Plus className='mr-2 h-4 w-4' /> Create Product
        </PrimaryButton>
      </PageHeader>

      <ActionBar>
        <div className='flex-1 max-w-md'>
          <SearchInput
            placeholder='Search products...'
            value={searchText}
            onChange={e => handleSearch(e.target.value)}
            onClear={() => handleSearch('')}
          />
        </div>
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className='w-[180px]'>
            <div className='flex items-center gap-2 text-muted-foreground'>
              <Filter className='h-4 w-4' />
              <SelectValue placeholder='Category' />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={handleStatusChange}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>All Status</SelectItem>
            <SelectItem value='active'>Active</SelectItem>
            <SelectItem value='inactive'>Inactive</SelectItem>
          </SelectContent>
        </Select>
      </ActionBar>

      {/* Product Table */}
      <div className='rounded-md border bg-card'>
        <ProductTable
          products={products}
          categories={categories}
          loading={loading}
          onEdit={handleEdit}
          onAdjustStock={handleAdjustStock}
          onDelete={handleDeleteClick}
          userRole={currentCompany.role}
        />
      </div>

      {/* Pagination - Simple implementation for now, can be extracted to component */}
      {!loading && products.length > 0 && (
        <div className='flex items-center justify-end space-x-2 py-4'>
          <div className='flex-1 text-sm text-muted-foreground'>
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className='space-x-2'>
            <button
              className='px-3 py-1 border rounded-md text-sm disabled:opacity-50 hover:bg-muted'
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
            >
              Previous
            </button>
            <button
              className='px-3 py-1 border rounded-md text-sm disabled:opacity-50 hover:bg-muted'
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Sheets and Dialogs */}
      <ProductFormSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSaved={handleSheetSaved}
        mode={editingProductId ? 'edit' : 'create'}
      />

      <StockAdjustmentDialog
        open={stockDialogOpen}
        onClose={() => setStockDialogOpen(false)}
        onAdjusted={handleStockAdjusted}
        product={selectedProduct}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product "
              {selectedProduct?.name}" and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
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
