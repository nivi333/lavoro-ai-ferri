import { API_BASE_URL } from '../config/api';
import { AuthStorage } from '../utils/storage';


export type BillStatus =
  | 'DRAFT'
  | 'RECEIVED'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type PaymentMethod =
  | 'CASH'
  | 'CHEQUE'
  | 'BANK_TRANSFER'
  | 'UPI'
  | 'CARD'
  | 'OTHER';

export type PaymentTerms =
  | 'IMMEDIATE'
  | 'NET_15'
  | 'NET_30'
  | 'NET_60'
  | 'NET_90'
  | 'ADVANCE'
  | 'COD'
  | 'CREDIT';

export interface BillItemInput {
  productId?: string;
  itemCode: string;
  description?: string;
  quantity: number;
  unitOfMeasure: string;
  unitCost: number;
  discountPercent?: number;
  taxRate?: number;
  notes?: string;
}

export interface BillItem {
  id: string;
  lineNumber: number;
  productId?: string;
  itemCode: string;
  description?: string;
  quantity: number;
  unitOfMeasure: string;
  unitCost: number;
  discountPercent: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  lineAmount: number;
  notes?: string;
  product?: {
    id: string;
    product_code: string;
    name: string;
    unit_of_measure: string;
  };
}

export interface BillSummary {
  id: string;
  billId: string;
  companyId: string;
  supplierId?: string;
  supplierName: string;
  supplierCode?: string;
  purchaseOrderId?: string;
  locationId: string;
  billNumber?: string;
  billDate: string;
  dueDate: string;
  status: BillStatus;
  paymentTerms: PaymentTerms;
  currency: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  supplier?: {
    id: string;
    name: string;
    code: string;
  };
  location?: {
    id: string;
    name: string;
    location_id: string;
  };
}

export interface BillDetail extends BillSummary {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingCharges: number;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  transactionRef?: string;
  notes?: string;
  supplierInvoiceNo?: string;
  items: BillItem[];
  purchaseOrder?: {
    id: string;
    poId: string;
    status: string;
  };
}

export interface CreateBillRequest {
  supplierId?: string;
  supplierName: string;
  supplierCode?: string;
  purchaseOrderId?: string;
  locationId: string;
  billNumber?: string;
  billDate: string; // ISO string
  dueDate: string; // ISO string
  paymentTerms?: PaymentTerms;
  currency?: string;
  shippingCharges?: number;
  notes?: string;
  supplierInvoiceNo?: string;
  items: BillItemInput[];
}

export interface CreateBillFromPORequest {
  purchaseOrderId: string;
  locationId?: string;
  billNumber?: string;
  billDate?: string;
  dueDate?: string;
  paymentTerms?: PaymentTerms;
  currency?: string;
  shippingCharges?: number;
  notes?: string;
  supplierInvoiceNo?: string;
}

export interface UpdateBillRequest {
  supplierId?: string;
  supplierName?: string;
  supplierCode?: string;
  locationId?: string;
  billNumber?: string;
  billDate?: string;
  dueDate?: string;
  paymentTerms?: PaymentTerms;
  currency?: string;
  shippingCharges?: number;
  amountPaid?: number;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  transactionRef?: string;
  notes?: string;
  supplierInvoiceNo?: string;
  items?: BillItemInput[];
}

export interface ListBillsParams {
  status?: BillStatus | string;
  supplierId?: string;
  supplierName?: string;
  purchaseOrderId?: string;
  locationId?: string;
  fromDate?: string;
  toDate?: string;
}

class BillService {
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

  async getBills(params?: ListBillsParams): Promise<BillSummary[]> {
    const query = new URLSearchParams();

    if (params?.status) query.append('status', params.status);
    if (params?.supplierId) query.append('supplierId', params.supplierId);
    if (params?.supplierName) query.append('supplierName', params.supplierName);
    if (params?.purchaseOrderId) query.append('purchaseOrderId', params.purchaseOrderId);
    if (params?.locationId) query.append('locationId', params.locationId);
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);

    const url = `${API_BASE_URL}/bills${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch bills');
    }

    return result.data || [];
  }

  async createBill(data: CreateBillRequest): Promise<BillDetail> {
    const response = await fetch(`${API_BASE_URL}/bills`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create bill');
    }

    return result.data as BillDetail;
  }

  async createBillFromPurchaseOrder(data: CreateBillFromPORequest): Promise<BillDetail> {
    const response = await fetch(`${API_BASE_URL}/bills/from-purchase-order`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create bill from purchase order');
    }

    return result.data as BillDetail;
  }

  async getBillById(billId: string): Promise<BillDetail> {
    const response = await fetch(`${API_BASE_URL}/bills/${encodeURIComponent(billId)}`, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch bill');
    }

    return result.data as BillDetail;
  }

  async updateBill(billId: string, data: UpdateBillRequest): Promise<BillDetail> {
    const response = await fetch(`${API_BASE_URL}/bills/${encodeURIComponent(billId)}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update bill');
    }

    return result.data as BillDetail;
  }

  async updateBillStatus(billId: string, status: BillStatus): Promise<BillSummary> {
    const response = await fetch(
      `${API_BASE_URL}/bills/${encodeURIComponent(billId)}/status`,
      {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status }),
      },
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update bill status');
    }

    return result.data as BillSummary;
  }

  async deleteBill(billId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/bills/${encodeURIComponent(billId)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete bill');
    }
  }
}

export const billService = new BillService();
