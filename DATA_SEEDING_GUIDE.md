# Data Seeding Guide - Lavoro AI Ferri

## Overview

This guide explains how to use the comprehensive data seeding script to populate your Lavoro AI Ferri application with realistic test data.

## Quick Start

```bash
./seed-test-data.sh
```

This single command will create a complete test environment with all necessary data.

---

## What Gets Created

### 1. **5 Main Users**
- `test1@lavoro.com` → Owner of Premium Textiles Ltd
- `test2@lavoro.com` → Owner of Fashion Garments Co
- `test3@lavoro.com` → Owner of Quality Fabrics Inc
- `test4@lavoro.com` → Owner of ColorTech Dyeing
- `test5@lavoro.com` → Owner of Design Studio Pro

**Password for all users:** `Test@123`

### 2. **5 Companies (Different Industries)**

| Company | Industry | Owner |
|---------|----------|-------|
| Premium Textiles Ltd | Textile Manufacturing | test1@lavoro.com |
| Fashion Garments Co | Garment Production | test2@lavoro.com |
| Quality Fabrics Inc | Fabric Processing | test3@lavoro.com |
| ColorTech Dyeing | Dyeing & Finishing | test4@lavoro.com |
| Design Studio Pro | Apparel Design | test5@lavoro.com |

### 3. **Additional Locations**
- **Company 1 (Premium Textiles)**: 3 additional locations
  - Branch Office
  - Main Warehouse
  - Production Unit
- **Company 2 (Fashion Garments)**: 3 additional locations
  - Branch Office
  - Main Warehouse
  - Production Unit

### 4. **Products**
- **Company 1**: 35 products (Cotton, Silk, Wool, Polyester, Blend fabrics)
- **Company 2**: 15 products (T-Shirts, Shirts, Pants, Dresses, Jackets)
- **Companies 3-5**: Standard product sets relevant to their industries

### 5. **Customers**
- **10 customers per company** (50 total)
- Types: Individual, Business, Distributor, Retailer, Wholesaler
- Complete contact information and payment terms

### 6. **Suppliers**
- **10 suppliers per company** (50 total)
- Types: Manufacturer, Distributor, Wholesaler, Importer, Local Vendor
- Complete business information

### 7. **Employee Users**
- **15 additional users** created for invitations
- Emails: `employee1@lavoro.com` through `employee15@lavoro.com`
- Password: `Test@123`

### 8. **User Invitations**
- **25 invitations sent from Company 1** (Premium Textiles)
- Roles distributed: ADMIN, MANAGER, EMPLOYEE
- All invitations automatically accepted
- Users can access Company 1 with their assigned roles

### 9. **Quality Control Data (Per Company)**
- **3 Quality Checkpoints** - Incoming inspection points
- **3 Quality Defects** - Common defect types
- **3 Compliance Reports** - ISO 9001 compliance reports

### 10. **Textile Operations Data (Per Company)**
Each company gets 5 records of each type:
- **5 Fabric Production** records
- **5 Yarn Manufacturing** records
- **5 Dyeing & Finishing** records
- **5 Garment Manufacturing** records
- **5 Design & Patterns** records

---

## Usage Instructions

### Running the Script

1. **Ensure backend is running:**
   ```bash
   npm run dev
   ```

2. **Run the seeding script:**
   ```bash
   ./seed-test-data.sh
   ```

3. **Wait for completion** (takes 2-3 minutes)

### Expected Output

The script provides real-time feedback:
- ✓ Green checkmarks for successful operations
- ✗ Red X marks for failed operations
- ℹ Blue info messages for progress updates
- Final summary with statistics

### Sample Output

```
=========================================
STEP 1: Creating 5 Main Users
=========================================
ℹ Creating user test1@lavoro.com...
✓ User test1@lavoro.com created
...

=========================================
DATA SEEDING COMPLETED
=========================================

SUMMARY
=========================================
Total Operations: 500
Successful: 500
Failed: 0

Created Test Data:
  • 5 Companies (Different Industries)
  • 6 Additional Locations
  • 50 Products
  • 50 Customers
  • 50 Suppliers
  • 15 Employee Users
  • 25 User Invitations (Accepted)
  • 45 Quality Control Items
  • 125 Textile Operations

✓ ALL DATA SEEDED SUCCESSFULLY!
```

---

## Login Credentials

### Main Company Owners

```
User 1: test1@lavoro.com / Test@123
User 2: test2@lavoro.com / Test@123
User 3: test3@lavoro.com / Test@123
User 4: test4@lavoro.com / Test@123
User 5: test5@lavoro.com / Test@123
```

### Employee Users (Can access Company 1)

```
employee1@lavoro.com through employee15@lavoro.com
Password: Test@123
```

---

## Testing Scenarios

### Scenario 1: Multi-Location Management
**Login as:** `test1@lavoro.com`
- View 4 locations (1 HQ + 3 additional)
- Test location switching
- Verify default location settings

### Scenario 2: Large Product Catalog
**Login as:** `test1@lavoro.com`
- Browse 35 products across 5 categories
- Test product search and filters
- Verify stock levels

### Scenario 3: Role-Based Access
**Login as:** `employee1@lavoro.com`
- Access Company 1 as ADMIN/MANAGER/EMPLOYEE
- Test role-specific permissions
- Verify menu restrictions

### Scenario 4: Textile Operations
**Login as:** Any company owner
- View 5 records in each textile module
- Test CRUD operations
- Verify data consistency

### Scenario 5: Quality Control
**Login as:** Any company owner
- Review quality checkpoints
- Check defect tracking
- View compliance reports

### Scenario 6: Customer/Supplier Management
**Login as:** Any company owner
- Browse 10 customers
- Browse 10 suppliers
- Test contact management

---

## Re-running the Script

### Clean Database Before Re-running

If you want to start fresh:

```bash
# Option 1: Drop and recreate database
npm run db:reset

# Option 2: Clear specific data (if you have a script)
npm run db:clear

# Then run seeding again
./seed-test-data.sh
```

### Idempotent Execution

The script creates unique data each time, so you can run it multiple times without conflicts. Each run will create:
- New users with unique emails
- New companies with unique slugs
- Additional test data

---

## Troubleshooting

### Script Fails to Start

**Error:** `Permission denied`
```bash
chmod +x seed-test-data.sh
```

**Error:** `Backend not running`
```bash
# Start backend first
npm run dev
```

### Partial Failures

If some operations fail:
1. Check the output for specific error messages
2. Verify backend is running and healthy
3. Check database connectivity
4. Review API endpoint availability

### Database Connection Issues

```bash
# Check PostgreSQL is running
psql -U nivetharamdev -d lavoro_ai_ferri -c "SELECT 1;"

# Restart backend
npm run dev
```

---

## Advanced Usage

### Customize Data Counts

Edit `seed-test-data.sh` to modify:
- Number of companies (line 100)
- Products per company (lines 350-351)
- Customers/Suppliers per company (loops in steps 5-6)
- Quality control items (step 9 loops)
- Textile operations (step 10 loops)

### Add More Industries

Modify the `INDUSTRIES` array:
```bash
INDUSTRIES=("textile_manufacturing" "garment_production" "your_industry")
```

### Custom Company Names

Modify the `COMPANY_NAMES` array:
```bash
COMPANY_NAMES=("Your Company 1" "Your Company 2" ...)
```

---

## Data Structure

### Companies Hierarchy

```
Company 1 (Premium Textiles Ltd)
├── Locations (4)
│   ├── Head Office (HQ, Default)
│   ├── Branch Office
│   ├── Main Warehouse
│   └── Production Unit
├── Products (35)
├── Customers (10)
├── Suppliers (10)
├── Users (26: 1 owner + 25 employees)
├── Quality Control (9 items)
└── Textile Operations (25 records)
```

---

## API Endpoints Used

The script interacts with these endpoints:
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/companies` - Company creation
- `POST /api/v1/companies/:id/switch` - Company context switch
- `POST /api/v1/locations` - Location creation
- `POST /api/v1/products` - Product creation
- `POST /api/v1/customers` - Customer creation
- `POST /api/v1/suppliers` - Supplier creation
- `POST /api/v1/companies/:id/invite` - User invitation
- `POST /api/v1/companies/:id/invitations/:id/accept` - Accept invitation
- `POST /api/v1/quality/*` - Quality control data
- `POST /api/v1/textile/*` - Textile operations data

---

## Notes

1. **Execution Time**: Script takes 2-3 minutes to complete
2. **Network**: Requires active internet connection for API calls
3. **Dependencies**: Requires `curl` and `jq` installed
4. **Idempotent**: Safe to run multiple times
5. **Cleanup**: No automatic cleanup - manually clear database if needed

---

## Support

For issues or questions:
1. Check the script output for specific error messages
2. Verify all prerequisites are met
3. Review the troubleshooting section
4. Check backend logs for API errors

---

**Happy Testing! 🎉**
