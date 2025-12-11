import { PrismaClient, DocumentType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateBillData,
  CreateInvoiceForOrderData,
  CreatePurchaseOrderData,
  ListFinancialDocumentFilters,
} from '../types';

const prisma = new PrismaClient();

export class FinancialDocumentService {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.prisma = client;
  }

  private getPrefix(type: DocumentType): string {
    switch (type) {
      case DocumentType.INVOICE:
        return 'INV';
      case DocumentType.BILL:
        return 'BILL';
      case DocumentType.PURCHASE_ORDER:
        return 'PO';
      default:
        return 'DOC';
    }
  }

  private async generateDocumentId(companyId: string, type: DocumentType): Promise<string> {
    const prefix = this.getPrefix(type);

    try {
      const lastDoc = await this.prisma.financial_documents.findFirst({
        where: {
          company_id: companyId,
          document_type: type,
        },
        orderBy: { document_id: 'desc' },
        select: { document_id: true },
      });

      if (!lastDoc) {
        return `${prefix}001`;
      }

      const numericPart = parseInt(lastDoc.document_id.replace(prefix, ''), 10);
      const next = Number.isNaN(numericPart) ? 1 : numericPart + 1;
      return `${prefix}${next.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating document ID:', error);
      return `${this.getPrefix(type)}${Date.now().toString().slice(-3)}`;
    }
  }

  private async resolveHqLocation(companyId: string) {
    const location = await this.prisma.company_locations.findFirst({
      where: {
        company_id: companyId,
        is_default: true,
        is_headquarters: true,
        is_active: true,
      },
      select: { id: true },
    });

    if (!location) {
      throw new Error('Default headquarters location not found for company');
    }

    return location.id;
  }

  private async validateLocation(companyId: string, locationId: string): Promise<void> {
    const location = await this.prisma.company_locations.findFirst({
      where: {
        id: locationId,
        company_id: companyId,
        is_active: true,
      },
      select: { id: true },
    });

    if (!location) {
      throw new Error('Invalid locationId for this company');
    }
  }

  async createInvoiceForOrder(companyId: string, data: CreateInvoiceForOrderData) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!data.orderId || !data.orderId.trim()) {
      throw new Error('Missing required field: orderId');
    }

    const order = await this.prisma.orders.findFirst({
      where: {
        company_id: companyId,
        order_id: data.orderId,
      },
      select: {
        id: true,
        status: true,
        total_amount: true,
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'CANCELLED') {
      throw new Error('Cannot create invoice for cancelled order');
    }

    const locationId = data.locationId
      ? await (async () => {
          await this.validateLocation(companyId, data.locationId!);
          return data.locationId!;
        })()
      : await this.resolveHqLocation(companyId);

    const documentId = await this.generateDocumentId(companyId, DocumentType.INVOICE);

    const now = new Date();

    const doc = await this.prisma.financial_documents.create({
      data: {
        id: uuidv4(),
        document_id: documentId,
        company_id: companyId,
        location_id: locationId,
        order_id: order.id,
        document_type: DocumentType.INVOICE,
        party_name: data.partyName,
        party_code: data.partyCode ?? null,
        issue_date: data.issueDate,
        due_date: data.dueDate ?? null,
        currency: data.currency || 'INR',
        subtotal_amount: data.subtotalAmount,
        tax_amount: data.taxAmount,
        total_amount: data.totalAmount,
        notes: data.notes ?? null,
        created_at: now,
        updated_at: now,
      },
    });

    return this.toDto(doc);
  }

  async createBill(companyId: string, data: CreateBillData) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    const locationId = await this.resolveHqLocation(companyId);
    const documentId = await this.generateDocumentId(companyId, DocumentType.BILL);
    const now = new Date();

    const doc = await this.prisma.financial_documents.create({
      data: {
        id: uuidv4(),
        document_id: documentId,
        company_id: companyId,
        location_id: locationId,
        order_id: null,
        document_type: DocumentType.BILL,
        party_name: data.supplierName,
        party_code: data.supplierCode ?? null,
        issue_date: data.billDate,
        due_date: data.dueDate ?? null,
        currency: data.currency || 'INR',
        subtotal_amount: data.subtotalAmount,
        tax_amount: data.taxAmount,
        total_amount: data.totalAmount,
        notes: data.notes ?? null,
        created_at: now,
        updated_at: now,
      },
    });

    return this.toDto(doc);
  }

  async createPurchaseOrder(companyId: string, data: CreatePurchaseOrderData) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!data.locationId || !data.locationId.trim()) {
      throw new Error('locationId is required for purchase orders');
    }

    await this.validateLocation(companyId, data.locationId);

    const documentId = await this.generateDocumentId(companyId, DocumentType.PURCHASE_ORDER);
    const now = new Date();

    const doc = await this.prisma.financial_documents.create({
      data: {
        id: uuidv4(),
        document_id: documentId,
        company_id: companyId,
        location_id: data.locationId,
        order_id: null,
        document_type: DocumentType.PURCHASE_ORDER,
        party_name: data.supplierName,
        party_code: data.supplierCode ?? null,
        issue_date: data.poDate,
        due_date: data.expectedDeliveryDate ?? null,
        currency: data.currency || 'INR',
        subtotal_amount: data.subtotalAmount,
        tax_amount: data.taxAmount,
        total_amount: data.totalAmount,
        notes: data.notes ?? null,
        created_at: now,
        updated_at: now,
      },
    });

    return this.toDto(doc);
  }

  async getFinancialDocuments(companyId: string, filters?: ListFinancialDocumentFilters) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    const where: any = {
      company_id: companyId,
    };

    if (filters?.type) {
      where.document_type = filters.type;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.issue_date = {};
      if (filters.fromDate) {
        where.issue_date.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.issue_date.lte = filters.toDate;
      }
    }

    if (filters?.locationId) {
      where.location_id = filters.locationId;
    }

    if (filters?.orderId) {
      // orderId is the business order_id, not PK
      const order = await this.prisma.orders.findFirst({
        where: {
          company_id: companyId,
          order_id: filters.orderId,
        },
        select: { id: true },
      });

      if (!order) {
        return [];
      }

      where.order_id = order.id;
    }

    const docs = await this.prisma.financial_documents.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    return docs.map(doc => this.toDto(doc));
  }

  private toDto(doc: any) {
    return {
      id: doc.id,
      documentId: doc.document_id,
      companyId: doc.company_id,
      locationId: doc.location_id,
      orderId: doc.order_id ?? undefined,
      documentType: doc.document_type,
      partyName: doc.party_name,
      partyCode: doc.party_code ?? undefined,
      issueDate: doc.issue_date,
      dueDate: doc.due_date ?? undefined,
      currency: doc.currency,
      subtotalAmount: doc.subtotal_amount,
      taxAmount: doc.tax_amount,
      totalAmount: doc.total_amount,
      notes: doc.notes ?? undefined,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    };
  }
}

export const financialDocumentService = new FinancialDocumentService();
