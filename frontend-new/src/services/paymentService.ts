import { API_BASE_URL } from '../config/api';

export type PaymentType = 'INVOICE_PAYMENT' | 'BILL_PAYMENT' | 'EXPENSE_PAYMENT' | 'REFUND' | 'ADVANCE' | 'OTHER';
export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
export type PaymentMethod = 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'OTHER';

export interface PaymentSummary {
  id: string;
  paymentId: string;
  companyId: string;
  paymentType: PaymentType;
  referenceType: string;
  referenceId: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: string;
  upiId?: string;
  partyType: string;
  partyId?: string;
  partyName: string;
  status: PaymentStatus;
  notes?: string;
  receiptUrl?: string;
  recordedBy?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RecordPaymentRequest {
  referenceType: 'INVOICE' | 'BILL' | 'EXPENSE';
  referenceId: string;
  amount: number;
  currency?: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  bankName?: string;
  chequeNumber?: string;
  chequeDate?: string;
  upiId?: string;
  notes?: string;
  receiptUrl?: string;
}

export interface ListPaymentsParams {
  paymentType?: string;
  referenceType?: string;
  partyType?: string;
  partyId?: string;
  status?: string;
  paymentMethod?: string;
  fromDate?: string;
  toDate?: string;
}

class PaymentService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async getPayments(params?: ListPaymentsParams): Promise<PaymentSummary[]> {
    const query = new URLSearchParams();

    if (params?.paymentType) query.append('paymentType', params.paymentType);
    if (params?.referenceType) query.append('referenceType', params.referenceType);
    if (params?.partyType) query.append('partyType', params.partyType);
    if (params?.partyId) query.append('partyId', params.partyId);
    if (params?.status) query.append('status', params.status);
    if (params?.paymentMethod) query.append('paymentMethod', params.paymentMethod);
    if (params?.fromDate) query.append('fromDate', params.fromDate);
    if (params?.toDate) query.append('toDate', params.toDate);

    const url = `${API_BASE_URL}/payments${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch payments');
    }

    const result = await response.json();
    return result.data || [];
  }

  async recordPayment(data: RecordPaymentRequest): Promise<PaymentSummary> {
    const response = await fetch(`${API_BASE_URL}/payments`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to record payment');
    }

    const result = await response.json();
    return result.data;
  }

  async getPaymentById(paymentId: string): Promise<PaymentSummary> {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch payment');
    }

    const result = await response.json();
    return result.data;
  }

  async getPaymentsByReference(referenceType: string, referenceId: string): Promise<PaymentSummary[]> {
    const response = await fetch(`${API_BASE_URL}/payments/reference/${referenceType}/${referenceId}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch payments');
    }

    const result = await response.json();
    return result.data || [];
  }

  async cancelPayment(paymentId: string): Promise<PaymentSummary> {
    const response = await fetch(`${API_BASE_URL}/payments/${paymentId}/cancel`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel payment');
    }

    const result = await response.json();
    return result.data;
  }
}

export const paymentService = new PaymentService();
