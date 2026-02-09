import { Request, Response } from 'express';
import Joi from 'joi';
import { textileService } from '../services/textileService';
import { logger } from '../utils/logger';
import {
  FabricType,
  QualityGrade,
  YarnType,
  YarnProcess,
  DyeingProcess,
  GarmentType,
  ProductionStage,
  DesignCategory,
  DesignStatus,
} from '@prisma/client';

// Validation Schemas
const createFabricSchema = Joi.object({
  fabricType: Joi.string()
    .valid(...Object.values(FabricType || {}))
    .required(),
  fabricName: Joi.string().min(1).max(255).required(),
  composition: Joi.string().min(1).max(500).required(),
  weightGsm: Joi.number().positive().required(),
  widthInches: Joi.number().positive().required(),
  color: Joi.string().min(1).max(100).required(),
  pattern: Joi.string().max(255).optional().allow('', null),
  finishType: Joi.string().max(255).optional().allow('', null),
  quantityMeters: Joi.number().positive().required(),
  productionDate: Joi.date().required(),
  batchNumber: Joi.string().min(1).max(100).required(),
  qualityGrade: Joi.string()
    .valid(...Object.values(QualityGrade || {}))
    .required(),
  locationId: Joi.string().optional(),
  notes: Joi.string().max(1000).optional().allow('', null),
  imageUrl: Joi.string().uri().optional().allow('', null),
  isActive: Joi.boolean().optional(),
});

const updateFabricSchema = createFabricSchema.fork(
  Object.keys(createFabricSchema.describe().keys),
  schema => schema.optional()
);

const createYarnSchema = Joi.object({
  yarnName: Joi.string().min(1).max(255).required(),
  yarnType: Joi.string()
    .valid(...Object.values(YarnType || {}))
    .required(),
  yarnCount: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  fiberContent: Joi.string().min(1).max(255).required(),
  twistType: Joi.string().max(100).optional().allow('', null),
  twistPerInch: Joi.number().positive().optional().allow(null, 0),
  ply: Joi.number().integer().positive().optional(),
  color: Joi.string().min(1).max(100).required(),
  dyeLot: Joi.string().max(100).optional().allow('', null),
  quantityKg: Joi.number().positive().required(),
  productionDate: Joi.date().required(),
  batchNumber: Joi.string().min(1).max(100).required(),
  processType: Joi.string()
    .valid(...Object.values(YarnProcess || {}))
    .optional()
    .allow('', null),
  qualityGrade: Joi.string()
    .valid(...Object.values(QualityGrade || {}))
    .required(),
  locationId: Joi.string().optional(),
  notes: Joi.string().max(1000).optional().allow('', null),
  isActive: Joi.boolean().optional(),
  imageUrl: Joi.string().uri().optional().allow('', null),
});

const updateYarnSchema = createYarnSchema.fork(
  Object.keys(createYarnSchema.describe().keys),
  schema => schema.optional()
);

const createDyeingSchema = Joi.object({
  processType: Joi.string()
    .valid(...Object.values(DyeingProcess || {}))
    .required(),
  colorCode: Joi.string().min(1).max(50).required(),
  colorName: Joi.string().min(1).max(100).required(),
  dyeMethod: Joi.string().max(255).optional().allow('', null),
  recipeCode: Joi.string().max(100).optional().allow('', null),
  quantityMeters: Joi.number().positive().required(),
  processDate: Joi.date().required(),
  batchNumber: Joi.string().min(1).max(100).required(),
  machineNumber: Joi.string().max(50).optional().allow('', null),
  temperatureC: Joi.number().optional().allow(null),
  durationMinutes: Joi.number().integer().min(0).optional().allow(null),
  qualityCheck: Joi.boolean().optional(),
  colorFastness: Joi.string().max(100).optional().allow('', null),
  shrinkagePercent: Joi.number().optional().allow(null),
  fabricId: Joi.string().optional().allow('', null),
  locationId: Joi.string().optional(),
  notes: Joi.string().max(1000).optional().allow('', null),
  imageUrl: Joi.string().uri().optional().allow('', null),
  isActive: Joi.boolean().optional(),
});

const updateDyeingSchema = createDyeingSchema.fork(
  Object.keys(createDyeingSchema.describe().keys),
  schema => schema.optional()
);

const createGarmentSchema = Joi.object({
  garmentType: Joi.string()
    .valid(...Object.values(GarmentType || {}))
    .required(),
  styleNumber: Joi.string().min(1).max(100).required(),
  size: Joi.string().min(1).max(50).required(),
  color: Joi.string().min(1).max(100).required(),
  fabricId: Joi.string().optional().allow('', null),
  quantity: Joi.number().integer().positive().required(),
  productionStage: Joi.string()
    .valid(...Object.values(ProductionStage || {}))
    .required(),
  cutDate: Joi.date().optional().allow(null),
  sewDate: Joi.date().optional().allow(null),
  finishDate: Joi.date().optional().allow(null),
  packDate: Joi.date().optional().allow(null),
  operatorName: Joi.string().max(255).optional().allow('', null),
  lineNumber: Joi.string().max(50).optional().allow('', null),
  qualityPassed: Joi.boolean().optional(),
  defectCount: Joi.number().integer().min(0).optional().allow(null),
  orderId: Joi.string().optional().allow('', null),
  locationId: Joi.string().optional(),
  notes: Joi.string().max(1000).optional().allow('', null),
  imageUrl: Joi.string().uri().optional().allow('', null),
  isActive: Joi.boolean().optional(),
});

const updateGarmentSchema = createGarmentSchema.fork(
  Object.keys(createGarmentSchema.describe().keys),
  schema => schema.optional()
);

const updateGarmentStageSchema = Joi.object({
  stage: Joi.string()
    .valid(...Object.values(ProductionStage || {}))
    .required(),
  notes: Joi.string().max(1000).optional().allow('', null),
});

const createDesignSchema = Joi.object({
  designName: Joi.string().min(1).max(255).required(),
  designCategory: Joi.string()
    .valid(...Object.values(DesignCategory || {}))
    .required(),
  designerName: Joi.string().max(255).optional().allow('', null),
  season: Joi.string().max(100).optional().allow('', null),
  colorPalette: Joi.array().items(Joi.string()).optional(),
  patternRepeat: Joi.string().max(255).optional().allow('', null),
  designFileUrl: Joi.string().uri().optional().allow('', null),
  sampleImageUrl: Joi.string().uri().optional().allow('', null),
  status: Joi.string()
    .valid(...Object.values(DesignStatus || {}))
    .required(),
  notes: Joi.string().max(1000).optional().allow('', null),
  isActive: Joi.boolean().optional(),
});

const updateDesignSchema = createDesignSchema.fork(
  Object.keys(createDesignSchema.describe().keys),
  schema => schema.optional()
);

const updateDesignStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(DesignStatus || {}))
    .required(),
  notes: Joi.string().max(1000).optional().allow('', null),
});

// Fabric Production Controllers
export const createFabric = async (req: Request, res: Response) => {
  try {
    const { error, value } = createFabricSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });

    // Generate Sequential Code
    const code = await textileService.generateFabricCode(tenantId);

    const fabric = await textileService.createFabric(tenantId, { ...value, code });
    res.status(201).json({ message: 'Fabric created successfully', data: fabric });
  } catch (error: any) {
    logger.error('Error creating fabric:', error);
    res.status(500).json({ message: error.message || 'Failed to create fabric' });
  }
};

export const getFabrics = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const fabrics = await textileService.getFabrics(tenantId, req.query);
    res.status(200).json({ data: fabrics });
  } catch (error: any) {
    logger.error('Error fetching fabrics:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch fabrics' });
  }
};

export const getFabricById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const fabric = await textileService.getFabricById(req.params.id, tenantId);
    res.status(200).json({ data: fabric });
  } catch (error: any) {
    logger.error('Error fetching fabric:', error);
    res.status(error.message === 'Fabric not found' ? 404 : 500).json({ message: error.message });
  }
};

export const updateFabric = async (req: Request, res: Response) => {
  try {
    const { error, value } = updateFabricSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const fabric = await textileService.updateFabric(req.params.id, tenantId, value);
    res.status(200).json({ message: 'Fabric updated successfully', data: fabric });
  } catch (error: any) {
    logger.error('Error updating fabric:', error);
    res.status(500).json({ message: error.message || 'Failed to update fabric' });
  }
};

export const deleteFabric = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const result = await textileService.deleteFabric(req.params.id, tenantId);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error deleting fabric:', error);
    res.status(500).json({ message: error.message || 'Failed to delete fabric' });
  }
};

// Yarn Manufacturing Controllers
export const createYarn = async (req: Request, res: Response) => {
  try {
    const { error, value } = createYarnSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });

    // Generate Sequential Code
    const code = await textileService.generateYarnCode(tenantId);

    const yarn = await textileService.createYarn(tenantId, { ...value, code });
    res.status(201).json({ message: 'Yarn created successfully', data: yarn });
  } catch (error: any) {
    logger.error('Error creating yarn:', error);
    res.status(500).json({ message: error.message || 'Failed to create yarn' });
  }
};

export const getYarns = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const yarns = await textileService.getYarns(tenantId, req.query);
    res.status(200).json({ data: yarns });
  } catch (error: any) {
    logger.error('Error fetching yarns:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch yarns' });
  }
};

export const getYarnById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const yarn = await textileService.getYarnById(req.params.id, tenantId);
    res.status(200).json({ data: yarn });
  } catch (error: any) {
    logger.error('Error fetching yarn:', error);
    res.status(error.message === 'Yarn not found' ? 404 : 500).json({ message: error.message });
  }
};

export const updateYarn = async (req: Request, res: Response) => {
  try {
    const { error, value } = updateYarnSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const yarn = await textileService.updateYarn(req.params.id, tenantId, value);
    res.status(200).json({ message: 'Yarn updated successfully', data: yarn });
  } catch (error: any) {
    logger.error('Error updating yarn:', error);
    res.status(500).json({ message: error.message || 'Failed to update yarn' });
  }
};

export const deleteYarn = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const result = await textileService.deleteYarn(req.params.id, tenantId);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error deleting yarn:', error);
    res.status(500).json({ message: error.message || 'Failed to delete yarn' });
  }
};

// Dyeing & Finishing Controllers
export const createDyeing = async (req: Request, res: Response) => {
  try {
    const { error, value } = createDyeingSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });

    // Generate Sequential Code
    const code = await textileService.generateDyeingCode(tenantId);

    const dyeing = await textileService.createDyeing(tenantId, { ...value, code });
    res.status(201).json({ message: 'Dyeing process created successfully', data: dyeing });
  } catch (error: any) {
    logger.error('Error creating dyeing process:', error);
    res.status(500).json({ message: error.message || 'Failed to create dyeing process' });
  }
};

export const getDyeings = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const dyeings = await textileService.getDyeings(tenantId, req.query);
    res.status(200).json({ data: dyeings });
  } catch (error: any) {
    logger.error('Error fetching dyeing processes:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch dyeing processes' });
  }
};

export const getDyeingById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const dyeing = await textileService.getDyeingById(req.params.id, tenantId);
    res.status(200).json({ data: dyeing });
  } catch (error: any) {
    logger.error('Error fetching dyeing process:', error);
    res
      .status(error.message === 'Dyeing process not found' ? 404 : 500)
      .json({ message: error.message });
  }
};

export const updateDyeing = async (req: Request, res: Response) => {
  try {
    const { error, value } = updateDyeingSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const dyeing = await textileService.updateDyeing(req.params.id, tenantId, value);
    res.status(200).json({ message: 'Dyeing process updated successfully', data: dyeing });
  } catch (error: any) {
    logger.error('Error updating dyeing process:', error);
    res.status(500).json({ message: error.message || 'Failed to update dyeing process' });
  }
};

export const deleteDyeing = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const result = await textileService.deleteDyeing(req.params.id, tenantId);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error deleting dyeing process:', error);
    res.status(500).json({ message: error.message || 'Failed to delete dyeing process' });
  }
};

// Garment Manufacturing Controllers
export const createGarment = async (req: Request, res: Response) => {
  try {
    const { error, value } = createGarmentSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });

    // Generate Sequential Code
    const code = await textileService.generateGarmentCode(tenantId);

    const garment = await textileService.createGarment(tenantId, { ...value, code });
    res.status(201).json({ message: 'Garment created successfully', data: garment });
  } catch (error: any) {
    logger.error('Error creating garment:', error);
    res.status(500).json({ message: error.message || 'Failed to create garment' });
  }
};

export const getGarments = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const garments = await textileService.getGarments(tenantId, req.query);
    res.status(200).json({ data: garments });
  } catch (error: any) {
    logger.error('Error fetching garments:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch garments' });
  }
};

export const getGarmentById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const garment = await textileService.getGarmentById(req.params.id, tenantId);
    res.status(200).json({ data: garment });
  } catch (error: any) {
    logger.error('Error fetching garment:', error);
    res.status(error.message === 'Garment not found' ? 404 : 500).json({ message: error.message });
  }
};

export const updateGarment = async (req: Request, res: Response) => {
  try {
    const { error, value } = updateGarmentSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const garment = await textileService.updateGarment(req.params.id, tenantId, value);
    res.status(200).json({ message: 'Garment updated successfully', data: garment });
  } catch (error: any) {
    logger.error('Error updating garment:', error);
    res.status(500).json({ message: error.message || 'Failed to update garment' });
  }
};

export const updateGarmentStage = async (req: Request, res: Response) => {
  try {
    const { error, value } = updateGarmentStageSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const garment = await textileService.updateGarmentStage(
      req.params.id,
      tenantId,
      value.stage,
      value.notes
    );
    res.status(200).json({ message: 'Garment stage updated successfully', data: garment });
  } catch (error: any) {
    logger.error('Error updating garment stage:', error);
    res.status(500).json({ message: error.message || 'Failed to update garment stage' });
  }
};

export const deleteGarment = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const result = await textileService.deleteGarment(req.params.id, tenantId);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error deleting garment:', error);
    res.status(500).json({ message: error.message || 'Failed to delete garment' });
  }
};

// Design & Patterns Controllers
export const createDesign = async (req: Request, res: Response) => {
  try {
    const { error, value } = createDesignSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });

    // Generate Sequential Code
    const code = await textileService.generateDesignCode(tenantId);

    const design = await textileService.createDesign(tenantId, { ...value, code });
    res.status(201).json({ message: 'Design created successfully', data: design });
  } catch (error: any) {
    logger.error('Error creating design:', error);
    res.status(500).json({ message: error.message || 'Failed to create design' });
  }
};

export const getDesigns = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const designs = await textileService.getDesigns(tenantId, req.query);
    res.status(200).json({ data: designs });
  } catch (error: any) {
    logger.error('Error fetching designs:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch designs' });
  }
};

export const getDesignById = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const design = await textileService.getDesignById(req.params.id, tenantId);
    res.status(200).json({ data: design });
  } catch (error: any) {
    logger.error('Error fetching design:', error);
    res.status(error.message === 'Design not found' ? 404 : 500).json({ message: error.message });
  }
};

export const updateDesign = async (req: Request, res: Response) => {
  try {
    const { error, value } = updateDesignSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const design = await textileService.updateDesign(req.params.id, tenantId, value);
    res.status(200).json({ message: 'Design updated successfully', data: design });
  } catch (error: any) {
    logger.error('Error updating design:', error);
    res.status(500).json({ message: error.message || 'Failed to update design' });
  }
};

export const updateDesignStatus = async (req: Request, res: Response) => {
  try {
    const { error, value } = updateDesignStatusSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const design = await textileService.updateDesignStatus(
      req.params.id,
      tenantId,
      value.status,
      value.notes
    );
    res.status(200).json({ message: 'Design status updated successfully', data: design });
  } catch (error: any) {
    logger.error('Error updating design status:', error);
    res.status(500).json({ message: error.message || 'Failed to update design status' });
  }
};

export const deleteDesign = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) return res.status(401).json({ message: 'Tenant ID not found' });
    const result = await textileService.deleteDesign(req.params.id, tenantId);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Error deleting design:', error);
    res.status(500).json({ message: error.message || 'Failed to delete design' });
  }
};
