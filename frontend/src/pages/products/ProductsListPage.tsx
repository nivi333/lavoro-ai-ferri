import { useEffect, useRef, useState } from 'react';
import {
  Table,
  Tag,
  Space,
  Button,
  Dropdown,
  Empty,
  Spin,
  message,
  Input,
  Select,
  Avatar,
} from 'antd';
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  StockOutlined,
  SearchOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import useAuth from '../../contexts/AuthContext';
import { useHeader } from '../../contexts/HeaderContext';
import { MainLayout } from '../../components/layout';
import { Heading } from '../../components/Heading';
import { GradientButton } from '../../components/ui';
import { productService, ProductSummary, ProductCategory } from '../../services/productService';
import { ProductFormDrawer } from '../../components/products/ProductFormDrawer';
import { StockAdjustmentModal } from '../../components/products/StockAdjustmentModal';
import './ProductsListPage.scss';

export default function ProductsListPage() {
  const { currentCompany } = useAuth();
  const { setHeaderActions } = useHeader();
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductSummary | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const fetchInProgressRef = useRef(false);

  useEffect(() => {
    const isEmployee = currentCompany?.role === 'EMPLOYEE';
    setHeaderActions(
      <GradientButton
        onClick={handleCreateProduct}
        size='small'
        className='products-create-btn'
        disabled={isEmployee}
      >
        Create Product
      </GradientButton>
    );

    return () => setHeaderActions(null);
  }, [setHeaderActions, currentCompany?.role]);

  useEffect(() => {
    if (currentCompany) {
      fetchData();
    }
  }, [currentCompany, searchText, selectedCategory, activeFilter, pagination.page]);

  const fetchData = async () => {
    if (fetchInProgressRef.current) return;

    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        productService.getProducts({
          search: searchText || undefined,
          categoryId: selectedCategory,
          isActive: activeFilter,
          page: pagination.page,
          limit: pagination.limit,
        }),
        productService.getCategories(),
      ]);
      setProducts(productsData.data);
      setPagination(productsData.pagination);
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      message.error(error.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  };

  const refreshProducts = async () => {
    try {
      setTableLoading(true);
      const productsData = await productService.getProducts({
        search: searchText || undefined,
        categoryId: selectedCategory,
        isActive: activeFilter,
        page: pagination.page,
        limit: pagination.limit,
      });
      setProducts(productsData.data);
      setPagination(productsData.pagination);
    } catch (error: any) {
      console.error('Error refreshing products:', error);
      message.error(error.message || 'Failed to refresh products');
    } finally {
      setTableLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setEditingProductId(null);
    setDrawerVisible(true);
  };

  const handleEditProduct = (product: ProductSummary) => {
    setEditingProductId(product.id);
    setDrawerVisible(true);
  };

  const handleDeleteProduct = async (product: ProductSummary) => {
    try {
      setTableLoading(true);
      await productService.deleteProduct(product.id);
      message.success('Product deleted successfully');
      refreshProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      message.error(error.message || 'Failed to delete product');
    } finally {
      setTableLoading(false);
    }
  };

  const handleAdjustStock = (product: ProductSummary) => {
    setSelectedProduct(product);
    setStockModalVisible(true);
  };

  const handleDrawerClose = () => {
    setDrawerVisible(false);
    setEditingProductId(null);
  };

  const handleStockModalClose = () => {
    setStockModalVisible(false);
    setSelectedProduct(null);
  };

  const handleProductSaved = () => {
    refreshProducts();
  };

  const handleStockAdjusted = () => {
    refreshProducts();
  };

  const getCategoryName = (categoryId?: string) => {
    if (!categoryId) return '—';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '—';
  };

  const getStockStatus = (product: ProductSummary) => {
    if (product.reorderLevel && product.stockQuantity <= product.reorderLevel) {
      return { color: 'red', text: 'Low Stock' };
    }
    if (product.stockQuantity === 0) {
      return { color: 'red', text: 'Out of Stock' };
    }
    return { color: 'green', text: 'In Stock' };
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (imageUrl: string | undefined, record: ProductSummary) => (
        <Avatar src={imageUrl} icon={<AppstoreOutlined />} style={{ flexShrink: 0 }}>
          {record.name.charAt(0)}
        </Avatar>
      ),
    },
    {
      title: 'Product Code',
      dataIndex: 'productCode',
      key: 'productCode',
      width: 120,
      sorter: (a: ProductSummary, b: ProductSummary) => (a.productCode || '').localeCompare(b.productCode || ''),
      render: (productCode: string) => <div className='product-code'>{productCode}</div>,
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: ProductSummary, b: ProductSummary) => (a.name || '').localeCompare(b.name || ''),
      render: (name: string, record: ProductSummary) => (
        <div>
          <div className='product-name'>{name}</div>
          <div className='product-sku'>SKU: {record.sku}</div>
        </div>
      ),
    },
    {
      title: 'Barcode',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 120,
      sorter: (a: ProductSummary, b: ProductSummary) => (a.barcode || '').localeCompare(b.barcode || ''),
      render: (barcode?: string) => <div className='product-barcode'>{barcode || '—'}</div>,
    },
    {
      title: 'Category',
      dataIndex: 'categoryId',
      key: 'categoryId',
      render: (categoryId?: string) => getCategoryName(categoryId),
    },
    {
      title: 'Stock',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      align: 'right' as const,
      sorter: (a: ProductSummary, b: ProductSummary) => (a.stockQuantity || 0) - (b.stockQuantity || 0),
      render: (stockQuantity: number, record: ProductSummary) => {
        const status = getStockStatus(record);
        return (
          <div>
            <div className='stock-quantity'>
              {stockQuantity} {record.unitOfMeasure}
            </div>
            <Tag color={status.color} className='stock-status-tag'>
              {status.text}
            </Tag>
          </div>
        );
      },
    },
    {
      title: 'Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      align: 'right' as const,
      sorter: (a: ProductSummary, b: ProductSummary) => (a.sellingPrice || 0) - (b.sellingPrice || 0),
      render: (sellingPrice: number, record: ProductSummary) => (
        <div>
          <div className='selling-price'>₹{sellingPrice.toFixed(2)}</div>
          {record.markupPercent && (
            <div className='markup-percent'>{record.markupPercent.toFixed(0)}% markup</div>
          )}
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      sorter: (a: ProductSummary, b: ProductSummary) => (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0),
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'orange'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: ProductSummary) => {
        const isEmployee = currentCompany?.role === 'EMPLOYEE';
        const menuItems = [
          {
            key: 'edit',
            icon: <EditOutlined />,
            label: 'Edit',
            onClick: () => handleEditProduct(record),
            disabled: isEmployee,
          },
          {
            key: 'stock',
            icon: <StockOutlined />,
            label: 'Adjust Stock',
            onClick: () => handleAdjustStock(record),
            disabled: isEmployee,
          },
          {
            type: 'divider' as const,
          },
          {
            key: 'delete',
            icon: <DeleteOutlined />,
            label: 'Delete',
            danger: true,
            onClick: () => handleDeleteProduct(record),
            disabled: isEmployee,
          },
        ];

        return (
          <Space>
            <Dropdown menu={{ items: menuItems }} trigger={['click']} placement='bottomRight'>
              <Button type='text' icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        );
      },
    },
  ];

  if (!currentCompany) {
    return (
      <MainLayout>
        <div className='no-company-message'>Please select a company to manage products.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className='page-container'>
        <div className='page-header-section'>
          <Heading level={2} className='page-title'>
            Products
          </Heading>
        </div>

        <div className='filters-section'>
          <Space size='middle'>
            <Input
              placeholder='Search products...'
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              placeholder='All Categories'
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: 200 }}
              allowClear
            >
              {categories.map(cat => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Select.Option>
              ))}
            </Select>
            <Select
              placeholder='All Status'
              value={activeFilter}
              onChange={setActiveFilter}
              style={{ width: 150 }}
              allowClear
            >
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Inactive</Select.Option>
            </Select>
          </Space>
        </div>

        <div className='table-container'>
          {loading ? (
            <div className='loading-container'>
              <Spin size='large' />
            </div>
          ) : products.length === 0 ? (
            <Empty description='No products found'>
              <GradientButton
                size='small'
                onClick={handleCreateProduct}
                disabled={currentCompany?.role === 'EMPLOYEE'}
              >
                Create First Product
              </GradientButton>
            </Empty>
          ) : (
            <Table
              columns={columns}
              dataSource={products}
              rowKey={record => record.id}
              loading={tableLoading}
              pagination={{
                current: pagination.page,
                pageSize: pagination.limit,
                total: pagination.total,
                showSizeChanger: true,
                onChange: (page, pageSize) => {
                  setPagination({ ...pagination, page, limit: pageSize || 10 });
                },
              }}
              className='products-table'
            />
          )}
        </div>
      </div>

      <ProductFormDrawer
        visible={drawerVisible}
        onClose={handleDrawerClose}
        onSaved={handleProductSaved}
        mode={editingProductId ? 'edit' : 'create'}
        editingProductId={editingProductId}
        categories={categories}
      />

      {selectedProduct && (
        <StockAdjustmentModal
          visible={stockModalVisible}
          onClose={handleStockModalClose}
          onAdjusted={handleStockAdjusted}
          product={selectedProduct}
        />
      )}
    </MainLayout>
  );
}
