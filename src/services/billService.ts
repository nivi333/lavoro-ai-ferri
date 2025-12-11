import { PrismaClient, BillStatus, PaymentTerms, Prisma } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateBillData,
  UpdateBillData,
  ListBillFilters,
  BillItemInput,
  BillStatusType,
} from '../types';

const prisma = new PrismaClient();

/**
 * Bill Service
 * Handles all bill-related operations including CRUD, status management, and line item calculations
 */
export class BillService {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.prisma = client;
  }

  /**
   * Generate a unique bill ID (BILL001, BILL002, etc.)
   */
  private async generateBillId(companyId: string): Promise<string> {
    // Get the highest bill number for this company
    const lastBill = await this.prisma.bills.findFirst({
      where: { company_id: companyId },
      orderBy: { bill_id: 'desc' },
      select: { bill_id: true },
    });

    let nextNumber = 1;
    if (lastBill?.bill_id) {
      const match = lastBill.bill_id.match(/BILL(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `BILL${String(nextNumber).padStart(3, '0')}`;
  }

  /**
   * Calculate line item totals (discount, tax, line amount)
   */
  calculateLineItemTotals(item: BillItemInput): {
    discountAmount: number;
    taxAmount: number;
    lineAmount: number;
  } {
    const quantity = Number(item.quantity);
    const unitCost = Number(item.unitCost);
    const discountPercent = Number(item.discountPercent || 0);
    const taxRate = Number(item.taxRate || 0);

    const grossAmount = quantity * unitCost;
    const discountAmount = (grossAmount * discountPercent) / 100;
    const netAmount = grossAmount - discountAmount;
    const taxAmount = (netAmount * taxRate) / 100;
    const lineAmount = netAmount + taxAmount;

    return {
      discountAmount: Math.round(discountAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      lineAmount: Math.round(lineAmount * 100) / 100,
    };
  }

  /**
   * Create a new bill
   */
  async createBill(companyId: string, data: CreateBillData) {
    // Validate company exists
    const company = await this.prisma.companies.findUnique({
      where: { id: companyId },
    });
    if (!company) {
      throw new Error('Invalid company');
    }

    // Validate location exists and belongs to company
    const location = await this.prisma.company_locations.findFirst({
      where: { id: data.locationId, company_id: companyId },
    });
    if (!location) {
      throw new Error('Invalid location');
    }

    // Validate supplier if provided
    if (data.supplierId) {
      const supplier = await this.prisma.suppliers.findFirst({
        where: { id: data.supplierId, company_id: companyId },
      });
      if (!supplier) {
        throw new Error('Invalid supplier');
      }
    }

    // Validate purchase order if provided
    if (data.purchaseOrderId) {
      const po = await this.prisma.purchase_orders.findFirst({
        where: { id: data.purchaseOrderId, company_id: companyId },
      });
      if (!po) {
        throw new Error('Invalid purchase order');
      }
    }

    // Validate items - product is required if no PO reference
    if (!data.purchaseOrderId) {
      for (const item of data.items) {
        if (!item.productId) {
          throw new Error(
            'Product is required for each line item when not linked to a Purchase Order'
          );
        }
      }
    }

    // Validate products exist
    for (const item of data.items) {
      if (item.productId) {
        const product = await this.prisma.products.findFirst({
          where: { id: item.productId, company_id: companyId },
        });
        if (!product) {
          throw new Error(`Invalid product: ${item.productId}`);
        }
      }
    }

    // Generate bill ID
    const billId = await this.generateBillId(companyId);

    // Calculate line item totals and bill totals
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const itemsWithTotals = data.items.map((item, index) => {
      const totals = this.calculateLineItemTotals(item);
      subtotal += Number(item.quantity) * Number(item.unitCost);
      totalDiscount += totals.discountAmount;
      totalTax += totals.taxAmount;

      return {
        id: uuidv4(),
        product_id: item.productId || null,
        line_number: index + 1,
        item_code: item.itemCode,
        description: item.description || null,
        quantity: new Prisma.Decimal(item.quantity),
        unit_of_measure: item.unitOfMeasure,
        unit_cost: new Prisma.Decimal(item.unitCost),
        discount_percent: new Prisma.Decimal(item.discountPercent || 0),
        discount_amount: new Prisma.Decimal(totals.discountAmount),
        tax_rate: new Prisma.Decimal(item.taxRate || 0),
        tax_amount: new Prisma.Decimal(totals.taxAmount),
        line_amount: new Prisma.Decimal(totals.lineAmount),
        notes: item.notes || null,
      };
    });

    const shippingCharges = Number(data.shippingCharges || 0);
    const totalAmount = subtotal - totalDiscount + totalTax + shippingCharges;
    const balanceDue = totalAmount; // Initially, balance due equals total

    // Create bill with items in a transaction
    const bill = await this.prisma.$transaction(async tx => {
      const newBill = await tx.bills.create({
        data: {
          id: uuidv4(),
          bill_id: billId,
          company_id: companyId,
          supplier_id: data.supplierId || null,
          supplier_name: data.supplierName,
          supplier_code: data.supplierCode || null,
          purchase_order_id: data.purchaseOrderId || null,
          location_id: data.locationId,
          bill_number: data.billNumber || null,
          bill_date: new Date(data.billDate),
          due_date: new Date(data.dueDate),
          status: 'DRAFT',
          payment_terms: (data.paymentTerms as PaymentTerms) || 'NET_30',
          currency: data.currency || 'INR',
          subtotal: new Prisma.Decimal(subtotal),
          discount_amount: new Prisma.Decimal(totalDiscount),
          tax_amount: new Prisma.Decimal(totalTax),
          shipping_charges: new Prisma.Decimal(shippingCharges),
          total_amount: new Prisma.Decimal(totalAmount),
          amount_paid: new Prisma.Decimal(0),
          balance_due: new Prisma.Decimal(balanceDue),
          notes: data.notes || null,
          supplier_invoice_no: data.supplierInvoiceNo || null,
          is_active: true,
          updated_at: new Date(),
          bill_items: {
            create: itemsWithTotals,
          },
        },
        include: {
          bill_items: {
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
          supplier: {
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
          purchase_order: {
            select: {
              id: true,
              po_id: true,
              status: true,
            },
          },
        },
      });

      return newBill;
    });

    return this.toDto(bill);
  }

  /**
   * Create a bill from a Purchase Order (auto-fill items)
   */
  async createBillFromPurchaseOrder(
    companyId: string,
    purchaseOrderId: string,
    data: Partial<CreateBillData>
  ) {
    // Fetch the purchase order with items
    const po = await this.prisma.purchase_orders.findFirst({
      where: { id: purchaseOrderId, company_id: companyId },
      include: {
        purchase_order_items: {
          include: {
            product: true,
          },
        },
        supplier: true,
        location: true,
      },
    });

    if (!po) {
      throw new Error('Purchase order not found');
    }

    // Check PO status - should be at least CONFIRMED or RECEIVED
    if (po.status === 'DRAFT' || po.status === 'CANCELLED') {
      throw new Error('Cannot create bill from a draft or cancelled purchase order');
    }

    // Build bill data from PO
    // Calculate items
    const items = po.purchase_order_items.map(item => ({
      productId: item.product_id || undefined,
      itemCode: item.item_code,
      description: item.description || undefined,
      quantity: Number(item.quantity),
      unitOfMeasure: item.unit_of_measure,
      unitCost: Number(item.unit_cost),
      discountPercent: Number(item.discount_percent),
      taxRate: Number(item.tax_rate),
      notes: item.notes || undefined,
    }));

    // Calculate totals
    const subtotalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const taxAmount = items.reduce((sum, item) => {
      const gross = item.quantity * item.unitCost;
      const discount = (gross * (item.discountPercent || 0)) / 100;
      return sum + ((gross - discount) * (item.taxRate || 0)) / 100;
    }, 0);
    const shippingCharges = data.shippingCharges ?? Number(po.shipping_charges);
    const totalAmount = subtotalAmount + taxAmount + (shippingCharges || 0);

    // Build bill data from PO
    const billData: CreateBillData = {
      supplierId: po.supplier_id || undefined,
      supplierName: po.supplier_name,
      supplierCode: po.supplier_code || undefined,
      purchaseOrderId: po.id,
      locationId: data.locationId || po.location_id || '',
      billNumber: data.billNumber,
      billDate: data.billDate || new Date(),
      dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default 30 days
      paymentTerms: data.paymentTerms || (po.payment_terms as any) || 'NET_30',
      currency: data.currency || po.currency,
      shippingCharges: shippingCharges,
      notes: data.notes,
      supplierInvoiceNo: data.supplierInvoiceNo,
      items: items,
      subtotalAmount: subtotalAmount,
      taxAmount: taxAmount,
      totalAmount: totalAmount,
    };

    // Validate location
    if (!billData.locationId) {
      // Get default HQ location
      const hqLocation = await this.prisma.company_locations.findFirst({
        where: { company_id: companyId, is_headquarters: true, is_active: true },
      });
      if (!hqLocation) {
        throw new Error('No headquarters location found. Please specify a location.');
      }
      billData.locationId = hqLocation.id;
    }

    return this.createBill(companyId, billData);
  }

  /**
   * Get all bills for a company with optional filters
   */
  async getBills(companyId: string, filters?: ListBillFilters) {
    const where: Prisma.billsWhereInput = {
      company_id: companyId,
      is_active: true,
    };

    if (filters?.status) {
      where.status = filters.status as BillStatus;
    }
    if (filters?.supplierId) {
      where.supplier_id = filters.supplierId;
    }
    if (filters?.supplierName) {
      where.supplier_name = { contains: filters.supplierName, mode: 'insensitive' };
    }
    if (filters?.purchaseOrderId) {
      where.purchase_order_id = filters.purchaseOrderId;
    }
    if (filters?.locationId) {
      where.location_id = filters.locationId;
    }
    if (filters?.fromDate) {
      where.bill_date = { gte: filters.fromDate };
    }
    if (filters?.toDate) {
      where.bill_date = { ...((where.bill_date as any) || {}), lte: filters.toDate };
    }

    const bills = await this.prisma.bills.findMany({
      where,
      include: {
        supplier: {
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

    return bills.map(bill => this.toSummaryDto(bill));
  }

  /**
   * Get a single bill by ID
   */
  async getBillById(companyId: string, billId: string) {
    const bill = await this.prisma.bills.findFirst({
      where: {
        company_id: companyId,
        OR: [{ id: billId }, { bill_id: billId }],
      },
      include: {
        bill_items: {
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
          orderBy: { line_number: 'asc' },
        },
        supplier: {
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
          },
        },
        purchase_order: {
          select: {
            id: true,
            po_id: true,
            status: true,
          },
        },
      },
    });

    if (!bill) {
      throw new Error('Bill not found');
    }

    return this.toDto(bill);
  }

  /**
   * Update a bill
   */
  async updateBill(companyId: string, billId: string, data: UpdateBillData) {
    // Find existing bill
    const existingBill = await this.prisma.bills.findFirst({
      where: {
        company_id: companyId,
        OR: [{ id: billId }, { bill_id: billId }],
      },
    });

    if (!existingBill) {
      throw new Error('Bill not found');
    }

    // Check if bill can be modified (only DRAFT bills can have items modified)
    if (data.items && existingBill.status !== 'DRAFT') {
      throw new Error('Cannot modify line items of a non-draft bill');
    }

    // Validate location if provided
    if (data.locationId) {
      const location = await this.prisma.company_locations.findFirst({
        where: { id: data.locationId, company_id: companyId },
      });
      if (!location) {
        throw new Error('Invalid location');
      }
    }

    // Validate supplier if provided
    if (data.supplierId) {
      const supplier = await this.prisma.suppliers.findFirst({
        where: { id: data.supplierId, company_id: companyId },
      });
      if (!supplier) {
        throw new Error('Invalid supplier');
      }
    }

    // Validate products if items provided
    if (data.items) {
      for (const item of data.items) {
        if (item.productId) {
          const product = await this.prisma.products.findFirst({
            where: { id: item.productId, company_id: companyId },
          });
          if (!product) {
            throw new Error(`Invalid product: ${item.productId}`);
          }
        }
      }
    }

    // Calculate new totals if items are provided
    let updateData: any = {
      supplier_id: data.supplierId ?? existingBill.supplier_id,
      supplier_name: data.supplierName ?? existingBill.supplier_name,
      supplier_code: data.supplierCode ?? existingBill.supplier_code,
      location_id: data.locationId ?? existingBill.location_id,
      bill_number: data.billNumber ?? existingBill.bill_number,
      bill_date: data.billDate ? new Date(data.billDate) : existingBill.bill_date,
      due_date: data.dueDate ? new Date(data.dueDate) : existingBill.due_date,
      payment_terms: data.paymentTerms ?? existingBill.payment_terms,
      currency: data.currency ?? existingBill.currency,
      shipping_charges:
        data.shippingCharges !== undefined
          ? new Prisma.Decimal(data.shippingCharges)
          : existingBill.shipping_charges,
      payment_method: data.paymentMethod ?? existingBill.payment_method,
      payment_date: data.paymentDate ? new Date(data.paymentDate) : existingBill.payment_date,
      transaction_ref: data.transactionRef ?? existingBill.transaction_ref,
      notes: data.notes ?? existingBill.notes,
      supplier_invoice_no: data.supplierInvoiceNo ?? existingBill.supplier_invoice_no,
      updated_at: new Date(),
    };

    // Handle amount paid update
    if (data.amountPaid !== undefined) {
      const amountPaid = new Prisma.Decimal(data.amountPaid);
      const totalAmount = existingBill.total_amount;
      const balanceDue = totalAmount.minus(amountPaid);

      updateData.amount_paid = amountPaid;
      updateData.balance_due = balanceDue;

      // Auto-update status based on payment
      if (balanceDue.lessThanOrEqualTo(0)) {
        updateData.status = 'PAID';
      } else if (amountPaid.greaterThan(0)) {
        updateData.status = 'PARTIALLY_PAID';
      }
    }

    // Update bill with items in transaction
    const updatedBill = await this.prisma.$transaction(async tx => {
      // If items are provided, recalculate totals and replace items
      if (data.items && data.items.length > 0) {
        // Delete existing items
        await tx.bill_items.deleteMany({
          where: { bill_id: existingBill.id },
        });

        // Calculate new totals
        let subtotal = 0;
        let totalDiscount = 0;
        let totalTax = 0;

        const itemsWithTotals = data.items.map((item, index) => {
          const totals = this.calculateLineItemTotals(item);
          subtotal += Number(item.quantity) * Number(item.unitCost);
          totalDiscount += totals.discountAmount;
          totalTax += totals.taxAmount;

          return {
            id: uuidv4(),
            bill_id: existingBill.id,
            product_id: item.productId || null,
            line_number: index + 1,
            item_code: item.itemCode,
            description: item.description || null,
            quantity: new Prisma.Decimal(item.quantity),
            unit_of_measure: item.unitOfMeasure,
            unit_cost: new Prisma.Decimal(item.unitCost),
            discount_percent: new Prisma.Decimal(item.discountPercent || 0),
            discount_amount: new Prisma.Decimal(totals.discountAmount),
            tax_rate: new Prisma.Decimal(item.taxRate || 0),
            tax_amount: new Prisma.Decimal(totals.taxAmount),
            line_amount: new Prisma.Decimal(totals.lineAmount),
            notes: item.notes || null,
          };
        });

        // Create new items
        await tx.bill_items.createMany({
          data: itemsWithTotals,
        });

        const shippingCharges = Number(updateData.shipping_charges);
        const totalAmount = subtotal - totalDiscount + totalTax + shippingCharges;
        const amountPaid = Number(updateData.amount_paid || existingBill.amount_paid);
        const balanceDue = totalAmount - amountPaid;

        updateData.subtotal = new Prisma.Decimal(subtotal);
        updateData.discount_amount = new Prisma.Decimal(totalDiscount);
        updateData.tax_amount = new Prisma.Decimal(totalTax);
        updateData.total_amount = new Prisma.Decimal(totalAmount);
        updateData.balance_due = new Prisma.Decimal(balanceDue);
      }

      // Update bill
      return tx.bills.update({
        where: { id: existingBill.id },
        data: updateData,
        include: {
          bill_items: {
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
            orderBy: { line_number: 'asc' },
          },
          supplier: {
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
          purchase_order: {
            select: {
              id: true,
              po_id: true,
              status: true,
            },
          },
        },
      });
    });

    return this.toDto(updatedBill);
  }

  /**
   * Update bill status with validation
   */
  async updateBillStatus(companyId: string, billId: string, newStatus: BillStatusType) {
    const bill = await this.prisma.bills.findFirst({
      where: {
        company_id: companyId,
        OR: [{ id: billId }, { bill_id: billId }],
      },
    });

    if (!bill) {
      throw new Error('Bill not found');
    }

    // Validate status transition
    const allowedTransitions = this.getAllowedStatusTransitions(bill.status);
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from ${bill.status} to ${newStatus}. Allowed: ${allowedTransitions.join(', ')}`
      );
    }

    const updatedBill = await this.prisma.bills.update({
      where: { id: bill.id },
      data: {
        status: newStatus as BillStatus,
        updated_at: new Date(),
      },
      include: {
        supplier: {
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
    });

    return this.toSummaryDto(updatedBill);
  }

  /**
   * Get allowed status transitions for a given status
   */
  getAllowedStatusTransitions(currentStatus: BillStatus): BillStatusType[] {
    const transitions: Record<BillStatus, BillStatusType[]> = {
      DRAFT: ['RECEIVED', 'CANCELLED'],
      RECEIVED: ['PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED'],
      PARTIALLY_PAID: ['PAID', 'OVERDUE'],
      PAID: [],
      OVERDUE: ['PARTIALLY_PAID', 'PAID'],
      CANCELLED: [],
    };

    return transitions[currentStatus] || [];
  }

  /**
   * Delete a bill (soft delete - only DRAFT bills can be deleted)
   */
  async deleteBill(companyId: string, billId: string) {
    const bill = await this.prisma.bills.findFirst({
      where: {
        company_id: companyId,
        OR: [{ id: billId }, { bill_id: billId }],
      },
    });

    if (!bill) {
      throw new Error('Bill not found');
    }

    // Only DRAFT bills can be deleted
    if (bill.status !== 'DRAFT') {
      throw new Error(
        `Cannot delete bill with status ${bill.status}. Only DRAFT bills can be deleted to maintain audit trail and financial records.`
      );
    }

    // Soft delete by setting is_active to false
    await this.prisma.bills.update({
      where: { id: bill.id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    return { success: true, message: 'Bill deleted successfully' };
  }

  /**
   * Convert bill to summary DTO (for list views)
   */
  private toSummaryDto(bill: any) {
    return {
      id: bill.id,
      billId: bill.bill_id,
      companyId: bill.company_id,
      supplierId: bill.supplier_id,
      supplierName: bill.supplier_name,
      supplierCode: bill.supplier_code,
      purchaseOrderId: bill.purchase_order_id,
      locationId: bill.location_id,
      billNumber: bill.bill_number,
      billDate: bill.bill_date,
      dueDate: bill.due_date,
      status: bill.status,
      paymentTerms: bill.payment_terms,
      currency: bill.currency,
      totalAmount: Number(bill.total_amount),
      amountPaid: Number(bill.amount_paid),
      balanceDue: Number(bill.balance_due),
      isActive: bill.is_active,
      createdAt: bill.created_at,
      updatedAt: bill.updated_at,
      supplier: bill.supplier,
      location: bill.location,
    };
  }

  /**
   * Convert bill to full DTO (for detail views)
   */
  private toDto(bill: any) {
    return {
      id: bill.id,
      billId: bill.bill_id,
      companyId: bill.company_id,
      supplierId: bill.supplier_id,
      supplierName: bill.supplier_name,
      supplierCode: bill.supplier_code,
      purchaseOrderId: bill.purchase_order_id,
      locationId: bill.location_id,
      billNumber: bill.bill_number,
      billDate: bill.bill_date,
      dueDate: bill.due_date,
      status: bill.status,
      paymentTerms: bill.payment_terms,
      currency: bill.currency,
      subtotal: Number(bill.subtotal),
      discountAmount: Number(bill.discount_amount),
      taxAmount: Number(bill.tax_amount),
      shippingCharges: Number(bill.shipping_charges),
      totalAmount: Number(bill.total_amount),
      amountPaid: Number(bill.amount_paid),
      balanceDue: Number(bill.balance_due),
      paymentMethod: bill.payment_method,
      paymentDate: bill.payment_date,
      transactionRef: bill.transaction_ref,
      notes: bill.notes,
      supplierInvoiceNo: bill.supplier_invoice_no,
      isActive: bill.is_active,
      createdAt: bill.created_at,
      updatedAt: bill.updated_at,
      supplier: bill.supplier,
      location: bill.location,
      purchaseOrder: bill.purchase_order,
      items: bill.bill_items?.map((item: any) => ({
        id: item.id,
        lineNumber: item.line_number,
        productId: item.product_id,
        itemCode: item.item_code,
        description: item.description,
        quantity: Number(item.quantity),
        unitOfMeasure: item.unit_of_measure,
        unitCost: Number(item.unit_cost),
        discountPercent: Number(item.discount_percent),
        discountAmount: Number(item.discount_amount),
        taxRate: Number(item.tax_rate),
        taxAmount: Number(item.tax_amount),
        lineAmount: Number(item.line_amount),
        notes: item.notes,
        product: item.product,
      })),
    };
  }
}

export const billService = new BillService();
