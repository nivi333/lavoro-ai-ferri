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

### ✅ Completed
- Sprint 3.4 Backend: Database schema, Service, Controller, Routes
- Sprint 3.4 Frontend: Quality Checkpoints (List + Form Drawer)
- Sprint 3.4 Frontend: Quality Defects (List + Form Drawer)
- Sprint 3.4 Frontend: Compliance Reports (List + Form Drawer)
- Sprint 3.4 Frontend: Quality Service API integration
- Sprint 3.4 Frontend: Routes and sidebar navigation for all Quality modules
- UI/UX Enhancement: isActive default value set to true, disabled on create, editable only on edit (Company, Location, Product drawers)

### 🔄 In Progress
- Sprint 3.5: Textile-Specific Features - Frontend (Pages & Drawers)

### ✅ Completed (Sprint 3.5)
- Database Schema: All 5 textile tables with enums (fabric_production, yarn_manufacturing, dyeing_finishing, garment_manufacturing, design_patterns)
- Database Migration: Successfully applied textile features migration
- Backend Service: TextileService with full CRUD operations for all 5 modules
- Backend Controller: TextileController with Joi validation for all endpoints
- Backend Routes: Textile routes registered in v1/index with proper authentication and role-based access

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

## 📋 Sprint 3.6: Product Master & Inventory Management

### Overview
**Purpose**: Centralized product catalog for managing all company items/products with complete specifications, pricing, and inventory tracking. Products can be selected from dropdown in Orders, Purchase Orders, and Invoices instead of manual entry.

**Benefits**:
- ✅ Eliminate manual item entry errors
- ✅ Consistent pricing across all transactions
- ✅ Real-time stock tracking
- ✅ Product history and analytics
- ✅ Faster order creation workflow
- ✅ Multi-location inventory support

### Database Schema (Prisma)

```prisma
// products table (Master Product Catalog)
model products {
  id                String   @id @default(uuid())
  product_id        String   @unique // PROD001
  company_id        String
  product_code      String   // SKU or internal code
  product_name      String
  description       String?
  category          ProductCategory
  sub_category      String?
  
  // Pricing
  unit_price        Decimal @db.Decimal(12,2)
  cost_price        Decimal? @db.Decimal(12,2)
  currency          String @default("INR")
  tax_rate          Decimal? @db.Decimal(5,2)
  
  // Inventory
  unit_of_measure   String // PCS, MTR, KG, etc.
  current_stock     Decimal @db.Decimal(12,3) @default(0)
  min_stock_level   Decimal? @db.Decimal(12,3)
  max_stock_level   Decimal? @db.Decimal(12,3)
  reorder_point     Decimal? @db.Decimal(12,3)
  
  // Product Details
  barcode           String?
  hsn_code          String? // For GST/tax compliance
  manufacturer      String?
  brand             String?
  model_number      String?
  
  // Textile-Specific Fields
  fabric_type       String?
  color             String?
  size              String?
  weight_gsm        Decimal? @db.Decimal(8,2)
  composition       String?
  
  // Media & Documentation
  image_url         String?
  additional_images String[] // Array of image URLs
  specification_url String? // PDF/document URL
  
  // Status & Tracking
  is_active         Boolean @default(true)
  is_featured       Boolean @default(false)
  notes             String?
  tags              String[] // For search and filtering
  
  // Timestamps
  created_at        DateTime @default(now())
  updated_at        DateTime
  created_by        String?
  updated_by        String?
  
  // Relations
  company           companies @relation(fields: [company_id], references: [id], onDelete: Cascade)
  stock_movements   product_stock_movements[]
  location_stock    product_location_stock[]
  
  @@unique([company_id, product_code])
  @@index([company_id, is_active])
  @@index([company_id, category])
}

enum ProductCategory {
  RAW_MATERIAL
  FABRIC
  YARN
  GARMENT
  ACCESSORY
  PACKAGING
  FINISHED_GOODS
  CONSUMABLE
  MACHINERY_PARTS
  OTHER
}

// product_location_stock table (Multi-location inventory)
model product_location_stock {
  id              String   @id @default(uuid())
  product_id      String
  location_id     String
  company_id      String
  quantity        Decimal @db.Decimal(12,3)
  reserved_qty    Decimal @db.Decimal(12,3) @default(0) // For pending orders
  available_qty   Decimal @db.Decimal(12,3) @default(0) // quantity - reserved_qty
  last_updated    DateTime
  
  product         products @relation(fields: [product_id], references: [id], onDelete: Cascade)
  location        company_locations @relation(fields: [location_id], references: [id])
  company         companies @relation(fields: [company_id], references: [id], onDelete: Cascade)
  
  @@unique([product_id, location_id])
  @@index([company_id, location_id])
}

// product_stock_movements table (Stock transaction history)
model product_stock_movements {
  id                String   @id @default(uuid())
  movement_id       String   @unique // STK001
  company_id        String
  product_id        String
  location_id       String?
  movement_type     StockMovementType
  quantity          Decimal @db.Decimal(12,3)
  unit_price        Decimal? @db.Decimal(12,2)
  reference_type    String? // ORDER, PURCHASE_ORDER, ADJUSTMENT, etc.
  reference_id      String? // Related document ID
  notes             String?
  movement_date     DateTime
  created_by        String?
  created_at        DateTime @default(now())
  
  product           products @relation(fields: [product_id], references: [id])
  location          company_locations? @relation(fields: [location_id], references: [id])
  company           companies @relation(fields: [company_id], references: [id], onDelete: Cascade)
  
  @@index([company_id, product_id])
  @@index([company_id, movement_date])
}

enum StockMovementType {
  PURCHASE
  SALE
  TRANSFER
  ADJUSTMENT_IN
  ADJUSTMENT_OUT
  RETURN
  PRODUCTION
  WASTAGE
  DAMAGED
}
```

### Backend APIs

**Product Management:**
- POST /api/v1/products - Create product
- GET /api/v1/products - List with filters (category, active, search, location)
- GET /api/v1/products/:id - Get product details with stock info
- PUT /api/v1/products/:id - Update product
- PATCH /api/v1/products/:id/status - Activate/deactivate
- DELETE /api/v1/products/:id - Delete product
- GET /api/v1/products/search - Quick search for dropdowns (returns: id, code, name, price, stock)
- POST /api/v1/products/:id/upload-image - Upload product image
- GET /api/v1/products/:id/stock-history - Get stock movement history

**Stock Management:**
- POST /api/v1/products/:id/stock/adjust - Manual stock adjustment
- POST /api/v1/products/:id/stock/transfer - Transfer between locations
- GET /api/v1/products/:id/stock/locations - Get stock by location
- POST /api/v1/products/stock/bulk-update - Bulk stock update (CSV import)
- GET /api/v1/products/stock/low-stock - Get products below reorder point
- GET /api/v1/products/stock/movements - List all stock movements with filters

**Integration Endpoints:**
- GET /api/v1/products/dropdown - Lightweight list for Order/PO/Invoice dropdowns
  - Returns: { id, productCode, productName, unitPrice, currentStock, uom }
- POST /api/v1/products/reserve - Reserve stock for order (reduces available_qty)
- POST /api/v1/products/release - Release reserved stock (cancelled order)

### Frontend Components

**1. ProductsListPage** (`frontend/src/pages/ProductsListPage.tsx`)
- **Header**: "Product Master" + "Add Product" (GradientButton)
- **Filters**: 
  - Category dropdown (all categories)
  - Active/Inactive toggle
  - Search bar (product code, name)
  - Location filter (show stock for specific location)
- **Table Columns**:
  - Image (thumbnail)
  - Product Code
  - Product Name
  - Category (Tag with color)
  - Unit Price (formatted with currency)
  - Current Stock (with color: red if below min, green if normal)
  - UOM
  - Status (Active/Inactive badge)
  - Actions (More dropdown: Edit, View Stock, Deactivate, Delete)
- **Features**:
  - Pagination (20 items per page)
  - Export to CSV
  - Bulk actions (activate/deactivate multiple)
  - Quick view modal for product details

**2. ProductFormDrawer** (`frontend/src/components/products/ProductFormDrawer.tsx`)
- **Width**: 720px
- **Sections**:

**Section 1: Basic Information**
- Row 1: Product Code (auto-generated, readonly for edit), Product Name (required)
- Row 2: Category (dropdown, required), Sub-Category (text)
- Row 3: Manufacturer, Brand
- Row 4: Model Number, Barcode
- Row 5: HSN Code (for tax), Tags (multi-select)
- Active Status Toggle (top-right)

**Section 2: Pricing & Inventory**
- Row 1: Unit Price (required, decimal), Cost Price (decimal)
- Row 2: Currency (dropdown, default INR), Tax Rate (%)
- Row 3: Unit of Measure (UOM dropdown with textile units)
- Row 4: Current Stock (readonly, shows total), Min Stock Level, Max Stock Level
- Row 5: Reorder Point (alert threshold)

**Section 3: Textile-Specific Details** (Collapsible)
- Row 1: Fabric Type (dropdown), Color
- Row 2: Size, Weight (GSM)
- Row 3: Composition (e.g., "100% Cotton", "65% Polyester 35% Cotton")

**Section 4: Description & Media**
- Description (textarea, 500 chars)
- Notes (textarea, 1000 chars)
- Image Upload:
  - Main Image (picture-circle with camera icon)
  - Additional Images (up to 4 images, picture-card)
  - Specification Document (PDF upload)

**Section 5: Stock by Location** (Edit mode only, readonly)
- Table showing stock at each location:
  - Location Name
  - Quantity
  - Reserved
  - Available
  - Last Updated
- "Adjust Stock" button opens StockAdjustmentModal

**Buttons**: Cancel (left), Save Product (right, GradientButton)

**3. StockAdjustmentModal** (`frontend/src/components/products/StockAdjustmentModal.tsx`)
- **Trigger**: From ProductFormDrawer or ProductsListPage
- **Fields**:
  - Product (readonly, shows name + code)
  - Location (dropdown, required)
  - Movement Type (dropdown: ADJUSTMENT_IN, ADJUSTMENT_OUT, TRANSFER, etc.)
  - Quantity (number, required)
  - Unit Price (if purchase/sale)
  - Reference Type (optional: ORDER, PURCHASE_ORDER, etc.)
  - Reference ID (optional)
  - Notes (textarea)
  - Movement Date (date picker, default today)
- **Buttons**: Cancel, Save Movement (GradientButton)

**4. StockMovementHistoryPage** (`frontend/src/pages/StockMovementHistoryPage.tsx`)
- **Header**: "Stock Movement History"
- **Filters**:
  - Date Range
  - Product (searchable dropdown)
  - Location
  - Movement Type
- **Table**:
  - Movement ID
  - Date
  - Product Code + Name
  - Location
  - Movement Type (Tag with color)
  - Quantity (+ for in, - for out)
  - Reference (type + ID link)
  - Created By
  - Notes
- **Export**: CSV export with filters

**5. LowStockAlertsPage** (`frontend/src/pages/LowStockAlertsPage.tsx`)
- **Header**: "Low Stock Alerts"
- **Table**:
  - Product Code
  - Product Name
  - Current Stock (red text)
  - Reorder Point
  - Shortage (calculated)
  - Location
  - Actions (Create PO button)
- **Auto-refresh**: Every 5 minutes
- **Notification**: Badge count in sidebar

**6. ProductDropdownSelector** (`frontend/src/components/products/ProductDropdownSelector.tsx`)
- **Reusable Component** for Order/PO/Invoice forms
- **Features**:
  - Searchable dropdown (by code or name)
  - Shows: Product Code - Product Name (Stock: X UOM) - Price
  - Auto-fills: unitPrice, uom when selected
  - Shows stock availability warning if low
  - Option to "Add New Product" (opens ProductFormDrawer)

### Integration with Existing Modules

**Orders (OrderFormDrawer):**
- Replace manual "Item Code" input with ProductDropdownSelector
- Auto-fill: description, unitOfMeasure, unitPrice from product
- Show current stock availability
- Reserve stock on order creation
- Release stock on order cancellation

**Purchase Orders:**
- Use ProductDropdownSelector for item selection
- Auto-fill product details
- Update stock on PO receipt

**Invoices:**
- Use ProductDropdownSelector
- Pull latest unit price from product master
- Deduct stock on invoice generation

### Service Layer (Backend)

**ProductService** (`src/services/productService.ts`)
- `createProduct(tenantId, data)` - Validate, generate PROD001, create product + initial stock entry
- `getProducts(tenantId, filters)` - List with pagination, search, filters
- `getProductById(tenantId, productId)` - Get with stock info from all locations
- `updateProduct(tenantId, productId, data)` - Update product details
- `deleteProduct(tenantId, productId)` - Soft delete (set is_active = false)
- `adjustStock(tenantId, productId, movement)` - Create stock movement, update quantities
- `transferStock(tenantId, productId, fromLocation, toLocation, quantity)` - Transfer between locations
- `reserveStock(tenantId, productId, locationId, quantity)` - Reserve for order
- `releaseStock(tenantId, productId, locationId, quantity)` - Release reservation
- `getLowStockProducts(tenantId)` - Get products below reorder point
- `getStockHistory(tenantId, productId, filters)` - Get movement history
- `searchProducts(tenantId, query)` - Quick search for dropdowns

**ProductController** (`src/controllers/productController.ts`)
- Joi validation schemas for all operations
- HTTP handlers for all endpoints
- Role-based access: OWNER/ADMIN (full access), MANAGER (read + adjust stock), EMPLOYEE (read only)

**ProductRoutes** (`src/routes/v1/productRoutes.ts`)
- All routes behind `tenantIsolationMiddleware`
- Role requirements per endpoint
- File upload middleware for images

### Frontend Service

**productService.ts** (`frontend/src/services/productService.ts`)
```typescript
export interface Product {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  description?: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  unitOfMeasure: string;
  imageUrl?: string;
  isActive: boolean;
  // ... all other fields
}

export const productService = {
  getProducts: (filters?) => Promise<Product[]>,
  getProductById: (id) => Promise<Product>,
  createProduct: (data) => Promise<Product>,
  updateProduct: (id, data) => Promise<Product>,
  deleteProduct: (id) => Promise<void>,
  searchProducts: (query) => Promise<Product[]>,
  adjustStock: (id, movement) => Promise<void>,
  getStockHistory: (id, filters?) => Promise<StockMovement[]>,
  getLowStockProducts: () => Promise<Product[]>,
  uploadImage: (id, file) => Promise<string>,
};
```

### UI/UX Specifications

**Colors:**
- Stock Status: Green (normal), Orange (low), Red (critical)
- Category Tags: Different color per category
- Movement Type: Blue (in), Red (out), Purple (transfer)

**Icons:**
- Product: ShoppingOutlined
- Stock: InboxOutlined
- Low Stock: WarningOutlined (red)
- Transfer: SwapOutlined

**Validation:**
- Product Code: Unique per company
- Unit Price: Must be > 0
- Stock quantities: Cannot be negative
- Reorder point: Must be < max stock level

### Required Fields

**Minimum Required for Product Creation:**
1. Product Code (auto-generated or manual)
2. Product Name
3. Category
4. Unit Price
5. Unit of Measure (UOM)

**Optional but Recommended:**
- Description
- Image
- Min/Max stock levels
- Reorder point
- Cost price (for profit margin calculation)

---

## ✅ Implementation Checklist

### Sprint 3.4 - Quality Control ✅ COMPLETED
- [x] Create Prisma schema for quality tables
- [x] Run migration
- [x] Implement QualityService (backend)
- [x] Implement QualityController (backend)
- [x] Create quality routes
- [x] Implement QualityCheckpointsListPage (frontend)
- [x] Implement QualityCheckpointFormDrawer (frontend)
- [x] Implement QualityDefectsListPage (frontend)
- [x] Implement QualityDefectFormDrawer (frontend)
- [x] Implement QualityMetricsTable (frontend)
- [x] Implement ComplianceReportsListPage (frontend)
- [x] Implement ComplianceReportFormDrawer (frontend)
- [x] Create quality service (frontend API client)
- [x] Add routes to AppRouter
- [x] Test all APIs (Checkpoints, Defects, Compliance - All Working ✅)
- [x] Verify UI patterns

### Sprint 3.5 - Textile Features
- [x] Create Prisma schema for textile tables
- [x] Run migration
- [x] Implement TextileService (backend)
- [x] Implement TextileController (backend)
- [x] Create textile routes
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

### Sprint 3.6 - Product Master & Inventory
- [ ] Create Prisma schema for products, product_location_stock, product_stock_movements
- [ ] Run migration
- [ ] Implement ProductService (backend)
- [ ] Implement ProductController (backend)
- [ ] Create product routes with file upload middleware
- [ ] Implement ProductsListPage (frontend)
- [ ] Implement ProductFormDrawer (frontend)
- [ ] Implement StockAdjustmentModal (frontend)
- [ ] Implement StockMovementHistoryPage (frontend)
- [ ] Implement LowStockAlertsPage (frontend)
- [ ] Implement ProductDropdownSelector component (frontend)
- [ ] Create product service (frontend API client)
- [ ] Integrate ProductDropdownSelector into OrderFormDrawer
- [ ] Integrate ProductDropdownSelector into Purchase Orders
- [ ] Integrate ProductDropdownSelector into Invoices
- [ ] Add stock reservation logic to order creation
- [ ] Add stock release logic to order cancellation
- [ ] Add routes to AppRouter and Sidebar
- [ ] Test all APIs (CRUD, stock movements, reservations)
- [ ] Test multi-location stock tracking
- [ ] Test low stock alerts
- [ ] Verify UI patterns and responsive design

---

**END OF IMPLEMENTATION PLAN**
