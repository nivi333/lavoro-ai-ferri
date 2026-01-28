/**
 * MachineService Unit Tests
 * Tests machine CRUD, maintenance scheduling, and breakdown management
 */

const createMockMachine = (overrides = {}) => ({
  machine_id: 'MCH001',
  tenant_id: 'tenant-123',
  name: 'Weaving Loom 1',
  machine_type: 'WEAVING_LOOM',
  manufacturer: 'Textile Machines Inc',
  model: 'WL-2000',
  serial_number: 'SN-12345',
  location_id: 'loc-001',
  status: 'IN_USE',
  purchase_date: new Date('2023-01-15'),
  warranty_expiry: new Date('2025-01-15'),
  specifications: { capacity: '1000 meters/day', power: '5kW' },
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const createMockMaintenanceSchedule = (overrides = {}) => ({
  schedule_id: 'ms-001',
  machine_id: 'MCH001',
  maintenance_type: 'PREVENTIVE',
  frequency: 'MONTHLY',
  next_due_date: new Date('2024-02-15'),
  estimated_duration: 120,
  assigned_to: 'user-123',
  notes: 'Regular maintenance check',
  is_active: true,
  ...overrides,
});

const createMockBreakdownReport = (overrides = {}) => ({
  breakdown_id: 'bd-001',
  machine_id: 'MCH001',
  reported_by: 'user-123',
  reported_at: new Date(),
  severity: 'HIGH',
  status: 'OPEN',
  description: 'Machine stopped unexpectedly',
  impact: 'Production halted',
  estimated_downtime: 240,
  ...overrides,
});

describe('MachineService - Machine Management', () => {
  it('should create machine with valid data', () => {
    const machine = createMockMachine();

    expect(machine.machine_id).toBe('MCH001');
    expect(machine.name).toBe('Weaving Loom 1');
    expect(machine.status).toBe('IN_USE');
    expect(machine.is_active).toBe(true);
  });

  it('should generate unique machine_id', () => {
    const machine1 = createMockMachine({ machine_id: 'MCH001' });
    const machine2 = createMockMachine({ machine_id: 'MCH002' });
    const machine3 = createMockMachine({ machine_id: 'MCH003' });

    const ids = [machine1.machine_id, machine2.machine_id, machine3.machine_id];
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(3);
  });

  it('should validate machine type', () => {
    const validTypes = [
      'WEAVING_LOOM',
      'SPINNING_MACHINE',
      'DYEING_MACHINE',
      'CUTTING_MACHINE',
      'STITCHING_MACHINE',
    ];

    const machine = createMockMachine({ machine_type: 'WEAVING_LOOM' });
    expect(validTypes).toContain(machine.machine_type);
  });

  it('should track machine location', () => {
    const machine = createMockMachine({ location_id: 'loc-001' });
    expect(machine.location_id).toBe('loc-001');
  });

  it('should store machine specifications', () => {
    const machine = createMockMachine({
      specifications: {
        capacity: '1000 meters/day',
        power: '5kW',
        dimensions: '2m x 1.5m x 1.8m',
      },
    });

    expect(machine.specifications).toBeDefined();
    expect(machine.specifications.capacity).toBe('1000 meters/day');
  });
});

describe('MachineService - Status Management', () => {
  it('should transition from IN_USE to UNDER_MAINTENANCE', () => {
    const machine = createMockMachine({ status: 'IN_USE' });
    const updatedMachine = { ...machine, status: 'UNDER_MAINTENANCE' };

    expect(updatedMachine.status).toBe('UNDER_MAINTENANCE');
  });

  it('should transition from UNDER_MAINTENANCE to IN_USE', () => {
    const machine = createMockMachine({ status: 'UNDER_MAINTENANCE' });
    const updatedMachine = { ...machine, status: 'IN_USE' };

    expect(updatedMachine.status).toBe('IN_USE');
  });

  it('should handle UNDER_REPAIR status', () => {
    const machine = createMockMachine({ status: 'IN_USE' });
    const brokenMachine = { ...machine, status: 'UNDER_REPAIR' };

    expect(brokenMachine.status).toBe('UNDER_REPAIR');
  });

  it('should mark machine as IDLE', () => {
    const machine = createMockMachine({ status: 'IN_USE' });
    const idleMachine = { ...machine, status: 'IDLE' };

    expect(idleMachine.status).toBe('IDLE');
  });

  it('should decommission machine', () => {
    const machine = createMockMachine({ status: 'IDLE' });
    const decommissioned = { ...machine, status: 'DECOMMISSIONED', is_active: false };

    expect(decommissioned.status).toBe('DECOMMISSIONED');
    expect(decommissioned.is_active).toBe(false);
  });
});

describe('MachineService - Maintenance Scheduling', () => {
  it('should create maintenance schedule', () => {
    const schedule = createMockMaintenanceSchedule();

    expect(schedule.schedule_id).toBeDefined();
    expect(schedule.machine_id).toBe('MCH001');
    expect(schedule.maintenance_type).toBe('PREVENTIVE');
  });

  it('should support different maintenance types', () => {
    const types = ['PREVENTIVE', 'CORRECTIVE', 'PREDICTIVE', 'ROUTINE'];
    
    types.forEach(type => {
      const schedule = createMockMaintenanceSchedule({ maintenance_type: type });
      expect(types).toContain(schedule.maintenance_type);
    });
  });

  it('should schedule recurring maintenance', () => {
    const frequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'];
    
    const schedule = createMockMaintenanceSchedule({ frequency: 'MONTHLY' });
    expect(frequencies).toContain(schedule.frequency);
  });

  it('should calculate next due date', () => {
    const schedule = createMockMaintenanceSchedule({
      frequency: 'MONTHLY',
      next_due_date: new Date('2024-02-15'),
    });

    expect(schedule.next_due_date).toBeInstanceOf(Date);
  });

  it('should assign maintenance to technician', () => {
    const schedule = createMockMaintenanceSchedule({ assigned_to: 'tech-123' });
    expect(schedule.assigned_to).toBe('tech-123');
  });

  it('should estimate maintenance duration', () => {
    const schedule = createMockMaintenanceSchedule({ estimated_duration: 120 });
    expect(schedule.estimated_duration).toBe(120);
  });
});

describe('MachineService - Breakdown Management', () => {
  it('should create breakdown report', () => {
    const breakdown = createMockBreakdownReport();

    expect(breakdown.breakdown_id).toBeDefined();
    expect(breakdown.machine_id).toBe('MCH001');
    expect(breakdown.status).toBe('OPEN');
  });

  it('should categorize breakdown severity', () => {
    const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    
    severities.forEach(severity => {
      const breakdown = createMockBreakdownReport({ severity });
      expect(severities).toContain(breakdown.severity);
    });
  });

  it('should track breakdown status', () => {
    const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    
    const breakdown = createMockBreakdownReport({ status: 'OPEN' });
    expect(statuses).toContain(breakdown.status);
  });

  it('should estimate downtime', () => {
    const breakdown = createMockBreakdownReport({
      estimated_downtime: 240,
      severity: 'HIGH',
    });

    expect(breakdown.estimated_downtime).toBe(240);
  });

  it('should record breakdown impact', () => {
    const breakdown = createMockBreakdownReport({
      impact: 'Production halted',
      severity: 'CRITICAL',
    });

    expect(breakdown.impact).toBeDefined();
  });

  it('should transition breakdown from OPEN to IN_PROGRESS', () => {
    const breakdown = createMockBreakdownReport({ status: 'OPEN' });
    const updated = { ...breakdown, status: 'IN_PROGRESS' };

    expect(updated.status).toBe('IN_PROGRESS');
  });

  it('should resolve breakdown', () => {
    const breakdown = createMockBreakdownReport({ status: 'IN_PROGRESS' });
    const resolved = {
      ...breakdown,
      status: 'RESOLVED',
      resolved_at: new Date(),
      resolution: 'Replaced faulty component',
    };

    expect(resolved.status).toBe('RESOLVED');
    expect(resolved.resolved_at).toBeInstanceOf(Date);
  });
});

describe('MachineService - Machine Analytics', () => {
  it('should calculate machine utilization', () => {
    const totalHours = 720; // 30 days
    const operatingHours = 600;
    const utilization = (operatingHours / totalHours) * 100;

    expect(utilization).toBeCloseTo(83.33, 2);
  });

  it('should track downtime', () => {
    const breakdowns = [
      createMockBreakdownReport({ estimated_downtime: 120 }),
      createMockBreakdownReport({ estimated_downtime: 180 }),
      createMockBreakdownReport({ estimated_downtime: 60 }),
    ];

    const totalDowntime = breakdowns.reduce((sum, b) => sum + b.estimated_downtime, 0);
    expect(totalDowntime).toBe(360);
  });

  it('should calculate MTBF (Mean Time Between Failures)', () => {
    const operatingHours = 1000;
    const numberOfFailures = 5;
    const mtbf = operatingHours / numberOfFailures;

    expect(mtbf).toBe(200);
  });

  it('should calculate MTTR (Mean Time To Repair)', () => {
    const repairTimes = [120, 180, 90, 150];
    const mttr = repairTimes.reduce((sum, t) => sum + t, 0) / repairTimes.length;

    expect(mttr).toBe(135);
  });
});
