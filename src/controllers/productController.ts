import { Request, Response } from 'express';
import Joi from 'joi';
import productService from '../services/productService';
import { logger } from '../utils/logger';
import { StockAdjustmentType } from '@prisma/client';

const createProductSchema = Joi.object({
  categoryId: Joi.string().optional(),
  sku: Joi.string().max(100).optional(),
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
  productType: Joi.string().valid('OWN_MANUFACTURE', 'VENDOR_SUPPLIED', 'OUTSOURCED', 'RAW_MATERIAL', 'FINISHED_GOODS', 'SEMI_FINISHED').optional(),
  material: Joi.string().max(100).optional(),
  color: Joi.string().max(50).optional(),
  size: Joi.string().max(50).optional(),
  weight: Joi.number().min(0).optional(),
  unitOfMeasure: Joi.string().max(50).optional(),
  costPrice: Joi.number().min(0).required(),
  sellingPrice: Joi.number().min(0).required(),
  markupPercent: Joi.number().min(0).max(1000).optional(),
  stockQuantity: Joi.number().min(0).optional(),
  reorderLevel: Joi.number().min(0).optional(),
  barcode: Joi.string().max(100).optional(),
  imageUrl: Joi.string().max(500).optional(),
  specifications: Joi.object().optional(),
  isActive: Joi.boolean().optional(),
});

const updateProductSchema = Joi.object({
  categoryId: Joi.string().optional(),
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(1000).optional(),
  productType: Joi.string().valid('OWN_MANUFACTURE', 'VENDOR_SUPPLIED', 'OUTSOURCED', 'RAW_MATERIAL', 'FINISHED_GOODS', 'SEMI_FINISHED').optional(),
  material: Joi.string().max(100).optional(),
  color: Joi.string().max(50).optional(),
  size: Joi.string().max(50).optional(),
  weight: Joi.number().min(0).optional(),
  unitOfMeasure: Joi.string().max(50).optional(),
  costPrice: Joi.number().min(0).optional(),
  sellingPrice: Joi.number().min(0).optional(),
  markupPercent: Joi.number().min(0).max(1000).optional(),
  reorderLevel: Joi.number().min(0).optional(),
  barcode: Joi.string().max(100).optional(),
  imageUrl: Joi.string().max(500).optional(),
  specifications: Joi.object().optional(),
  isActive: Joi.boolean().optional(),
}).min(1);

const stockAdjustmentSchema = Joi.object({
  adjustmentType: Joi.string()
    .valid('ADD', 'REMOVE', 'SET', 'SALE', 'PURCHASE', 'RETURN', 'DAMAGE', 'TRANSFER')
    .required(),
  quantity: Joi.number().greater(0).required(),
  reason: Joi.string().max(255).optional(),
  notes: Joi.string().max(1000).optional(),
  adjustedBy: Joi.string().min(1).max(255).required(),
});

const createCategorySchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional(),
});

export class ProductController {
  /**
   * Create a new product
   */
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createProductSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const companyId = (req as any).tenantId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company context required',
        });
        return;
      }

      const product = await productService.createProduct(companyId, value);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product,
      });
    } catch (err: any) {
      logger.error('Error creating product:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to create product',
      });
    }
  }

  /**
   * Get products list with filters
   */
  async getProducts(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).tenantId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company context required',
        });
        return;
      }

      const filters = {
        categoryId: req.query.categoryId as string,
        search: req.query.search as string,
        isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
        lowStock: req.query.lowStock === 'true',
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      };

      const result = await productService.getProducts(companyId, filters);

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination,
      });
    } catch (err: any) {
      logger.error('Error fetching products:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch products',
      });
    }
  }

  /**
   * Get product by ID
   */
  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).tenantId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company context required',
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Product ID is required',
        });
        return;
      }

      const product = await productService.getProductById(companyId, id);

      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (err: any) {
      logger.error('Error fetching product:', err);
      const statusCode = err.message === 'Product not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: err.message || 'Failed to fetch product',
      });
    }
  }

  /**
   * Update product
   */
  async updateProduct(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = updateProductSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const companyId = (req as any).tenantId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company context required',
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Product ID is required',
        });
        return;
      }

      const product = await productService.updateProduct(companyId, id, value);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product,
      });
    } catch (err: any) {
      logger.error('Error updating product:', err);
      const statusCode = err.message === 'Product not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: err.message || 'Failed to update product',
      });
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).tenantId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company context required',
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Product ID is required',
        });
        return;
      }

      const result = await productService.deleteProduct(companyId, id);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (err: any) {
      logger.error('Error deleting product:', err);
      const statusCode = err.message === 'Product not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: err.message || 'Failed to delete product',
      });
    }
  }

  /**
   * Adjust product stock
   */
  async adjustStock(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = stockAdjustmentSchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const companyId = (req as any).tenantId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company context required',
        });
        return;
      }

      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          message: 'Product ID is required',
        });
        return;
      }

      const result = await productService.adjustStock(companyId, id, value);

      res.status(200).json({
        success: true,
        message: 'Stock adjusted successfully',
        data: result,
      });
    } catch (err: any) {
      logger.error('Error adjusting stock:', err);
      const statusCode = err.message === 'Product not found' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: err.message || 'Failed to adjust stock',
      });
    }
  }

  /**
   * Get product categories
   */
  async getCategories(req: Request, res: Response): Promise<void> {
    try {
      const companyId = (req as any).tenantId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company context required',
        });
        return;
      }

      const categories = await productService.getCategories(companyId);

      res.status(200).json({
        success: true,
        data: categories,
      });
    } catch (err: any) {
      logger.error('Error fetching categories:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to fetch categories',
      });
    }
  }

  /**
   * Create product category
   */
  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const { error, value } = createCategorySchema.validate(req.body);
      if (error) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: error.details.map(d => d.message),
        });
        return;
      }

      const companyId = (req as any).tenantId;
      if (!companyId) {
        res.status(400).json({
          success: false,
          message: 'Company context required',
        });
        return;
      }

      const category = await productService.createCategory(
        companyId,
        value.name,
        value.description
      );

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (err: any) {
      logger.error('Error creating category:', err);
      res.status(500).json({
        success: false,
        message: err.message || 'Failed to create category',
      });
    }
  }
}

export const productController = new ProductController();
