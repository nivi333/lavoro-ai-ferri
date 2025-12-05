import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface CreateCustomerData {
  companyId: string;
  name: string;
  customerType?: string;
  companyName?: string;
  customerCategory?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;
  // Billing Address
  billingAddressLine1?: string;
  billingAddressLine2?: string;
  billingCity?: string;
  billingState?: string;
  billingCountry?: string;
  billingPostalCode?: string;
  // Shipping Address
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingCountry?: string;
  shippingPostalCode?: string;
  sameAsBillingAddress?: boolean;
  // Financial Information
  paymentTerms?: string;
  creditLimit?: number;
  currency?: string;
  taxId?: string;
  panNumber?: string;
  // Additional Information
  assignedSalesRep?: string;
  notes?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface UpdateCustomerData extends Partial<CreateCustomerData> {}

export interface CustomerFilters {
  search?: string;
  customerType?: string;
  customerCategory?: string;
  isActive?: boolean;
  paymentTerms?: string;
  currency?: string;
  assignedSalesRep?: string;
  page?: number;
  limit?: number;
}

class CustomerService {
  // Generate Customer Code (CUST-001, etc.)
  private async generateCustomerCode(companyId: string): Promise<string> {
    const lastCustomer = await prisma.customers.findFirst({
      where: { company_id: companyId },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    if (!lastCustomer) {
      return 'CUST-001';
    }

    try {
      const lastNumber = parseInt(lastCustomer.code.split('-')[1]);
      const nextNumber = lastNumber + 1;
      return `CUST-${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      return `CUST-${Date.now().toString().slice(-4)}`;
    }
  }

  async createCustomer(data: CreateCustomerData) {
    const { companyId, ...customerData } = data;

    // Validate company exists
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // Validate conditional fields
    if (customerData.customerType === 'BUSINESS' && !customerData.companyName) {
      throw new Error('Company name is required when customer type is BUSINESS');
    }

    // Handle same as billing address logic
    if (customerData.sameAsBillingAddress) {
      customerData.shippingAddressLine1 = customerData.billingAddressLine1;
      customerData.shippingAddressLine2 = customerData.billingAddressLine2;
      customerData.shippingCity = customerData.billingCity;
      customerData.shippingState = customerData.billingState;
      customerData.shippingCountry = customerData.billingCountry;
      customerData.shippingPostalCode = customerData.billingPostalCode;
    }

    const code = await this.generateCustomerCode(companyId);

    return await prisma.customers.create({
      data: {
        customer_id: uuidv4(), // Internal unique ID
        company_id: companyId,
        code,
        name: customerData.name,
        customer_type: customerData.customerType || 'RETAIL',
        company_name: customerData.companyName,
        customer_category: customerData.customerCategory,
        email: customerData.email,
        phone: customerData.phone,
        alternate_phone: customerData.alternatePhone,
        website: customerData.website,
        // Billing Address
        billing_address_line_1: customerData.billingAddressLine1,
        billing_address_line_2: customerData.billingAddressLine2,
        billing_city: customerData.billingCity,
        billing_state: customerData.billingState,
        billing_country: customerData.billingCountry,
        billing_postal_code: customerData.billingPostalCode,
        // Shipping Address
        shipping_address_line_1: customerData.shippingAddressLine1,
        shipping_address_line_2: customerData.shippingAddressLine2,
        shipping_city: customerData.shippingCity,
        shipping_state: customerData.shippingState,
        shipping_country: customerData.shippingCountry,
        shipping_postal_code: customerData.shippingPostalCode,
        same_as_billing_address: customerData.sameAsBillingAddress ?? true,
        // Financial Information
        payment_terms: customerData.paymentTerms,
        credit_limit: customerData.creditLimit,
        currency: customerData.currency || 'INR',
        tax_id: customerData.taxId,
        pan_number: customerData.panNumber,
        // Additional Information
        assigned_sales_rep: customerData.assignedSalesRep,
        notes: customerData.notes,
        tags: customerData.tags || [],
        is_active: customerData.isActive ?? true,
        updated_at: new Date(),
      },
    });
  }

  async getCustomers(companyId: string, filters: CustomerFilters) {
    const {
      search,
      customerType,
      customerCategory,
      isActive,
      paymentTerms,
      currency,
      assignedSalesRep,
      page = 1,
      limit = 10,
    } = filters;
    const skip = (page - 1) * limit;

    const where: any = {
      company_id: companyId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (customerType) {
      where.customer_type = customerType;
    }

    if (customerCategory) {
      where.customer_category = customerCategory;
    }

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    if (paymentTerms) {
      where.payment_terms = paymentTerms;
    }

    if (currency) {
      where.currency = currency;
    }

    if (assignedSalesRep) {
      where.assigned_sales_rep = assignedSalesRep;
    }

    const [customers, total] = await Promise.all([
      prisma.customers.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.customers.count({ where }),
    ]);

    return {
      customers: customers.map(this.mapCustomer),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCustomerById(companyId: string, customerId: string) {
    const customer = await prisma.customers.findFirst({
      where: {
        id: customerId,
        company_id: companyId,
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    return this.mapCustomer(customer);
  }

  async updateCustomer(customerId: string, data: UpdateCustomerData) {
    const { companyId, ...updateData } = data;

    // Build the where clause
    const whereClause: any = { id: customerId };
    if (companyId) {
      whereClause.company_id = companyId;
    }

    // Check if customer exists
    const existingCustomer = await prisma.customers.findUnique({
      where: whereClause,
    });

    if (!existingCustomer) {
      throw new Error('Customer not found');
    }

    // Validate conditional fields
    if (updateData.customerType === 'BUSINESS' && !updateData.companyName) {
      throw new Error('Company name is required when customer type is BUSINESS');
    }

    // Handle same as billing address logic
    if (updateData.sameAsBillingAddress) {
      updateData.shippingAddressLine1 =
        updateData.billingAddressLine1 || existingCustomer.billing_address_line_1;
      updateData.shippingAddressLine2 =
        updateData.billingAddressLine2 || existingCustomer.billing_address_line_2;
      updateData.shippingCity = updateData.billingCity || existingCustomer.billing_city;
      updateData.shippingState = updateData.billingState || existingCustomer.billing_state;
      updateData.shippingCountry = updateData.billingCountry || existingCustomer.billing_country;
      updateData.shippingPostalCode =
        updateData.billingPostalCode || existingCustomer.billing_postal_code;
    }

    return await prisma.customers.update({
      where: whereClause,
      data: {
        name: updateData.name,
        customer_type: updateData.customerType,
        company_name: updateData.companyName,
        customer_category: updateData.customerCategory,
        email: updateData.email,
        phone: updateData.phone,
        alternate_phone: updateData.alternatePhone,
        website: updateData.website,
        // Billing Address
        billing_address_line_1: updateData.billingAddressLine1,
        billing_address_line_2: updateData.billingAddressLine2,
        billing_city: updateData.billingCity,
        billing_state: updateData.billingState,
        billing_country: updateData.billingCountry,
        billing_postal_code: updateData.billingPostalCode,
        // Shipping Address
        shipping_address_line_1: updateData.shippingAddressLine1,
        shipping_address_line_2: updateData.shippingAddressLine2,
        shipping_city: updateData.shippingCity,
        shipping_state: updateData.shippingState,
        shipping_country: updateData.shippingCountry,
        shipping_postal_code: updateData.shippingPostalCode,
        same_as_billing_address: updateData.sameAsBillingAddress,
        // Financial Information
        payment_terms: updateData.paymentTerms,
        credit_limit: updateData.creditLimit,
        currency: updateData.currency,
        tax_id: updateData.taxId,
        pan_number: updateData.panNumber,
        // Additional Information
        assigned_sales_rep: updateData.assignedSalesRep,
        notes: updateData.notes,
        tags: updateData.tags,
        is_active: updateData.isActive,
        updated_at: new Date(),
      },
    });
  }

  async deleteCustomer(companyId: string, customerId: string) {
    const customer = await prisma.customers.findFirst({
      where: {
        id: customerId,
        company_id: companyId,
      },
    });

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Soft delete
    await prisma.customers.update({
      where: { id: customerId },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });
  }

  private mapCustomer(customer: any) {
    return {
      id: customer.id,
      customerId: customer.customer_id,
      code: customer.code,
      name: customer.name,
      customerType: customer.customer_type,
      companyName: customer.company_name,
      customerCategory: customer.customer_category,
      email: customer.email,
      phone: customer.phone,
      alternatePhone: customer.alternate_phone,
      website: customer.website,
      // Billing Address
      billingAddressLine1: customer.billing_address_line_1,
      billingAddressLine2: customer.billing_address_line_2,
      billingCity: customer.billing_city,
      billingState: customer.billing_state,
      billingCountry: customer.billing_country,
      billingPostalCode: customer.billing_postal_code,
      // Shipping Address
      shippingAddressLine1: customer.shipping_address_line_1,
      shippingAddressLine2: customer.shipping_address_line_2,
      shippingCity: customer.shipping_city,
      shippingState: customer.shipping_state,
      shippingCountry: customer.shipping_country,
      shippingPostalCode: customer.shipping_postal_code,
      sameAsBillingAddress: customer.same_as_billing_address,
      // Financial Information
      paymentTerms: customer.payment_terms,
      creditLimit: customer.credit_limit,
      currency: customer.currency,
      taxId: customer.tax_id,
      panNumber: customer.pan_number,
      // Additional Information
      assignedSalesRep: customer.assigned_sales_rep,
      notes: customer.notes,
      tags: customer.tags,
      isActive: customer.is_active,
      createdAt: customer.created_at,
      updatedAt: customer.updated_at,
    };
  }
}

export const customerService = new CustomerService();
