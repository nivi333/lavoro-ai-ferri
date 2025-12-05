import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface CreateSupplierData {
  companyId: string;
  name: string;
  supplierType?: string;
  companyRegNo?: string;
  // Contact Info
  email?: string;
  phone?: string;
  alternatePhone?: string;
  website?: string;
  fax?: string;
  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  // Financial
  paymentTerms?: string;
  creditPeriod?: number;
  currency?: string;
  taxId?: string;
  panNumber?: string;
  bankDetails?: string;
  // Supply Info
  productCategories?: string[];
  leadTimeDays?: number;
  minOrderQty?: number;
  minOrderValue?: number;
  // Quality & Compliance
  qualityRating?: string;
  certifications?: string[];
  complianceStatus?: string;
  // Additional
  supplierCategory?: string;
  assignedManager?: string;
  notes?: string;
  tags?: string[];
  isActive?: boolean;
}

export interface UpdateSupplierData extends Partial<CreateSupplierData> {}

export interface SupplierFilters {
  search?: string;
  supplierType?: string;
  supplierCategory?: string;
  isActive?: boolean;
  qualityRating?: string;
  complianceStatus?: string;
  page?: number;
  limit?: number;
}

class SupplierService {
  // Generate Supplier Code (SUPP-001, etc.)
  private async generateSupplierCode(companyId: string): Promise<string> {
    const lastSupplier = await prisma.suppliers.findFirst({
      where: { company_id: companyId },
      orderBy: { code: 'desc' },
      select: { code: true },
    });

    if (!lastSupplier) {
      return 'SUPP-001';
    }

    try {
      const lastNumber = parseInt(lastSupplier.code.split('-')[1]);
      const nextNumber = lastNumber + 1;
      return `SUPP-${nextNumber.toString().padStart(3, '0')}`;
    } catch (error) {
      return `SUPP-${Date.now().toString().slice(-4)}`;
    }
  }

  async createSupplier(data: CreateSupplierData) {
    const { companyId, ...supplierData } = data;

    // Validate company exists
    const company = await prisma.companies.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    const code = await this.generateSupplierCode(companyId);

    return await prisma.suppliers.create({
      data: {
        supplier_id: uuidv4(), // Internal unique ID
        company_id: companyId,
        code,
        name: supplierData.name,
        supplier_type: supplierData.supplierType || 'MANUFACTURER',
        company_reg_no: supplierData.companyRegNo,
        // Contact Info
        email: supplierData.email,
        phone: supplierData.phone,
        alternate_phone: supplierData.alternatePhone,
        website: supplierData.website,
        fax: supplierData.fax,
        // Address
        address_line_1: supplierData.addressLine1,
        address_line_2: supplierData.addressLine2,
        city: supplierData.city,
        state: supplierData.state,
        country: supplierData.country,
        postal_code: supplierData.postalCode,
        // Financial
        payment_terms: supplierData.paymentTerms,
        credit_period: supplierData.creditPeriod,
        currency: supplierData.currency || 'INR',
        tax_id: supplierData.taxId,
        pan_number: supplierData.panNumber,
        bank_details: supplierData.bankDetails,
        // Supply Info
        product_categories: supplierData.productCategories || [],
        lead_time_days: supplierData.leadTimeDays,
        min_order_qty: supplierData.minOrderQty,
        min_order_value: supplierData.minOrderValue,
        // Quality & Compliance
        quality_rating: supplierData.qualityRating,
        certifications: supplierData.certifications || [],
        compliance_status: supplierData.complianceStatus,
        // Additional
        supplier_category: supplierData.supplierCategory,
        assigned_manager: supplierData.assignedManager,
        notes: supplierData.notes,
        tags: supplierData.tags || [],
        is_active: supplierData.isActive ?? true,
        updated_at: new Date(),
      },
    });
  }

  async getSuppliers(companyId: string, filters: SupplierFilters) {
    const {
      search,
      supplierType,
      supplierCategory,
      isActive,
      qualityRating,
      complianceStatus,
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

    if (supplierType) {
      where.supplier_type = supplierType;
    }

    if (supplierCategory) {
      where.supplier_category = supplierCategory;
    }

    if (isActive !== undefined) {
      where.is_active = isActive;
    }

    if (qualityRating) {
      where.quality_rating = qualityRating;
    }

    if (complianceStatus) {
      where.compliance_status = complianceStatus;
    }

    const [suppliers, total] = await Promise.all([
      prisma.suppliers.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.suppliers.count({ where }),
    ]);

    return {
      suppliers: suppliers.map(this.mapSupplier),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSupplierById(companyId: string, supplierId: string) {
    const supplier = await prisma.suppliers.findFirst({
      where: {
        id: supplierId,
        company_id: companyId,
      },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    return this.mapSupplier(supplier);
  }

  async updateSupplier(supplierId: string, data: UpdateSupplierData) {
    const { companyId, ...updateData } = data;

    // Build the where clause
    const whereClause: any = { id: supplierId };
    if (companyId) {
      whereClause.company_id = companyId;
    }

    // Check if supplier exists
    const existingSupplier = await prisma.suppliers.findUnique({
      where: whereClause,
    });

    if (!existingSupplier) {
      throw new Error('Supplier not found');
    }

    return await prisma.suppliers.update({
      where: whereClause,
      data: {
        name: updateData.name,
        supplier_type: updateData.supplierType,
        company_reg_no: updateData.companyRegNo,
        // Contact Info
        email: updateData.email,
        phone: updateData.phone,
        alternate_phone: updateData.alternatePhone,
        website: updateData.website,
        fax: updateData.fax,
        // Address
        address_line_1: updateData.addressLine1,
        address_line_2: updateData.addressLine2,
        city: updateData.city,
        state: updateData.state,
        country: updateData.country,
        postal_code: updateData.postalCode,
        // Financial
        payment_terms: updateData.paymentTerms,
        credit_period: updateData.creditPeriod,
        currency: updateData.currency,
        tax_id: updateData.taxId,
        pan_number: updateData.panNumber,
        bank_details: updateData.bankDetails,
        // Supply Info
        product_categories: updateData.productCategories,
        lead_time_days: updateData.leadTimeDays,
        min_order_qty: updateData.minOrderQty,
        min_order_value: updateData.minOrderValue,
        // Quality & Compliance
        quality_rating: updateData.qualityRating,
        certifications: updateData.certifications,
        compliance_status: updateData.complianceStatus,
        // Additional
        supplier_category: updateData.supplierCategory,
        assigned_manager: updateData.assignedManager,
        notes: updateData.notes,
        tags: updateData.tags,
        is_active: updateData.isActive,
        updated_at: new Date(),
      },
    });
  }

  async deleteSupplier(companyId: string, supplierId: string) {
    const supplier = await prisma.suppliers.findFirst({
      where: {
        id: supplierId,
        company_id: companyId,
      },
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    // Soft delete
    await prisma.suppliers.update({
      where: { id: supplierId },
      data: {
        is_active: false,
        updated_at: new Date(),
      },
    });
  }

  private mapSupplier(supplier: any) {
    return {
      id: supplier.id,
      supplierId: supplier.supplier_id,
      code: supplier.code,
      name: supplier.name,
      supplierType: supplier.supplier_type,
      companyRegNo: supplier.company_reg_no,
      // Contact Info
      email: supplier.email,
      phone: supplier.phone,
      alternatePhone: supplier.alternate_phone,
      website: supplier.website,
      fax: supplier.fax,
      // Address
      addressLine1: supplier.address_line_1,
      addressLine2: supplier.address_line_2,
      city: supplier.city,
      state: supplier.state,
      country: supplier.country,
      postalCode: supplier.postal_code,
      // Financial
      paymentTerms: supplier.payment_terms,
      creditPeriod: supplier.credit_period,
      currency: supplier.currency,
      taxId: supplier.tax_id,
      panNumber: supplier.pan_number,
      bankDetails: supplier.bank_details,
      // Supply Info
      productCategories: supplier.product_categories,
      leadTimeDays: supplier.lead_time_days,
      minOrderQty: supplier.min_order_qty,
      minOrderValue: supplier.min_order_value,
      // Quality & Compliance
      qualityRating: supplier.quality_rating,
      certifications: supplier.certifications,
      complianceStatus: supplier.compliance_status,
      // Additional
      supplierCategory: supplier.supplier_category,
      assignedManager: supplier.assigned_manager,
      notes: supplier.notes,
      tags: supplier.tags,
      isActive: supplier.is_active,
      createdAt: supplier.created_at,
      updatedAt: supplier.updated_at,
    };
  }
}

export const supplierService = new SupplierService();
