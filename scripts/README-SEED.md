# Live Data Seeding Guide

This guide explains how to populate your live deployment with comprehensive test data.

## 📋 What Gets Created

The seed script creates realistic test data for **2 companies** with the following:

### User Account
- **Email**: `testuser@lavoro.com`
- **Password**: `Test@123`
- **Role**: OWNER for both companies

### Per Company Data

#### 1. **Locations** (5 per company)
- Head Office / Headquarters (HQ)
- Manufacturing Unit / Production Facility
- Warehouse / Distribution Center
- Showroom / Retail Store
- Branch Office / Regional Office

#### 2. **Customers & Suppliers** (5 each)
- Customer records with contact details
- Supplier records with contact details

#### 3. **Products** (5 per company)
- Product master data
- SKU codes
- Pricing information

#### 4. **Inventory Management**
- Multi-location inventory tracking
- Stock levels across 3 locations per product
- 10 stock adjustments per company

#### 5. **Sales & Purchasing**
- 8 Sales Orders with line items
- 6 Purchase Orders with line items
- Various statuses (DRAFT, CONFIRMED, IN_PROGRESS, COMPLETED)

#### 6. **Financial Documents**
- 10 Invoices with line items
- 8 Bills with line items
- Various payment statuses

#### 7. **Machines** (6 per company)
- Machine master data
- Different machine types (WEAVING, KNITTING, DYEING, etc.)
- Various statuses (IN_USE, IDLE, UNDER_MAINTENANCE)

#### 8. **Quality Control**
- 5 Quality Checkpoints per company
- 5 Quality Defects per company
- 3 Quality Inspections per company
- 2 Compliance Reports per company

#### 9. **Textile Operations**
- 4 Fabric Production records
- 4 Yarn Manufacturing records
- 3 Dyeing & Finishing records
- 3 Garment Manufacturing records
- 3 Design Patterns

## 🚀 How to Run

### Option 1: Using npm script (Recommended)

```bash
npm run seed:live
```

### Option 2: Using Node directly

```bash
node scripts/seed-live-simple.js
```

### Option 3: Using the shell script

```bash
chmod +x scripts/run-seed.sh
./scripts/run-seed.sh
```

## ⚙️ Prerequisites

1. **Database Connection**: Ensure your `DATABASE_URL` environment variable is set correctly
2. **Prisma Setup**: Run `npx prisma generate` if you haven't already
3. **Clean Database**: The script uses `upsert` for the user, so it's safe to run multiple times

## 🔐 Environment Setup

### For Local Development

```bash
# .env file
DATABASE_URL="postgresql://user:password@localhost:5432/lavoro_ai_ferri"
```

### For Live Deployment (Render/Supabase)

```bash
# Use your Supabase connection string with pgbouncer
DATABASE_URL="postgresql://user:password@host.supabase.co:5432/postgres?pgbouncer=true"
```

## 📊 Testing the Data

After running the seed script:

1. **Login to the application**
   - Email: `testuser@lavoro.com`
   - Password: `Test@123`

2. **Select a company**
   - Choose either "Ayphen Textiles Ltd" or "Global Fabrics Inc"

3. **Explore all modules**
   - Dashboard: View KPIs and statistics
   - Locations: See 5 locations per company
   - Products: Browse 5 products
   - Inventory: Check stock levels across locations
   - Orders: View 8 sales orders
   - Purchase Orders: See 6 purchase orders
   - Invoices: Browse 10 invoices
   - Bills: Check 8 bills
   - Machines: View 6 machines
   - Quality Control: Explore checkpoints, defects, inspections
   - Textile Operations: View fabric, yarn, dyeing, garments, designs

## 🔄 Re-running the Script

The script is **idempotent** for the user account (uses `upsert`), but will create duplicate data for companies and related records if run multiple times.

### To clean and re-seed:

```bash
# Option 1: Reset database (WARNING: Deletes all data)
npm run db:migrate:reset

# Then run seed again
npm run seed:live
```

```bash
# Option 2: Manually delete test data via SQL
# Connect to your database and delete records for test companies
DELETE FROM companies WHERE name IN ('Ayphen Textiles Ltd', 'Global Fabrics Inc');
DELETE FROM users WHERE email = 'testuser@lavoro.com';
```

## 🎯 Use Cases

### 1. **Demo & Presentation**
- Show potential clients a fully populated system
- Demonstrate all features with realistic data

### 2. **Development & Testing**
- Test UI components with real data
- Verify multi-tenant isolation
- Test performance with populated database

### 3. **QA & UAT**
- Provide test data for quality assurance
- Enable user acceptance testing
- Verify workflows end-to-end

### 4. **Training**
- Onboard new team members
- Create training materials
- Practice using the system

## 📝 Customization

To customize the seed data, edit `scripts/seed-live-simple.js`:

- Change company names and details
- Adjust number of records (products, orders, etc.)
- Modify product types and categories
- Update location names and types
- Change status distributions

## ⚠️ Important Notes

1. **Production Warning**: Be careful when running this on production databases. Always test on staging first.

2. **Data Volume**: The script creates ~500+ records across all tables. Adjust counts if needed for performance testing.

3. **Multi-tenant Safety**: All data is properly isolated by `company_id` to ensure multi-tenant integrity.

4. **Relationships**: All foreign key relationships are properly maintained (products → inventory → orders, etc.).

## 🐛 Troubleshooting

### Error: "Cannot connect to database"
- Check your `DATABASE_URL` environment variable
- Ensure database is running and accessible
- Verify network connectivity

### Error: "Unique constraint violation"
- The script may have been run before
- Clean existing test data or use a fresh database

### Error: "Missing Prisma Client"
- Run `npx prisma generate` to generate the Prisma client
- Ensure `@prisma/client` is installed

### Script runs but no data appears
- Check that you're connected to the correct database
- Verify the script completed without errors
- Check database logs for any issues

## 📞 Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify your database connection
3. Ensure all prerequisites are met
4. Review the Prisma schema for any recent changes

## ✅ Success Indicators

After successful seeding, you should see:
- ✅ User created message
- ✅ Company creation confirmations
- ✅ Progress messages for each data type
- ✨ Final success message with summary
- 🎯 Login instructions

Happy testing! 🚀
