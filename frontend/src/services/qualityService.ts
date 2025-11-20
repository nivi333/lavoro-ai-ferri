const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface CreateCheckpointData {
  checkpointType: string;
  checkpointName: string;
  inspectorName: string;
  inspectionDate: string;
  orderId?: string;
  locationId?: string;
  overallScore?: number;
  notes?: string;
}

interface CreateDefectData {
  checkpointId: string;
  defectCategory: string;
  defectType: string;
  severity: string;
  quantity: number;
  description?: string;
  imageUrl?: string;
}

interface CreateMetricData {
  checkpointId: string;
  metricName: string;
  metricValue: number;
  unitOfMeasure: string;
  minThreshold?: number;
  maxThreshold?: number;
  notes?: string;
}

interface CreateComplianceReportData {
  reportType: string;
  reportDate: string;
  auditorName: string;
  certification?: string;
  validityPeriod?: string;
  status: string;
  findings?: string;
  recommendations?: string;
  documentUrl?: string;
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

class QualityService {
  // Quality Checkpoints
  async getCheckpoints(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/quality/checkpoints${queryString}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch checkpoints');
    }

    const result = await response.json();
    return result.data;
  }

  async getCheckpointById(id: string) {
    const response = await fetch(`${API_BASE_URL}/quality/checkpoints/${id}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch checkpoint');
    }

    const result = await response.json();
    return result.data;
  }

  async createCheckpoint(data: CreateCheckpointData) {
    const response = await fetch(`${API_BASE_URL}/quality/checkpoints`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create checkpoint');
    }

    const result = await response.json();
    return result.data;
  }

  async updateCheckpoint(id: string, data: Partial<CreateCheckpointData> & { status?: string }) {
    const response = await fetch(`${API_BASE_URL}/quality/checkpoints/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update checkpoint');
    }

    const result = await response.json();
    return result.data;
  }

  async deleteCheckpoint(id: string) {
    const response = await fetch(`${API_BASE_URL}/quality/checkpoints/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete checkpoint');
    }

    const result = await response.json();
    return result;
  }

  // Quality Defects
  async getDefects(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/quality/defects${queryString}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch defects');
    }

    const result = await response.json();
    return result.data;
  }

  async createDefect(data: CreateDefectData) {
    const response = await fetch(`${API_BASE_URL}/quality/defects`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create defect');
    }

    const result = await response.json();
    return result.data;
  }

  async resolveDefect(id: string, resolvedBy: string, resolutionNotes?: string) {
    const response = await fetch(`${API_BASE_URL}/quality/defects/${id}/resolve`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ resolvedBy, resolutionNotes }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to resolve defect');
    }

    const result = await response.json();
    return result.data;
  }

  async deleteDefect(id: string) {
    const response = await fetch(`${API_BASE_URL}/quality/defects/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete defect');
    }

    const result = await response.json();
    return result;
  }

  // Quality Metrics
  async createMetric(data: CreateMetricData) {
    const response = await fetch(`${API_BASE_URL}/quality/metrics`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create metric');
    }

    const result = await response.json();
    return result.data;
  }

  async getMetricsByCheckpoint(checkpointId: string) {
    const response = await fetch(`${API_BASE_URL}/quality/metrics/${checkpointId}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch metrics');
    }

    const result = await response.json();
    return result.data;
  }

  async deleteMetric(id: string) {
    const response = await fetch(`${API_BASE_URL}/quality/metrics/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete metric');
    }

    const result = await response.json();
    return result;
  }

  // Compliance Reports
  async getComplianceReports(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    const response = await fetch(`${API_BASE_URL}/quality/compliance${queryString}`, {
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch compliance reports');
    }

    const result = await response.json();
    return result.data;
  }

  async createComplianceReport(data: CreateComplianceReportData) {
    const response = await fetch(`${API_BASE_URL}/quality/compliance`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create compliance report');
    }

    const result = await response.json();
    return result.data;
  }

  async deleteComplianceReport(id: string) {
    const response = await fetch(`${API_BASE_URL}/quality/compliance/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete compliance report');
    }

    const result = await response.json();
    return result;
  }
}

export const qualityService = new QualityService();
