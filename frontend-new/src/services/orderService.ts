import { API_BASE_URL } from '../config/api';
import { AuthStorage } from '../utils/storage';


export type OrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'IN_PRODUCTION'
  | 'READY_TO_SHIP'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type OrderPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

export interface OrderItemInput {
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

export interface OrderItem {
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

export interface OrderSummary {
  id: string;
  orderId: string;
  companyId: string;
  customerId?: string;
  customerName: string;
  customerCode?: string;
  status: OrderStatus;
  priority: OrderPriority;
  orderDate: string;
  deliveryDate?: string;
  expectedDeliveryDate?: string;
  currency: string;
  paymentTerms?: string;
  referenceNumber?: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingCharges: number;
  totalAmount: number;
  notes?: string;
  customerNotes?: string;
  locationId?: string;
  shippingAddress?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  shippingMethod?: string;
  deliveryWindowStart?: string;
  deliveryWindowEnd?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface OrderDetail extends OrderSummary {
  items: OrderItem[];
  customer?: {
    id: string;
    name: string;
    code: string;
    email?: string;
    phone?: string;
  };
}

export interface CreateOrderRequest {
  customerId?: string;
  customerName: string;
  customerCode?: string;
  priority?: OrderPriority;
  orderDate: string; // ISO string
  deliveryDate?: string; // ISO string
  expectedDeliveryDate?: string; // ISO string
  currency?: string;
  paymentTerms?: string;
  referenceNumber?: string;
  notes?: string;
  customerNotes?: string;
  locationId?: string;
  shippingAddress?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  shippingMethod?: string;
  deliveryWindowStart?: string; // ISO string
  deliveryWindowEnd?: string; // ISO string
  shippingCharges?: number;
  items: OrderItemInput[];
}

export interface ListOrdersParams {
  status?: OrderStatus | string;
  priority?: OrderPriority | string;
  customerId?: string;
  from?: string; // ISO date string (date only is fine)
  to?: string;
  customerName?: string;
}

class OrderService {
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

  async getOrders(params?: ListOrdersParams): Promise<OrderSummary[]> {
    const query = new URLSearchParams();

    if (params?.status) query.append('status', params.status);
    if (params?.priority) query.append('priority', params.priority);
    if (params?.customerId) query.append('customerId', params.customerId);
    if (params?.from) query.append('from', params.from);
    if (params?.to) query.append('to', params.to);
    if (params?.customerName) query.append('customerName', params.customerName);

    const url = `${API_BASE_URL}/orders${query.toString() ? `?${query.toString()}` : ''}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch orders');
    }

    return result.data || [];
  }

  async createOrder(data: CreateOrderRequest): Promise<OrderDetail> {
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create order');
    }

    return result.data as OrderDetail;
  }

  async getOrderById(orderId: string): Promise<OrderDetail> {
    const response = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to fetch order');
    }

    return result.data as OrderDetail;
  }

  async updateOrder(orderId: string, data: Partial<CreateOrderRequest>): Promise<OrderDetail> {
    const response = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update order');
    }

    return result.data as OrderDetail;
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    payload?: {
      deliveryDate?: string;
      shippingCarrier?: string;
      trackingNumber?: string;
      shippingMethod?: string;
      deliveryWindowStart?: string;
      deliveryWindowEnd?: string;
    },
  ): Promise<OrderSummary> {
    const response = await fetch(
      `${API_BASE_URL}/orders/${encodeURIComponent(orderId)}/status`,
      {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status, ...(payload || {}) }),
      },
    );

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update order status');
    }

    return result.data as OrderSummary;
  }

  async deleteOrder(orderId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.message || 'Failed to delete order');
    }
  }
}

export const orderService = new OrderService();
