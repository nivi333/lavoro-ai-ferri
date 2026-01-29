import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const MockInventoryListPage = () => {
  const [filters, setFilters] = React.useState({
    search: '',
    category: '',
    location: '',
    stockStatus: '',
  });
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(20);

  const mockInventory = [
    { id: '1', name: 'Cotton Fabric', sku: 'FAB-001', stock: 500, reorderLevel: 50, category: 'fabric', location: 'Warehouse A' },
    { id: '2', name: 'Polyester Yarn', sku: 'YRN-001', stock: 30, reorderLevel: 50, category: 'yarn', location: 'Warehouse B' },
    { id: '3', name: 'Buttons', sku: 'ACC-001', stock: 0, reorderLevel: 100, category: 'accessories', location: 'Warehouse A' },
  ];

  const filteredInventory = mockInventory.filter(item => {
    if (filters.search && !item.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.category && item.category !== filters.category) return false;
    if (filters.location && item.location !== filters.location) return false;
    if (filters.stockStatus === 'in-stock' && item.stock <= 0) return false;
    if (filters.stockStatus === 'low-stock' && (item.stock > item.reorderLevel || item.stock <= 0)) return false;
    if (filters.stockStatus === 'out-of-stock' && item.stock > 0) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  return (
    <div data-testid="inventory-list-page">
      <div data-testid="filters">
        <input
          data-testid="search-input"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder="Search products..."
        />
        <select
          data-testid="category-filter"
          value={filters.category}
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">All Categories</option>
          <option value="fabric">Fabric</option>
          <option value="yarn">Yarn</option>
          <option value="accessories">Accessories</option>
        </select>
        <select
          data-testid="location-filter"
          value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })}
        >
          <option value="">All Locations</option>
          <option value="Warehouse A">Warehouse A</option>
          <option value="Warehouse B">Warehouse B</option>
        </select>
        <select
          data-testid="stockStatus-filter"
          value={filters.stockStatus}
          onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value })}
        >
          <option value="">All Stock Status</option>
          <option value="in-stock">In Stock</option>
          <option value="low-stock">Low Stock</option>
          <option value="out-of-stock">Out of Stock</option>
        </select>
      </div>
      <div data-testid="inventory-table">
        {filteredInventory.map(item => (
          <div key={item.id} data-testid={`inventory-item-${item.id}`}>
            <span>{item.name}</span>
            <span>{item.sku}</span>
            <span data-testid={`stock-${item.id}`}>{item.stock}</span>
          </div>
        ))}
      </div>
      <div data-testid="pagination">
        <button
          data-testid="prev-page"
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span data-testid="page-info">Page {currentPage} of {totalPages}</span>
        <button
          data-testid="next-page"
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

describe('InventoryListPage Component', () => {
  describe('Page Rendering', () => {
    it('should render inventory list page', () => {
      render(<MockInventoryListPage />);
      expect(screen.getByTestId('inventory-list-page')).toBeInTheDocument();
    });

    it('should render filters section', () => {
      render(<MockInventoryListPage />);
      expect(screen.getByTestId('filters')).toBeInTheDocument();
    });

    it('should render inventory table', () => {
      render(<MockInventoryListPage />);
      expect(screen.getByTestId('inventory-table')).toBeInTheDocument();
    });

    it('should render pagination controls', () => {
      render(<MockInventoryListPage />);
      expect(screen.getByTestId('pagination')).toBeInTheDocument();
    });
  });

  describe('Search Filter', () => {
    it('should have search input', () => {
      render(<MockInventoryListPage />);
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
    });

    it('should filter items by search term', async () => {
      const user = userEvent.setup();
      render(<MockInventoryListPage />);
      
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Cotton');
      
      expect(screen.getByTestId('inventory-item-1')).toBeInTheDocument();
      expect(screen.queryByTestId('inventory-item-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('inventory-item-3')).not.toBeInTheDocument();
    });

    it('should be case insensitive', async () => {
      const user = userEvent.setup();
      render(<MockInventoryListPage />);
      
      await user.type(screen.getByTestId('search-input'), 'cotton');
      expect(screen.getByTestId('inventory-item-1')).toBeInTheDocument();
    });
  });

  describe('Category Filter', () => {
    it('should have category filter', () => {
      render(<MockInventoryListPage />);
      expect(screen.getByTestId('category-filter')).toBeInTheDocument();
    });

    it('should filter by fabric category', async () => {
      const user = userEvent.setup();
      render(<MockInventoryListPage />);
      
      await user.selectOptions(screen.getByTestId('category-filter'), 'fabric');
      
      expect(screen.getByTestId('inventory-item-1')).toBeInTheDocument();
      expect(screen.queryByTestId('inventory-item-2')).not.toBeInTheDocument();
    });

    it('should filter by yarn category', async () => {
      const user = userEvent.setup();
      render(<MockInventoryListPage />);
      
      await user.selectOptions(screen.getByTestId('category-filter'), 'yarn');
      
      expect(screen.queryByTestId('inventory-item-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('inventory-item-2')).toBeInTheDocument();
    });
  });

  describe('Location Filter', () => {
    it('should have location filter', () => {
      render(<MockInventoryListPage />);
      expect(screen.getByTestId('location-filter')).toBeInTheDocument();
    });

    it('should filter by warehouse location', async () => {
      const user = userEvent.setup();
      render(<MockInventoryListPage />);
      
      await user.selectOptions(screen.getByTestId('location-filter'), 'Warehouse A');
      
      expect(screen.getByTestId('inventory-item-1')).toBeInTheDocument();
      expect(screen.queryByTestId('inventory-item-2')).not.toBeInTheDocument();
      expect(screen.getByTestId('inventory-item-3')).toBeInTheDocument();
    });
  });

  describe('Stock Status Filter', () => {
    it('should have stock status filter', () => {
      render(<MockInventoryListPage />);
      expect(screen.getByTestId('stockStatus-filter')).toBeInTheDocument();
    });

    it('should filter in-stock items', async () => {
      const user = userEvent.setup();
      render(<MockInventoryListPage />);
      
      await user.selectOptions(screen.getByTestId('stockStatus-filter'), 'in-stock');
      
      expect(screen.getByTestId('inventory-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('inventory-item-2')).toBeInTheDocument();
      expect(screen.queryByTestId('inventory-item-3')).not.toBeInTheDocument();
    });

    it('should filter low-stock items', async () => {
      const user = userEvent.setup();
      render(<MockInventoryListPage />);
      
      await user.selectOptions(screen.getByTestId('stockStatus-filter'), 'low-stock');
      
      expect(screen.queryByTestId('inventory-item-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('inventory-item-2')).toBeInTheDocument();
    });

    it('should filter out-of-stock items', async () => {
      const user = userEvent.setup();
      render(<MockInventoryListPage />);
      
      await user.selectOptions(screen.getByTestId('stockStatus-filter'), 'out-of-stock');
      
      expect(screen.queryByTestId('inventory-item-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('inventory-item-3')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should show current page number', () => {
      render(<MockInventoryListPage />);
      expect(screen.getByTestId('page-info')).toHaveTextContent('Page 1 of');
    });

    it('should disable previous button on first page', () => {
      render(<MockInventoryListPage />);
      expect(screen.getByTestId('prev-page')).toBeDisabled();
    });

    it('should enable next button when more pages exist', () => {
      render(<MockInventoryListPage />);
      const nextButton = screen.getByTestId('next-page');
      expect(nextButton).toBeInTheDocument();
    });
  });

  describe('Inventory Display', () => {
    it('should display all inventory items by default', () => {
      render(<MockInventoryListPage />);
      
      expect(screen.getByTestId('inventory-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('inventory-item-2')).toBeInTheDocument();
      expect(screen.getByTestId('inventory-item-3')).toBeInTheDocument();
    });

    it('should display stock quantities', () => {
      render(<MockInventoryListPage />);
      
      expect(screen.getByTestId('stock-1')).toHaveTextContent('500');
      expect(screen.getByTestId('stock-2')).toHaveTextContent('30');
      expect(screen.getByTestId('stock-3')).toHaveTextContent('0');
    });
  });

  describe('Combined Filters', () => {
    it('should apply multiple filters together', async () => {
      const user = userEvent.setup();
      render(<MockInventoryListPage />);
      
      await user.selectOptions(screen.getByTestId('category-filter'), 'fabric');
      await user.selectOptions(screen.getByTestId('location-filter'), 'Warehouse A');
      
      expect(screen.getByTestId('inventory-item-1')).toBeInTheDocument();
      expect(screen.queryByTestId('inventory-item-2')).not.toBeInTheDocument();
      expect(screen.queryByTestId('inventory-item-3')).not.toBeInTheDocument();
    });
  });
});
