import { PrismaClient, MachineStatus, MaintenanceType, BreakdownSeverity, BreakdownStatus, BreakdownPriority } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateMachineRequest {
  name: string;
  machineType?: string;
  model?: string;
  manufacturer?: string;
  serialNumber?: string;
  purchaseDate?: Date;
  warrantyExpiry?: Date;
  specifications?: any;
  imageUrl?: string;
  locationId?: string;
  currentOperatorId?: string;
  operationalStatus?: string;
  isActive?: boolean;
}

export interface UpdateMachineRequest extends Partial<CreateMachineRequest> {
  status?: MachineStatus;
}

export interface MachineFilters {
  locationId?: string;
  machineType?: string;
  status?: MachineStatus;
  search?: string;
  isActive?: boolean;
}

export interface CreateBreakdownRequest {
  machineId: string;
  severity: BreakdownSeverity;
  title: string;
  description: string;
  breakdownTime?: Date;
  reportedBy?: string;
  priority?: BreakdownPriority;
  images?: string[];
}

export interface UpdateBreakdownRequest {
  assignedTechnician?: string;
  rootCause?: string;
  resolutionNotes?: string;
  partsUsed?: any;
  laborHours?: number;
  repairCost?: number;
  status?: BreakdownStatus;
  priority?: BreakdownPriority;
}

export interface CreateMaintenanceScheduleRequest {
  machineId: string;
  maintenanceType: MaintenanceType;
  title: string;
  description?: string;
  frequencyDays?: number;
  nextDue: Date;
  estimatedHours?: number;
  assignedTechnician?: string;
  checklist?: any;
  partsRequired?: any;
}

export interface CreateMaintenanceRecordRequest {
  machineId: string;
  scheduleId?: string;
  maintenanceType: MaintenanceType;
  performedBy?: string;
  performedDate: Date;
  durationHours?: number;
  tasksCompleted?: any;
  partsUsed?: any;
  cost?: number;
  notes?: string;
  nextMaintenanceDate?: Date;
}

class MachineService {
  // Generate unique machine ID
  private async generateMachineId(companyId: string): Promise<string> {
    try {
      const lastMachine = await prisma.machines.findFirst({
        where: { company_id: companyId },
        orderBy: { machine_id: 'desc' },
        select: { machine_id: true },
      });

      if (!lastMachine) {
        return 'MCH0001';
      }

      const numericPart = parseInt(lastMachine.machine_id.substring(3), 10);
      const next = Number.isNaN(numericPart) ? 1 : numericPart + 1;
      return `MCH${next.toString().padStart(4, '0')}`;
    } catch (error) {
      logger.error('Error generating machine ID:', error);
      return `MCH${Date.now().toString().slice(-4)}`;
    }
  }

  // Generate unique machine code
  private async generateMachineCode(companyId: string): Promise<string> {
    try {
      const lastMachine = await prisma.machines.findFirst({
        where: { company_id: companyId },
        orderBy: { machine_code: 'desc' },
        select: { machine_code: true },
      });

      if (!lastMachine) {
        return 'MC0001';
      }

      const numericPart = parseInt(lastMachine.machine_code.substring(2), 10);
      const next = Number.isNaN(numericPart) ? 1 : numericPart + 1;
      return `MC${next.toString().padStart(4, '0')}`;
    } catch (error) {
      logger.error('Error generating machine code:', error);
      return `MC${Date.now().toString().slice(-4)}`;
    }
  }

  // Generate unique ticket ID for breakdowns
  private async generateTicketId(companyId: string): Promise<string> {
    try {
      const lastTicket = await prisma.breakdown_reports.findFirst({
        where: { company_id: companyId },
        orderBy: { ticket_id: 'desc' },
        select: { ticket_id: true },
      });

      if (!lastTicket) {
        return 'TKT0001';
      }

      const numericPart = parseInt(lastTicket.ticket_id.substring(3), 10);
      const next = Number.isNaN(numericPart) ? 1 : numericPart + 1;
      return `TKT${next.toString().padStart(4, '0')}`;
    } catch (error) {
      logger.error('Error generating ticket ID:', error);
      return `TKT${Date.now().toString().slice(-4)}`;
    }
  }

  // Generate unique schedule ID
  private async generateScheduleId(companyId: string): Promise<string> {
    try {
      const lastSchedule = await prisma.maintenance_schedules.findFirst({
        where: { company_id: companyId },
        orderBy: { schedule_id: 'desc' },
        select: { schedule_id: true },
      });

      if (!lastSchedule) {
        return 'SCH0001';
      }

      const numericPart = parseInt(lastSchedule.schedule_id.substring(3), 10);
      const next = Number.isNaN(numericPart) ? 1 : numericPart + 1;
      return `SCH${next.toString().padStart(4, '0')}`;
    } catch (error) {
      logger.error('Error generating schedule ID:', error);
      return `SCH${Date.now().toString().slice(-4)}`;
    }
  }

  // Generate unique record ID
  private async generateRecordId(companyId: string): Promise<string> {
    try {
      const lastRecord = await prisma.maintenance_records.findFirst({
        where: { company_id: companyId },
        orderBy: { record_id: 'desc' },
        select: { record_id: true },
      });

      if (!lastRecord) {
        return 'REC0001';
      }

      const numericPart = parseInt(lastRecord.record_id.substring(3), 10);
      const next = Number.isNaN(numericPart) ? 1 : numericPart + 1;
      return `REC${next.toString().padStart(4, '0')}`;
    } catch (error) {
      logger.error('Error generating record ID:', error);
      return `REC${Date.now().toString().slice(-4)}`;
    }
  }

  // Create machine
  async createMachine(companyId: string, data: CreateMachineRequest) {
    try {
      const machineId = await this.generateMachineId(companyId);
      const machineCode = await this.generateMachineCode(companyId);

      const machine = await prisma.machines.create({
        data: {
          machine_id: machineId,
          machine_code: machineCode,
          company_id: companyId,
          location_id: data.locationId || null,
          name: data.name,
          machine_type: data.machineType || null,
          model: data.model || null,
          manufacturer: data.manufacturer || null,
          serial_number: data.serialNumber || null,
          purchase_date: data.purchaseDate || null,
          warranty_expiry: data.warrantyExpiry || null,
          specifications: data.specifications || null,
          image_url: data.imageUrl || null,
          current_operator_id: data.currentOperatorId || null,
          operational_status: data.operationalStatus as any || 'FREE',
          is_active: data.isActive ?? true,
          updated_at: new Date(),
        },
        include: {
          location: true,
          current_operator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      // Create initial status history
      await prisma.machine_status_history.create({
        data: {
          machine_id: machine.id,
          company_id: companyId,
          new_status: machine.status,
          reason: 'Machine created',
        },
      });

      logger.info(`Machine created: ${machine.machine_id} for company ${companyId}`);
      return machine;
    } catch (error) {
      logger.error('Error creating machine:', error);
      throw error;
    }
  }

  // Get machines with filters
  async getMachines(companyId: string, filters: MachineFilters = {}) {
    try {
      const where: any = {
        company_id: companyId,
      };

      if (filters.locationId) {
        where.location_id = filters.locationId;
      }

      if (filters.machineType) {
        where.machine_type = filters.machineType;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.isActive !== undefined) {
        where.is_active = filters.isActive;
      }

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { machine_id: { contains: filters.search, mode: 'insensitive' } },
          { machine_code: { contains: filters.search, mode: 'insensitive' } },
          { machine_type: { contains: filters.search, mode: 'insensitive' } },
          { manufacturer: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const machines = await prisma.machines.findMany({
        where,
        include: {
          location: true,
          current_operator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
          _count: {
            select: {
              breakdown_reports: {
                where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
              },
              maintenance_schedules: {
                where: { is_active: true },
              },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return machines;
    } catch (error) {
      logger.error('Error fetching machines:', error);
      throw error;
    }
  }

  // Get machine by ID
  async getMachineById(companyId: string, machineId: string) {
    try {
      const machine = await prisma.machines.findFirst({
        where: {
          id: machineId,
          company_id: companyId,
        },
        include: {
          location: true,
          current_operator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
          status_history: {
            orderBy: { created_at: 'desc' },
            take: 10,
          },
          breakdown_reports: {
            where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
            orderBy: { created_at: 'desc' },
            take: 5,
          },
          maintenance_schedules: {
            where: { is_active: true },
            orderBy: { next_due: 'asc' },
            take: 5,
          },
        },
      });

      if (!machine) {
        throw new Error('Machine not found');
      }

      return machine;
    } catch (error) {
      logger.error('Error fetching machine:', error);
      throw error;
    }
  }

  // Update machine
  async updateMachine(companyId: string, machineId: string, data: UpdateMachineRequest) {
    try {
      const existingMachine = await prisma.machines.findFirst({
        where: {
          id: machineId,
          company_id: companyId,
        },
      });

      if (!existingMachine) {
        throw new Error('Machine not found');
      }

      // Build update data, converting empty strings to null
      const updateData: any = {
        updated_at: new Date(),
      };
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.machineType !== undefined) updateData.machine_type = data.machineType || null;
      if (data.model !== undefined) updateData.model = data.model || null;
      if (data.manufacturer !== undefined) updateData.manufacturer = data.manufacturer || null;
      if (data.serialNumber !== undefined) updateData.serial_number = data.serialNumber || null;
      if (data.purchaseDate !== undefined) updateData.purchase_date = data.purchaseDate || null;
      if (data.warrantyExpiry !== undefined) updateData.warranty_expiry = data.warrantyExpiry || null;
      if (data.specifications !== undefined) updateData.specifications = data.specifications || null;
      if (data.imageUrl !== undefined) updateData.image_url = data.imageUrl || null;
      if (data.locationId !== undefined) updateData.location_id = data.locationId || null;
      if (data.currentOperatorId !== undefined) updateData.current_operator_id = data.currentOperatorId || null;
      if (data.operationalStatus !== undefined) updateData.operational_status = data.operationalStatus;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.isActive !== undefined) updateData.is_active = data.isActive;

      const machine = await prisma.machines.update({
        where: { id: machineId },
        data: updateData,
        include: {
          location: true,
          current_operator: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
            },
          },
        },
      });

      // Create status history if status changed
      if (data.status && data.status !== existingMachine.status) {
        await prisma.machine_status_history.create({
          data: {
            machine_id: machineId,
            company_id: companyId,
            previous_status: existingMachine.status,
            new_status: data.status,
            reason: 'Status updated',
          },
        });
      }

      logger.info(`Machine updated: ${machine.machine_id} for company ${companyId}`);
      return machine;
    } catch (error) {
      logger.error('Error updating machine:', error);
      throw error;
    }
  }

  // Update machine status
  async updateMachineStatus(companyId: string, machineId: string, status: MachineStatus, reason?: string, changedBy?: string) {
    try {
      const existingMachine = await prisma.machines.findFirst({
        where: {
          id: machineId,
          company_id: companyId,
        },
      });

      if (!existingMachine) {
        throw new Error('Machine not found');
      }

      const machine = await prisma.machines.update({
        where: { id: machineId },
        data: {
          status,
          updated_at: new Date(),
        },
        include: {
          location: true,
        },
      });

      // Create status history
      await prisma.machine_status_history.create({
        data: {
          machine_id: machineId,
          company_id: companyId,
          previous_status: existingMachine.status,
          new_status: status,
          changed_by: changedBy,
          reason: reason || 'Status updated',
        },
      });

      logger.info(`Machine status updated: ${machine.machine_id} to ${status} for company ${companyId}`);
      return machine;
    } catch (error) {
      logger.error('Error updating machine status:', error);
      throw error;
    }
  }

  // Create breakdown report
  async createBreakdownReport(companyId: string, data: CreateBreakdownRequest) {
    try {
      const ticketId = await this.generateTicketId(companyId);

      const breakdown = await prisma.breakdown_reports.create({
        data: {
          ticket_id: ticketId,
          machine_id: data.machineId,
          company_id: companyId,
          reported_by: data.reportedBy,
          severity: data.severity,
          title: data.title,
          description: data.description,
          breakdown_time: data.breakdownTime || new Date(),
          priority: data.priority || 'MEDIUM',
          images: data.images,
          updated_at: new Date(),
        },
        include: {
          machine: {
            include: {
              location: true,
            },
          },
        },
      });

      // Update machine status to UNDER_REPAIR if critical
      if (data.severity === 'CRITICAL') {
        await this.updateMachineStatus(companyId, data.machineId, 'UNDER_REPAIR', 'Critical breakdown reported');
      }

      logger.info(`Breakdown report created: ${breakdown.ticket_id} for machine ${breakdown.machine.machine_id}`);
      return breakdown;
    } catch (error) {
      logger.error('Error creating breakdown report:', error);
      throw error;
    }
  }

  // Get breakdown reports
  async getBreakdownReports(companyId: string, filters: { machineId?: string; status?: BreakdownStatus; severity?: BreakdownSeverity } = {}) {
    try {
      const where: any = {
        company_id: companyId,
      };

      if (filters.machineId) {
        where.machine_id = filters.machineId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.severity) {
        where.severity = filters.severity;
      }

      const breakdowns = await prisma.breakdown_reports.findMany({
        where,
        include: {
          machine: {
            include: {
              location: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      return breakdowns;
    } catch (error) {
      logger.error('Error fetching breakdown reports:', error);
      throw error;
    }
  }

  // Update breakdown report
  async updateBreakdownReport(companyId: string, breakdownId: string, data: UpdateBreakdownRequest) {
    try {
      const breakdown = await prisma.breakdown_reports.update({
        where: {
          id: breakdownId,
          company_id: companyId,
        },
        data: {
          ...data,
          resolved_time: data.status === 'RESOLVED' ? new Date() : undefined,
          updated_at: new Date(),
        },
        include: {
          machine: {
            include: {
              location: true,
            },
          },
        },
      });

      // Update machine status if breakdown is resolved
      if (data.status === 'RESOLVED') {
        await this.updateMachineStatus(companyId, breakdown.machine_id, 'IDLE', 'Breakdown resolved');
      }

      logger.info(`Breakdown report updated: ${breakdown.ticket_id}`);
      return breakdown;
    } catch (error) {
      logger.error('Error updating breakdown report:', error);
      throw error;
    }
  }

  // Create maintenance schedule
  async createMaintenanceSchedule(companyId: string, data: CreateMaintenanceScheduleRequest) {
    try {
      const scheduleId = await this.generateScheduleId(companyId);

      const schedule = await prisma.maintenance_schedules.create({
        data: {
          schedule_id: scheduleId,
          machine_id: data.machineId,
          company_id: companyId,
          maintenance_type: data.maintenanceType,
          title: data.title,
          description: data.description,
          frequency_days: data.frequencyDays,
          next_due: data.nextDue,
          estimated_hours: data.estimatedHours,
          assigned_technician: data.assignedTechnician,
          checklist: data.checklist,
          parts_required: data.partsRequired,
          updated_at: new Date(),
        },
        include: {
          machine: {
            include: {
              location: true,
            },
          },
        },
      });

      logger.info(`Maintenance schedule created: ${schedule.schedule_id} for machine ${schedule.machine.machine_id}`);
      return schedule;
    } catch (error) {
      logger.error('Error creating maintenance schedule:', error);
      throw error;
    }
  }

  // Get maintenance schedules
  async getMaintenanceSchedules(companyId: string, filters: { machineId?: string; dueWithinDays?: number } = {}) {
    try {
      const where: any = {
        company_id: companyId,
        is_active: true,
      };

      if (filters.machineId) {
        where.machine_id = filters.machineId;
      }

      if (filters.dueWithinDays) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + filters.dueWithinDays);
        where.next_due = {
          lte: dueDate,
        };
      }

      const schedules = await prisma.maintenance_schedules.findMany({
        where,
        include: {
          machine: {
            include: {
              location: true,
            },
          },
        },
        orderBy: { next_due: 'asc' },
      });

      return schedules;
    } catch (error) {
      logger.error('Error fetching maintenance schedules:', error);
      throw error;
    }
  }

  // Create maintenance record
  async createMaintenanceRecord(companyId: string, data: CreateMaintenanceRecordRequest) {
    try {
      const recordId = await this.generateRecordId(companyId);

      const record = await prisma.maintenance_records.create({
        data: {
          record_id: recordId,
          machine_id: data.machineId,
          schedule_id: data.scheduleId,
          company_id: companyId,
          maintenance_type: data.maintenanceType,
          performed_by: data.performedBy,
          performed_date: data.performedDate,
          duration_hours: data.durationHours,
          tasks_completed: data.tasksCompleted,
          parts_used: data.partsUsed,
          cost: data.cost,
          notes: data.notes,
          next_maintenance_date: data.nextMaintenanceDate,
        },
        include: {
          machine: {
            include: {
              location: true,
            },
          },
          schedule: true,
        },
      });

      // Update schedule if provided
      if (data.scheduleId && data.nextMaintenanceDate) {
        await prisma.maintenance_schedules.update({
          where: { id: data.scheduleId },
          data: {
            last_completed: data.performedDate,
            next_due: data.nextMaintenanceDate,
            updated_at: new Date(),
          },
        });
      }

      logger.info(`Maintenance record created: ${record.record_id} for machine ${record.machine.machine_id}`);
      return record;
    } catch (error) {
      logger.error('Error creating maintenance record:', error);
      throw error;
    }
  }

  // Get machine analytics
  async getMachineAnalytics(companyId: string) {
    try {
      const totalMachines = await prisma.machines.count({
        where: { company_id: companyId, is_active: true },
      });

      const machinesByStatus = await prisma.machines.groupBy({
        by: ['status'],
        where: { company_id: companyId, is_active: true },
        _count: true,
      });

      const activeBreakdowns = await prisma.breakdown_reports.count({
        where: {
          company_id: companyId,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      });

      const dueMaintenance = await prisma.maintenance_schedules.count({
        where: {
          company_id: companyId,
          is_active: true,
          next_due: {
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next 7 days
          },
        },
      });

      const overdueMaintenance = await prisma.maintenance_schedules.count({
        where: {
          company_id: companyId,
          is_active: true,
          next_due: {
            lt: new Date(),
          },
        },
      });

      return {
        totalMachines,
        machinesByStatus: machinesByStatus.reduce((acc, item) => {
          acc[item.status] = item._count;
          return acc;
        }, {} as Record<string, number>),
        activeBreakdowns,
        dueMaintenance,
        overdueMaintenance,
      };
    } catch (error) {
      logger.error('Error fetching machine analytics:', error);
      throw error;
    }
  }

  // Delete machine (soft delete)
  async deleteMachine(companyId: string, machineId: string) {
    try {
      const existingMachine = await prisma.machines.findFirst({
        where: {
          id: machineId,
          company_id: companyId,
        },
      });

      if (!existingMachine) {
        throw new Error('Machine not found');
      }

      // Check if machine has active breakdowns
      const activeBreakdowns = await prisma.breakdown_reports.count({
        where: {
          machine_id: machineId,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      });

      if (activeBreakdowns > 0) {
        throw new Error('Cannot delete machine with active breakdown reports. Please resolve all breakdowns first.');
      }

      // Soft delete by setting is_active to false
      const machine = await prisma.machines.update({
        where: { id: machineId },
        data: {
          is_active: false,
          status: 'DECOMMISSIONED',
          updated_at: new Date(),
        },
      });

      // Create status history
      await prisma.machine_status_history.create({
        data: {
          machine_id: machineId,
          company_id: companyId,
          previous_status: existingMachine.status,
          new_status: 'DECOMMISSIONED',
          reason: 'Machine deleted (soft delete)',
        },
      });

      logger.info(`Machine deleted (soft): ${machine.machine_id} for company ${companyId}`);
      return { success: true, message: 'Machine deleted successfully' };
    } catch (error) {
      logger.error('Error deleting machine:', error);
      throw error;
    }
  }
}

export const machineService = new MachineService();
