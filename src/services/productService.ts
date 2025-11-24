import { PrismaClient, StockAdjustmentType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export interface CreateProductData {
  categoryId?: string;
  productCode?: string;
  sku?: string;
  name: string;
  description?: string;
  material?: string;
  color?: string;
  size?: string;
  weight?: number;
  unitOfMeasure?: string;
  costPrice: number;
  sellingPrice: number;
  markupPercent?: number;
  stockQuantity?: number;
  reorderLevel?: number;
  barcode?: string;
  imageUrl?: string;
  specifications?: any;
  isActive?: boolean;
}

export interface UpdateProductData {
  categoryId?: string;
  name?: string;
  description?: string;
  material?: string;
  color?: string;
  size?: string;
  weight?: number;
  unitOfMeasure?: string;
  costPrice?: number;
  sellingPrice?: number;
  markupPercent?: number;
  reorderLevel?: number;
  barcode?: string;
  imageUrl?: string;
  specifications?: any;
  isActive?: boolean;
}

export interface ListProductFilters {
  categoryId?: string;
  search?: string;
  isActive?: boolean;
  lowStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface StockAdjustmentData {
  adjustmentType: StockAdjustmentType;
  quantity: number;
  reason?: string;
  notes?: string;
  adjustedBy: string;
}

export class ProductService {
  private prisma: PrismaClient;

  constructor(client: PrismaClient = prisma) {
    this.prisma = client;
  }

  /**
   * Generate unique product ID for a company
   */
  private async generateProductId(companyId: string): Promise<string> {
    try {
      const lastProduct = await this.prisma.products.findFirst({
        where: { company_id: companyId },
        orderBy: { product_id: 'desc' },
        select: { product_id: true },
      });

      if (!lastProduct) {
        return 'PRD001';
      }

      const numericPart = parseInt(lastProduct.product_id.substring(3), 10);
      const next = Number.isNaN(numericPart) ? 1 : numericPart + 1;
      return `PRD${next.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating product ID:', error);
      return `PRD${Date.now().toString().slice(-3)}`;
    }
  }

  /**
   * Generate unique product code for a company
   */
  private async generateProductCode(companyId: string): Promise<string> {
    try {
      const lastProduct = await this.prisma.products.findFirst({
        where: { company_id: companyId },
        orderBy: { product_code: 'desc' },
        select: { product_code: true },
      });

      if (!lastProduct) {
        return 'PC0001';
      }

      const numericPart = parseInt(lastProduct.product_code.substring(2), 10);
      const next = Number.isNaN(numericPart) ? 1 : numericPart + 1;
      return `PC${next.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating product code:', error);
      return `PC${Date.now().toString().slice(-4)}`;
    }
  }

  /**
   * Generate unique SKU for a product
   */
  private async generateSKU(companyId: string, productName: string): Promise<string> {
    const prefix = productName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 3);
    
    const timestamp = Date.now().toString().slice(-6);
    return `${prefix}-${timestamp}`;
  }

  /**
   * Generate unique adjustment ID
   */
  private async generateAdjustmentId(companyId: string): Promise<string> {
    try {
      const lastAdjustment = await this.prisma.stock_adjustments.findFirst({
        where: { company_id: companyId },
        orderBy: { adjustment_id: 'desc' },
        select: { adjustment_id: true },
      });

      if (!lastAdjustment) {
        return 'ADJ001';
      }

      const numericPart = parseInt(lastAdjustment.adjustment_id.substring(3), 10);
      const next = Number.isNaN(numericPart) ? 1 : numericPart + 1;
      return `ADJ${next.toString().padStart(3, '0')}`;
    } catch (error) {
      console.error('Error generating adjustment ID:', error);
      return `ADJ${Date.now().toString().slice(-3)}`;
    }
  }

  /**
   * Create a new product
   */
  async createProduct(companyId: string, data: CreateProductData) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!data.name || !data.name.trim()) {
      throw new Error('Product name is required');
    }

    if (data.costPrice === undefined || data.costPrice < 0) {
      throw new Error('Valid cost price is required');
    }

    if (data.sellingPrice === undefined || data.sellingPrice < 0) {
      throw new Error('Valid selling price is required');
    }

    // Validate company exists
    const company = await this.prisma.companies.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!company) {
      throw new Error('Company not found');
    }

    // Validate category if provided
    if (data.categoryId) {
      const category = await this.prisma.product_categories.findFirst({
        where: { id: data.categoryId, company_id: companyId },
        select: { id: true },
      });

      if (!category) {
        throw new Error('Invalid category for this company');
      }
    }

    const productId = await this.generateProductId(companyId);
    const productCode = data.productCode || await this.generateProductCode(companyId);
    const sku = data.sku || await this.generateSKU(companyId, data.name);

    // Check product code uniqueness within company
    const existingCode = await this.prisma.products.findFirst({
      where: { company_id: companyId, product_code: productCode },
    });

    if (existingCode) {
      throw new Error('Product code already exists for this company');
    }

    // Check SKU uniqueness within company
    const existingSKU = await this.prisma.products.findFirst({
      where: { company_id: companyId, sku },
    });

    if (existingSKU) {
      throw new Error('SKU already exists for this company');
    }

    // Calculate markup if not provided
    let markupPercent = data.markupPercent;
    if (!markupPercent && data.costPrice > 0) {
      markupPercent = ((data.sellingPrice - data.costPrice) / data.costPrice) * 100;
    }

    const now = new Date();

    const product = await this.prisma.products.create({
      data: {
        id: uuidv4(),
        product_id: productId,
        product_code: productCode,
        company_id: companyId,
        category_id: data.categoryId || null,
        sku,
        name: data.name,
        description: data.description || null,
        material: data.material || null,
        color: data.color || null,
        size: data.size || null,
        weight: data.weight || null,
        unit_of_measure: data.unitOfMeasure || 'PCS',
        cost_price: data.costPrice,
        selling_price: data.sellingPrice,
        markup_percent: markupPercent || null,
        stock_quantity: data.stockQuantity || 0,
        reorder_level: data.reorderLevel || null,
        barcode: data.barcode || null,
        image_url: data.imageUrl || null,
        specifications: data.specifications || null,
        is_active: data.isActive !== undefined ? data.isActive : true,
        updated_at: now,
      },
      include: {
        category: true,
      },
    });

    return this.mapProductToDTO(product);
  }

  /**
   * Get products list with filters
   * FIX: Returns empty array if table doesn't exist (new company scenario)
   * This prevents 500 errors when product tables haven't been migrated yet
   */
  async getProducts(companyId: string, filters: ListProductFilters = {}) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    try {
      const {
        categoryId,
        search,
        isActive,
        lowStock,
        minPrice,
        maxPrice,
        page = 1,
        limit = 50,
      } = filters;

      const where: any = { company_id: companyId };

      if (categoryId) {
        where.category_id = categoryId;
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (isActive !== undefined) {
        where.is_active = isActive;
      }

      if (lowStock) {
        where.stock_quantity = { lte: where.reorder_level || 10 };
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.selling_price = {};
        if (minPrice !== undefined) where.selling_price.gte = minPrice;
        if (maxPrice !== undefined) where.selling_price.lte = maxPrice;
      }

      const skip = (page - 1) * limit;

      const [products, total] = await Promise.all([
        this.prisma.products.findMany({
          where,
          include: {
            category: true,
          },
          orderBy: { created_at: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.products.count({ where }),
      ]);

      return {
        products: products.map(p => this.mapProductToDTO(p)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error: any) {
      // If table doesn't exist, return empty result instead of throwing error
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.warn(`Products table not found for company ${companyId}. Returning empty array.`);
        return {
          products: [],
          pagination: {
            page: filters.page || 1,
            limit: filters.limit || 50,
            total: 0,
            totalPages: 0,
          },
        };
      }
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(companyId: string, productId: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!productId || !productId.trim()) {
      throw new Error('Missing required field: productId');
    }

    const product = await this.prisma.products.findFirst({
      where: {
        id: productId,
        company_id: companyId,
      },
      include: {
        category: true,
        stock_adjustments: {
          orderBy: { created_at: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return this.mapProductToDTO(product);
  }

  /**
   * Update product
   */
  async updateProduct(companyId: string, productId: string, data: UpdateProductData) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!productId || !productId.trim()) {
      throw new Error('Missing required field: productId');
    }

    // Verify product exists and belongs to company
    const existingProduct = await this.prisma.products.findFirst({
      where: {
        id: productId,
        company_id: companyId,
      },
    });

    if (!existingProduct) {
      throw new Error('Product not found');
    }

    // Validate category if provided
    if (data.categoryId) {
      const category = await this.prisma.product_categories.findFirst({
        where: { id: data.categoryId, company_id: companyId },
        select: { id: true },
      });

      if (!category) {
        throw new Error('Invalid category for this company');
      }
    }

    // Calculate markup if prices are updated
    let markupPercent = data.markupPercent;
    if (!markupPercent && data.costPrice && data.sellingPrice && data.costPrice > 0) {
      markupPercent = ((data.sellingPrice - data.costPrice) / data.costPrice) * 100;
    }

    const now = new Date();

    const updateData: any = {
      updated_at: now,
    };

    // Map camelCase to snake_case
    if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.material !== undefined) updateData.material = data.material;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.size !== undefined) updateData.size = data.size;
    if (data.weight !== undefined) updateData.weight = data.weight;
    if (data.unitOfMeasure !== undefined) updateData.unit_of_measure = data.unitOfMeasure;
    if (data.costPrice !== undefined) updateData.cost_price = data.costPrice;
    if (data.sellingPrice !== undefined) updateData.selling_price = data.sellingPrice;
    if (markupPercent !== undefined) updateData.markup_percent = markupPercent;
    if (data.reorderLevel !== undefined) updateData.reorder_level = data.reorderLevel;
    if (data.barcode !== undefined) updateData.barcode = data.barcode;
    if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl;
    if (data.specifications !== undefined) updateData.specifications = data.specifications;
    if (data.isActive !== undefined) updateData.is_active = data.isActive;

    const product = await this.prisma.products.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: true,
      },
    });

    return this.mapProductToDTO(product);
  }

  /**
   * Delete product
   */
  async deleteProduct(companyId: string, productId: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!productId || !productId.trim()) {
      throw new Error('Missing required field: productId');
    }

    // Verify product exists and belongs to company
    const product = await this.prisma.products.findFirst({
      where: {
        id: productId,
        company_id: companyId,
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    await this.prisma.products.delete({
      where: { id: productId },
    });

    return { message: 'Product deleted successfully' };
  }

  /**
   * Adjust stock for a product
   */
  async adjustStock(
    companyId: string,
    productId: string,
    data: StockAdjustmentData
  ) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!productId || !productId.trim()) {
      throw new Error('Missing required field: productId');
    }

    if (!data.quantity || data.quantity <= 0) {
      throw new Error('Valid quantity is required');
    }

    if (!data.adjustedBy || !data.adjustedBy.trim()) {
      throw new Error('adjustedBy is required');
    }

    const result = await this.prisma.$transaction(async tx => {
      // Get current product
      const product = await tx.products.findFirst({
        where: {
          id: productId,
          company_id: companyId,
        },
      });

      if (!product) {
        throw new Error('Product not found');
      }

      const previousStock = Number(product.stock_quantity);
      let newStock = previousStock;

      // Calculate new stock based on adjustment type
      switch (data.adjustmentType) {
        case StockAdjustmentType.ADD:
        case StockAdjustmentType.PURCHASE:
        case StockAdjustmentType.RETURN:
          newStock = previousStock + data.quantity;
          break;
        case StockAdjustmentType.REMOVE:
        case StockAdjustmentType.SALE:
        case StockAdjustmentType.DAMAGE:
          newStock = previousStock - data.quantity;
          if (newStock < 0) {
            throw new Error('Insufficient stock for this adjustment');
          }
          break;
        case StockAdjustmentType.SET:
          newStock = data.quantity;
          break;
        case StockAdjustmentType.TRANSFER:
          // For transfer, quantity represents the amount being transferred out
          newStock = previousStock - data.quantity;
          if (newStock < 0) {
            throw new Error('Insufficient stock for transfer');
          }
          break;
        default:
          throw new Error('Invalid adjustment type');
      }

      // Update product stock
      const updatedProduct = await tx.products.update({
        where: { id: productId },
        data: {
          stock_quantity: newStock,
          updated_at: new Date(),
        },
        include: {
          category: true,
        },
      });

      // Create adjustment record
      const adjustmentId = await this.generateAdjustmentId(companyId);
      const adjustment = await tx.stock_adjustments.create({
        data: {
          id: uuidv4(),
          adjustment_id: adjustmentId,
          product_id: productId,
          company_id: companyId,
          adjustment_type: data.adjustmentType,
          quantity: data.quantity,
          previous_stock: previousStock,
          new_stock: newStock,
          reason: data.reason || null,
          notes: data.notes || null,
          adjusted_by: data.adjustedBy,
        },
      });

      return {
        product: this.mapProductToDTO(updatedProduct),
        adjustment: this.mapAdjustmentToDTO(adjustment),
      };
    });

    return result;
  }

  /**
   * Get product categories
   */
  async getCategories(companyId: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    const categories = await this.prisma.product_categories.findMany({
      where: {
        company_id: companyId,
        is_active: true,
      },
      orderBy: { name: 'asc' },
    });

    return categories.map(c => this.mapCategoryToDTO(c));
  }

  /**
   * Create product category
   */
  async createCategory(companyId: string, name: string, description?: string) {
    if (!companyId || !companyId.trim()) {
      throw new Error('Missing required field: companyId');
    }

    if (!name || !name.trim()) {
      throw new Error('Category name is required');
    }

    // Check if category already exists
    const existing = await this.prisma.product_categories.findFirst({
      where: {
        company_id: companyId,
        name: { equals: name, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new Error('Category with this name already exists');
    }

    // Generate category ID
    const lastCategory = await this.prisma.product_categories.findFirst({
      where: { company_id: companyId },
      orderBy: { category_id: 'desc' },
      select: { category_id: true },
    });

    let categoryId = 'CAT001';
    if (lastCategory) {
      const numericPart = parseInt(lastCategory.category_id.substring(3), 10);
      const next = Number.isNaN(numericPart) ? 1 : numericPart + 1;
      categoryId = `CAT${next.toString().padStart(3, '0')}`;
    }

    const now = new Date();

    const category = await this.prisma.product_categories.create({
      data: {
        id: uuidv4(),
        category_id: categoryId,
        company_id: companyId,
        name,
        description: description || null,
        updated_at: now,
      },
    });

    return this.mapCategoryToDTO(category);
  }

  /**
   * Map product to DTO (snake_case to camelCase)
   */
  private mapProductToDTO(product: any) {
    return {
      id: product.id,
      productId: product.product_id,
      productCode: product.product_code,
      companyId: product.company_id,
      categoryId: product.category_id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      productType: product.product_type,
      material: product.material,
      color: product.color,
      size: product.size,
      weight: product.weight ? Number(product.weight) : null,
      unitOfMeasure: product.unit_of_measure,
      costPrice: Number(product.cost_price),
      sellingPrice: Number(product.selling_price),
      markupPercent: product.markup_percent ? Number(product.markup_percent) : null,
      stockQuantity: Number(product.stock_quantity),
      reorderLevel: product.reorder_level ? Number(product.reorder_level) : null,
      barcode: product.barcode,
      imageUrl: product.image_url,
      specifications: product.specifications,
      isActive: product.is_active,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
      category: product.category ? this.mapCategoryToDTO(product.category) : null,
      stockAdjustments: product.stock_adjustments
        ? product.stock_adjustments.map((a: any) => this.mapAdjustmentToDTO(a))
        : undefined,
    };
  }

  /**
   * Map category to DTO
   */
  private mapCategoryToDTO(category: any) {
    return {
      id: category.id,
      categoryId: category.category_id,
      companyId: category.company_id,
      name: category.name,
      description: category.description,
      parentId: category.parent_id,
      isActive: category.is_active,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    };
  }

  /**
   * Map adjustment to DTO
   */
  private mapAdjustmentToDTO(adjustment: any) {
    return {
      id: adjustment.id,
      adjustmentId: adjustment.adjustment_id,
      productId: adjustment.product_id,
      companyId: adjustment.company_id,
      adjustmentType: adjustment.adjustment_type,
      quantity: Number(adjustment.quantity),
      previousStock: Number(adjustment.previous_stock),
      newStock: Number(adjustment.new_stock),
      reason: adjustment.reason,
      notes: adjustment.notes,
      adjustedBy: adjustment.adjusted_by,
      createdAt: adjustment.created_at,
    };
  }
}

export default new ProductService();
