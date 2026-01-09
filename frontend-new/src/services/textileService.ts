import { toast } from 'sonner';
import { AuthStorage } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

// ============================================
// FABRIC PRODUCTION INTERFACES
// ============================================
export interface FabricProduction {
  id: string;
  fabricId: string;
  companyId: string;
  locationId?: string;
  fabricType: string;
  fabricName: string;
  composition: string;
  weightGsm: number;
  widthInches: number;
  color: string;
  pattern?: string;
  finishType?: string;
  quantityMeters: number;
  productionDate: string;
  batchNumber: string;
  qualityGrade: string;
  imageUrl?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  location?: {
    id: string;
    name: string;
    locationId: string;
  };
}

export interface CreateFabricProductionData {
  fabricType: string;
  fabricName: string;
  composition: string;
  weightGsm: number;
  widthInches: number;
  color: string;
  pattern?: string;
  finishType?: string;
  quantityMeters: number;
  productionDate: string;
  batchNumber: string;
  qualityGrade: string;
  imageUrl?: string;
  locationId?: string;
  notes?: string;
  isActive?: boolean;
}

// ============================================
// YARN MANUFACTURING INTERFACES
// ============================================
export interface YarnManufacturing {
  id: string;
  yarnId: string;
  companyId: string;
  locationId?: string;
  yarnName: string;
  fiberContent: string;
  yarnType: string;
  yarnCount: string;
  twistType?: string;
  twistPerInch?: number;
  ply: number;
  color: string;
  dyeLot?: string;
  quantityKg: number;
  productionDate: string;
  batchNumber: string;
  processType?: string;
  qualityGrade: string;
  imageUrl?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  location?: {
    id: string;
    name: string;
    locationId: string;
  };
}

export interface CreateYarnManufacturingData {
  yarnName: string;
  fiberContent: string;
  yarnType: string;
  yarnCount: number;
  twistType?: string;
  twistPerInch?: number;
  ply?: number;
  color: string;
  dyeLot?: string;
  quantityKg: number;
  productionDate: string;
  batchNumber: string;
  processType?: string;
  qualityGrade: string;
  imageUrl?: string;
  locationId?: string;
  notes?: string;
  isActive?: boolean;
}

// ============================================
// DYEING & FINISHING INTERFACES
// ============================================
export interface DyeingFinishing {
  id: string;
  processId: string;
  companyId: string;
  locationId?: string;
  fabricId?: string;
  processType: string;
  colorCode: string;
  colorName: string;
  dyeMethod?: string;
  recipeCode?: string;
  quantityMeters: number;
  processDate: string;
  batchNumber: string;
  machineNumber?: string;
  temperatureC?: number;
  durationMinutes?: number;
  qualityCheck: boolean;
  colorFastness?: string;
  shrinkagePercent?: number;
  imageUrl?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  location?: {
    id: string;
    name: string;
    locationId: string;
  };
}

export interface CreateDyeingFinishingData {
  processType: string;
  colorCode: string;
  colorName: string;
  dyeMethod?: string;
  recipeCode?: string;
  quantityMeters: number;
  processDate: string;
  batchNumber: string;
  machineNumber?: string;
  temperatureC?: number;
  durationMinutes?: number;
  qualityCheck?: boolean;
  colorFastness?: string;
  shrinkagePercent?: number;
  imageUrl?: string;
  locationId?: string;
  notes?: string;
  isActive?: boolean;
}

// ============================================
// GARMENT MANUFACTURING INTERFACES
// ============================================
export interface GarmentManufacturing {
  id: string;
  garmentId: string;
  companyId: string;
  locationId?: string;
  orderId?: string;
  garmentType: string;
  styleNumber: string;
  size: string;
  color: string;
  fabricId?: string;
  quantity: number;
  productionStage: string;
  cutDate?: string;
  sewDate?: string;
  finishDate?: string;
  packDate?: string;
  operatorName?: string;
  lineNumber?: string;
  qualityPassed: boolean;
  defectCount: number;
  imageUrl?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  location?: {
    id: string;
    name: string;
    locationId: string;
  };
}

export interface CreateGarmentManufacturingData {
  garmentType: string;
  styleNumber: string;
  size: string;
  color: string;
  fabricId?: string;
  quantity: number;
  productionStage: string;
  cutDate?: string;
  sewDate?: string;
  finishDate?: string;
  packDate?: string;
  operatorName?: string;
  lineNumber?: string;
  qualityPassed?: boolean;
  defectCount?: number;
  imageUrl?: string;
  locationId?: string;
  notes?: string;
  isActive?: boolean;
}

// ============================================
// DESIGN PATTERNS INTERFACES
// ============================================
export interface DesignPattern {
  id: string;
  designId: string;
  companyId: string;
  designName: string;
  designCategory: string;
  designerName?: string;
  season?: string;
  colorPalette: string[];
  patternRepeat?: string;
  designFileUrl?: string;
  sampleImageUrl?: string;
  status: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDesignPatternData {
  designName: string;
  designCategory: string;
  designerName?: string;
  season?: string;
  colorPalette: string[];
  patternRepeat?: string;
  designFileUrl?: string;
  sampleImageUrl?: string;
  status: string;
  notes?: string;
  isActive?: boolean;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
const getAuthToken = (): string | null => {
  const tokens = AuthStorage.getTokens();
  return tokens?.accessToken || null;
};

// Clean filters to remove undefined/null/empty values before sending to API
const cleanFilters = (filters: any): Record<string, string> => {
  if (!filters) return {};
  const cleaned: Record<string, string> = {};
  Object.keys(filters).forEach(key => {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = String(value);
    }
  });
  return cleaned;
};

const handleApiError = (error: any, defaultMessage: string) => {
  console.error('API Error:', error);
  const errorMessage = error?.response?.data?.message || error?.message || defaultMessage;
  toast.error(errorMessage);
  throw new Error(errorMessage);
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();

  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    handleApiError(error, 'Network request failed');
  }
};

// ============================================
// FABRIC PRODUCTION SERVICE
// ============================================
export const fabricProductionService = {
  async createFabricProduction(data: CreateFabricProductionData): Promise<FabricProduction> {
    const response = await apiRequest('/textile/fabrics', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async getFabricProductions(filters?: any): Promise<FabricProduction[]> {
    const cleaned = cleanFilters(filters);
    const queryParams =
      Object.keys(cleaned).length > 0 ? `?${new URLSearchParams(cleaned).toString()}` : '';
    const response = await apiRequest(`/textile/fabrics${queryParams}`);
    return response.data || [];
  },

  async getFabricProductionById(fabricId: string): Promise<FabricProduction> {
    const response = await apiRequest(`/textile/fabrics/${fabricId}`);
    return response.data;
  },

  async updateFabricProduction(
    fabricId: string,
    data: Partial<CreateFabricProductionData>
  ): Promise<FabricProduction> {
    const response = await apiRequest(`/textile/fabrics/${fabricId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async deleteFabricProduction(fabricId: string): Promise<void> {
    await apiRequest(`/textile/fabrics/${fabricId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// YARN MANUFACTURING SERVICE
// ============================================
export const yarnManufacturingService = {
  async createYarnManufacturing(data: CreateYarnManufacturingData): Promise<YarnManufacturing> {
    const response = await apiRequest('/textile/yarns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async getYarnManufacturing(filters?: any): Promise<YarnManufacturing[]> {
    const cleaned = cleanFilters(filters);
    const queryParams =
      Object.keys(cleaned).length > 0 ? `?${new URLSearchParams(cleaned).toString()}` : '';
    const response = await apiRequest(`/textile/yarns${queryParams}`);
    return response.data || [];
  },

  async getYarnManufacturingById(yarnId: string): Promise<YarnManufacturing> {
    const response = await apiRequest(`/textile/yarns/${yarnId}`);
    return response.data;
  },

  async updateYarnManufacturing(
    yarnId: string,
    data: Partial<CreateYarnManufacturingData>
  ): Promise<YarnManufacturing> {
    const response = await apiRequest(`/textile/yarns/${yarnId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async deleteYarnManufacturing(yarnId: string): Promise<void> {
    await apiRequest(`/textile/yarns/${yarnId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// DYEING & FINISHING SERVICE
// ============================================
export const dyeingFinishingService = {
  async createDyeingFinishing(data: CreateDyeingFinishingData): Promise<DyeingFinishing> {
    const response = await apiRequest('/textile/dyeing', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async getDyeingFinishing(filters?: any): Promise<DyeingFinishing[]> {
    const cleaned = cleanFilters(filters);
    const queryParams =
      Object.keys(cleaned).length > 0 ? `?${new URLSearchParams(cleaned).toString()}` : '';
    const response = await apiRequest(`/textile/dyeing${queryParams}`);
    return response.data || [];
  },

  async getDyeingFinishingById(processId: string): Promise<DyeingFinishing> {
    const response = await apiRequest(`/textile/dyeing/${processId}`);
    return response.data;
  },

  async updateDyeingFinishing(
    processId: string,
    data: Partial<CreateDyeingFinishingData>
  ): Promise<DyeingFinishing> {
    const response = await apiRequest(`/textile/dyeing/${processId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async deleteDyeingFinishing(processId: string): Promise<void> {
    await apiRequest(`/textile/dyeing/${processId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// GARMENT MANUFACTURING SERVICE
// ============================================
export const garmentManufacturingService = {
  async createGarmentManufacturing(
    data: CreateGarmentManufacturingData
  ): Promise<GarmentManufacturing> {
    const response = await apiRequest('/textile/garments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async getGarmentManufacturing(filters?: any): Promise<GarmentManufacturing[]> {
    const cleaned = cleanFilters(filters);
    const queryParams =
      Object.keys(cleaned).length > 0 ? `?${new URLSearchParams(cleaned).toString()}` : '';
    const response = await apiRequest(`/textile/garments${queryParams}`);
    return response.data || [];
  },

  async getGarmentManufacturingById(garmentId: string): Promise<GarmentManufacturing> {
    const response = await apiRequest(`/textile/garments/${garmentId}`);
    return response.data;
  },

  async updateGarmentManufacturing(
    garmentId: string,
    data: Partial<CreateGarmentManufacturingData>
  ): Promise<GarmentManufacturing> {
    const response = await apiRequest(`/textile/garments/${garmentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async updateGarmentStage(
    garmentId: string,
    stage: string,
    notes?: string
  ): Promise<GarmentManufacturing> {
    const response = await apiRequest(`/textile/garments/${garmentId}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage, notes }),
    });
    return response.data;
  },

  async deleteGarmentManufacturing(garmentId: string): Promise<void> {
    await apiRequest(`/textile/garments/${garmentId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// DESIGN PATTERNS SERVICE
// ============================================
export const designPatternService = {
  async createDesignPattern(data: CreateDesignPatternData): Promise<DesignPattern> {
    const response = await apiRequest('/textile/designs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async getDesignPatterns(filters?: any): Promise<DesignPattern[]> {
    const cleaned = cleanFilters(filters);
    const queryParams =
      Object.keys(cleaned).length > 0 ? `?${new URLSearchParams(cleaned).toString()}` : '';
    const response = await apiRequest(`/textile/designs${queryParams}`);
    return response.data || [];
  },

  async getDesignPatternById(designId: string): Promise<DesignPattern> {
    const response = await apiRequest(`/textile/designs/${designId}`);
    return response.data;
  },

  async updateDesignPattern(
    designId: string,
    data: Partial<CreateDesignPatternData>
  ): Promise<DesignPattern> {
    const response = await apiRequest(`/textile/designs/${designId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  async updateDesignStatus(designId: string, status: string): Promise<DesignPattern> {
    const response = await apiRequest(`/textile/designs/${designId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return response.data;
  },

  async deleteDesignPattern(designId: string): Promise<void> {
    await apiRequest(`/textile/designs/${designId}`, {
      method: 'DELETE',
    });
  },
};

// ============================================
// CONSTANTS & ENUMS
// ============================================
export const FABRIC_TYPES = [
  { value: 'COTTON', label: 'Cotton' },
  { value: 'SILK', label: 'Silk' },
  { value: 'WOOL', label: 'Wool' },
  { value: 'POLYESTER', label: 'Polyester' },
  { value: 'NYLON', label: 'Nylon' },
  { value: 'LINEN', label: 'Linen' },
  { value: 'RAYON', label: 'Rayon' },
  { value: 'SPANDEX', label: 'Spandex' },
  { value: 'BLEND', label: 'Blend' },
];

export const QUALITY_GRADES = [
  { value: 'A_GRADE', label: 'A Grade' },
  { value: 'B_GRADE', label: 'B Grade' },
  { value: 'C_GRADE', label: 'C Grade' },
  { value: 'REJECT', label: 'Reject' },
];

export const YARN_TYPES = [
  { value: 'COTTON', label: 'Cotton' },
  { value: 'WOOL', label: 'Wool' },
  { value: 'SILK', label: 'Silk' },
  { value: 'SYNTHETIC', label: 'Synthetic' },
  { value: 'BLEND', label: 'Blend' },
];

export const YARN_PROCESSES = [
  { value: 'SPINNING', label: 'Spinning' },
  { value: 'WEAVING', label: 'Weaving' },
  { value: 'KNITTING', label: 'Knitting' },
];

export const DYEING_PROCESSES = [
  { value: 'DYEING', label: 'Dyeing' },
  { value: 'PRINTING', label: 'Printing' },
  { value: 'FINISHING', label: 'Finishing' },
];

export const GARMENT_TYPES = [
  { value: 'T_SHIRT', label: 'T-Shirt' },
  { value: 'SHIRT', label: 'Shirt' },
  { value: 'PANTS', label: 'Pants' },
  { value: 'DRESS', label: 'Dress' },
  { value: 'JACKET', label: 'Jacket' },
  { value: 'SKIRT', label: 'Skirt' },
  { value: 'BLOUSE', label: 'Blouse' },
  { value: 'SHORTS', label: 'Shorts' },
];

export const PRODUCTION_STAGES = [
  { value: 'CUTTING', label: 'Cutting' },
  { value: 'SEWING', label: 'Sewing' },
  { value: 'FINISHING', label: 'Finishing' },
  { value: 'PACKING', label: 'Packing' },
  { value: 'COMPLETED', label: 'Completed' },
];

export const DESIGN_CATEGORIES = [
  { value: 'PRINT', label: 'Print' },
  { value: 'EMBROIDERY', label: 'Embroidery' },
  { value: 'WOVEN', label: 'Woven' },
  { value: 'KNIT', label: 'Knit' },
];

export const DESIGN_STATUSES = [
  { value: 'CONCEPT', label: 'Concept' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'REVIEW', label: 'Review' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'PRODUCTION', label: 'Production' },
  { value: 'ARCHIVED', label: 'Archived' },
];
