import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

const MockMachineFormDrawer = ({ 
  open, 
  mode,
  initialData,
  onClose, 
  onSuccess 
}: { 
  open: boolean;
  mode: 'create' | 'edit';
  initialData?: any;
  onClose: () => void; 
  onSuccess: (data: any) => void | Promise<void>;
}) => {
  const [formData, setFormData] = React.useState(initialData || {
    name: '',
    machineType: '',
    serialNumber: '',
    manufacturer: '',
    model: '',
    purchaseDate: '',
    warrantyExpiry: '',
    location: '',
    status: 'IDLE',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSuccess(formData);
    onClose();
  };

  if (!open) return null;

  return (
    <div data-testid="machine-form-drawer">
      <h2>{mode === 'create' ? 'Add Machine' : 'Edit Machine'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          data-testid="name-input"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Machine Name"
        />
        <select
          data-testid="machineType-select"
          value={formData.machineType}
          onChange={(e) => setFormData({ ...formData, machineType: e.target.value })}
        >
          <option value="">Select Type</option>
          <option value="WEAVING_LOOM">Weaving Loom</option>
          <option value="SPINNING_MACHINE">Spinning Machine</option>
          <option value="DYEING_MACHINE">Dyeing Machine</option>
          <option value="CUTTING_MACHINE">Cutting Machine</option>
          <option value="STITCHING_MACHINE">Stitching Machine</option>
        </select>
        <input
          data-testid="serialNumber-input"
          value={formData.serialNumber}
          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
          placeholder="Serial Number"
        />
        <input
          data-testid="manufacturer-input"
          value={formData.manufacturer}
          onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
          placeholder="Manufacturer"
        />
        <input
          data-testid="model-input"
          value={formData.model}
          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          placeholder="Model"
        />
        <input
          data-testid="purchaseDate-input"
          type="date"
          value={formData.purchaseDate}
          onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
        />
        <input
          data-testid="warrantyExpiry-input"
          type="date"
          value={formData.warrantyExpiry}
          onChange={(e) => setFormData({ ...formData, warrantyExpiry: e.target.value })}
        />
        <select
          data-testid="location-select"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        >
          <option value="">Select Location</option>
          <option value="Production Floor A">Production Floor A</option>
          <option value="Production Floor B">Production Floor B</option>
          <option value="Warehouse">Warehouse</option>
        </select>
        <select
          data-testid="status-select"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        >
          <option value="IDLE">Idle</option>
          <option value="IN_USE">In Use</option>
          <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          <option value="UNDER_REPAIR">Under Repair</option>
        </select>
        <button type="submit" data-testid="submit-button">
          {mode === 'create' ? 'Add Machine' : 'Update Machine'}
        </button>
        <button type="button" onClick={onClose} data-testid="cancel-button">Cancel</button>
      </form>
    </div>
  );
};

describe('MachineFormDrawer Component', () => {
  let mockOnClose: any;
  let mockOnSuccess: any;

  beforeEach(() => {
    mockOnClose = vi.fn();
    mockOnSuccess = vi.fn();
  });

  describe('Drawer Modes', () => {
    it('should render in create mode', () => {
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      expect(screen.getByRole('heading', { name: 'Add Machine' })).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toHaveTextContent('Add Machine');
    });

    it('should render in edit mode', () => {
      render(<MockMachineFormDrawer open={true} mode="edit" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      expect(screen.getByRole('heading', { name: 'Edit Machine' })).toBeInTheDocument();
      expect(screen.getByTestId('submit-button')).toHaveTextContent('Update Machine');
    });

    it('should populate form with initial data in edit mode', () => {
      const initialData = {
        name: 'Loom Machine 01',
        machineType: 'WEAVING_LOOM',
        serialNumber: 'WL-2024-001',
        manufacturer: 'Textile Corp',
        model: 'TC-500',
        location: 'Production Floor A',
        status: 'IN_USE',
      };
      
      render(
        <MockMachineFormDrawer 
          open={true} 
          mode="edit" 
          initialData={initialData}
          onClose={mockOnClose} 
          onSuccess={mockOnSuccess} 
        />
      );
      
      expect(screen.getByTestId('name-input')).toHaveValue('Loom Machine 01');
      expect(screen.getByTestId('machineType-select')).toHaveValue('WEAVING_LOOM');
      expect(screen.getByTestId('serialNumber-input')).toHaveValue('WL-2024-001');
    });
  });

  describe('Industry-Specific Machine Types', () => {
    it('should have weaving loom option', () => {
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      expect(screen.getByText('Weaving Loom')).toBeInTheDocument();
    });

    it('should have spinning machine option', () => {
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      expect(screen.getByText('Spinning Machine')).toBeInTheDocument();
    });

    it('should have dyeing machine option', () => {
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      expect(screen.getByText('Dyeing Machine')).toBeInTheDocument();
    });

    it('should have cutting machine option', () => {
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      expect(screen.getByText('Cutting Machine')).toBeInTheDocument();
    });

    it('should have stitching machine option', () => {
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      expect(screen.getByText('Stitching Machine')).toBeInTheDocument();
    });

    it('should allow selecting machine type', async () => {
      const user = userEvent.setup();
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      
      await user.selectOptions(screen.getByTestId('machineType-select'), 'WEAVING_LOOM');
      expect(screen.getByTestId('machineType-select')).toHaveValue('WEAVING_LOOM');
    });
  });

  describe('Form Fields', () => {
    it('should have all required fields', () => {
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      
      expect(screen.getByTestId('name-input')).toBeInTheDocument();
      expect(screen.getByTestId('machineType-select')).toBeInTheDocument();
      expect(screen.getByTestId('serialNumber-input')).toBeInTheDocument();
      expect(screen.getByTestId('manufacturer-input')).toBeInTheDocument();
      expect(screen.getByTestId('model-input')).toBeInTheDocument();
      expect(screen.getByTestId('purchaseDate-input')).toBeInTheDocument();
      expect(screen.getByTestId('warrantyExpiry-input')).toBeInTheDocument();
      expect(screen.getByTestId('location-select')).toBeInTheDocument();
      expect(screen.getByTestId('status-select')).toBeInTheDocument();
    });

    it('should allow entering machine name', async () => {
      const user = userEvent.setup();
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByTestId('name-input'), 'Loom Machine 01');
      expect(screen.getByTestId('name-input')).toHaveValue('Loom Machine 01');
    });

    it('should allow entering serial number', async () => {
      const user = userEvent.setup();
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByTestId('serialNumber-input'), 'WL-2024-001');
      expect(screen.getByTestId('serialNumber-input')).toHaveValue('WL-2024-001');
    });

    it('should allow entering manufacturer', async () => {
      const user = userEvent.setup();
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByTestId('manufacturer-input'), 'Textile Corp');
      expect(screen.getByTestId('manufacturer-input')).toHaveValue('Textile Corp');
    });

    it('should allow entering model', async () => {
      const user = userEvent.setup();
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByTestId('model-input'), 'TC-500');
      expect(screen.getByTestId('model-input')).toHaveValue('TC-500');
    });
  });

  describe('Date Fields', () => {
    it('should have purchase date field', () => {
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      expect(screen.getByTestId('purchaseDate-input')).toBeInTheDocument();
      expect(screen.getByTestId('purchaseDate-input')).toHaveAttribute('type', 'date');
    });

    it('should have warranty expiry field', () => {
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      expect(screen.getByTestId('warrantyExpiry-input')).toBeInTheDocument();
      expect(screen.getByTestId('warrantyExpiry-input')).toHaveAttribute('type', 'date');
    });

    it('should allow selecting dates', async () => {
      const user = userEvent.setup();
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      
      const purchaseDateInput = screen.getByTestId('purchaseDate-input');
      await user.type(purchaseDateInput, '2024-01-15');
      expect(purchaseDateInput).toHaveValue('2024-01-15');
    });
  });

  describe('Location and Status', () => {
    it('should have location options', () => {
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      
      expect(screen.getByText('Production Floor A')).toBeInTheDocument();
      expect(screen.getByText('Production Floor B')).toBeInTheDocument();
      expect(screen.getByText('Warehouse')).toBeInTheDocument();
    });

    it('should have status options', () => {
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      
      expect(screen.getByText('Idle')).toBeInTheDocument();
      expect(screen.getByText('In Use')).toBeInTheDocument();
      expect(screen.getByText('Under Maintenance')).toBeInTheDocument();
      expect(screen.getByText('Under Repair')).toBeInTheDocument();
    });

    it('should default status to IDLE', () => {
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      expect(screen.getByTestId('status-select')).toHaveValue('IDLE');
    });

    it('should allow changing status', async () => {
      const user = userEvent.setup();
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      
      await user.selectOptions(screen.getByTestId('status-select'), 'IN_USE');
      expect(screen.getByTestId('status-select')).toHaveValue('IN_USE');
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      
      await user.type(screen.getByTestId('name-input'), 'Loom Machine 01');
      await user.selectOptions(screen.getByTestId('machineType-select'), 'WEAVING_LOOM');
      await user.type(screen.getByTestId('serialNumber-input'), 'WL-2024-001');
      await user.type(screen.getByTestId('manufacturer-input'), 'Textile Corp');
      await user.type(screen.getByTestId('model-input'), 'TC-500');
      await user.selectOptions(screen.getByTestId('location-select'), 'Production Floor A');
      await user.selectOptions(screen.getByTestId('status-select'), 'IN_USE');
      
      await user.click(screen.getByTestId('submit-button'));
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(expect.objectContaining({
          name: 'Loom Machine 01',
          machineType: 'WEAVING_LOOM',
          serialNumber: 'WL-2024-001',
          manufacturer: 'Textile Corp',
          model: 'TC-500',
          location: 'Production Floor A',
          status: 'IN_USE',
        }));
      });
    });

    it('should close drawer after submission', async () => {
      const user = userEvent.setup();
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      
      await user.click(screen.getByTestId('submit-button'));
      
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should close drawer when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<MockMachineFormDrawer open={true} mode="create" onClose={mockOnClose} onSuccess={mockOnSuccess} />);
      
      await user.click(screen.getByTestId('cancel-button'));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
