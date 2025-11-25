import { AuthStorage } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export interface Inspection {
  id: string;
  inspectionNumber: string;
  inspectionType: 'INCOMING_MATERIAL' | 'IN_PROCESS' | 'FINAL_PRODUCT' | 'RANDOM_CHECK';
  referenceType: string;
  referenceId: string;
  inspector: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  inspectorName?: string;
  scheduledDate: string;
  inspectionDate?: string;
  nextInspectionDate?: string;
  startedAt?: string;
  completedAt?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'CONDITIONAL';
  overallResult?: string;
  qualityScore?: number;
  checkpointsTotal: number;
  checkpointsCompleted: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionDetail extends Inspection {
  locationId?: string;
  template?: {
    id: string;
    name: string;
    description?: string;
  };
  inspectorNotes?: string;
  recommendations?: string;
  checkpoints: InspectionCheckpoint[];
}

export interface InspectionCheckpoint {
  id: string;
  name: string;
  description?: string;
  evaluationType: 'PASS_FAIL' | 'RATING' | 'MEASUREMENT';
  result?: string;
  notes?: string;
  photos: string[];
  orderIndex: number;
}

export interface InspectionTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  applicableTo: string[];
  passingScore: number;
  checkpointsCount: number;
  usageCount: number;
  createdAt: string;
}

export interface InspectionTemplateDetail extends InspectionTemplate {
  creator: {
    id: string;
    firstName: string;
    lastName: string;
  };
  checkpoints: TemplateCheckpoint[];
  updatedAt: string;
}

export interface TemplateCheckpoint {
  id: string;
  name: string;
  description?: string;
  evaluationType: 'PASS_FAIL' | 'RATING' | 'MEASUREMENT';
  isRequired: boolean;
  orderIndex: number;
}

export interface InspectionMetrics {
  totalInspections: number;
  passedInspections: number;
  failedInspections: number;
  passRate: number;
  totalDefects: number;
  criticalDefects: number;
  avgInspectionTime?: number;
}

export interface CreateInspectionData {
  inspectionType: 'INCOMING_MATERIAL' | 'IN_PROCESS' | 'FINAL_PRODUCT' | 'RANDOM_CHECK';
  referenceType: string;
  referenceId: string;
  locationId?: string;
  inspectorId?: string;
  inspectorName?: string;
  templateId?: string;
  scheduledDate?: string;
  inspectionDate?: string;
  nextInspectionDate?: string;
  inspectorNotes?: string;
  recommendations?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'CONDITIONAL';
  qualityScore?: number;
  isActive?: boolean;
}

export interface UpdateInspectionData {
  status?: 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'CONDITIONAL';
  startedAt?: string;
  completedAt?: string;
  overallResult?: string;
  qualityScore?: number;
  inspectorNotes?: string;
  recommendations?: string;
  isActive?: boolean;
}

export interface CompleteInspectionData {
  result: 'PASS' | 'FAIL' | 'CONDITIONAL';
  qualityScore: number;
  notes?: string;
  recommendations?: string;
}

export interface UpdateCheckpointData {
  result: string;
  notes?: string;
  photos?: string[];
}

export interface CreateTemplateData {
  name: string;
  description?: string;
  category: string;
  applicableTo: string[];
  passingScore?: number;
  checkpoints: {
    name: string;
    description?: string;
    evaluationType: 'PASS_FAIL' | 'RATING' | 'MEASUREMENT';
    isRequired?: boolean;
    orderIndex: number;
  }[];
}

export interface InspectionFilters {
  inspectionType?: string;
  status?: string;
  inspectorId?: string;
  referenceType?: string;
  referenceId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

class InspectionService {
  private getAuthHeaders() {
    const tokens = AuthStorage.getTokens();
    if (!tokens?.accessToken) {
      throw new Error('No access token available');
    }

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokens.accessToken}`,
    };
  }

  // Inspections
  async createInspection(data: CreateInspectionData): Promise<Inspection> {
    const response = await fetch(`${API_BASE_URL}/inspections/inspections`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create inspection');
    }

    const result = await response.json();
    return result.data;
  }

  async getInspections(filters?: InspectionFilters): Promise<Inspection[]> {
    const query = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.append(key, String(value));
        }
      });
    }

    const url = `${API_BASE_URL}/inspections/inspections${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch inspections');
    }

    const result = await response.json();
    return result.data;
  }

  async getInspectionById(id: string): Promise<InspectionDetail> {
    const response = await fetch(`${API_BASE_URL}/inspections/inspections/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch inspection');
    }

    const result = await response.json();
    return result.data;
  }

  async updateInspection(id: string, data: UpdateInspectionData): Promise<Inspection> {
    const response = await fetch(`${API_BASE_URL}/inspections/inspections/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update inspection');
    }

    const result = await response.json();
    return result.data;
  }

  async completeInspection(id: string, data: CompleteInspectionData): Promise<Inspection> {
    const response = await fetch(`${API_BASE_URL}/inspections/inspections/${id}/complete`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete inspection');
    }

    const result = await response.json();
    return result.data;
  }

  async deleteInspection(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/inspections/inspections/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete inspection');
    }
  }

  // Checkpoints
  async updateCheckpoint(id: string, data: UpdateCheckpointData): Promise<InspectionCheckpoint> {
    const response = await fetch(`${API_BASE_URL}/inspections/checkpoints/${id}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update checkpoint');
    }

    const result = await response.json();
    return result.data;
  }

  // Templates
  async createTemplate(data: CreateTemplateData): Promise<InspectionTemplate> {
    const response = await fetch(`${API_BASE_URL}/inspections/templates`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create template');
    }

    const result = await response.json();
    return result.data;
  }

  async getTemplates(category?: string): Promise<InspectionTemplate[]> {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    const response = await fetch(`${API_BASE_URL}/inspections/templates${query}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch templates');
    }

    const result = await response.json();
    return result.data;
  }

  async getTemplateById(id: string): Promise<InspectionTemplateDetail> {
    const response = await fetch(`${API_BASE_URL}/inspections/templates/${id}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch template');
    }

    const result = await response.json();
    return result.data;
  }

  async deleteTemplate(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/inspections/templates/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete template');
    }
  }

  // Metrics
  async getMetrics(periodStart?: string, periodEnd?: string): Promise<InspectionMetrics> {
    const query = new URLSearchParams();
    if (periodStart) query.append('periodStart', periodStart);
    if (periodEnd) query.append('periodEnd', periodEnd);

    const url = `${API_BASE_URL}/inspections/metrics${query.toString() ? `?${query.toString()}` : ''}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch metrics');
    }

    const result = await response.json();
    return result.data;
  }
}

export const inspectionService = new InspectionService();
export default inspectionService;
