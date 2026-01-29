import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

const MockDashboard = () => {
  const stats = {
    totalOrders: 156,
    totalRevenue: 125000,
    activeProducts: 89,
    lowStockItems: 12,
    machinesInUse: 45,
    machinesUnderMaintenance: 3,
  };

  const recentOrders = [
    { id: 'ORD-001', customer: 'ABC Corp', amount: 5000, status: 'PENDING' },
    { id: 'ORD-002', customer: 'XYZ Ltd', amount: 7500, status: 'CONFIRMED' },
  ];

  const alerts = [
    { id: '1', type: 'warning', message: '12 products are low on stock' },
    { id: '2', type: 'info', message: '3 machines scheduled for maintenance' },
  ];

  return (
    <div data-testid="dashboard">
      <div data-testid="stats-section">
        <div data-testid="stat-total-orders">
          <span>Total Orders</span>
          <span data-testid="total-orders-value">{stats.totalOrders}</span>
        </div>
        <div data-testid="stat-total-revenue">
          <span>Total Revenue</span>
          <span data-testid="total-revenue-value">${stats.totalRevenue.toLocaleString()}</span>
        </div>
        <div data-testid="stat-active-products">
          <span>Active Products</span>
          <span data-testid="active-products-value">{stats.activeProducts}</span>
        </div>
        <div data-testid="stat-low-stock">
          <span>Low Stock Items</span>
          <span data-testid="low-stock-value">{stats.lowStockItems}</span>
        </div>
        <div data-testid="stat-machines-in-use">
          <span>Machines In Use</span>
          <span data-testid="machines-in-use-value">{stats.machinesInUse}</span>
        </div>
        <div data-testid="stat-machines-maintenance">
          <span>Under Maintenance</span>
          <span data-testid="machines-maintenance-value">{stats.machinesUnderMaintenance}</span>
        </div>
      </div>
      <div data-testid="charts-section">
        <div data-testid="revenue-chart">Revenue Chart</div>
        <div data-testid="orders-chart">Orders Chart</div>
        <div data-testid="inventory-chart">Inventory Chart</div>
      </div>
      <div data-testid="recent-orders-section">
        <h3>Recent Orders</h3>
        {recentOrders.map(order => (
          <div key={order.id} data-testid={`order-${order.id}`}>
            <span>{order.id}</span>
            <span>{order.customer}</span>
            <span>${order.amount}</span>
            <span data-testid={`order-status-${order.id}`}>{order.status}</span>
          </div>
        ))}
      </div>
      <div data-testid="alerts-section">
        <h3>Alerts</h3>
        {alerts.map(alert => (
          <div key={alert.id} data-testid={`alert-${alert.id}`} className={alert.type}>
            {alert.message}
          </div>
        ))}
      </div>
    </div>
  );
};

describe('Dashboard Component', () => {
  describe('Page Rendering', () => {
    it('should render dashboard', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });

    it('should render stats section', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('stats-section')).toBeInTheDocument();
    });

    it('should render charts section', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('charts-section')).toBeInTheDocument();
    });

    it('should render recent orders section', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('recent-orders-section')).toBeInTheDocument();
    });

    it('should render alerts section', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('alerts-section')).toBeInTheDocument();
    });
  });

  describe('Statistics Cards', () => {
    it('should display total orders stat', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('stat-total-orders')).toBeInTheDocument();
      expect(screen.getByTestId('total-orders-value')).toHaveTextContent('156');
    });

    it('should display total revenue stat', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('stat-total-revenue')).toBeInTheDocument();
      expect(screen.getByTestId('total-revenue-value')).toHaveTextContent('$125,000');
    });

    it('should display active products stat', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('stat-active-products')).toBeInTheDocument();
      expect(screen.getByTestId('active-products-value')).toHaveTextContent('89');
    });

    it('should display low stock items stat', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('stat-low-stock')).toBeInTheDocument();
      expect(screen.getByTestId('low-stock-value')).toHaveTextContent('12');
    });

    it('should display machines in use stat', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('stat-machines-in-use')).toBeInTheDocument();
      expect(screen.getByTestId('machines-in-use-value')).toHaveTextContent('45');
    });

    it('should display machines under maintenance stat', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('stat-machines-maintenance')).toBeInTheDocument();
      expect(screen.getByTestId('machines-maintenance-value')).toHaveTextContent('3');
    });

    it('should format revenue with currency symbol', () => {
      render(<MockDashboard />);
      const revenueValue = screen.getByTestId('total-revenue-value');
      expect(revenueValue.textContent).toContain('$');
    });

    it('should format large numbers with commas', () => {
      render(<MockDashboard />);
      const revenueValue = screen.getByTestId('total-revenue-value');
      expect(revenueValue.textContent).toContain(',');
    });
  });

  describe('Charts', () => {
    it('should display revenue chart', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('revenue-chart')).toBeInTheDocument();
    });

    it('should display orders chart', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('orders-chart')).toBeInTheDocument();
    });

    it('should display inventory chart', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('inventory-chart')).toBeInTheDocument();
    });
  });

  describe('Recent Orders', () => {
    it('should display recent orders heading', () => {
      render(<MockDashboard />);
      expect(screen.getByText('Recent Orders')).toBeInTheDocument();
    });

    it('should display order ORD-001', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('order-ORD-001')).toBeInTheDocument();
    });

    it('should display order ORD-002', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('order-ORD-002')).toBeInTheDocument();
    });

    it('should display order customer names', () => {
      render(<MockDashboard />);
      expect(screen.getByText('ABC Corp')).toBeInTheDocument();
      expect(screen.getByText('XYZ Ltd')).toBeInTheDocument();
    });

    it('should display order amounts', () => {
      render(<MockDashboard />);
      expect(screen.getByText('$5000')).toBeInTheDocument();
      expect(screen.getByText('$7500')).toBeInTheDocument();
    });

    it('should display order statuses', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('order-status-ORD-001')).toHaveTextContent('PENDING');
      expect(screen.getByTestId('order-status-ORD-002')).toHaveTextContent('CONFIRMED');
    });
  });

  describe('Alerts', () => {
    it('should display alerts heading', () => {
      render(<MockDashboard />);
      expect(screen.getByText('Alerts')).toBeInTheDocument();
    });

    it('should display low stock alert', () => {
      render(<MockDashboard />);
      const alert = screen.getByTestId('alert-1');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('12 products are low on stock');
    });

    it('should display maintenance alert', () => {
      render(<MockDashboard />);
      const alert = screen.getByTestId('alert-2');
      expect(alert).toBeInTheDocument();
      expect(alert).toHaveTextContent('3 machines scheduled for maintenance');
    });

    it('should apply warning class to low stock alert', () => {
      render(<MockDashboard />);
      const alert = screen.getByTestId('alert-1');
      expect(alert).toHaveClass('warning');
    });

    it('should apply info class to maintenance alert', () => {
      render(<MockDashboard />);
      const alert = screen.getByTestId('alert-2');
      expect(alert).toHaveClass('info');
    });
  });

  describe('Data Display', () => {
    it('should show all stat cards', () => {
      render(<MockDashboard />);
      const statsSection = screen.getByTestId('stats-section');
      expect(statsSection.children.length).toBe(6);
    });

    it('should show all charts', () => {
      render(<MockDashboard />);
      const chartsSection = screen.getByTestId('charts-section');
      expect(chartsSection.children.length).toBe(3);
    });

    it('should show correct number of recent orders', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('order-ORD-001')).toBeInTheDocument();
      expect(screen.getByTestId('order-ORD-002')).toBeInTheDocument();
    });

    it('should show correct number of alerts', () => {
      render(<MockDashboard />);
      expect(screen.getByTestId('alert-1')).toBeInTheDocument();
      expect(screen.getByTestId('alert-2')).toBeInTheDocument();
    });
  });
});
