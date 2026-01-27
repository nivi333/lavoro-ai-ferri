const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Delete in correct order to respect foreign key constraints
    const testEmail = 'testuser@lavoro.com';
    const companySlugs = ['ayphen-textiles-ltd', 'global-fabrics-inc'];
    
    // Find user
    const user = await prisma.users.findUnique({
      where: { email: testEmail }
    });
    
    if (!user) {
      console.log('No test user found. Nothing to clean up.');
      return;
    }
    
    // Find companies
    const companies = await prisma.companies.findMany({
      where: { slug: { in: companySlugs } }
    });
    
    const companyIds = companies.map(c => c.id);
    
    // First, delete ALL quality control and textile operations data (to handle orphaned records)
    console.log('Cleaning up all quality control and textile operations data...');
    await prisma.quality_defects.deleteMany({});
    await prisma.quality_checkpoints.deleteMany({});
    await prisma.quality_inspections.deleteMany({});
    await prisma.compliance_reports.deleteMany({});
    await prisma.fabric_production.deleteMany({});
    await prisma.yarn_manufacturing.deleteMany({});
    await prisma.dyeing_finishing.deleteMany({});
    await prisma.garment_manufacturing.deleteMany({});
    await prisma.design_patterns.deleteMany({});
    
    if (companyIds.length > 0) {
      console.log(`Found ${companyIds.length} test companies to delete...`);
      
      // Delete all related data for these companies (order matters for foreign keys)
      await prisma.user_companies.deleteMany({ where: { company_id: { in: companyIds } } });
      
      // Delete invoices and bills first (they reference locations)
      await prisma.invoices.deleteMany({ where: { company_id: { in: companyIds } } });
      await prisma.bills.deleteMany({ where: { company_id: { in: companyIds } } });
      
      // Delete orders and purchase orders
      await prisma.orders.deleteMany({ where: { company_id: { in: companyIds } } });
      await prisma.purchase_orders.deleteMany({ where: { company_id: { in: companyIds } } });
      
      // Delete inventory and stock adjustments
      await prisma.location_inventory.deleteMany({ where: { company_id: { in: companyIds } } });
      await prisma.stock_adjustments.deleteMany({ where: { company_id: { in: companyIds } } });
      
      // Delete products, customers, suppliers
      await prisma.products.deleteMany({ where: { company_id: { in: companyIds } } });
      await prisma.customers.deleteMany({ where: { company_id: { in: companyIds } } });
      await prisma.suppliers.deleteMany({ where: { company_id: { in: companyIds } } });
      await prisma.machines.deleteMany({ where: { company_id: { in: companyIds } } });
      
      // Delete locations last (after all data that references them)
      await prisma.company_locations.deleteMany({ where: { company_id: { in: companyIds } } });
      
      // Delete companies
      await prisma.companies.deleteMany({ where: { id: { in: companyIds } } });
      console.log('✅ Deleted all company data');
    }
    
    // Delete user
    await prisma.users.delete({ where: { id: user.id } });
    console.log('✅ Deleted test user');
    
    console.log('✨ Cleanup complete!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
