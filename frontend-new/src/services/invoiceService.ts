import { API_BASE_URL } from '../config/api';
import { AuthStorage } from '../utils/storage';


export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
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

export interface InvoiceItemInput {
  productId?: string;
  itemCode: string;
  description?: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
  discountPercent?: number;
  taxRate?: number;
  notes?: string;
}

export interface InvoiceItem {
  id: string;
  lineNumber: number;
  productId?: string;
  itemCode: string;
  description?: string;
  quantity: number;
  unitOfMeasure: string;
  unitPrice: number;
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

export interface InvoiceSummary {
  id: string;
  invoiceId: string;
  companyId: string;
  customerId?: string;
  customerName: string;
  customerCode?: string;
  orderId?: string;
  locationId: string;
  invoiceNumber?: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentTerms: PaymentTerms;
  currency: string;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: {
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

export interface InvoiceDetail extends InvoiceSummary {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingCharges: number;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  transactionRef?: string;
  notes?: string;
  termsConditions?: string;
  bankDetails?: string;
  items: InvoiceItem[];
  order?: {
    id: string;
    orderId: string;
    status: string;
  };
}

export interface CreateInvoiceRequest {
  customerId?: string;
  customerName: string;
  customerCode?: string;
  orderId?: string;
  locationId: string;
  invoiceNumber?: string;
  invoiceDate: string; // ISO string
  dueDate: string; // ISO string
  paymentTerms?: PaymentTerms;
  currency?: string;
  shippingCharges?: number;
  notes?: string;
  termsConditions?: string;
  bankDetails?: string;
  items: InvoiceItemInput[];
}

export interface CreateInvoiceFromOrderRequest {
  orderId: string;
  locationId?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  paymentTerms?: PaymentTerms;
  currency?: string;
  shippingCharges?: number;
  notes?: string;
  termsConditions?: string;
  bankDetails?: string;
}

export interface UpdateInvoiceRequest {
  customerId?: string;
  customerName?: string;
  customerCode?: string;
  locationId?: string;
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  paymentTerms?: PaymentTerms;
  currency?: string;
  shippingCharges?: number;
  amountPaid?: number;
  paymentMethod?: PaymentMethod;
  paymentDate?: string;
  transactionRef?: string;
  notes?: string;
  termsConditions?: string;
  bankDetails?: string;
  items?: InvoiceItemInput[];
}

export interface ListInvoicesParams {
  status?: InvoiceStatus | string;
  customerId?: string;
  customerName?: string;
  orderId?: string;
  locationId?: string;
  fromDate?: string;
  toDate?: string;
}

class InvoiceService {
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

  async getInvoices(params?: ListInvoicesParams): Promise<InvoiceSummary[]> {
    const query = new URLSearchParams();

    if (params?.status) query.append('status', params.status);
    if (params?.customerId) query.append('customerId', params.customerId);
    if (params?.customerName) query.append('customerName', params.customerName);
    if (params?.orderId) query.append('orderId', params.orderId);
    if (params?.locationId) query.append('locationId', params.locationId);
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);

    const url = `${API_BASE_URL}/invoices${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch invoices');
    }

    return result.data || [];
  }

  async createInvoice(data: CreateInvoiceRequest): Promise<InvoiceDetail> {
    const response = await fetch(`${API_BASE_URL}/invoices`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create invoice');
    }

    return result.data as InvoiceDetail;
  }

  async createInvoiceFromOrder(data: CreateInvoiceFromOrderRequest): Promise<InvoiceDetail> {
    const response = await fetch(`${API_BASE_URL}/invoices/from-order`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create invoice from order');
    }

    return result.data as InvoiceDetail;
  }

  async getInvoiceById(invoiceId: string): Promise<InvoiceDetail> {
    const response = await fetch(`${API_BASE_URL}/invoices/${encodeURIComponent(invoiceId)}`, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch invoice');
    }

    return result.data as InvoiceDetail;
  }

  async updateInvoice(invoiceId: string, data: UpdateInvoiceRequest): Promise<InvoiceDetail> {
    const response = await fetch(`${API_BASE_URL}/invoices/${encodeURIComponent(invoiceId)}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update invoice');
    }

    return result.data as InvoiceDetail;
  }

  async updateInvoiceStatus(invoiceId: string, status: InvoiceStatus): Promise<InvoiceSummary> {
    const response = await fetch(
      `${API_BASE_URL}/invoices/${encodeURIComponent(invoiceId)}/status`,
      {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status }),
      },
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update invoice status');
    }

    return result.data as InvoiceSummary;
  }

  async deleteInvoice(invoiceId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/invoices/${encodeURIComponent(invoiceId)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete invoice');
    }
  }
}

export const invoiceService = new InvoiceService();
