# 🏭 EPIC: Quality Control & Textile-Specific Modules
## Lavoro AI Ferri - Sprint 3.4 & 3.5 Implementation

---

## 📋 EPIC Overview

**Epic Name**: Quality Control & Textile-Specific Manufacturing Modules  
**Duration**: Week 10-10.5  
**Status**: 🔄 IN PROGRESS  
**Priority**: P1 (High Priority)

---

## ⚠️ CRITICAL: FOLLOW EXISTING PATTERNS

**ALL implementations MUST follow these established patterns:**

### Backend Standards
- Service: `src/services/[module]Service.ts` (Prisma, transactions, snake_case ↔ camelCase)
- Controller: `src/controllers/[module]Controller.ts` (Joi validation, HTTP handling)
- Routes: `src/routes/v1/[module]Routes.ts` (tenantIsolation + requireRole middleware)
- Auto-generated IDs: QC001, DEF001, FAB001, etc.

### Frontend Standards
- Pages: `frontend/src/pages/[Module]ListPage.tsx` (AntD Table, pagination)
- Components: `frontend/src/components/[module]/[Module]FormDrawer.tsx` (720px drawer)
- Services: `frontend/src/services/[module]Service.ts` (fetch with auth)
- Buttons: GradientButton (primary), AntD Button (secondary)
- Status Tags: Color-coded with AntD Tag
- SCSS: Alongside components

### UI Theme
- Primary: #7b5fc9, Accent: #a2d8e5, Success: #52c41a, Warning: #faad14, Error: #ff4d4f

---

## 📊 Implementation Status

### ✅ Completed
- Sprint 3.3: Order Management System
- Bug fixes: locationName validation, JWT role inclusion
- Financial documents with location integration

### 🔄 In Progress
- Sprint 3.4: Quality Control System - Frontend (Checkpoints ✅, Defects ✅, Compliance Reports ⏳)

### ✅ Completed
- Sprint 3.4 Backend: Database schema, Service, Controller, Routes
- Sprint 3.4 Frontend: Quality Checkpoints (List + Form Drawer)
- Sprint 3.4 Frontend: Quality Defects (List + Form Drawer)
- Sprint 3.4 Frontend: Quality Service API integration

### ⏳ Todo
- Sprint 3.4: Compliance Reports page and drawer
- Sprint 3.5: Textile-Specific Features

---

---

## 📋 Sprint 3.4: Quality Control System

### Database Schema (Prisma)

```prisma
// quality_checkpoints table
model quality_checkpoints {
  id              String   @id @default(uuid())
  checkpoint_id   String   @unique // QC001
  company_id      String
  location_id     String?
  order_id        String?
  checkpoint_type CheckpointType
  checkpoint_name String
  inspector_name  String
  inspection_date DateTime
  status          QCStatus
  overall_score   Decimal? @db.Decimal(5,2)
  notes           String?
  created_at      DateTime @default(now())
  updated_at      DateTime
  
  company         companies @relation(fields: [company_id], references: [id], onDelete: Cascade)
  location        company_locations? @relation(fields: [location_id], references: [id])
  order           orders? @relation(fields: [order_id], references: [id])
  defects         quality_defects[]
  metrics         quality_metrics[]
}

enum CheckpointType {
  INCOMING_MATERIAL
  IN_PROCESS
  FINAL_INSPECTION
  PACKAGING
  RANDOM_SAMPLING
}

enum QCStatus {
  PENDING
  IN_PROGRESS
  PASSED
  FAILED
  CONDITIONAL_PASS
  REWORK_REQUIRED
}

// quality_defects table
model quality_defects {
  id                String   @id @default(uuid())
  defect_id         String   @unique // DEF001
  company_id        String
  checkpoint_id     String
  defect_category   DefectCategory
  defect_type       String
  severity          DefectSeverity
  quantity          Int
  description       String?
  image_url         String?
  resolution_status ResolutionStatus
  resolution_notes  String?
  resolved_by       String?
  resolved_at       DateTime?
  created_at        DateTime @default(now())
  updated_at        DateTime
  
  company           companies @relation(fields: [company_id], references: [id], onDelete: Cascade)
  checkpoint        quality_checkpoints @relation(fields: [checkpoint_id], references: [id])
}

enum DefectCategory {
  FABRIC
  STITCHING
  COLOR
  MEASUREMENT
  PACKAGING
  FINISHING
  LABELING
}

enum DefectSeverity {
  CRITICAL
  MAJOR
  MINOR
}

enum ResolutionStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  REJECTED
}

// quality_metrics table
model quality_metrics {
  id              String   @id @default(uuid())
  metric_id       String   @unique // QM001
  company_id      String
  checkpoint_id   String
  metric_name     String
  metric_value    Decimal @db.Decimal(10,4)
  unit_of_measure String
  min_threshold   Decimal? @db.Decimal(10,4)
  max_threshold   Decimal? @db.Decimal(10,4)
  is_within_range Boolean
  notes           String?
  created_at      DateTime @default(now())
  
  company         companies @relation(fields: [company_id], references: [id], onDelete: Cascade)
  checkpoint      quality_checkpoints @relation(fields: [checkpoint_id], references: [id])
}

// compliance_reports table
model compliance_reports {
  id              String   @id @default(uuid())
  report_id       String   @unique // CR001
  company_id      String
  report_type     ComplianceType
  report_date     DateTime
  auditor_name    String
  certification   String?
  validity_period String?
  status          ComplianceStatus
  findings        String?
  recommendations String?
  document_url    String?
  created_at      DateTime @default(now())
  updated_at      DateTime
  
  company         companies @relation(fields: [company_id], references: [id], onDelete: Cascade)
}

enum ComplianceType {
  ISO_9001
  ISO_14001
  OEKO_TEX
  GOTS
  WRAP
  SA8000
  BSCI
  SEDEX
}

enum ComplianceStatus {
  COMPLIANT
  NON_COMPLIANT
  PENDING_REVIEW
  EXPIRED
}
```

### Backend APIs

**Quality Checkpoints:**
- POST /api/v1/quality/checkpoints - Create checkpoint
- GET /api/v1/quality/checkpoints - List with filters (type, status, dateRange)
- GET /api/v1/quality/checkpoints/:id - Get details
- PUT /api/v1/quality/checkpoints/:id - Update
- PATCH /api/v1/quality/checkpoints/:id/status - Update status
- DELETE /api/v1/quality/checkpoints/:id - Delete

**Quality Defects:**
- POST /api/v1/quality/defects - Create defect
- GET /api/v1/quality/defects - List with filters (category, severity, resolutionStatus)
- GET /api/v1/quality/defects/:id - Get details
- PUT /api/v1/quality/defects/:id - Update
- PATCH /api/v1/quality/defects/:id/resolve - Resolve defect
- DELETE /api/v1/quality/defects/:id - Delete

**Quality Metrics:**
- POST /api/v1/quality/metrics - Create metric
- GET /api/v1/quality/metrics - List with filters
- GET /api/v1/quality/metrics/:checkpointId - Get metrics for checkpoint
- DELETE /api/v1/quality/metrics/:id - Delete

**Compliance Reports:**
- POST /api/v1/quality/compliance - Create report
- GET /api/v1/quality/compliance - List with filters (type, status)
- GET /api/v1/quality/compliance/:id - Get details
- PUT /api/v1/quality/compliance/:id - Update
- DELETE /api/v1/quality/compliance/:id - Delete

### Frontend Components

**1. QualityCheckpointsListPage**
- Header: "Quality Checkpoints" + "Create Checkpoint" (GradientButton)
- Filters: Type, Status, Date Range
- Table: ID, Name, Type (Tag), Inspector, Date, Status (Tag), Score (Progress), Actions
- Status Colors: PENDING=orange, IN_PROGRESS=blue, PASSED=green, FAILED=red

**2. QualityCheckpointFormDrawer**
- Section 1: Checkpoint Info (name, type, inspector, date)
- Section 2: References (order, location, production)
- Section 3: Results (status, score, notes)
- Buttons: Cancel, Save (GradientButton)

**3. QualityDefectsListPage**
- Header: "Quality Defects" + "Report Defect" (GradientButton)
- Filters: Category, Severity, Resolution Status
- Table: ID, Checkpoint, Category (Tag), Type, Severity (Tag), Quantity, Status, Actions
- Severity Colors: CRITICAL=red, MAJOR=orange, MINOR=yellow

**4. QualityDefectFormDrawer**
- Section 1: Defect Info (checkpoint, category, type, severity)
- Section 2: Details (quantity, description, image upload)
- Section 3: Resolution (status, notes, resolved by, date)
- Buttons: Cancel, Save (GradientButton)

**5. QualityMetricsTable** (Component)
- Embedded in checkpoint detail
- Table: Metric Name, Value, Unit, Min/Max Threshold, Within Range (icon), Actions
- Add Metric button + Modal form

**6. ComplianceReportsListPage**
- Header: "Compliance Reports" + "Create Report" (GradientButton)
- Filters: Type, Status
- Table: ID, Type (Tag), Date, Auditor, Certification, Validity, Status (Tag), Actions

**7. ComplianceReportFormDrawer**
- Section 1: Report Info (type, date, auditor)
- Section 2: Certification (number, validity period, status)
- Section 3: Findings (findings, recommendations, document upload)
- Buttons: Cancel, Save (GradientButton)

---

## 📋 Sprint 3.5: Textile-Specific Features

### Database Schema (Prisma)

```prisma
// fabric_production table
model fabric_production {
  id              String   @id @default(uuid())
  fabric_id       String   @unique // FAB001
  company_id      String
  location_id     String?
  fabric_type     FabricType
  fabric_name     String
  composition     String
  weight_gsm      Decimal @db.Decimal(8,2)
  width_inches    Decimal @db.Decimal(6,2)
  color           String
  pattern         String?
  finish_type     String?
  quantity_meters Decimal @db.Decimal(10,2)
  production_date DateTime
  batch_number    String
  quality_grade   QualityGrade
  notes           String?
  created_at      DateTime @default(now())
  updated_at      DateTime
  
  company         companies @relation(fields: [company_id], references: [id], onDelete: Cascade)
  location        company_locations? @relation(fields: [location_id], references: [id])
}

enum FabricType {
  COTTON
  SILK
  WOOL
  POLYESTER
  NYLON
  LINEN
  RAYON
  SPANDEX
  BLEND
}

enum QualityGrade {
  A_GRADE
  B_GRADE
  C_GRADE
  REJECT
}

// yarn_manufacturing table
model yarn_manufacturing {
  id              String   @id @default(uuid())
  yarn_id         String   @unique // YARN001
  company_id      String
  location_id     String?
  yarn_type       YarnType
  yarn_count      String
  twist_per_inch  Decimal? @db.Decimal(6,2)
  ply             Int
  color           String
  dye_lot         String?
  quantity_kg     Decimal @db.Decimal(10,2)
  production_date DateTime
  batch_number    String
  process_type    YarnProcess
  quality_grade   QualityGrade
  notes           String?
  created_at      DateTime @default(now())
  updated_at      DateTime
  
  company         companies @relation(fields: [company_id], references: [id], onDelete: Cascade)
  location        company_locations? @relation(fields: [location_id], references: [id])
}

enum YarnType {
  COTTON
  POLYESTER
  WOOL
  SILK
  ACRYLIC
  NYLON
  BLEND
}

enum YarnProcess {
  SPINNING
  WEAVING
  KNITTING
  TWISTING
}

// dyeing_finishing table
model dyeing_finishing {
  id                String   @id @default(uuid())
  process_id        String   @unique // DYE001
  company_id        String
  location_id       String?
  fabric_id         String?
  process_type      DyeingProcess
  color_code        String
  color_name        String
  dye_method        String?
  recipe_code       String?
  quantity_meters   Decimal @db.Decimal(10,2)
  process_date      DateTime
  batch_number      String
  machine_number    String?
  temperature_c     Decimal? @db.Decimal(5,2)
  duration_minutes  Int?
  quality_check     Boolean @default(false)
  color_fastness    String?
  shrinkage_percent Decimal? @db.Decimal(5,2)
  notes             String?
  created_at        DateTime @default(now())
  updated_at        DateTime
  
  company           companies @relation(fields: [company_id], references: [id], onDelete: Cascade)
  location          company_locations? @relation(fields: [location_id], references: [id])
}

enum DyeingProcess {
  DYEING
  PRINTING
  FINISHING
  WASHING
  BLEACHING
  MERCERIZING
}

// garment_manufacturing table
model garment_manufacturing {
  id              String   @id @default(uuid())
  garment_id      String   @unique // GARM001
  company_id      String
  location_id     String?
  order_id        String?
  garment_type    GarmentType
  style_number    String
  size            String
  color           String
  fabric_id       String?
  quantity        Int
  production_stage ProductionStage
  cut_date        DateTime?
  sew_date        DateTime?
  finish_date     DateTime?
  pack_date       DateTime?
  operator_name   String?
  line_number     String?
  quality_passed  Boolean @default(false)
  defect_count    Int @default(0)
  notes           String?
  created_at      DateTime @default(now())
  updated_at      DateTime
  
  company         companies @relation(fields: [company_id], references: [id], onDelete: Cascade)
  location        company_locations? @relation(fields: [location_id], references: [id])
  order           orders? @relation(fields: [order_id], references: [id])
}

enum GarmentType {
  SHIRT
  T_SHIRT
  PANTS
  JEANS
  DRESS
  SKIRT
  JACKET
  COAT
  SWEATER
  SHORTS
  UNDERWEAR
  SOCKS
}

enum ProductionStage {
  CUTTING
  SEWING
  FINISHING
  QUALITY_CHECK
  PACKING
  COMPLETED
}

// design_patterns table
model design_patterns {
  id                String   @id @default(uuid())
  design_id         String   @unique // DES001
  company_id        String
  design_name       String
  design_category   DesignCategory
  designer_name     String?
  season            String?
  color_palette     String[]
  pattern_repeat    String?
  design_file_url   String?
  sample_image_url  String?
  status            DesignStatus
  notes             String?
  created_at        DateTime @default(now())
  updated_at        DateTime
  
  company           companies @relation(fields: [company_id], references: [id], onDelete: Cascade)
}

enum DesignCategory {
  PRINT
  EMBROIDERY
  WEAVE
  KNIT
  APPLIQUE
  DIGITAL_PRINT
}

enum DesignStatus {
  CONCEPT
  APPROVED
  IN_PRODUCTION
  ARCHIVED
}
```

### Backend APIs

**Fabric Production:**
- POST /api/v1/textile/fabrics
- GET /api/v1/textile/fabrics (filters: type, grade, dateRange)
- GET /api/v1/textile/fabrics/:id
- PUT /api/v1/textile/fabrics/:id
- DELETE /api/v1/textile/fabrics/:id

**Yarn Manufacturing:**
- POST /api/v1/textile/yarn
- GET /api/v1/textile/yarn (filters: type, process, grade)
- GET /api/v1/textile/yarn/:id
- PUT /api/v1/textile/yarn/:id
- DELETE /api/v1/textile/yarn/:id

**Dyeing & Finishing:**
- POST /api/v1/textile/dyeing
- GET /api/v1/textile/dyeing (filters: processType, dateRange)
- GET /api/v1/textile/dyeing/:id
- PUT /api/v1/textile/dyeing/:id
- DELETE /api/v1/textile/dyeing/:id

**Garment Manufacturing:**
- POST /api/v1/textile/garments
- GET /api/v1/textile/garments (filters: type, stage, orderId)
- GET /api/v1/textile/garments/:id
- PUT /api/v1/textile/garments/:id
- PATCH /api/v1/textile/garments/:id/stage
- DELETE /api/v1/textile/garments/:id

**Design & Patterns:**
- POST /api/v1/textile/designs
- GET /api/v1/textile/designs (filters: category, status, season)
- GET /api/v1/textile/designs/:id
- PUT /api/v1/textile/designs/:id
- PATCH /api/v1/textile/designs/:id/status
- DELETE /api/v1/textile/designs/:id

### Frontend Components

**1. FabricProductionListPage**
- Header: "Fabric Production" + "Add Fabric" (GradientButton)
- Filters: Type, Grade, Date Range
- Table: ID, Name, Type (Tag), Composition, Weight (GSM), Width, Color, Quantity (m), Grade (Tag), Date, Actions
- Grade Colors: A=green, B=yellow, C=orange, REJECT=red

**2. FabricProductionFormDrawer**
- Section 1: Fabric Details (name, type, composition, weight, width, color, pattern, finish)
- Section 2: Production (quantity, date, batch, location)
- Section 3: Quality (grade, notes)
- Buttons: Cancel, Save (GradientButton)

**3. YarnManufacturingListPage**
- Header: "Yarn Manufacturing" + "Add Yarn" (GradientButton)
- Filters: Type, Process, Grade
- Table: ID, Type (Tag), Count, Ply, Color, Quantity (kg), Process (Tag), Grade (Tag), Date, Actions

**4. YarnManufacturingFormDrawer**
- Section 1: Yarn Details (type, count, twist, ply, color, dye lot)
- Section 2: Production (quantity, date, batch, process, location)
- Section 3: Quality (grade, notes)
- Buttons: Cancel, Save (GradientButton)

**5. DyeingFinishingListPage**
- Header: "Dyeing & Finishing" + "Add Process" (GradientButton)
- Filters: Process Type, Date Range
- Table: ID, Process (Tag), Color Code, Color Name, Method, Quantity (m), Date, Quality Check (icon), Actions

**6. DyeingFinishingFormDrawer**
- Section 1: Process Details (type, color code, color name, method, recipe)
- Section 2: Production (quantity, date, batch, machine, location)
- Section 3: Parameters (temperature, duration, quality check, color fastness, shrinkage)
- Buttons: Cancel, Save (GradientButton)

**7. GarmentManufacturingListPage**
- Header: "Garment Manufacturing" + "Add Garment" (GradientButton)
- Filters: Type, Stage, Order
- Table: ID, Type (Tag), Style, Size, Color, Quantity, Stage (Tag), Quality (icon), Defects, Actions
- Stage Colors: CUTTING=blue, SEWING=orange, FINISHING=yellow, QUALITY_CHECK=purple, PACKING=cyan, COMPLETED=green

**8. GarmentManufacturingFormDrawer**
- Section 1: Garment Details (type, style, size, color, fabric, quantity)
- Section 2: Production (stage, dates, operator, line, location, order)
- Section 3: Quality (quality passed, defect count, notes)
- Buttons: Cancel, Save (GradientButton)

**9. DesignPatternsListPage**
- Header: "Design & Patterns" + "Create Design" (GradientButton)
- Filters: Category, Status, Season
- Table: ID, Name, Category (Tag), Designer, Season, Status (Tag), Sample (image thumbnail), Actions

**10. DesignPatternFormDrawer**
- Section 1: Design Info (name, category, designer, season)
- Section 2: Pattern Details (color palette, pattern repeat, design file upload, sample image upload)
- Section 3: Status (status, notes)
- Buttons: Cancel, Save (GradientButton)

---

## ✅ Implementation Checklist

### Sprint 3.4 - Quality Control
- [ ] Create Prisma schema for quality tables
- [ ] Run migration
- [ ] Implement QualityService (backend)
- [ ] Implement QualityController (backend)
- [ ] Create quality routes
- [ ] Implement QualityCheckpointsListPage (frontend)
- [ ] Implement QualityCheckpointFormDrawer (frontend)
- [ ] Implement QualityDefectsListPage (frontend)
- [ ] Implement QualityDefectFormDrawer (frontend)
- [ ] Implement QualityMetricsTable (frontend)
- [ ] Implement ComplianceReportsListPage (frontend)
- [ ] Implement ComplianceReportFormDrawer (frontend)
- [ ] Create quality service (frontend API client)
- [ ] Add routes to AppRouter
- [ ] Test all APIs
- [ ] Verify UI patterns

### Sprint 3.5 - Textile Features
- [ ] Create Prisma schema for textile tables
- [ ] Run migration
- [ ] Implement TextileService (backend)
- [ ] Implement TextileController (backend)
- [ ] Create textile routes
- [ ] Implement FabricProductionListPage (frontend)
- [ ] Implement FabricProductionFormDrawer (frontend)
- [ ] Implement YarnManufacturingListPage (frontend)
- [ ] Implement YarnManufacturingFormDrawer (frontend)
- [ ] Implement DyeingFinishingListPage (frontend)
- [ ] Implement DyeingFinishingFormDrawer (frontend)
- [ ] Implement GarmentManufacturingListPage (frontend)
- [ ] Implement GarmentManufacturingFormDrawer (frontend)
- [ ] Implement DesignPatternsListPage (frontend)
- [ ] Implement DesignPatternFormDrawer (frontend)
- [ ] Create textile service (frontend API client)
- [ ] Add routes to AppRouter
- [ ] Test all APIs
- [ ] Verify UI patterns

---

**END OF IMPLEMENTATION PLAN**
