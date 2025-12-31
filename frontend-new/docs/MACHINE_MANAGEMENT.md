# Machine Management Module Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Components](#components)
4. [Data Models](#data-models)
5. [API Endpoints](#api-endpoints)
6. [State Management](#state-management)
7. [Validation Rules](#validation-rules)
8. [User Workflows](#user-workflows)
9. [Future Enhancements](#future-enhancements)

---

## Overview

The Machine Management module provides comprehensive functionality for tracking, managing, and maintaining industrial machinery and equipment. It enables organizations to monitor machine status, schedule maintenance, report breakdowns, and track operational efficiency.

### Key Features

- **Machine Inventory**: Complete catalog of all machines with detailed specifications
- **Status Tracking**: Real-time monitoring of machine status and operational state
- **Maintenance Management**: Schedule and track preventive and corrective maintenance
- **Breakdown Reporting**: Quick reporting and tracking of machine failures
- **Operator Assignment**: Track which operators are using which machines
- **Location Management**: Organize machines by physical location
- **Image Management**: Upload and store machine images for easy identification

### Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Form Management**: react-hook-form with zod validation
- **State Management**: React hooks (useState, useEffect, useRef)
- **API Communication**: Fetch API with TypeScript interfaces
- **Styling**: Tailwind CSS

---

## Architecture

### Component Hierarchy

```
MachineListPage
├── PageContainer
├── PageHeader
│   ├── PageTitle
│   └── PrimaryButton (Add Machine)
├── Filters Section
│   ├── SearchInput
│   ├── Select (Location Filter)
│   └── Select (Status Filter)
├── Table
│   ├── TableHeader
│   ├── TableBody
│   │   └── TableRow (for each machine)
│   │       ├── TableCell (10 columns)
│   │       └── DropdownMenu (Actions)
│   └── EmptyState (when no data)
├── MachineFormSheet (Create/Edit)
└── AlertDialog (Delete Confirmation)
```

### Data Flow

```
User Action → Component State → API Call → Backend → Response → State Update → UI Render
```

**Example Flow - Create Machine**:
1. User clicks "Add Machine" button
2. `MachineFormSheet` opens in create mode
3. User fills form and submits
4. Form validation (zod schema)
5. API call: `POST /api/v1/machines`
6. Backend creates machine and returns data
7. Success toast notification
8. Sheet closes
9. Machine list refreshes
10. New machine appears in table

---

## Components

### 1. MachineListPage

**File**: `frontend-new/src/pages/machines/MachineListPage.tsx`

**Purpose**: Main page component for displaying and managing the list of machines.

**Props**: None (uses route-based rendering)

**State Variables**:
```typescript
machines: Machine[]              // List of all machines
locations: Location[]            // List of locations for filter
loading: boolean                 // Initial data loading
tableLoading: boolean            // Table refresh loading
sheetOpen: boolean               // MachineFormSheet visibility
editingMachineId: string | null  // ID of machine being edited
deleteDialogOpen: boolean        // Delete confirmation dialog
machineToDelete: Machine | null  // Machine selected for deletion
searchText: string               // Search query
selectedLocation: string         // Location filter value
statusFilter: string             // Status filter value
fetchInProgressRef: useRef       // Prevents duplicate API calls
```

**Key Functions**:
- `fetchData()`: Loads machines and locations from API
- `refreshMachines()`: Reloads only machines (after CRUD operations)
- `handleCreateMachine()`: Opens form sheet in create mode
- `handleEditMachine(machine)`: Opens form sheet in edit mode
- `handleDeleteMachine(machine)`: Shows delete confirmation dialog
- `confirmDelete()`: Executes machine deletion
- `getStatusColor(status)`: Returns badge variant for machine status
- `getOperationalStatusColor(status)`: Returns badge variant for operational status

**Table Columns**:
1. **Code**: Machine code (monospace font)
2. **Machine**: Name with avatar/icon
3. **Machine Type**: Type of machine
4. **Purchase Date**: Formatted date (PP format)
5. **Warranty Expiry**: Formatted date (PP format)
6. **Location**: Location name
7. **Current Operator**: Operator name with avatar (with tooltip)
8. **Operational Status**: Badge (FREE, BUSY, RESERVED, UNAVAILABLE)
9. **Status**: Badge (NEW, IN_USE, UNDER_MAINTENANCE, UNDER_REPAIR, IDLE, DECOMMISSIONED)
10. **Actions**: Dropdown menu with Edit, Delete, etc.

**Actions Menu Items**:
- **Edit**: Opens MachineFormSheet in edit mode (disabled for EMPLOYEE role)
- **Schedule Maintenance**: Placeholder for future implementation (disabled for EMPLOYEE role)
- **Report Breakdown**: Placeholder for future implementation
- **View History**: Placeholder for future implementation
- **Assign Operator**: Placeholder for future implementation
- **Delete**: Shows confirmation dialog (disabled for EMPLOYEE role)

---

### 2. MachineFormSheet

**File**: `frontend-new/src/components/machines/MachineFormSheet.tsx`

**Purpose**: Form component for creating and editing machines.

**Props**:
```typescript
interface MachineFormSheetProps {
  open: boolean;                    // Sheet visibility
  onClose: () => void;              // Close handler
  onSaved: () => void;              // Success callback
  mode: 'create' | 'edit';          // Form mode
  editingMachineId?: string | null; // ID for edit mode
  locations: Location[];            // Available locations
}
```

**Form Sections**:

1. **Basic Information**:
   - Machine image upload (PNG/JPG/SVG, max 2MB)
   - Machine name (required, max 100 chars)
   - Machine type (required, dropdown)
   - Machine status (required)
   - Operational status (optional, default: FREE)
   - Location (required)

2. **Machine Details**:
   - Manufacturer (optional, max 100 chars)
   - Model (optional, max 50 chars)
   - Serial number (optional, max 100 chars)

3. **Purchase & Warranty**:
   - Purchase date (required, date picker)
   - Warranty expiry (required, date picker)

4. **Technical Specifications**:
   - Specifications (optional, textarea)

**Machine Types** (11 options):
- Ring Spinning Frame
- Air Jet Loom
- Water Jet Loom
- Circular Knitting Machine
- Industrial Sewing Machine
- Overlock Machine
- Dyeing Machine
- Printing Machine
- Cutting Machine
- Pressing Machine
- Other

**Image Upload**:
- Accepts: PNG, JPG, SVG
- Max size: 2MB
- Preview with remove option
- Stored as base64 or URL

---

### 3. Future Components

#### BreakdownReportSheet
**Purpose**: Report machine breakdowns and failures

**Planned Fields**:
- Severity (CRITICAL, HIGH, MEDIUM, LOW)
- Priority (URGENT, HIGH, MEDIUM, LOW)
- Title (required)
- Description (required)
- Breakdown time (datetime)
- Images (multiple upload)

#### MaintenanceScheduleSheet
**Purpose**: Schedule preventive maintenance

**Planned Fields**:
- Maintenance type (DAILY_CHECK, WEEKLY, MONTHLY, QUARTERLY, ANNUAL, EMERGENCY)
- Title (required)
- Description
- Frequency (in days)
- Next due date (required)
- Estimated hours
- Assigned technician
- Checklist (JSON array)
- Parts required (JSON array)

#### MaintenanceRecordSheet
**Purpose**: Record completed maintenance activities

**Planned Fields**:
- Maintenance type
- Performed by
- Performed date (required)
- Duration (hours)
- Tasks completed (JSON)
- Parts used (JSON)
- Cost
- Notes
- Next maintenance date

---

## Data Models

### Machine Interface

```typescript
interface Machine {
  id: string;                    // Unique identifier
  machineId: string;             // Auto-generated machine ID
  machineCode: string;           // Auto-generated code
  companyId: string;             // Company owner
  locationId?: string;           // Physical location
  name: string;                  // Machine name
  machineType?: string;          // Type of machine
  model?: string;                // Model number
  manufacturer?: string;         // Manufacturer name
  serialNumber?: string;         // Serial number
  purchaseDate?: string;         // ISO date string
  warrantyExpiry?: string;       // ISO date string
  specifications?: any;          // Technical specs (JSON)
  imageUrl?: string;             // Image URL or base64
  qrCode?: string;               // QR code for identification
  status: MachineStatus;         // Current status
  operationalStatus: OperationalStatus; // Operational state
  currentOperatorId?: string;    // Assigned operator
  isActive: boolean;             // Active/inactive flag
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  location?: {                   // Populated location
    id: string;
    name: string;
    isDefault: boolean;
    isHeadquarters: boolean;
  };
  currentOperator?: {            // Populated operator
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {                     // Relation counts
    breakdown_reports: number;
    maintenance_schedules: number;
  };
}
```

### Enums

```typescript
type MachineStatus =
  | 'NEW'                    // Newly acquired
  | 'IN_USE'                 // Currently in production
  | 'UNDER_MAINTENANCE'      // Scheduled maintenance
  | 'UNDER_REPAIR'           // Being repaired
  | 'IDLE'                   // Not in use
  | 'DECOMMISSIONED';        // Retired/removed

type OperationalStatus =
  | 'FREE'                   // Available for use
  | 'BUSY'                   // Currently operating
  | 'RESERVED'               // Reserved for specific job
  | 'UNAVAILABLE';           // Cannot be used

type MaintenanceType =
  | 'DAILY_CHECK'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'ANNUAL'
  | 'EMERGENCY';

type BreakdownSeverity =
  | 'CRITICAL'               // Production stopped
  | 'HIGH'                   // Major impact
  | 'MEDIUM'                 // Moderate impact
  | 'LOW';                   // Minor issue

type BreakdownPriority =
  | 'URGENT'                 // Fix immediately
  | 'HIGH'                   // Fix soon
  | 'MEDIUM'                 // Normal priority
  | 'LOW';                   // Can wait
```

---

## API Endpoints

### Machine Management

#### List Machines
```
GET /api/v1/machines
Query Parameters:
  - search?: string (search by name, code, type)
  - locationId?: string (filter by location)
  - status?: MachineStatus (filter by status)
  - isActive?: boolean (filter active/inactive)
Response: { success: boolean, data: Machine[] }
```

#### Get Machine Details
```
GET /api/v1/machines/{id}
Response: { success: boolean, data: Machine }
```

#### Create Machine
```
POST /api/v1/machines
Body: CreateMachineRequest
Response: { success: boolean, data: Machine }
```

#### Update Machine
```
PUT /api/v1/machines/{id}
Body: UpdateMachineRequest
Response: { success: boolean, data: Machine }
```

#### Delete Machine
```
DELETE /api/v1/machines/{id}
Response: { success: boolean }
Note: Soft delete (sets isActive = false)
```

#### Update Machine Status
```
PATCH /api/v1/machines/{id}/status
Body: { status: MachineStatus, reason?: string }
Response: { success: boolean, data: Machine }
```

### Breakdown Management (Future)

```
POST /api/v1/machines/breakdowns
GET /api/v1/machines/breakdowns?machineId={id}&status={status}
PATCH /api/v1/machines/breakdowns/{id}
```

### Maintenance Management (Future)

```
POST /api/v1/machines/maintenance/schedules
GET /api/v1/machines/maintenance/schedules?machineId={id}
POST /api/v1/machines/maintenance/records
GET /api/v1/machines/maintenance/records?machineId={id}
```

### Analytics (Future)

```
GET /api/v1/machines/analytics
GET /api/v1/machines/utilization
```

---

## State Management

### Local State Pattern

The module uses React hooks for state management:

```typescript
// Data state
const [machines, setMachines] = useState<Machine[]>([]);
const [locations, setLocations] = useState<Location[]>([]);

// UI state
const [loading, setLoading] = useState(false);
const [sheetOpen, setSheetOpen] = useState(false);

// Filter state
const [searchText, setSearchText] = useState('');
const [selectedLocation, setSelectedLocation] = useState<string>();
const [statusFilter, setStatusFilter] = useState<string>();

// Ref for preventing duplicate calls
const fetchInProgressRef = useRef(false);
```

### Form State (react-hook-form)

```typescript
const form = useForm<MachineFormValues>({
  resolver: zodResolver(machineSchema),
  defaultValues: {
    operationalStatus: 'FREE',
    status: 'NEW',
  },
});
```

### API Integration Pattern

```typescript
const fetchData = async () => {
  if (fetchInProgressRef.current) return;
  
  try {
    fetchInProgressRef.current = true;
    setLoading(true);
    
    const [machinesData, locationsData] = await Promise.all([
      machineService.getMachines({ search, locationId, status }),
      locationService.getLocations(),
    ]);
    
    setMachines(machinesData.data || []);
    setLocations(locationsData || []);
  } catch (error) {
    toast.error('Failed to fetch data');
  } finally {
    setLoading(false);
    fetchInProgressRef.current = false;
  }
};
```

---

## Validation Rules

### Form Validation Schema

```typescript
const machineSchema = z.object({
  name: z.string()
    .min(1, 'Machine name is required')
    .max(100),
  machineType: z.string()
    .min(1, 'Machine type is required')
    .max(50),
  model: z.string().max(50).optional(),
  manufacturer: z.string().max(100).optional(),
  serialNumber: z.string().max(100).optional(),
  purchaseDate: z.date({
    required_error: 'Purchase date is required',
  }),
  warrantyExpiry: z.date({
    required_error: 'Warranty expiry is required',
  }),
  locationId: z.string()
    .min(1, 'Location is required'),
  currentOperatorId: z.string().optional(),
  operationalStatus: z.enum([
    'FREE', 'BUSY', 'RESERVED', 'UNAVAILABLE'
  ]).optional(),
  status: z.enum([
    'NEW', 'IN_USE', 'UNDER_MAINTENANCE',
    'UNDER_REPAIR', 'IDLE', 'DECOMMISSIONED'
  ]),
  specifications: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});
```

### Business Rules

1. **Machine Name**: Must be unique within company (to be implemented)
2. **Purchase Date**: Cannot be in the future
3. **Warranty Expiry**: Can be any date
4. **Location**: Must be an existing location in the company
5. **Operator Assignment**: Optional, but recommended for BUSY/RESERVED status
6. **Image Upload**: Max 2MB, PNG/JPG/SVG only
7. **Status Transitions**: Should follow logical flow (e.g., NEW → IN_USE → UNDER_MAINTENANCE)

---

## User Workflows

### 1. Create New Machine

1. Navigate to Machines page (`/machines`)
2. Click "Add Machine" button
3. Fill in required fields:
   - Machine name
   - Machine type
   - Purchase date
   - Warranty expiry
   - Location
4. Optionally add:
   - Machine image
   - Manufacturer details
   - Technical specifications
5. Click "Create Machine"
6. System validates and creates machine
7. Success toast appears
8. Sheet closes
9. New machine appears in table

### 2. Edit Existing Machine

1. Find machine in table
2. Click three-dot menu → "Edit"
3. Form opens with pre-filled data
4. Modify desired fields
5. Click "Update Machine"
6. System validates and updates
7. Success toast appears
8. Changes reflect in table

### 3. Delete Machine

1. Find machine in table
2. Click three-dot menu → "Delete"
3. Confirmation dialog appears
4. Review machine details
5. Click "Delete" to confirm
6. Machine is soft-deleted (isActive = false)
7. Machine removed from table
8. Success toast appears

### 4. Search and Filter

**Search**:
- Type in search box
- Searches: machine name, code, type
- Results update in real-time

**Filter by Location**:
- Select location from dropdown
- Table shows only machines at that location

**Filter by Status**:
- Select status from dropdown
- Table shows only machines with that status

**Combined Filters**:
- All filters work together (AND logic)
- Clear filters to see all machines

---

## Future Enhancements

### Phase 1: Breakdown Management
- Report breakdowns with severity and priority
- Track breakdown history
- Assign technicians to repairs
- Record parts used and costs
- Calculate downtime and production loss

### Phase 2: Maintenance Scheduling
- Create maintenance schedules
- Set recurring maintenance (daily, weekly, monthly, etc.)
- Assign technicians
- Define checklists
- Track parts required
- Send notifications for due maintenance

### Phase 3: Maintenance Records
- Log completed maintenance activities
- Record time spent and costs
- Track parts used
- Link to maintenance schedules
- Generate maintenance history reports

### Phase 4: Analytics & Reporting
- Machine utilization charts
- Breakdown frequency analysis
- Maintenance cost tracking
- Downtime analysis
- Operator efficiency metrics
- Predictive maintenance insights

### Phase 5: Advanced Features
- QR code generation and scanning
- Mobile app for operators
- Real-time machine status monitoring
- Integration with IoT sensors
- Automated maintenance scheduling based on usage
- Machine performance benchmarking

---

## Best Practices

### Code Organization
- Keep components focused and single-purpose
- Extract reusable logic into custom hooks
- Use TypeScript interfaces for type safety
- Follow consistent naming conventions

### Performance
- Use `useRef` to prevent duplicate API calls
- Implement debouncing for search inputs
- Lazy load images
- Paginate large datasets

### Error Handling
- Always wrap API calls in try-catch
- Show user-friendly error messages
- Log errors for debugging
- Provide fallback UI for errors

### Accessibility
- Use semantic HTML elements
- Provide alt text for images
- Ensure keyboard navigation works
- Use ARIA labels where needed

### Security
- Validate all inputs
- Sanitize user-provided data
- Implement role-based access control
- Use HTTPS for all API calls
- Never expose sensitive data in client code

---

## Troubleshooting

### Common Issues

**Issue**: Machine list not loading
- **Solution**: Check network tab for API errors, verify authentication token

**Issue**: Form validation errors
- **Solution**: Ensure all required fields are filled, check date formats

**Issue**: Image upload fails
- **Solution**: Verify file size < 2MB, check file type (PNG/JPG/SVG only)

**Issue**: Delete confirmation not showing
- **Solution**: Check if `deleteDialogOpen` state is being set correctly

**Issue**: Filters not working
- **Solution**: Verify filter values are being passed to API correctly

---

## Related Documentation

- [API Documentation](../docs/API.md)
- [Component Library](../docs/COMPONENTS.md)
- [State Management Guide](../docs/STATE_MANAGEMENT.md)
- [Testing Guide](../docs/TESTING.md)

---

## Changelog

### v1.0.0 (2025-12-31)
- Initial implementation of Machine Management module
- MachineListPage with 10-column table
- MachineFormSheet for create/edit operations
- Search and filter functionality
- Delete confirmation dialog
- Role-based access control
- Status badge color coding

---

## Support

For questions or issues related to the Machine Management module:
- Create an issue in the project repository
- Contact the development team
- Refer to the implementation plan and walkthrough documents
