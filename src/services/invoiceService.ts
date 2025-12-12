import { PrismaClient, InvoiceStatus, PaymentMethod, PaymentTerms } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { CreateInvoiceData, UpdateInvoiceData, ListInvoiceFilters, InvoiceItemInput } from '../types';

const prisma = new PrismaClient();

export class InvoiceService {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.prisma = client;
  }

  private async generateInvoiceId(companyId: string): Promise<string> {
    try {
      // Get all invoice IDs for this company and find the max numeric value
      const invoices = await this.prisma.invoices.findMany({
        where: { company_id: companyId },
        select: { invoice_id: true },
      });

      if (invoices.length === 0) {
        return 'INV001';
      }

      // Extract numeric parts and find the maximum
      let maxNumber = 0;
      for (const inv of invoices) {
        const match = inv.invoice_id.match(/INV(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!Number.isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }

      const next = maxNumber + 1;
      return `INV${next.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating invoice ID:', error);
      // Use timestamp-based fallback to avoid collisions
      return `INV${Date.now().toString().slice(-6)}`;
    }
  }

  private calculateLineItemTotals(item: {
    quantity: number;
    unitPrice: number;
    discountPercent?: number;
    taxRate?: number;
  }) {
    const baseAmount = item.quantity * item.unitPrice;
    const discountPercent = item.discountPercent || 0;
    const taxRate = item.taxRate || 0;

    const discountAmount = (baseAmount * discountPercent) / 100;
    const amountAfterDiscount = baseAmount - discountAmount;
    const taxAmount = (amountAfterDiscount * taxRate) / 100;
    const lineAmount = amountAfterDiscount + taxAmount;

    return {
      discountAmount: Number(discountAmount.toFixed(2)),
      taxAmount: Number(taxAmount.toFixed(2)),
      lineAmount: Number(lineAmount.toFixed(2)),
    };
  }

  // Check if invoice can be deleted based on status
  private canDeleteInvoice(status: InvoiceStatus): boolean {
    // Only DRAFT invoices can be deleted
    return status === InvoiceStatus.DRAFT;
  }

  // Get deletion error message based on status
  private getDeletionErrorMessage(status: InvoiceStatus): string {
    switch (status) {
      case InvoiceStatus.SENT:
        return 'Cannot delete invoice that has been sent. Cancel it instead to maintain audit trail.';
      case InvoiceStatus.PARTIALLY_PAID:
        return 'Cannot delete invoice with partial payments. This would affect financial records.';
      case InvoiceStatus.PAID:
        return 'Cannot delete paid invoice. This would affect financial records and audit trail.';
      case InvoiceStatus.OVERDUE:
        return 'Cannot delete overdue invoice. Cancel it instead to maintain audit trail.';
      case InvoiceStatus.CANCELLED:
        return 'Cannot delete cancelled invoice. It must be kept for audit purposes.';
      default:
        return 'Cannot delete this invoice due to its current status.';
    }
  }

  async createInvoice(companyId: string, data: CreateInvoiceData) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('At least one invoice item is required');
    }

    if (!data.invoiceDate) {
      throw new Error('invoiceDate is required');
    }

    if (!data.dueDate) {
      throw new Error('dueDate is required');
    }

    if (!data.locationId) {
      throw new Error('locationId is required');
    }

    const invoiceId = await this.generateInvoiceId(companyId);

    const result = await this.prisma.$transaction(async tx => {
      // Validate location
      const location = await tx.company_locations.findFirst({
        where: { id: data.locationId, company_id: companyId, is_active: true },
        select: { id: true },
      });

      if (!location) {
        throw new Error('Invalid locationId for this company');
      }

      // Validate customer if customerId provided
      if (data.customerId) {
        const customer = await tx.customers.findFirst({
          where: { id: data.customerId, company_id: companyId },
          select: { id: true, name: true, code: true },
        });

        if (!customer) {
          throw new Error('Invalid customerId for this company');
        }
      }

      // Validate and fetch order if orderId provided
      let orderPk: string | null = null;
      if (data.orderId) {
        const order = await tx.orders.findFirst({
          where: { 
            company_id: companyId, 
            order_id: data.orderId,
            is_active: true,
          },
          select: { id: true, status: true },
        });

        if (!order) {
          throw new Error('Invalid orderId for this company');
        }

        if (order.status === 'CANCELLED') {
          throw new Error('Cannot create invoice for cancelled order');
        }

        orderPk = order.id;
      }

      // Validate items - if no order reference, product is required for each item
      if (!data.orderId) {
        for (let index = 0; index < data.items.length; index++) {
          const item = data.items[index];
          if (!item.productId) {
            throw new Error(`Product is required for item at index ${index} when not linked to a Sales Order`);
          }
        }
      }

      // Calculate totals
      let subtotal = 0;
      let totalDiscount = 0;
      let totalTax = 0;
      const now = new Date();

      const itemsData = [];

      for (let index = 0; index < data.items.length; index++) {
        const item = data.items[index];

        // Validate product if productId provided
        if (item.productId) {
          const product = await tx.products.findFirst({
            where: { id: item.productId, company_id: companyId },
            select: { id: true, product_code: true, name: true },
          });

          if (!product) {
            throw new Error(`Invalid productId for item at index ${index}`);
          }
        }

        const calculations = this.calculateLineItemTotals({
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          taxRate: item.taxRate,
        });

        subtotal += item.quantity * item.unitPrice;
        totalDiscount += calculations.discountAmount;
        totalTax += calculations.taxAmount;

        itemsData.push({
          id: uuidv4(),
          line_number: index + 1,
          product_id: item.productId ?? null,
          item_code: item.itemCode,
          description: item.description ?? null,
          quantity: item.quantity,
          unit_of_measure: item.unitOfMeasure,
          unit_price: item.unitPrice,
          discount_percent: item.discountPercent ?? 0,
          discount_amount: calculations.discountAmount,
          tax_rate: item.taxRate ?? 0,
          tax_amount: calculations.taxAmount,
          line_amount: calculations.lineAmount,
          notes: item.notes ?? null,
        });
      }

      const shippingCharges = data.shippingCharges ?? 0;
      const totalAmount = subtotal - totalDiscount + totalTax + shippingCharges;
      const balanceDue = totalAmount; // Initially, balance due equals total amount

      // Create invoice
      const invoice = await tx.invoices.create({
        data: {
          id: uuidv4(),
          invoice_id: invoiceId,
          company_id: companyId,
          customer_id: data.customerId ?? null,
          customer_name: data.customerName,
          customer_code: data.customerCode ?? null,
          order_id: orderPk,
          location_id: data.locationId,
          invoice_number: data.invoiceNumber ?? null,
          invoice_date: data.invoiceDate,
          due_date: data.dueDate,
          status: InvoiceStatus.DRAFT,
          payment_terms: (data.paymentTerms as PaymentTerms) ?? PaymentTerms.NET_30,
          currency: data.currency || 'INR',
          subtotal: subtotal,
          discount_amount: totalDiscount,
          tax_amount: totalTax,
          shipping_charges: shippingCharges,
          total_amount: totalAmount,
          amount_paid: 0,
          balance_due: balanceDue,
          notes: data.notes ?? null,
          terms_conditions: data.termsConditions ?? null,
          bank_details: data.bankDetails ?? null,
          is_active: true,
          updated_at: now,
        },
      });

      // Create invoice items
      await tx.invoice_items.createMany({
        data: itemsData.map(item => ({
          ...item,
          invoice_id: invoice.id,
        })),
      });

      // Fetch created items for response
      const createdItems = await tx.invoice_items.findMany({
        where: { invoice_id: invoice.id },
        orderBy: { line_number: 'asc' },
      });

      return this.toDto(invoice, createdItems);
    });

    return result;
  }

  async createInvoiceFromOrder(companyId: string, orderId: string, data: Partial<CreateInvoiceData>) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!orderId || !orderId.trim()) {
      throw new Error('Missing required field: orderId');
    }

    // Fetch order with items
    const order = await this.prisma.orders.findFirst({
      where: {
        company_id: companyId,
        order_id: orderId,
        is_active: true,
      },
      include: {
        order_items: {
          orderBy: { line_number: 'asc' },
        },
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'CANCELLED') {
      throw new Error('Cannot create invoice for cancelled order');
    }

    // Resolve location - use order's location or HQ
    let locationId = data.locationId || order.location_id;
    if (!locationId) {
      const hqLocation = await this.prisma.company_locations.findFirst({
        where: {
          company_id: companyId,
          is_headquarters: true,
          is_default: true,
          is_active: true,
        },
        select: { id: true },
      });

      if (!hqLocation) {
        throw new Error('No default headquarters location found. Please specify a locationId.');
      }
      locationId = hqLocation.id;
    }

    // Map order items to invoice items
    const items: InvoiceItemInput[] = order.order_items.map(item => ({
      productId: item.product_id ?? undefined,
      itemCode: item.item_code,
      description: item.description ?? undefined,
      quantity: Number(item.quantity),
      unitOfMeasure: item.unit_of_measure,
      unitPrice: Number(item.unit_price),
      discountPercent: Number(item.discount_percent),
      taxRate: Number(item.tax_rate),
      notes: item.notes ?? undefined,
    }));

    // Calculate due date based on payment terms
    const invoiceDate = data.invoiceDate || new Date();
    const paymentTerms = data.paymentTerms || 'NET_30';
    const dueDate = data.dueDate || this.calculateDueDate(invoiceDate, paymentTerms);

    return this.createInvoice(companyId, {
      customerId: order.customer_id ?? undefined,
      customerName: order.customer_name,
      customerCode: order.customer_code ?? undefined,
      orderId: orderId,
      locationId: locationId,
      invoiceNumber: data.invoiceNumber,
      invoiceDate: invoiceDate,
      dueDate: dueDate,
      paymentTerms: paymentTerms,
      currency: data.currency || order.currency,
      shippingCharges: data.shippingCharges ?? Number(order.shipping_charges),
      notes: data.notes,
      termsConditions: data.termsConditions,
      bankDetails: data.bankDetails,
      items: items,
    });
  }

  private calculateDueDate(invoiceDate: Date, paymentTerms: string): Date {
    const date = new Date(invoiceDate);
    switch (paymentTerms) {
      case 'IMMEDIATE':
        return date;
      case 'NET_15':
        date.setDate(date.getDate() + 15);
        return date;
      case 'NET_30':
        date.setDate(date.getDate() + 30);
        return date;
      case 'NET_60':
        date.setDate(date.getDate() + 60);
        return date;
      case 'NET_90':
        date.setDate(date.getDate() + 90);
        return date;
      case 'ADVANCE':
      case 'COD':
        return date;
      default:
        date.setDate(date.getDate() + 30);
        return date;
    }
  }

  async getInvoices(companyId: string, filters?: ListInvoiceFilters) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    const where: any = {
      company_id: companyId,
      is_active: true,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.customerId) {
      where.customer_id = filters.customerId;
    }

    if (filters?.orderId) {
      // Find order by order_id (business ID)
      const order = await this.prisma.orders.findFirst({
        where: { company_id: companyId, order_id: filters.orderId },
        select: { id: true },
      });
      if (order) {
        where.order_id = order.id;
      } else {
        return []; // No matching order
      }
    }

    if (filters?.locationId) {
      where.location_id = filters.locationId;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.invoice_date = {};
      if (filters.fromDate) {
        where.invoice_date.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.invoice_date.lte = filters.toDate;
      }
    }

    if (filters?.customerName) {
      where.customer_name = {
        contains: filters.customerName,
        mode: 'insensitive',
      };
    }

    const invoices = await this.prisma.invoices.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            location_id: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return invoices.map(invoice => this.toSummaryDto(invoice));
  }

  async getInvoiceById(companyId: string, invoiceId: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!invoiceId || !invoiceId.trim()) {
      throw new Error('Missing required field: invoiceId');
    }

    const invoice = await this.prisma.invoices.findFirst({
      where: {
        company_id: companyId,
        invoice_id: invoiceId,
        is_active: true,
      },
      include: {
        invoice_items: {
          orderBy: { line_number: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                product_code: true,
                name: true,
                unit_of_measure: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
            phone: true,
          },
        },
        location: {
          select: {
            id: true,
            name: true,
            location_id: true,
            address_line_1: true,
            city: true,
            state: true,
            country: true,
          },
        },
        order: {
          select: {
            id: true,
            order_id: true,
            status: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    return this.toDetailDto(invoice);
  }

  async updateInvoice(companyId: string, invoiceId: string, data: UpdateInvoiceData) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!invoiceId || !invoiceId.trim()) {
      throw new Error('Missing required field: invoiceId');
    }

    const existing = await this.prisma.invoices.findFirst({
      where: {
        company_id: companyId,
        invoice_id: invoiceId,
        is_active: true,
      },
    });

    if (!existing) {
      throw new Error('Invoice not found');
    }

    // Only DRAFT and SENT invoices can be fully edited
    if (existing.status !== InvoiceStatus.DRAFT && existing.status !== InvoiceStatus.SENT) {
      // For other statuses, only allow payment updates
      if (data.items || data.customerName || data.locationId) {
        throw new Error('Cannot modify invoice details after it has been partially paid or paid. Only payment information can be updated.');
      }
    }

    const result = await this.prisma.$transaction(async tx => {
      // Validate customer if customerId provided
      if (data.customerId !== undefined && data.customerId) {
        const customer = await tx.customers.findFirst({
          where: { id: data.customerId, company_id: companyId },
          select: { id: true },
        });

        if (!customer) {
          throw new Error('Invalid customerId for this company');
        }
      }

      // Validate location if provided
      if (data.locationId !== undefined && data.locationId) {
        const location = await tx.company_locations.findFirst({
          where: { id: data.locationId, company_id: companyId, is_active: true },
          select: { id: true },
        });

        if (!location) {
          throw new Error('Invalid locationId for this company');
        }
      }

      const now = new Date();
      const updateData: any = {
        updated_at: now,
      };

      // Update basic fields
      if (data.customerId !== undefined) updateData.customer_id = data.customerId ?? null;
      if (data.customerName !== undefined) updateData.customer_name = data.customerName;
      if (data.customerCode !== undefined) updateData.customer_code = data.customerCode ?? null;
      if (data.locationId !== undefined) updateData.location_id = data.locationId;
      if (data.invoiceNumber !== undefined) updateData.invoice_number = data.invoiceNumber ?? null;
      if (data.invoiceDate !== undefined) updateData.invoice_date = data.invoiceDate;
      if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
      if (data.paymentTerms !== undefined) updateData.payment_terms = data.paymentTerms as PaymentTerms;
      if (data.currency !== undefined) updateData.currency = data.currency || 'INR';
      if (data.notes !== undefined) updateData.notes = data.notes ?? null;
      if (data.termsConditions !== undefined) updateData.terms_conditions = data.termsConditions ?? null;
      if (data.bankDetails !== undefined) updateData.bank_details = data.bankDetails ?? null;

      // Update payment information
      if (data.amountPaid !== undefined) {
        updateData.amount_paid = data.amountPaid;
        // Recalculate balance due
        const totalAmount = Number(existing.total_amount);
        updateData.balance_due = totalAmount - data.amountPaid;

        // Auto-update status based on payment
        if (data.amountPaid >= totalAmount) {
          updateData.status = InvoiceStatus.PAID;
        } else if (data.amountPaid > 0) {
          updateData.status = InvoiceStatus.PARTIALLY_PAID;
        }
      }

      if (data.paymentMethod !== undefined) updateData.payment_method = data.paymentMethod as PaymentMethod;
      if (data.paymentDate !== undefined) updateData.payment_date = data.paymentDate ?? null;
      if (data.transactionRef !== undefined) updateData.transaction_ref = data.transactionRef ?? null;

      // Recompute items and totals if items were provided
      if (data.items && data.items.length > 0) {
        // Validate items - if invoice not linked to order, product is required
        if (!existing.order_id) {
          for (let index = 0; index < data.items.length; index++) {
            const item = data.items[index];
            if (!item.productId) {
              throw new Error(`Product is required for item at index ${index} when not linked to a Sales Order`);
            }
          }
        }

        let subtotal = 0;
        let totalDiscount = 0;
        let totalTax = 0;

        await tx.invoice_items.deleteMany({ where: { invoice_id: existing.id } });

        const itemsData = [];

        for (let index = 0; index < data.items.length; index++) {
          const item = data.items[index];

          // Validate product if productId provided
          if (item.productId) {
            const product = await tx.products.findFirst({
              where: { id: item.productId, company_id: companyId },
              select: { id: true },
            });

            if (!product) {
              throw new Error(`Invalid productId for item at index ${index}`);
            }
          }

          const calculations = this.calculateLineItemTotals({
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountPercent: item.discountPercent,
            taxRate: item.taxRate,
          });

          subtotal += item.quantity * item.unitPrice;
          totalDiscount += calculations.discountAmount;
          totalTax += calculations.taxAmount;

          itemsData.push({
            id: uuidv4(),
            invoice_id: existing.id,
            line_number: index + 1,
            product_id: item.productId ?? null,
            item_code: item.itemCode,
            description: item.description ?? null,
            quantity: item.quantity,
            unit_of_measure: item.unitOfMeasure,
            unit_price: item.unitPrice,
            discount_percent: item.discountPercent ?? 0,
            discount_amount: calculations.discountAmount,
            tax_rate: item.taxRate ?? 0,
            tax_amount: calculations.taxAmount,
            line_amount: calculations.lineAmount,
            notes: item.notes ?? null,
          });
        }

        await tx.invoice_items.createMany({ data: itemsData });

        const shippingCharges = data.shippingCharges ?? Number(existing.shipping_charges);
        const totalAmount = subtotal - totalDiscount + totalTax + shippingCharges;
        const amountPaid = data.amountPaid ?? Number(existing.amount_paid);
        const balanceDue = totalAmount - amountPaid;

        updateData.subtotal = subtotal;
        updateData.discount_amount = totalDiscount;
        updateData.tax_amount = totalTax;
        updateData.shipping_charges = shippingCharges;
        updateData.total_amount = totalAmount;
        updateData.balance_due = balanceDue;
      } else if (data.shippingCharges !== undefined) {
        // Recalculate total if only shipping charges changed
        const shippingCharges = data.shippingCharges ?? 0;
        const totalAmount =
          Number(existing.subtotal) -
          Number(existing.discount_amount) +
          Number(existing.tax_amount) +
          shippingCharges;
        const amountPaid = data.amountPaid ?? Number(existing.amount_paid);
        updateData.shipping_charges = shippingCharges;
        updateData.total_amount = totalAmount;
        updateData.balance_due = totalAmount - amountPaid;
      }

      const updatedInvoice = await tx.invoices.update({
        where: { id: existing.id },
        data: updateData,
      });

      const items = await tx.invoice_items.findMany({
        where: { invoice_id: existing.id },
        orderBy: { line_number: 'asc' },
      });

      return this.toDto(updatedInvoice, items);
    });

    return result;
  }

  async updateInvoiceStatus(companyId: string, invoiceId: string, newStatus: InvoiceStatus) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!invoiceId || !invoiceId.trim()) {
      throw new Error('Missing required field: invoiceId');
    }

    const existing = await this.prisma.invoices.findFirst({
      where: {
        company_id: companyId,
        invoice_id: invoiceId,
        is_active: true,
      },
    });

    if (!existing) {
      throw new Error('Invoice not found');
    }

    const allowedNext = this.getAllowedNextStatuses(existing.status);
    if (!allowedNext.includes(newStatus)) {
      throw new Error(`Invalid status transition from ${existing.status} to ${newStatus}`);
    }

    const now = new Date();

    const updatedInvoice = await this.prisma.invoices.update({
      where: { id: existing.id },
      data: {
        status: newStatus,
        updated_at: now,
      },
    });

    return this.toSummaryDto(updatedInvoice);
  }

  private getAllowedNextStatuses(current: InvoiceStatus): InvoiceStatus[] {
    switch (current) {
      case InvoiceStatus.DRAFT:
        return [InvoiceStatus.SENT, InvoiceStatus.CANCELLED];
      case InvoiceStatus.SENT:
        return [InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.OVERDUE, InvoiceStatus.CANCELLED];
      case InvoiceStatus.PARTIALLY_PAID:
        return [InvoiceStatus.PAID, InvoiceStatus.OVERDUE];
      case InvoiceStatus.OVERDUE:
        return [InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID];
      case InvoiceStatus.PAID:
      case InvoiceStatus.CANCELLED:
      default:
        return [];
    }
  }

  async deleteInvoice(companyId: string, invoiceId: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!invoiceId || !invoiceId.trim()) {
      throw new Error('Missing required field: invoiceId');
    }

    const existing = await this.prisma.invoices.findFirst({
      where: {
        company_id: companyId,
        invoice_id: invoiceId,
        is_active: true,
      },
    });

    if (!existing) {
      throw new Error('Invoice not found');
    }

    // Check if invoice can be deleted based on status
    if (!this.canDeleteInvoice(existing.status)) {
      throw new Error(this.getDeletionErrorMessage(existing.status));
    }

    // Soft delete
    await this.prisma.invoices.update({
      where: { id: existing.id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });
  }

  // DTO Mappers
  private toDto(invoice: any, items: any[]) {
    return {
      id: invoice.id,
      invoiceId: invoice.invoice_id,
      companyId: invoice.company_id,
      customerId: invoice.customer_id ?? undefined,
      customerName: invoice.customer_name,
      customerCode: invoice.customer_code ?? undefined,
      orderId: invoice.order_id ?? undefined,
      locationId: invoice.location_id,
      invoiceNumber: invoice.invoice_number ?? undefined,
      invoiceDate: invoice.invoice_date,
      dueDate: invoice.due_date,
      status: invoice.status,
      paymentTerms: invoice.payment_terms,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      discountAmount: invoice.discount_amount,
      taxAmount: invoice.tax_amount,
      shippingCharges: invoice.shipping_charges,
      totalAmount: invoice.total_amount,
      amountPaid: invoice.amount_paid,
      balanceDue: invoice.balance_due,
      paymentMethod: invoice.payment_method ?? undefined,
      paymentDate: invoice.payment_date ?? undefined,
      transactionRef: invoice.transaction_ref ?? undefined,
      notes: invoice.notes ?? undefined,
      termsConditions: invoice.terms_conditions ?? undefined,
      bankDetails: invoice.bank_details ?? undefined,
      isActive: invoice.is_active,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at,
      items: items.map(i => ({
        id: i.id,
        lineNumber: i.line_number,
        productId: i.product_id ?? undefined,
        itemCode: i.item_code,
        description: i.description ?? undefined,
        quantity: i.quantity,
        unitOfMeasure: i.unit_of_measure,
        unitPrice: i.unit_price,
        discountPercent: i.discount_percent,
        discountAmount: i.discount_amount,
        taxRate: i.tax_rate,
        taxAmount: i.tax_amount,
        lineAmount: i.line_amount,
        notes: i.notes ?? undefined,
      })),
    };
  }

  private toSummaryDto(invoice: any) {
    return {
      id: invoice.id,
      invoiceId: invoice.invoice_id,
      companyId: invoice.company_id,
      customerId: invoice.customer_id ?? undefined,
      customerName: invoice.customer_name,
      customerCode: invoice.customer_code ?? undefined,
      orderId: invoice.order_id ?? undefined,
      locationId: invoice.location_id,
      invoiceNumber: invoice.invoice_number ?? undefined,
      invoiceDate: invoice.invoice_date,
      dueDate: invoice.due_date,
      status: invoice.status,
      paymentTerms: invoice.payment_terms,
      currency: invoice.currency,
      totalAmount: invoice.total_amount,
      amountPaid: invoice.amount_paid,
      balanceDue: invoice.balance_due,
      isActive: invoice.is_active,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at,
      customer: invoice.customer,
      location: invoice.location,
    };
  }

  private toDetailDto(invoice: any) {
    return {
      id: invoice.id,
      invoiceId: invoice.invoice_id,
      companyId: invoice.company_id,
      customerId: invoice.customer_id ?? undefined,
      customerName: invoice.customer_name,
      customerCode: invoice.customer_code ?? undefined,
      orderId: invoice.order_id ?? undefined,
      locationId: invoice.location_id,
      invoiceNumber: invoice.invoice_number ?? undefined,
      invoiceDate: invoice.invoice_date,
      dueDate: invoice.due_date,
      status: invoice.status,
      paymentTerms: invoice.payment_terms,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      discountAmount: invoice.discount_amount,
      taxAmount: invoice.tax_amount,
      shippingCharges: invoice.shipping_charges,
      totalAmount: invoice.total_amount,
      amountPaid: invoice.amount_paid,
      balanceDue: invoice.balance_due,
      paymentMethod: invoice.payment_method ?? undefined,
      paymentDate: invoice.payment_date ?? undefined,
      transactionRef: invoice.transaction_ref ?? undefined,
      notes: invoice.notes ?? undefined,
      termsConditions: invoice.terms_conditions ?? undefined,
      bankDetails: invoice.bank_details ?? undefined,
      isActive: invoice.is_active,
      createdAt: invoice.created_at,
      updatedAt: invoice.updated_at,
      customer: invoice.customer,
      location: invoice.location,
      order: invoice.order ? {
        id: invoice.order.id,
        orderId: invoice.order.order_id,
        status: invoice.order.status,
      } : undefined,
      items: invoice.invoice_items.map((i: any) => ({
        id: i.id,
        lineNumber: i.line_number,
        productId: i.product_id ?? undefined,
        itemCode: i.item_code,
        description: i.description ?? undefined,
        quantity: i.quantity,
        unitOfMeasure: i.unit_of_measure,
        unitPrice: i.unit_price,
        discountPercent: i.discount_percent,
        discountAmount: i.discount_amount,
        taxRate: i.tax_rate,
        taxAmount: i.tax_amount,
        lineAmount: i.line_amount,
        notes: i.notes ?? undefined,
        product: i.product,
      })),
    };
  }
}

export const invoiceService = new InvoiceService();
