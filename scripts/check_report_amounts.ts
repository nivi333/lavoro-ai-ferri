import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const startDate = new Date('2026-01-07');
  const endDate = new Date('2026-02-06');
  endDate.setHours(23, 59, 59, 999);

  console.log(`Checking data from ${startDate.toISOString()} to ${endDate.toISOString()}`);

  const invoices = await prisma.invoices.findMany({
    where: {
      invoice_date: { gte: startDate, lte: endDate },
      is_active: true,
    },
    include: { invoice_items: true },
  });

  const bills = await prisma.bills.findMany({
    where: {
      bill_date: { gte: startDate, lte: endDate },
      is_active: true,
    },
    include: { bill_items: true, supplier: true },
  });

  console.log('--- INVOICES (REVENUE) ---');
  invoices.forEach(inv => {
    console.log(
      `Invoice ID: ${inv.id}, Date: ${inv.invoice_date.toISOString().split('T')[0]}, Total: ${inv.total_amount}`
    );
    inv.invoice_items.forEach(item => {
      console.log(`  - ${item.description}: ${item.line_amount}`);
    });
  });

  console.log('\n--- BILLS (COGS/PURCHASES) ---');
  bills.forEach(bill => {
    console.log(
      `Bill ID: ${bill.id}, Date: ${bill.bill_date.toISOString().split('T')[0]}, Total: ${bill.total_amount}, Supplier: ${bill.supplier?.name}`
    );
    bill.bill_items.forEach(item => {
      console.log(`  - ${item.description}: ${item.line_amount}`);
    });
  });

  const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  const totalBills = bills.reduce((sum, bill) => sum + Number(bill.total_amount), 0);

  console.log(`\nTOTAL REVENUE: ${totalRevenue}`);
  console.log(`TOTAL BILLS (COGS): ${totalBills}`);
  console.log(`GROSS PROFIT: ${totalRevenue - totalBills}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
