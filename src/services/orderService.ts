import { PrismaClient, OrderStatus, OrderPriority } from '@prisma/client';
import { globalPrisma } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import { CreateOrderData, ListOrderFilters } from '../types';

const prisma = globalPrisma;

export class OrderService {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.prisma = client;
  }

  private async generateOrderId(companyId: string): Promise<string> {
    try {
      const lastOrder = await this.prisma.orders.findFirst({
        where: { company_id: companyId },
        orderBy: { order_id: 'desc' },
        select: { order_id: true },
      });

      if (!lastOrder) {
        return 'SO001';
      }

      const numericPart = parseInt(lastOrder.order_id.substring(2), 10);
      const next = Number.isNaN(numericPart) ? 1 : numericPart + 1;
      return `SO${next.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating order ID:', error);
      return `SO${Date.now().toString().slice(-3)}`;
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

  async createOrder(companyId: string, data: CreateOrderData) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!data.items || data.items.length === 0) {
      throw new Error('At least one order item is required');
    }

    if (!data.orderDate) {
      throw new Error('orderDate is required');
    }

    const orderId = await this.generateOrderId(companyId);

    const result = await this.prisma.$transaction(async tx => {
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

      // Create order
      const order = await tx.orders.create({
        data: {
          id: uuidv4(),
          order_id: orderId,
          company_id: companyId,
          customer_id: data.customerId ?? null,
          customer_name: data.customerName,
          customer_code: data.customerCode ?? null,
          status: OrderStatus.DRAFT,
          priority: (data.priority as OrderPriority) ?? OrderPriority.NORMAL,
          order_date: data.orderDate,
          delivery_date: data.deliveryDate ?? null,
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
          customer_notes: data.customerNotes ?? null,
          location_id: data.locationId ?? null,
          shipping_address: data.shippingAddress ?? null,
          shipping_carrier: data.shippingCarrier ?? null,
          tracking_number: data.trackingNumber ?? null,
          shipping_method: data.shippingMethod ?? null,
          delivery_window_start: data.deliveryWindowStart ?? null,
          delivery_window_end: data.deliveryWindowEnd ?? null,
          is_active: true,
          updated_at: now,
        },
      });

      // Create order items
      await tx.order_items.createMany({
        data: itemsData.map(item => ({
          ...item,
          order_id: order.id,
        })),
      });

      // Fetch created items for response
      const createdItems = await tx.order_items.findMany({
        where: { order_id: order.id },
        orderBy: { line_number: 'asc' },
      });

      return {
        id: order.id,
        orderId: order.order_id,
        companyId: order.company_id,
        customerId: order.customer_id ?? undefined,
        customerName: order.customer_name,
        customerCode: order.customer_code ?? undefined,
        status: order.status,
        priority: order.priority,
        orderDate: order.order_date,
        deliveryDate: order.delivery_date ?? undefined,
        expectedDeliveryDate: order.expected_delivery_date ?? undefined,
        currency: order.currency,
        paymentTerms: order.payment_terms ?? undefined,
        referenceNumber: order.reference_number ?? undefined,
        subtotal: order.subtotal,
        discountAmount: order.discount_amount,
        taxAmount: order.tax_amount,
        shippingCharges: order.shipping_charges,
        totalAmount: order.total_amount,
        notes: order.notes ?? undefined,
        customerNotes: order.customer_notes ?? undefined,
        locationId: order.location_id ?? undefined,
        shippingAddress: order.shipping_address ?? undefined,
        shippingCarrier: order.shipping_carrier ?? undefined,
        trackingNumber: order.tracking_number ?? undefined,
        shippingMethod: order.shipping_method ?? undefined,
        deliveryWindowStart: order.delivery_window_start ?? undefined,
        deliveryWindowEnd: order.delivery_window_end ?? undefined,
        isActive: order.is_active,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        items: createdItems.map(i => ({
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
    });

    return result;
  }

  async getOrders(companyId: string, filters?: ListOrderFilters) {
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

    if (filters?.customerId) {
      where.customer_id = filters.customerId;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.order_date = {};
      if (filters.fromDate) {
        where.order_date.gte = filters.fromDate;
      }
      if (filters.toDate) {
        where.order_date.lte = filters.toDate;
      }
    }

    if (filters?.customerName) {
      where.customer_name = {
        contains: filters.customerName,
        mode: 'insensitive',
      };
    }

    const orders = await this.prisma.orders.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return orders.map(order => ({
      id: order.id,
      orderId: order.order_id,
      companyId: order.company_id,
      customerId: order.customer_id ?? undefined,
      customerName: order.customer_name,
      customerCode: order.customer_code ?? undefined,
      status: order.status,
      priority: order.priority,
      orderDate: order.order_date,
      deliveryDate: order.delivery_date ?? undefined,
      expectedDeliveryDate: order.expected_delivery_date ?? undefined,
      currency: order.currency,
      paymentTerms: order.payment_terms ?? undefined,
      referenceNumber: order.reference_number ?? undefined,
      subtotal: order.subtotal,
      discountAmount: order.discount_amount,
      taxAmount: order.tax_amount,
      shippingCharges: order.shipping_charges,
      totalAmount: order.total_amount,
      notes: order.notes ?? undefined,
      customerNotes: order.customer_notes ?? undefined,
      locationId: order.location_id ?? undefined,
      shippingAddress: order.shipping_address ?? undefined,
      shippingCarrier: order.shipping_carrier ?? undefined,
      trackingNumber: order.tracking_number ?? undefined,
      shippingMethod: order.shipping_method ?? undefined,
      deliveryWindowStart: order.delivery_window_start ?? undefined,
      deliveryWindowEnd: order.delivery_window_end ?? undefined,
      isActive: order.is_active,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      customer: order.customer,
    }));
  }

  async getOrderById(companyId: string, orderId: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!orderId || !orderId.trim()) {
      throw new Error('Missing required field: orderId');
    }

    const order = await this.prisma.orders.findFirst({
      where: {
        company_id: companyId,
        order_id: orderId,
        is_active: true,
      },
      include: {
        order_items: {
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
      },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    return {
      id: order.id,
      orderId: order.order_id,
      companyId: order.company_id,
      customerId: order.customer_id ?? undefined,
      customerName: order.customer_name,
      customerCode: order.customer_code ?? undefined,
      status: order.status,
      priority: order.priority,
      orderDate: order.order_date,
      deliveryDate: order.delivery_date ?? undefined,
      expectedDeliveryDate: order.expected_delivery_date ?? undefined,
      currency: order.currency,
      paymentTerms: order.payment_terms ?? undefined,
      referenceNumber: order.reference_number ?? undefined,
      subtotal: order.subtotal,
      discountAmount: order.discount_amount,
      taxAmount: order.tax_amount,
      shippingCharges: order.shipping_charges,
      totalAmount: order.total_amount,
      notes: order.notes ?? undefined,
      customerNotes: order.customer_notes ?? undefined,
      locationId: order.location_id ?? undefined,
      shippingAddress: order.shipping_address ?? undefined,
      shippingCarrier: order.shipping_carrier ?? undefined,
      trackingNumber: order.tracking_number ?? undefined,
      shippingMethod: order.shipping_method ?? undefined,
      deliveryWindowStart: order.delivery_window_start ?? undefined,
      deliveryWindowEnd: order.delivery_window_end ?? undefined,
      isActive: order.is_active,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      customer: order.customer,
      items: order.order_items.map(item => ({
        id: item.id,
        lineNumber: item.line_number,
        productId: item.product_id ?? undefined,
        itemCode: item.item_code,
        description: item.description ?? undefined,
        quantity: item.quantity,
        unitOfMeasure: item.unit_of_measure,
        unitPrice: item.unit_price,
        discountPercent: item.discount_percent,
        discountAmount: item.discount_amount,
        taxRate: item.tax_rate,
        taxAmount: item.tax_amount,
        lineAmount: item.line_amount,
        notes: item.notes ?? undefined,
        product: item.product,
      })),
    };
  }

  async updateOrder(companyId: string, orderId: string, data: Partial<CreateOrderData>) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!orderId || !orderId.trim()) {
      throw new Error('Missing required field: orderId');
    }

    const existing = await this.prisma.orders.findFirst({
      where: {
        company_id: companyId,
        order_id: orderId,
        is_active: true,
      },
    });

    if (!existing) {
      throw new Error('Order not found');
    }

    if (existing.status === OrderStatus.DELIVERED || existing.status === OrderStatus.CANCELLED) {
      throw new Error('Cannot update an order that is delivered or cancelled');
    }

    const result = await this.prisma.$transaction(async tx => {
      // Validate customer if customerId provided
      if (data.customerId !== undefined) {
        if (data.customerId) {
          const customer = await tx.customers.findFirst({
            where: { id: data.customerId, company_id: companyId },
            select: { id: true },
          });

          if (!customer) {
            throw new Error('Invalid customerId for this company');
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
      if (data.customerId !== undefined) updateData.customer_id = data.customerId ?? null;
      if (data.customerName !== undefined) updateData.customer_name = data.customerName;
      if (data.customerCode !== undefined) updateData.customer_code = data.customerCode ?? null;
      if (data.priority !== undefined) updateData.priority = data.priority as OrderPriority;
      if (data.orderDate !== undefined) updateData.order_date = data.orderDate;
      if (data.deliveryDate !== undefined) updateData.delivery_date = data.deliveryDate ?? null;
      if (data.expectedDeliveryDate !== undefined)
        updateData.expected_delivery_date = data.expectedDeliveryDate ?? null;
      if (data.currency !== undefined) updateData.currency = data.currency || 'INR';
      if (data.paymentTerms !== undefined) updateData.payment_terms = data.paymentTerms ?? null;
      if (data.referenceNumber !== undefined)
        updateData.reference_number = data.referenceNumber ?? null;
      if (data.notes !== undefined) updateData.notes = data.notes ?? null;
      if (data.customerNotes !== undefined) updateData.customer_notes = data.customerNotes ?? null;
      if (data.locationId !== undefined) updateData.location_id = data.locationId ?? null;
      if (data.shippingAddress !== undefined)
        updateData.shipping_address = data.shippingAddress ?? null;
      if (data.shippingCarrier !== undefined)
        updateData.shipping_carrier = data.shippingCarrier ?? null;
      if (data.trackingNumber !== undefined)
        updateData.tracking_number = data.trackingNumber ?? null;
      if (data.shippingMethod !== undefined)
        updateData.shipping_method = data.shippingMethod ?? null;
      if (data.deliveryWindowStart !== undefined)
        updateData.delivery_window_start = data.deliveryWindowStart ?? null;
      if (data.deliveryWindowEnd !== undefined)
        updateData.delivery_window_end = data.deliveryWindowEnd ?? null;

      // Recompute items and totals if items were provided
      if (data.items && data.items.length > 0) {
        let subtotal = 0;
        let totalDiscount = 0;
        let totalTax = 0;

        await tx.order_items.deleteMany({ where: { order_id: existing.id } });

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
            order_id: existing.id,
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

        await tx.order_items.createMany({ data: itemsData });

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

      const updatedOrder = await tx.orders.update({
        where: { id: existing.id },
        data: updateData,
      });

      const items = await tx.order_items.findMany({
        where: { order_id: existing.id },
        orderBy: { line_number: 'asc' },
      });

      return {
        id: updatedOrder.id,
        orderId: updatedOrder.order_id,
        companyId: updatedOrder.company_id,
        customerId: updatedOrder.customer_id ?? undefined,
        customerName: updatedOrder.customer_name,
        customerCode: updatedOrder.customer_code ?? undefined,
        status: updatedOrder.status,
        priority: updatedOrder.priority,
        orderDate: updatedOrder.order_date,
        deliveryDate: updatedOrder.delivery_date ?? undefined,
        expectedDeliveryDate: updatedOrder.expected_delivery_date ?? undefined,
        currency: updatedOrder.currency,
        paymentTerms: updatedOrder.payment_terms ?? undefined,
        referenceNumber: updatedOrder.reference_number ?? undefined,
        subtotal: updatedOrder.subtotal,
        discountAmount: updatedOrder.discount_amount,
        taxAmount: updatedOrder.tax_amount,
        shippingCharges: updatedOrder.shipping_charges,
        totalAmount: updatedOrder.total_amount,
        notes: updatedOrder.notes ?? undefined,
        customerNotes: updatedOrder.customer_notes ?? undefined,
        locationId: updatedOrder.location_id ?? undefined,
        shippingAddress: updatedOrder.shipping_address ?? undefined,
        shippingCarrier: updatedOrder.shipping_carrier ?? undefined,
        trackingNumber: updatedOrder.tracking_number ?? undefined,
        shippingMethod: updatedOrder.shipping_method ?? undefined,
        deliveryWindowStart: updatedOrder.delivery_window_start ?? undefined,
        deliveryWindowEnd: updatedOrder.delivery_window_end ?? undefined,
        isActive: updatedOrder.is_active,
        createdAt: updatedOrder.created_at,
        updatedAt: updatedOrder.updated_at,
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
    });

    return result;
  }

  private getAllowedNextStatuses(current: OrderStatus): OrderStatus[] {
    switch (current) {
      case OrderStatus.DRAFT:
        return [OrderStatus.CONFIRMED, OrderStatus.CANCELLED];
      case OrderStatus.CONFIRMED:
        return [OrderStatus.IN_PRODUCTION, OrderStatus.CANCELLED];
      case OrderStatus.IN_PRODUCTION:
        return [OrderStatus.READY_TO_SHIP, OrderStatus.CANCELLED];
      case OrderStatus.READY_TO_SHIP:
        return [OrderStatus.SHIPPED];
      case OrderStatus.SHIPPED:
        return [OrderStatus.DELIVERED];
      case OrderStatus.DELIVERED:
      case OrderStatus.CANCELLED:
      default:
        return [];
    }
  }

  async updateOrderStatus(
    companyId: string,
    orderId: string,
    newStatus: OrderStatus,
    data?: {
      deliveryDate?: Date;
      shippingCarrier?: string;
      trackingNumber?: string;
      shippingMethod?: string;
      deliveryWindowStart?: Date;
      deliveryWindowEnd?: Date;
    },
  ) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!orderId || !orderId.trim()) {
      throw new Error('Missing required field: orderId');
    }

    const existing = await this.prisma.orders.findFirst({
      where: {
        company_id: companyId,
        order_id: orderId,
        is_active: true,
      },
    });

    if (!existing) {
      throw new Error('Order not found');
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

    if (data?.deliveryDate !== undefined) {
      updateData.delivery_date = data.deliveryDate ?? null;
    }
    if (data?.shippingCarrier !== undefined) {
      updateData.shipping_carrier = data.shippingCarrier ?? null;
    }
    if (data?.trackingNumber !== undefined) {
      updateData.tracking_number = data.trackingNumber ?? null;
    }
    if (data?.shippingMethod !== undefined) {
      updateData.shipping_method = data.shippingMethod ?? null;
    }
    if (data?.deliveryWindowStart !== undefined) {
      updateData.delivery_window_start = data.deliveryWindowStart ?? null;
    }
    if (data?.deliveryWindowEnd !== undefined) {
      updateData.delivery_window_end = data.deliveryWindowEnd ?? null;
    }

    const updatedOrder = await this.prisma.orders.update({
      where: { id: existing.id },
      data: updateData,
    });

    return {
      id: updatedOrder.id,
      orderId: updatedOrder.order_id,
      companyId: updatedOrder.company_id,
      customerId: updatedOrder.customer_id ?? undefined,
      customerName: updatedOrder.customer_name,
      customerCode: updatedOrder.customer_code ?? undefined,
      status: updatedOrder.status,
      priority: updatedOrder.priority,
      orderDate: updatedOrder.order_date,
      deliveryDate: updatedOrder.delivery_date ?? undefined,
      expectedDeliveryDate: updatedOrder.expected_delivery_date ?? undefined,
      currency: updatedOrder.currency,
      paymentTerms: updatedOrder.payment_terms ?? undefined,
      referenceNumber: updatedOrder.reference_number ?? undefined,
      subtotal: updatedOrder.subtotal,
      discountAmount: updatedOrder.discount_amount,
      taxAmount: updatedOrder.tax_amount,
      shippingCharges: updatedOrder.shipping_charges,
      totalAmount: updatedOrder.total_amount,
      notes: updatedOrder.notes ?? undefined,
      customerNotes: updatedOrder.customer_notes ?? undefined,
      locationId: updatedOrder.location_id ?? undefined,
      shippingAddress: updatedOrder.shipping_address ?? undefined,
      shippingCarrier: updatedOrder.shipping_carrier ?? undefined,
      trackingNumber: updatedOrder.tracking_number ?? undefined,
      shippingMethod: updatedOrder.shipping_method ?? undefined,
      deliveryWindowStart: updatedOrder.delivery_window_start ?? undefined,
      deliveryWindowEnd: updatedOrder.delivery_window_end ?? undefined,
      isActive: updatedOrder.is_active,
      createdAt: updatedOrder.created_at,
      updatedAt: updatedOrder.updated_at,
    };
  }

  async deleteOrder(companyId: string, orderId: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!orderId || !orderId.trim()) {
      throw new Error('Missing required field: orderId');
    }

    const existing = await this.prisma.orders.findFirst({
      where: {
        company_id: companyId,
        order_id: orderId,
        is_active: true,
      },
    });

    if (!existing) {
      throw new Error('Order not found');
    }

    // Soft delete
    await this.prisma.orders.update({
      where: { id: existing.id },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });
  }
}

export const orderService = new OrderService();
