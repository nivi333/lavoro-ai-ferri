import { API_BASE_URL } from '../config/api';
import { AuthStorage } from '../utils/storage';


export interface QualityMetrics {
  totalInspections: number;
  passRate: number;
  defectRate: number;
  avgQualityScore: number;
  criticalDefects: number;
  inspectorPerformance: Array<{
    inspector: string;
    inspections: number;
    passRate: number;
    avgScore: number;
  }>;
  trendData: Array<{
    date: string;
    passRate: number;
    defectCount: number;
    qualityScore: number;
  }>;
  defectsByCategory: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

export interface ReportRequest {
  reportName: string;
  reportType: 'Inspection Summary' | 'Defect Analysis' | 'Trend Analysis' | 'Inspector Performance';
  dateRange: [string, string];
  locations?: string[];
  products?: string[];
}

export interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  dateRange: [string, string];
  generatedAt: string;
  generatedBy: string;
  status: 'GENERATING' | 'COMPLETED' | 'FAILED';
  downloadUrl?: string;
}

class QualityReportsService {
  private getAuthHeaders() {
    const tokens = AuthStorage.getTokens();
    const token = tokens?.accessToken;
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async getQualityMetrics(
    dateRange: [string, string],
    locations?: string[],
    products?: string[]
  ): Promise<QualityMetrics> {
    const params = new URLSearchParams({
      startDate: dateRange[0],
      endDate: dateRange[1],
    });

    if (locations?.length) {
      params.append('locations', locations.join(','));
    }
    if (products?.length) {
      params.append('products', products.join(','));
    }

    const response = await fetch(`${API_BASE_URL}/quality/reports/metrics?${params}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch quality metrics');
    }

    return response.json();
  }

  async generateReport(request: ReportRequest): Promise<GeneratedReport> {
    const response = await fetch(`${API_BASE_URL}/quality/reports/generate`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to generate report');
    }

    return response.json();
  }

  async getReports(): Promise<GeneratedReport[]> {
    const response = await fetch(`${API_BASE_URL}/quality/reports`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }

    return response.json();
  }

  async downloadReport(reportId: string, format: 'pdf' | 'excel'): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/quality/reports/${reportId}/download?format=${format}`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to download report');
    }

    return response.blob();
  }

  async deleteReport(reportId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/quality/reports/${reportId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Failed to delete report');
    }
  }
}

export const qualityReportsService = new QualityReportsService();
