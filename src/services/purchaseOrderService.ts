import { PrismaClient, POStatus, OrderPriority } from '@prisma/client';
import { globalPrisma } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import { CreatePurchaseOrderData, ListPurchaseOrderFilters } from '../types';

const prisma = globalPrisma;

export class PurchaseOrderService {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.prisma = client;
  }

  private async generatePOId(companyId: string): Promise<string> {
    try {
      const lastPO = await this.prisma.purchase_orders.findFirst({
        where: { company_id: companyId },
        orderBy: { po_id: 'desc' },
        select: { po_id: true },
      });

      if (!lastPO) {
        return 'PO001';
      }

      const numericPart = parseInt(lastPO.po_id.substring(2), 10);
      const next = Number.isNaN(numericPart) ? 1 : numericPart + 1;
      return `PO${next.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating PO ID:', error);
      return `PO${Date.now().toString().slice(-3)}`;
    }
  }

  private calculateLineItemTotals(item: {
    quantity: number;
    unitCost: number;
    discountPercent?: number;
    taxRate?: number;
  }) {
    const baseAmount = item.quantity * item.unitCost;
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

  async createPurchaseOrder(companyId: string, data: CreatePurchaseOrderData) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('At least one order item is required');
    }

    if (!data.poDate) {
      throw new Error('poDate is required');
    }

    const poId = await this.generatePOId(companyId);

    const result = await this.prisma.$transaction(async tx => {
      // Validate supplier if supplierId provided
      if (data.supplierId) {
        const supplier = await tx.suppliers.findFirst({
          where: { id: data.supplierId, company_id: companyId },
          select: { id: true, name: true, code: true },
        });

        if (!supplier) {
          throw new Error('Invalid supplierId for this company');
        }
      }

      // Validate location if provided
      if (data.locationId) {
        const location = await tx.company_locations.findFirst({
          where: { id: data.locationId, company_id: companyId },
          select: { id: true },
        });

        if (!location) {
          throw new Error('Invalid locationId for this company');
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
          unitCost: item.unitCost,
          discountPercent: item.discountPercent,
          taxRate: item.taxRate,
        });

        subtotal += item.quantity * item.unitCost;
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
          unit_cost: item.unitCost,
          discount_percent: item.discountPercent ?? 0,
          discount_amount: calculations.discountAmount,
          tax_rate: item.taxRate ?? 0,
          tax_amount: calculations.taxAmount,
          line_amount: calculations.lineAmount,
          expected_delivery: item.expectedDelivery ?? null,
          notes: item.notes ?? null,
        });
      }

      const shippingCharges = data.shippingCharges ?? 0;
      const totalAmount = subtotal - totalDiscount + totalTax + shippingCharges;

      // Create PO
      const po = await tx.purchase_orders.create({
        data: {
          id: uuidv4(),
          po_id: poId,
          company_id: companyId,
          supplier_id: data.supplierId ?? null,
          supplier_name: data.supplierName,
          supplier_code: data.supplierCode ?? null,
          status: POStatus.DRAFT,
          priority: (data.priority as OrderPriority) ?? OrderPriority.NORMAL,
          po_date: data.poDate,
          expected_delivery_date: data.expectedDeliveryDate ?? null,
          currency: data.currency || 'INR',
          payment_terms: data.paymentTerms ?? null,
          reference_number: data.referenceNumber ?? null,
          subtotal: subtotal,
          discount_amount: totalDiscount,
          tax_amount: totalTax,
          shipping_charges: shippingCharges,
          total_amount: totalAmount,
          notes: data.notes ?? null,
          terms_conditions: data.termsConditions ?? null,
          location_id: data.locationId ?? null,
          delivery_address: data.deliveryAddress ?? null,
          shipping_method: data.shippingMethod ?? null,
          incoterms: data.incoterms ?? null,
          is_active: true,
          updated_at: now,
        },
      });

      // Create PO items
      await tx.purchase_order_items.createMany({
        data: itemsData.map(item => ({
          ...item,
          po_id: po.id,
        })),
      });

      // Fetch created items for response
      const createdItems = await tx.purchase_order_items.findMany({
        where: { po_id: po.id },
        orderBy: { line_number: 'asc' },
      });

      return {
        id: po.id,
        poId: po.po_id,
        companyId: po.company_id,
        supplierId: po.supplier_id ?? undefined,
        supplierName: po.supplier_name,
        supplierCode: po.supplier_code ?? undefined,
        status: po.status,
        priority: po.priority,
        poDate: po.po_date,
        expectedDeliveryDate: po.expected_delivery_date ?? undefined,
        currency: po.currency,
        paymentTerms: po.payment_terms ?? undefined,
        referenceNumber: po.reference_number ?? undefined,
        subtotal: po.subtotal,
        discountAmount: po.discount_amount,
        taxAmount: po.tax_amount,
        shippingCharges: po.shipping_charges,
        totalAmount: po.total_amount,
        notes: po.notes ?? undefined,
        termsConditions: po.terms_conditions ?? undefined,
        locationId: po.location_id ?? undefined,
        deliveryAddress: po.delivery_address ?? undefined,
        shippingMethod: po.shipping_method ?? undefined,
        incoterms: po.incoterms ?? undefined,
        isActive: po.is_active,
        createdAt: po.created_at,
        updatedAt: po.updated_at,
        items: createdItems.map(i => ({
          id: i.id,
          lineNumber: i.line_number,
          productId: i.product_id ?? undefined,
          itemCode: i.item_code,
          description: i.description ?? undefined,
          quantity: i.quantity,
          unitOfMeasure: i.unit_of_measure,
          unitCost: i.unit_cost,
          discountPercent: i.discount_percent,
          discountAmount: i.discount_amount,
          taxRate: i.tax_rate,
          taxAmount: i.tax_amount,
          lineAmount: i.line_amount,
          expectedDelivery: i.expected_delivery ?? undefined,
          notes: i.notes ?? undefined,
        })),
      };
    });

    return result;
  }

  async getPurchaseOrders(companyId: string, filters?: ListPurchaseOrderFilters) {
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

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.supplierId) {
      where.supplier_id = filters.supplierId;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.po_date = {};
      if (filters.fromDate) {
        where.po_date.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.po_date.lte = filters.toDate;
      }
    }

    if (filters?.supplierName) {
      where.supplier_name = {
        contains: filters.supplierName,
        mode: 'insensitive',
      };
    }

    const pos = await this.prisma.purchase_orders.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return pos.map(po => ({
      id: po.id,
      poId: po.po_id,
      companyId: po.company_id,
      supplierId: po.supplier_id ?? undefined,
      supplierName: po.supplier_name,
      supplierCode: po.supplier_code ?? undefined,
      status: po.status,
      priority: po.priority,
      poDate: po.po_date,
      expectedDeliveryDate: po.expected_delivery_date ?? undefined,
      currency: po.currency,
      paymentTerms: po.payment_terms ?? undefined,
      referenceNumber: po.reference_number ?? undefined,
      subtotal: po.subtotal,
      discountAmount: po.discount_amount,
      taxAmount: po.tax_amount,
      shippingCharges: po.shipping_charges,
      totalAmount: po.total_amount,
      notes: po.notes ?? undefined,
      termsConditions: po.terms_conditions ?? undefined,
      locationId: po.location_id ?? undefined,
      deliveryAddress: po.delivery_address ?? undefined,
      shippingMethod: po.shipping_method ?? undefined,
      incoterms: po.incoterms ?? undefined,
      isActive: po.is_active,
      createdAt: po.created_at,
      updatedAt: po.updated_at,
      supplier: po.supplier,
    }));
  }

  async getPurchaseOrderById(companyId: string, poId: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!poId || !poId.trim()) {
      throw new Error('Missing required field: poId');
    }

    const po = await this.prisma.purchase_orders.findFirst({
      where: {
        company_id: companyId,
        po_id: poId,
        is_active: true,
      },
      include: {
        purchase_order_items: {
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
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!po) {
      throw new Error('Purchase Order not found');
    }

    return {
      id: po.id,
      poId: po.po_id,
      companyId: po.company_id,
      supplierId: po.supplier_id ?? undefined,
      supplierName: po.supplier_name,
      supplierCode: po.supplier_code ?? undefined,
      status: po.status,
      priority: po.priority,
      poDate: po.po_date,
      expectedDeliveryDate: po.expected_delivery_date ?? undefined,
      currency: po.currency,
      paymentTerms: po.payment_terms ?? undefined,
      referenceNumber: po.reference_number ?? undefined,
      subtotal: po.subtotal,
      discountAmount: po.discount_amount,
      taxAmount: po.tax_amount,
      shippingCharges: po.shipping_charges,
      totalAmount: po.total_amount,
      notes: po.notes ?? undefined,
      termsConditions: po.terms_conditions ?? undefined,
      locationId: po.location_id ?? undefined,
      deliveryAddress: po.delivery_address ?? undefined,
      shippingMethod: po.shipping_method ?? undefined,
      incoterms: po.incoterms ?? undefined,
      isActive: po.is_active,
      createdAt: po.created_at,
      updatedAt: po.updated_at,
      supplier: po.supplier,
      items: po.purchase_order_items.map(item => ({
        id: item.id,
        lineNumber: item.line_number,
        productId: item.product_id ?? undefined,
        itemCode: item.item_code,
        description: item.description ?? undefined,
        quantity: item.quantity,
        unitOfMeasure: item.unit_of_measure,
        unitCost: item.unit_cost,
        discountPercent: item.discount_percent,
        discountAmount: item.discount_amount,
        taxRate: item.tax_rate,
        taxAmount: item.tax_amount,
        lineAmount: item.line_amount,
        expectedDelivery: item.expected_delivery ?? undefined,
        notes: item.notes ?? undefined,
        product: item.product,
      })),
    };
  }

  async updatePurchaseOrder(companyId: string, poId: string, data: Partial<CreatePurchaseOrderData>) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!poId || !poId.trim()) {
      throw new Error('Missing required field: poId');
    }

    const existing = await this.prisma.purchase_orders.findFirst({
      where: {
        company_id: companyId,
        po_id: poId,
        is_active: true,
      },
    });

    if (!existing) {
      throw new Error('Purchase Order not found');
    }

    if (existing.status === POStatus.RECEIVED || existing.status === POStatus.CANCELLED) {
      throw new Error('Cannot update a PO that is received or cancelled');
    }

    const result = await this.prisma.$transaction(async tx => {
      // Validate supplier if supplierId provided
      if (data.supplierId !== undefined) {
        if (data.supplierId) {
          const supplier = await tx.suppliers.findFirst({
            where: { id: data.supplierId, company_id: companyId },
            select: { id: true },
          });

          if (!supplier) {
            throw new Error('Invalid supplierId for this company');
          }
        }
      }

      // Validate location if provided
      if (data.locationId !== undefined) {
        if (data.locationId) {
          const location = await tx.company_locations.findFirst({
            where: { id: data.locationId, company_id: companyId },
            select: { id: true },
          });

          if (!location) {
            throw new Error('Invalid locationId for this company');
          }
        }
      }

      const now = new Date();
      const updateData: any = {
        updated_at: now,
      };

      // Update basic fields
      if (data.supplierId !== undefined) updateData.supplier_id = data.supplierId ?? null;
      if (data.supplierName !== undefined) updateData.supplier_name = data.supplierName;
      if (data.supplierCode !== undefined) updateData.supplier_code = data.supplierCode ?? null;
      if (data.priority !== undefined) updateData.priority = data.priority as OrderPriority;
      if (data.poDate !== undefined) updateData.po_date = data.poDate;
      if (data.expectedDeliveryDate !== undefined)
        updateData.expected_delivery_date = data.expectedDeliveryDate ?? null;
      if (data.currency !== undefined) updateData.currency = data.currency || 'INR';
      if (data.paymentTerms !== undefined) updateData.payment_terms = data.paymentTerms ?? null;
      if (data.referenceNumber !== undefined)
        updateData.reference_number = data.referenceNumber ?? null;
      if (data.notes !== undefined) updateData.notes = data.notes ?? null;
      if (data.termsConditions !== undefined) updateData.terms_conditions = data.termsConditions ?? null;
      if (data.locationId !== undefined) updateData.location_id = data.locationId ?? null;
      if (data.deliveryAddress !== undefined)
        updateData.delivery_address = data.deliveryAddress ?? null;
      if (data.shippingMethod !== undefined)
        updateData.shipping_method = data.shippingMethod ?? null;
      if (data.incoterms !== undefined)
        updateData.incoterms = data.incoterms ?? null;

      // Recompute items and totals if items were provided
      if (data.items && data.items.length > 0) {
        let subtotal = 0;
        let totalDiscount = 0;
        let totalTax = 0;

        await tx.purchase_order_items.deleteMany({ where: { po_id: existing.id } });

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
            unitCost: item.unitCost,
            discountPercent: item.discountPercent,
            taxRate: item.taxRate,
          });

          subtotal += item.quantity * item.unitCost;
          totalDiscount += calculations.discountAmount;
          totalTax += calculations.taxAmount;

          itemsData.push({
            id: uuidv4(),
            po_id: existing.id,
            line_number: index + 1,
            product_id: item.productId ?? null,
            item_code: item.itemCode,
            description: item.description ?? null,
            quantity: item.quantity,
            unit_of_measure: item.unitOfMeasure,
            unit_cost: item.unitCost,
            discount_percent: item.discountPercent ?? 0,
            discount_amount: calculations.discountAmount,
            tax_rate: item.taxRate ?? 0,
            tax_amount: calculations.taxAmount,
            line_amount: calculations.lineAmount,
            expected_delivery: item.expectedDelivery ?? null,
            notes: item.notes ?? null,
          });
        }

        await tx.purchase_order_items.createMany({ data: itemsData });

        const shippingCharges = data.shippingCharges ?? existing.shipping_charges;
        const totalAmount = subtotal - totalDiscount + totalTax + Number(shippingCharges);

        updateData.subtotal = subtotal;
        updateData.discount_amount = totalDiscount;
        updateData.tax_amount = totalTax;
        updateData.shipping_charges = shippingCharges;
        updateData.total_amount = totalAmount;
      } else if (data.shippingCharges !== undefined) {
        // Recalculate total if only shipping charges changed
        const shippingCharges = data.shippingCharges ?? 0;
        const totalAmount =
          Number(existing.subtotal) -
          Number(existing.discount_amount) +
          Number(existing.tax_amount) +
          shippingCharges;
        updateData.shipping_charges = shippingCharges;
        updateData.total_amount = totalAmount;
      }

      const updatedPO = await tx.purchase_orders.update({
        where: { id: existing.id },
        data: updateData,
      });

      const items = await tx.purchase_order_items.findMany({
        where: { po_id: existing.id },
        orderBy: { line_number: 'asc' },
      });

      return {
        id: updatedPO.id,
        poId: updatedPO.po_id,
        companyId: updatedPO.company_id,
        supplierId: updatedPO.supplier_id ?? undefined,
        supplierName: updatedPO.supplier_name,
        supplierCode: updatedPO.supplier_code ?? undefined,
        status: updatedPO.status,
        priority: updatedPO.priority,
        poDate: updatedPO.po_date,
        expectedDeliveryDate: updatedPO.expected_delivery_date ?? undefined,
        currency: updatedPO.currency,
        paymentTerms: updatedPO.payment_terms ?? undefined,
        referenceNumber: updatedPO.reference_number ?? undefined,
        subtotal: updatedPO.subtotal,
        discountAmount: updatedPO.discount_amount,
        taxAmount: updatedPO.tax_amount,
        shippingCharges: updatedPO.shipping_charges,
        totalAmount: updatedPO.total_amount,
        notes: updatedPO.notes ?? undefined,
        termsConditions: updatedPO.terms_conditions ?? undefined,
        locationId: updatedPO.location_id ?? undefined,
        deliveryAddress: updatedPO.delivery_address ?? undefined,
        shippingMethod: updatedPO.shipping_method ?? undefined,
        incoterms: updatedPO.incoterms ?? undefined,
        isActive: updatedPO.is_active,
        createdAt: updatedPO.created_at,
        updatedAt: updatedPO.updated_at,
        items: items.map(i => ({
          id: i.id,
          lineNumber: i.line_number,
          productId: i.product_id ?? undefined,
          itemCode: i.item_code,
          description: i.description ?? undefined,
          quantity: i.quantity,
          unitOfMeasure: i.unit_of_measure,
          unitCost: i.unit_cost,
          discountPercent: i.discount_percent,
          discountAmount: i.discount_amount,
          taxRate: i.tax_rate,
          taxAmount: i.tax_amount,
          lineAmount: i.line_amount,
          expectedDelivery: i.expected_delivery ?? undefined,
          notes: i.notes ?? undefined,
        })),
      };
    });

    return result;
  }

  private getAllowedNextStatuses(current: POStatus): POStatus[] {
    switch (current) {
      case POStatus.DRAFT:
        return [POStatus.SENT, POStatus.CANCELLED];
      case POStatus.SENT:
        return [POStatus.CONFIRMED, POStatus.CANCELLED];
      case POStatus.CONFIRMED:
        return [POStatus.PARTIALLY_RECEIVED, POStatus.RECEIVED, POStatus.CANCELLED];
      case POStatus.PARTIALLY_RECEIVED:
        return [POStatus.RECEIVED];
      case POStatus.RECEIVED:
      case POStatus.CANCELLED:
      default:
        return [];
    }
  }

  async updatePOStatus(
    companyId: string,
    poId: string,
    newStatus: POStatus,
    data?: {
      expectedDeliveryDate?: Date;
      shippingMethod?: string;
    },
  ) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!poId || !poId.trim()) {
      throw new Error('Missing required field: poId');
    }

    const existing = await this.prisma.purchase_orders.findFirst({
      where: {
        company_id: companyId,
        po_id: poId,
        is_active: true,
      },
    });

    if (!existing) {
      throw new Error('Purchase Order not found');
    }

    const allowedNext = this.getAllowedNextStatuses(existing.status);
    if (!allowedNext.includes(newStatus)) {
      throw new Error('Invalid status transition');
    }

    const now = new Date();

    const updateData: any = {
      status: newStatus,
      updated_at: now,
    };

    if (data?.expectedDeliveryDate !== undefined) {
      updateData.expected_delivery_date = data.expectedDeliveryDate ?? null;
    }
    if (data?.shippingMethod !== undefined) {
      updateData.shipping_method = data.shippingMethod ?? null;
    }

    const updatedPO = await this.prisma.purchase_orders.update({
      where: { id: existing.id },
      data: updateData,
    });

    return {
      id: updatedPO.id,
      poId: updatedPO.po_id,
      status: updatedPO.status,
      updatedAt: updatedPO.updated_at,
    };
  }

  async deletePurchaseOrder(companyId: string, poId: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!poId || !poId.trim()) {
      throw new Error('Missing required field: poId');
    }

    const existing = await this.prisma.purchase_orders.findFirst({
      where: {
        company_id: companyId,
        po_id: poId,
        is_active: true,
      },
    });

    if (!existing) {
      throw new Error('Purchase Order not found');
    }

    if (existing.status !== POStatus.DRAFT) {
      throw new Error('Only DRAFT purchase orders can be deleted');
    }

    // Soft delete
    await this.prisma.purchase_orders.update({
      where: { id: existing.id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });

    return true;
  }
}

export const purchaseOrderService = new PurchaseOrderService();
