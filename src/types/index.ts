// Common interfaces for API responses and data structures

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface CreateCompanyData {
  name: string;
  slug?: string;
  industry: string;
  country: string;
  contactInfo: string; // emailOrPhone format
  establishedDate: Date;
  businessType: string;
  defaultLocation: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  taxId?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  certifications?: string[];
  isActive: boolean; // Always true for company creation (default: true)
}

export interface CreateLocationData {
  name: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  locationType?: 'BRANCH' | 'WAREHOUSE' | 'FACTORY' | 'STORE';
  isDefault?: boolean;
  isHeadquarters?: boolean;
  isActive?: boolean;
  imageUrl?: string;
  contactInfo?: Record<string, any>;
}

export interface UpdateLocationData {
  name?: string;
  email?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  locationType?: 'BRANCH' | 'WAREHOUSE' | 'FACTORY' | 'STORE';
  isDefault?: boolean;
  isHeadquarters?: boolean;
  isActive?: boolean;
  imageUrl?: string;
}

export interface OrderItemInput {
  lineNumber?: number;
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

export interface CreateOrderData {
  customerId?: string;
  customerName: string;
  customerCode?: string;
  priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  orderDate: Date;
  deliveryDate?: Date;
  expectedDeliveryDate?: Date;
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
  deliveryWindowStart?: Date;
  deliveryWindowEnd?: Date;
  shippingCharges?: number;
  items: OrderItemInput[];
}

export interface ListOrderFilters {
  status?: string;
  priority?: string;
  fromDate?: Date;
  toDate?: Date;
  customerName?: string;
  customerId?: string;
}

export type FinancialDocumentType = 'INVOICE' | 'BILL' | 'PURCHASE_ORDER';

export interface CreateFinancialDocumentBase {
  partyName: string;
  partyCode?: string;
  issueDate: Date;
  dueDate?: Date;
  currency?: string;
  subtotalAmount: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  locationId?: string;
}

export interface CreateInvoiceForOrderData extends CreateFinancialDocumentBase {
  orderId: string;
}

// Old CreateBillData removed - using new detailed version below

export interface PurchaseOrderItemInput {
  lineNumber?: number;
  productId?: string;
  itemCode: string;
  description?: string;
  quantity: number;
  unitOfMeasure: string;
  unitCost: number;
  discountPercent?: number;
  taxRate?: number;
  expectedDelivery?: Date;
  notes?: string;
}

export interface CreatePurchaseOrderData {
  supplierId?: string;
  supplierName: string;
  supplierCode?: string;
  priority?: 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
  poDate: Date;
  expectedDeliveryDate?: Date;
  currency?: string;
  paymentTerms?: string;
  referenceNumber?: string;
  notes?: string;
  termsConditions?: string;
  locationId?: string;
  deliveryAddress?: string;
  shippingMethod?: string;
  incoterms?: string;
  shippingCharges?: number;
  items: PurchaseOrderItemInput[];
}

export interface ListPurchaseOrderFilters {
  status?: string;
  priority?: string;
  fromDate?: Date;
  toDate?: Date;
  supplierName?: string;
  supplierId?: string;
}

export interface ListFinancialDocumentFilters {
  type?: FinancialDocumentType;
  fromDate?: Date;
  toDate?: Date;
  locationId?: string;
  orderId?: string;
}

// Invoice Management Types
export type InvoiceStatusType = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
export type PaymentMethodType = 'CASH' | 'CHEQUE' | 'BANK_TRANSFER' | 'UPI' | 'CARD' | 'OTHER';
export type PaymentTermsType = 'IMMEDIATE' | 'NET_15' | 'NET_30' | 'NET_60' | 'NET_90' | 'ADVANCE' | 'COD' | 'CREDIT';

export interface InvoiceItemInput {
  lineNumber?: number;
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

export interface CreateInvoiceData {
  customerId?: string;
  customerName: string;
  customerCode?: string;
  orderId?: string; // Optional link to Sales Order
  locationId: string; // Required
  invoiceNumber?: string;
  invoiceDate: Date;
  dueDate: Date;
  paymentTerms?: PaymentTermsType;
  currency?: string;
  shippingCharges?: number;
  notes?: string;
  termsConditions?: string;
  bankDetails?: string;
  items: InvoiceItemInput[];
}

export interface UpdateInvoiceData {
  customerId?: string;
  customerName?: string;
  customerCode?: string;
  locationId?: string;
  invoiceNumber?: string;
  invoiceDate?: Date;
  dueDate?: Date;
  paymentTerms?: PaymentTermsType;
  currency?: string;
  shippingCharges?: number;
  amountPaid?: number;
  paymentMethod?: PaymentMethodType;
  paymentDate?: Date;
  transactionRef?: string;
  notes?: string;
  termsConditions?: string;
  bankDetails?: string;
  items?: InvoiceItemInput[];
}

export interface ListInvoiceFilters {
  status?: InvoiceStatusType;
  fromDate?: Date;
  toDate?: Date;
  customerName?: string;
  customerId?: string;
  orderId?: string;
  locationId?: string;
}

// Bill Management Types
export type BillStatusType = 'DRAFT' | 'RECEIVED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface BillItemInput {
  lineNumber?: number;
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

export interface CreateBillData {
  supplierId?: string;
  supplierName: string;
  supplierCode?: string;
  purchaseOrderId?: string; // Optional link to Purchase Order
  locationId: string; // Required
  billNumber?: string;
  billDate: Date;
  dueDate: Date;
  paymentTerms?: PaymentTermsType;
  currency?: string;
  shippingCharges?: number;
  notes?: string;
  supplierInvoiceNo?: string;
  items: BillItemInput[];
}

export interface UpdateBillData {
  supplierId?: string;
  supplierName?: string;
  supplierCode?: string;
  locationId?: string;
  billNumber?: string;
  billDate?: Date;
  dueDate?: Date;
  paymentTerms?: PaymentTermsType;
  currency?: string;
  shippingCharges?: number;
  amountPaid?: number;
  paymentMethod?: PaymentMethodType;
  paymentDate?: Date;
  transactionRef?: string;
  notes?: string;
  supplierInvoiceNo?: string;
  items?: BillItemInput[];
}

export interface ListBillFilters {
  status?: BillStatusType;
  fromDate?: Date;
  toDate?: Date;
  supplierName?: string;
  supplierId?: string;
  purchaseOrderId?: string;
  locationId?: string;
}
