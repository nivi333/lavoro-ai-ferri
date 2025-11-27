import { AuthStorage } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

// ============================================
// INTERFACES
// ============================================

export interface Machine {
  id: string;
  machineId: string;
  machineCode: string;
  companyId: string;
  locationId?: string;
  name: string;
  machineType?: string;
  model?: string;
  manufacturer?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyExpiry?: string;
  specifications?: any;
  imageUrl?: string;
  qrCode?: string;
  status: MachineStatus;
  operationalStatus: OperationalStatus;
  currentOperatorId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  location?: {
    id: string;
    name: string;
    isDefault: boolean;
    isHeadquarters: boolean;
  };
  currentOperator?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    breakdown_reports: number;
    maintenance_schedules: number;
  };
}

export interface BreakdownReport {
  id: string;
  ticketId: string;
  machineId: string;
  companyId: string;
  reportedBy?: string;
  severity: BreakdownSeverity;
  title: string;
  description: string;
  breakdownTime: string;
  resolvedTime?: string;
  assignedTechnician?: string;
  rootCause?: string;
  resolutionNotes?: string;
  partsUsed?: any;
  laborHours?: number;
  repairCost?: number;
  downtimeHours?: number;
  productionLoss?: number;
  status: BreakdownStatus;
  priority: BreakdownPriority;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  machine: {
    id: string;
    name: string;
    machineId: string;
    machineCode: string;
    location?: {
      id: string;
      name: string;
    };
  };
}

export interface MaintenanceSchedule {
  id: string;
  scheduleId: string;
  machineId: string;
  companyId: string;
  maintenanceType: MaintenanceType;
  title: string;
  description?: string;
  frequencyDays?: number;
  lastCompleted?: string;
  nextDue: string;
  estimatedHours?: number;
  assignedTechnician?: string;
  checklist?: any;
  partsRequired?: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  machine: {
    id: string;
    name: string;
    machineId: string;
    machineCode: string;
    location?: {
      id: string;
      name: string;
    };
  };
}

export interface MaintenanceRecord {
  id: string;
  recordId: string;
  machineId: string;
  scheduleId?: string;
  companyId: string;
  maintenanceType: MaintenanceType;
  performedBy?: string;
  performedDate: string;
  durationHours?: number;
  tasksCompleted?: any;
  partsUsed?: any;
  cost?: number;
  notes?: string;
  nextMaintenanceDate?: string;
  status: MaintenanceRecordStatus;
  createdAt: string;
  machine: {
    id: string;
    name: string;
    machineId: string;
    machineCode: string;
    location?: {
      id: string;
      name: string;
    };
  };
  schedule?: MaintenanceSchedule;
}

export interface MachineAnalytics {
  totalMachines: number;
  machinesByStatus: Record<MachineStatus, number>;
  activeBreakdowns: number;
  dueMaintenance: number;
  overdueMaintenance: number;
}

// ============================================
// REQUEST/RESPONSE TYPES
// ============================================

export interface CreateMachineRequest {
  name: string;
  machineType?: string;
  model?: string;
  manufacturer?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  specifications?: any;
  imageUrl?: string;
  locationId?: string;
  currentOperatorId?: string;
  operationalStatus?: OperationalStatus;
  isActive?: boolean;
}

export interface UpdateMachineRequest extends Partial<CreateMachineRequest> {
  status?: MachineStatus;
}

export interface MachineFilters {
  locationId?: string;
  machineType?: string;
  status?: MachineStatus;
  search?: string;
  isActive?: boolean;
}

export interface CreateBreakdownRequest {
  machineId: string;
  severity: BreakdownSeverity;
  title: string;
  description: string;
  breakdownTime?: Date;
  priority?: BreakdownPriority;
  images?: string[];
}

export interface UpdateBreakdownRequest {
  assignedTechnician?: string;
  rootCause?: string;
  resolutionNotes?: string;
  partsUsed?: any;
  laborHours?: number;
  repairCost?: number;
  status?: BreakdownStatus;
  priority?: BreakdownPriority;
}

export interface CreateMaintenanceScheduleRequest {
  machineId: string;
  maintenanceType: MaintenanceType;
  title: string;
  description?: string;
  frequencyDays?: number;
  nextDue: Date;
  estimatedHours?: number;
  assignedTechnician?: string;
  checklist?: any;
  partsRequired?: any;
}

export interface CreateMaintenanceRecordRequest {
  machineId: string;
  scheduleId?: string;
  maintenanceType: MaintenanceType;
  performedDate: Date;
  durationHours?: number;
  tasksCompleted?: any;
  partsUsed?: any;
  cost?: number;
  notes?: string;
  nextMaintenanceDate?: Date;
}

export interface UpdateMachineStatusRequest {
  status: MachineStatus;
  reason?: string;
}

// ============================================
// ENUMS
// ============================================

export type MachineStatus =
  | 'NEW'
  | 'IN_USE'
  | 'UNDER_MAINTENANCE'
  | 'UNDER_REPAIR'
  | 'IDLE'
  | 'DECOMMISSIONED';

export type OperationalStatus =
  | 'FREE'
  | 'BUSY'
  | 'RESERVED'
  | 'UNAVAILABLE';

export type MaintenanceType =
  | 'DAILY_CHECK'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUAL'
  | 'EMERGENCY';

export type MaintenanceRecordStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type BreakdownSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type BreakdownStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type BreakdownPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  details?: string;
}

// ============================================
// SERVICE CLASS
// ============================================

class MachineService {
  // Convert snake_case from backend to camelCase for frontend
  private convertMachineData(data: any): Machine {
    return {
      id: data.id,
      machineId: data.machine_id,
      machineCode: data.machine_code,
      companyId: data.company_id,
      locationId: data.location_id,
      name: data.name,
      machineType: data.machine_type,
      model: data.model,
      manufacturer: data.manufacturer,
      serialNumber: data.serial_number,
      purchaseDate: data.purchase_date,
      warrantyExpiry: data.warranty_expiry,
      specifications: data.specifications,
      imageUrl: data.image_url,
      qrCode: data.qr_code,
      status: data.status,
      operationalStatus: data.operational_status,
      currentOperatorId: data.current_operator_id,
      isActive: data.is_active,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      location: data.location ? {
        id: data.location.id,
        name: data.location.name,
        isDefault: data.location.is_default || false,
        isHeadquarters: data.location.is_headquarters || false,
      } : undefined,
      currentOperator: data.current_operator ? {
        id: data.current_operator.id,
        firstName: data.current_operator.first_name,
        lastName: data.current_operator.last_name,
      } : undefined,
      _count: data._count,
    };
  }

  private getAuthHeaders() {
    const tokens = AuthStorage.getTokens();
    if (!tokens?.accessToken) {
      throw new Error('No access token available');
    }

    return {
      Authorization: `Bearer ${tokens.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  // Machine Management
  async createMachine(data: CreateMachineRequest): Promise<ApiResponse<Machine>> {
    const response = await fetch(`${API_BASE_URL}/machines`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    // Convert snake_case to camelCase
    if (result.data) {
      result.data = this.convertMachineData(result.data);
    }
    
    return result;
  }

  async getMachines(filters?: MachineFilters): Promise<ApiResponse<Machine[]>> {
    const params = new URLSearchParams();

    if (filters?.locationId) params.append('locationId', filters.locationId);
    if (filters?.machineType) params.append('machineType', filters.machineType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());

    const response = await fetch(`${API_BASE_URL}/machines?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    // Convert snake_case to camelCase
    if (result.data && Array.isArray(result.data)) {
      result.data = result.data.map((machine: any) => this.convertMachineData(machine));
    }
    
    return result;
  }

  async getMachineById(id: string): Promise<ApiResponse<Machine>> {
    const response = await fetch(`${API_BASE_URL}/machines/${id}`, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();
    
    // Convert snake_case to camelCase
    if (result.data) {
      result.data = this.convertMachineData(result.data);
    }
    
    return result;
  }

  async updateMachine(id: string, data: UpdateMachineRequest): Promise<ApiResponse<Machine>> {
    const response = await fetch(`${API_BASE_URL}/machines/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();
    
    // Convert snake_case to camelCase
    if (result.data) {
      result.data = this.convertMachineData(result.data);
    }
    
    return result;
  }

  async updateMachineStatus(
    id: string,
    data: UpdateMachineStatusRequest
  ): Promise<ApiResponse<Machine>> {
    const response = await fetch(`${API_BASE_URL}/machines/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return response.json();
  }

  // Breakdown Management
  async createBreakdownReport(data: CreateBreakdownRequest): Promise<ApiResponse<BreakdownReport>> {
    const response = await fetch(`${API_BASE_URL}/machines/breakdowns`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async getBreakdownReports(filters?: {
    machineId?: string;
    status?: BreakdownStatus;
    severity?: BreakdownSeverity;
  }): Promise<ApiResponse<BreakdownReport[]>> {
    const params = new URLSearchParams();

    if (filters?.machineId) params.append('machineId', filters.machineId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.severity) params.append('severity', filters.severity);

    const response = await fetch(`${API_BASE_URL}/machines/breakdowns?${params.toString()}`, {
      headers: this.getAuthHeaders(),
    });

    return response.json();
  }

  async updateBreakdownReport(
    id: string,
    data: UpdateBreakdownRequest
  ): Promise<ApiResponse<BreakdownReport>> {
    const response = await fetch(`${API_BASE_URL}/machines/breakdowns/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return response.json();
  }

  // Maintenance Management
  async createMaintenanceSchedule(
    data: CreateMaintenanceScheduleRequest
  ): Promise<ApiResponse<MaintenanceSchedule>> {
    const response = await fetch(`${API_BASE_URL}/machines/maintenance/schedules`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async getMaintenanceSchedules(filters?: {
    machineId?: string;
    dueWithinDays?: number;
  }): Promise<ApiResponse<MaintenanceSchedule[]>> {
    const params = new URLSearchParams();

    if (filters?.machineId) params.append('machineId', filters.machineId);
    if (filters?.dueWithinDays) params.append('dueWithinDays', filters.dueWithinDays.toString());

    const response = await fetch(
      `${API_BASE_URL}/machines/maintenance/schedules?${params.toString()}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    return response.json();
  }

  async createMaintenanceRecord(
    data: CreateMaintenanceRecordRequest
  ): Promise<ApiResponse<MaintenanceRecord>> {
    const response = await fetch(`${API_BASE_URL}/machines/maintenance/records`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    return response.json();
  }

  // Analytics
  async getMachineAnalytics(): Promise<ApiResponse<MachineAnalytics>> {
    const response = await fetch(`${API_BASE_URL}/machines/analytics`, {
      headers: this.getAuthHeaders(),
    });

    return response.json();
  }

  // Alias for getMachineAnalytics
  async getAnalytics(): Promise<MachineAnalytics> {
    const response = await this.getMachineAnalytics();
    return response.data || {
      totalMachines: 0,
      machinesByStatus: {} as Record<MachineStatus, number>,
      activeBreakdowns: 0,
      dueMaintenance: 0,
      overdueMaintenance: 0,
    };
  }
}

export const machineService = new MachineService();
