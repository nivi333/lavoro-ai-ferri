const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting data seeding...\n');

  // 1. Create User
  console.log('🔐 Creating test user...');
  const hashedPassword = await bcrypt.hash('Test@123', 10);
  
  const user = await prisma.users.upsert({
    where: { email: 'testuser@lavoro.com' },
    update: {},
    create: {
      id: uuidv4(),
      email: 'testuser@lavoro.com',
      password: hashedPassword,
      first_name: 'Test',
      last_name: 'User',
      phone: '+1234567890',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    },
  });
  console.log(`✅ User: ${user.email}`);

  // 2. Create Companies
  console.log('\n🏢 Creating companies...');
  const companies = [];
  
  for (let i = 1; i <= 2; i++) {
    const companyId = uuidv4();
    const companyName = i === 1 ? 'Ayphen Textiles Ltd' : 'Global Fabrics Inc';
    const companySlug = i === 1 ? 'ayphen-textiles-ltd' : 'global-fabrics-inc';
    
    const company = await prisma.companies.create({
      data: {
        id: companyId,
        company_id: `COMP${String(i).padStart(3, '0')}`,
        name: companyName,
        slug: companySlug,
        industry: 'TEXTILE_MANUFACTURING',
        business_type: 'MANUFACTURER',
        country: i === 1 ? 'India' : 'USA',
        address_line_1: `${i}23 Industrial Area`,
        city: i === 1 ? 'Mumbai' : 'New York',
        state: i === 1 ? 'Maharashtra' : 'New York',
        pincode: i === 1 ? '400001' : '10001',
        contact_info: { phone: `+${i}-555-0100`, email: `contact@company${i}.com` },
        established_date: new Date('2020-01-01'),
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    await prisma.user_companies.create({
      data: {
        id: uuidv4(),
        user_id: user.id,
        company_id: companyId,
        role: 'OWNER',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    companies.push({ id: companyId, name: company.name, locations: [], products: [], customers: [], suppliers: [] });
    console.log(`✅ Company: ${company.name}`);
  }

  // 3. Create Locations (5 per company)
  console.log('\n📍 Creating locations...');
  for (const company of companies) {
    for (let i = 1; i <= 5; i++) {
      const locationId = uuidv4();
      const locationTypes = ['BRANCH', 'WAREHOUSE', 'FACTORY', 'STORE', 'BRANCH'];
      await prisma.company_locations.create({
        data: {
          id: locationId,
          company_id: company.id,
          location_id: `L${String(i).padStart(3, '0')}`,
          name: `Location ${i}`,
          address_line_1: `${i}00 Street`,
          city: 'City',
          state: 'State',
          country: 'Country',
          pincode: `1000${i}`,
          contact_info: { phone: `+1-555-${1000 + i}`, email: `loc${i}@company.com` },
          location_type: locationTypes[i - 1],
          is_headquarters: i === 1,
          is_default: i === 1,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      company.locations.push(locationId);
    }
    console.log(`  ✅ ${company.name}: 5 locations`);
  }

  // 4. Create Customers & Suppliers
  console.log('\n👥 Creating customers and suppliers...');
  let customerCounter = 1;
  let supplierCounter = 1;
  
  for (const company of companies) {
    for (let i = 1; i <= 5; i++) {
      const customerId = uuidv4();
      const customerCode = `CUST${String(customerCounter).padStart(3, '0')}`;
      await prisma.customers.create({
        data: {
          id: customerId,
          customer_id: customerCode,
          company_id: company.id,
          code: customerCode,
          name: `Customer ${i}`,
          email: `customer${i}@example.com`,
          phone: `+1-555-010${i}`,
          billing_address_line_1: `${i}00 Customer St`,
          billing_city: 'City',
          billing_state: 'State',
          billing_country: 'Country',
          billing_postal_code: `1000${i}`,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      company.customers.push(customerId);
      customerCounter++;

      const supplierId = uuidv4();
      const supplierCode = `SUPP${String(supplierCounter).padStart(3, '0')}`;
      await prisma.suppliers.create({
        data: {
          id: supplierId,
          supplier_id: supplierCode,
          company_id: company.id,
          code: supplierCode,
          name: `Supplier ${i}`,
          email: `supplier${i}@example.com`,
          phone: `+1-555-020${i}`,
          address_line_1: `${i}00 Supplier Ave`,
          city: 'City',
          state: 'State',
          country: 'Country',
          postal_code: `2000${i}`,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      company.suppliers.push(supplierId);
      supplierCounter++;
    }
    console.log(`  ✅ ${company.name}: 5 customers, 5 suppliers`);
  }

  // 5. Create Products
  console.log('\n📦 Creating products...');
  let productCounter = 1;
  
  for (const company of companies) {
    for (let i = 1; i <= 5; i++) {
      const productId = uuidv4();
      const productCode = `PROD${String(productCounter).padStart(3, '0')}`;
      const costPrice = 30 + i * 5;
      const sellingPrice = 50 + i * 10;
      
      await prisma.products.create({
        data: {
          id: productId,
          product_id: productCode,
          product_code: productCode,
          company_id: company.id,
          name: `Product ${i}`,
          description: `Description for product ${i}`,
          unit_of_measure: 'METER',
          cost_price: costPrice,
          selling_price: sellingPrice,
          sku: `SKU-${productCode}`,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      company.products.push(productId);
      productCounter++;
    }
    console.log(`  ✅ ${company.name}: 5 products`);
  }

  // 6. Create Inventory
  console.log('\n📊 Creating inventory...');
  let inventoryCounter = 1;
  
  for (const company of companies) {
    for (const productId of company.products) {
      for (let i = 0; i < 3; i++) {
        const inventoryCode = `INV${String(inventoryCounter).padStart(4, '0')}`;
        const stockQty = Math.floor(Math.random() * 1000) + 100;
        const reservedQty = Math.floor(Math.random() * 50);
        const availableQty = stockQty - reservedQty;
        
        await prisma.location_inventory.create({
          data: {
            id: uuidv4(),
            company_id: company.id,
            product_id: productId,
            location_id: company.locations[i],
            inventory_code: inventoryCode,
            stock_quantity: stockQty,
            reserved_quantity: reservedQty,
            available_quantity: availableQty,
            reorder_level: 50,
            max_stock_level: 2000,
            is_active: true,
          },
        });
        inventoryCounter++;
      }
    }
    console.log(`  ✅ ${company.name}: Inventory created`);
  }

  // 7. Create Stock Adjustments
  console.log('\n📝 Creating stock adjustments...');
  let adjustmentCounter = 1;
  
  for (const company of companies) {
    for (let i = 1; i <= 10; i++) {
      const adjustmentQty = Math.floor(Math.random() * 100) + 10;
      const previousStock = Math.floor(Math.random() * 500) + 100;
      const adjustmentType = ['ADD', 'REMOVE', 'SET'][i % 3];
      const newStock = adjustmentType === 'REMOVE' ? previousStock - adjustmentQty : adjustmentType === 'ADD' ? previousStock + adjustmentQty : adjustmentQty;
      
      await prisma.stock_adjustments.create({
        data: {
          id: uuidv4(),
          company_id: company.id,
          adjustment_id: `ADJ${String(adjustmentCounter).padStart(4, '0')}`,
          product_id: company.products[i % company.products.length],
          adjustment_type: adjustmentType,
          quantity: adjustmentQty,
          previous_stock: previousStock,
          new_stock: newStock,
          reason: 'Stock adjustment',
          adjusted_by: user.id,
        },
      });
      adjustmentCounter++;
    }
    console.log(`  ✅ ${company.name}: 10 stock adjustments`);
  }

  // 8. Create Sales Orders
  console.log('\n🛒 Creating sales orders...');
  let orderCounter = 1;
  
  for (const company of companies) {
    for (let i = 1; i <= 8; i++) {
      const orderId = uuidv4();
      await prisma.orders.create({
        data: {
          id: orderId,
          order_id: `ORD${String(orderCounter).padStart(4, '0')}`,
          company_id: company.id,
          customer_id: company.customers[i % company.customers.length],
          customer_name: `Customer ${(i % company.customers.length) + 1}`,
          location_id: company.locations[0],
          order_date: new Date(),
          expected_delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: ['DRAFT', 'CONFIRMED', 'IN_PRODUCTION', 'DELIVERED'][i % 4],
          priority: ['LOW', 'NORMAL', 'HIGH', 'URGENT'][i % 4],
          total_amount: 1000 + i * 100,
          currency: 'USD',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      for (let j = 0; j < 2; j++) {
        const qty = 10 + j * 5;
        const price = 50 + j * 10;
        await prisma.order_items.create({
          data: {
            id: uuidv4(),
            order_id: orderId,
            product_id: company.products[j % company.products.length],
            item_code: `ITEM-${orderCounter}-${j + 1}`,
            line_number: j + 1,
            quantity: qty,
            unit_price: price,
            line_amount: qty * price,
            unit_of_measure: 'PCS',
          },
        });
      }
      orderCounter++;
    }
    console.log(`  ✅ ${company.name}: 8 sales orders`);
  }

  // 9. Create Purchase Orders
  console.log('\n🛍️ Creating purchase orders...');
  let poCounter = 1;
  
  for (const company of companies) {
    for (let i = 1; i <= 6; i++) {
      const poId = uuidv4();
      await prisma.purchase_orders.create({
        data: {
          id: poId,
          po_id: `PO${String(poCounter).padStart(4, '0')}`,
          company_id: company.id,
          supplier_id: company.suppliers[i % company.suppliers.length],
          supplier_name: `Supplier ${(i % company.suppliers.length) + 1}`,
          location_id: company.locations[0],
          po_date: new Date(),
          expected_delivery_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          status: ['DRAFT', 'SENT', 'CONFIRMED', 'RECEIVED'][i % 4],
          priority: ['LOW', 'NORMAL', 'HIGH'][i % 3],
          total_amount: 800 + i * 100,
          currency: 'USD',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      for (let j = 0; j < 2; j++) {
        const qty = 20 + j * 10;
        const cost = 40 + j * 10;
        await prisma.purchase_order_items.create({
          data: {
            id: uuidv4(),
            po_id: poId,
            product_id: company.products[j % company.products.length],
            item_code: `POITEM-${poCounter}-${j + 1}`,
            line_number: j + 1,
            quantity: qty,
            unit_cost: cost,
            line_amount: qty * cost,
            unit_of_measure: 'PCS',
          },
        });
      }
      poCounter++;
    }
    console.log(`  ✅ ${company.name}: 6 purchase orders`);
  }

  // 10. Create Invoices
  console.log('\n💰 Creating invoices...');
  let invoiceCounter = 1;
  
  for (const company of companies) {
    for (let i = 1; i <= 10; i++) {
      const invoiceId = uuidv4();
      const totalAmount = 1200 + i * 100;
      const status = ['DRAFT', 'SENT', 'PAID', 'OVERDUE'][i % 4];
      const balanceDue = status === 'PAID' ? 0 : totalAmount;
      
      await prisma.invoices.create({
        data: {
          id: invoiceId,
          invoice_id: `INV${String(invoiceCounter).padStart(4, '0')}`,
          company_id: company.id,
          customer_id: company.customers[i % company.customers.length],
          customer_name: `Customer ${(i % company.customers.length) + 1}`,
          location_id: company.locations[0],
          invoice_date: new Date(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: status,
          total_amount: totalAmount,
          balance_due: balanceDue,
          currency: 'USD',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      for (let j = 0; j < 2; j++) {
        const qty = 15 + j * 5;
        const price = 60 + j * 10;
        await prisma.invoice_items.create({
          data: {
            id: uuidv4(),
            invoice_id: invoiceId,
            product_id: company.products[j % company.products.length],
            item_code: `INVITEM-${i}-${j + 1}`,
            line_number: j + 1,
            description: `Invoice item ${j + 1}`,
            quantity: qty,
            unit_price: price,
            line_amount: qty * price,
            unit_of_measure: 'PCS',
          },
        });
      }
      invoiceCounter++;
    }
    console.log(`  ✅ ${company.name}: 10 invoices`);
  }

  // 11. Create Bills
  console.log('\n📄 Creating bills...');
  let billCounter = 1;
  
  for (const company of companies) {
    for (let i = 1; i <= 8; i++) {
      const billId = uuidv4();
      const totalAmount = 900 + i * 100;
      const status = ['DRAFT', 'RECEIVED', 'PAID', 'OVERDUE'][i % 4];
      const balanceDue = status === 'PAID' ? 0 : totalAmount;
      
      await prisma.bills.create({
        data: {
          id: billId,
          bill_id: `BILL${String(billCounter).padStart(4, '0')}`,
          company_id: company.id,
          supplier_id: company.suppliers[i % company.suppliers.length],
          supplier_name: `Supplier ${(i % company.suppliers.length) + 1}`,
          location_id: company.locations[0],
          bill_date: new Date(),
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: status,
          total_amount: totalAmount,
          balance_due: balanceDue,
          currency: 'USD',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      for (let j = 0; j < 2; j++) {
        const qty = 25 + j * 5;
        const cost = 35 + j * 10;
        await prisma.bill_items.create({
          data: {
            id: uuidv4(),
            bill_id: billId,
            product_id: company.products[j % company.products.length],
            item_code: `BILLITEM-${i}-${j + 1}`,
            line_number: j + 1,
            description: `Bill item ${j + 1}`,
            quantity: qty,
            unit_cost: cost,
            line_amount: qty * cost,
            unit_of_measure: 'PCS',
          },
        });
      }
      billCounter++;
    }
    console.log(`  ✅ ${company.name}: 8 bills`);
  }

  // 12. Create Machines
  console.log('\n⚙️ Creating machines...');
  for (const company of companies) {
    for (let i = 1; i <= 6; i++) {
      await prisma.machines.create({
        data: {
          id: uuidv4(),
          machine_id: `MCH${String(i).padStart(3, '0')}`,
          machine_code: `M${String(i).padStart(3, '0')}`,
          name: `Machine ${i}`,
          machine_type: 'WEAVING_MACHINE',
          company_id: company.id,
          location_id: company.locations[i % company.locations.length],
          manufacturer: 'Manufacturer',
          model: `Model-${i}`,
          serial_number: `SN-${i}`,
          purchase_date: new Date('2020-01-01'),
          status: ['IN_USE', 'IDLE', 'UNDER_MAINTENANCE'][i % 3],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }
    console.log(`  ✅ ${company.name}: 6 machines`);
  }

  // 13. Create Quality Control Data
  console.log('\n✅ Creating quality control data...');
  let checkpointCounter = 1;
  let defectCounter = 1;
  let inspectionCounter = 1;
  let complianceCounter = 1;
  
  for (const company of companies) {
    for (let i = 1; i <= 5; i++) {
      const checkpointUuid = uuidv4();
      await prisma.quality_checkpoints.create({
        data: {
          id: checkpointUuid,
          company_id: company.id,
          checkpoint_id: `QC${String(checkpointCounter).padStart(3, '0')}`,
          checkpoint_name: `Quality Check ${i}`,
          checkpoint_type: ['INCOMING_MATERIAL', 'IN_PROCESS', 'FINAL_INSPECTION', 'PACKAGING'][i % 4],
          product_id: company.products[i % company.products.length],
          location_id: company.locations[0],
          batch_number: `BATCH-${i}`,
          inspector_name: 'Inspector',
          inspection_date: new Date(),
          status: ['PENDING', 'IN_PROGRESS', 'PASSED', 'FAILED'][i % 4],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      checkpointCounter++;

      await prisma.quality_defects.create({
        data: {
          id: uuidv4(),
          company_id: company.id,
          checkpoint_id: checkpointUuid,
          defect_id: `DEF${String(defectCounter).padStart(3, '0')}`,
          defect_type: 'STAIN',
          defect_category: 'FABRIC',
          severity: 'MINOR',
          quantity: 5,
          product_id: company.products[0],
          resolution_status: 'OPEN',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      defectCounter++;
    }

    for (let i = 1; i <= 3; i++) {
      await prisma.quality_inspections.create({
        data: {
          id: uuidv4(),
          company_id: company.id,
          inspection_number: `INS${String(inspectionCounter).padStart(3, '0')}`,
          inspection_type: 'INCOMING_MATERIAL',
          reference_type: 'PRODUCT',
          reference_id: company.products[0],
          location_id: company.locations[0],
          scheduled_date: new Date(),
          status: 'PENDING',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      inspectionCounter++;
    }

    for (let i = 1; i <= 2; i++) {
      await prisma.compliance_reports.create({
        data: {
          id: uuidv4(),
          company_id: company.id,
          report_id: `REP${String(complianceCounter).padStart(3, '0')}`,
          report_type: 'ISO_9001',
          report_date: new Date(),
          auditor_name: 'Auditor',
          status: 'PENDING_REVIEW',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      complianceCounter++;
    }

    console.log(`  ✅ ${company.name}: Quality control data`);
  }

  // 14. Create Textile Operations
  console.log('\n🧵 Creating textile operations...');
  let fabricCounter = 1;
  let yarnCounter = 1;
  let dyeingCounter = 1;
  let garmentCounter = 1;
  let designCounter = 1;
  for (const company of companies) {
    for (let i = 1; i <= 4; i++) {
      await prisma.fabric_production.create({
        data: {
          id: uuidv4(),
          company_id: company.id,
          fabric_id: `FAB${String(fabricCounter).padStart(3, '0')}`,
          code: `FAB-${String(fabricCounter).padStart(3, '0')}`,
          fabric_type: 'COTTON',
          fabric_name: `Fabric ${i}`,
          composition: '100% Cotton',
          weight_gsm: 150,
          width_inches: 60,
          color: 'White',
          quantity_meters: 1000,
          production_date: new Date(),
          batch_number: `BATCH-FAB-${i}`,
          quality_grade: 'A_GRADE',
          location_id: company.locations[0],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      fabricCounter++;

      await prisma.yarn_manufacturing.create({
        data: {
          id: uuidv4(),
          company_id: company.id,
          yarn_id: `YARN${String(yarnCounter).padStart(3, '0')}`,
          code: `YARN-${String(yarnCounter).padStart(3, '0')}`,
          yarn_name: `Yarn ${i}`,
          fiber_content: '100% Cotton',
          yarn_type: 'COTTON',
          yarn_count: '20s',
          ply: 2,
          color: 'Natural',
          quantity_kg: 500,
          production_date: new Date(),
          batch_number: `BATCH-YARN-${i}`,
          process_type: 'SPINNING',
          quality_grade: 'A_GRADE',
          location_id: company.locations[0],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      yarnCounter++;
    }

    for (let i = 1; i <= 3; i++) {
      await prisma.dyeing_finishing.create({
        data: {
          id: uuidv4(),
          company_id: company.id,
          process_id: `DYE${String(dyeingCounter).padStart(3, '0')}`,
          code: `DYE-${String(dyeingCounter).padStart(3, '0')}`,
          process_type: 'DYEING',
          color_code: `C${String(i).padStart(3, '0')}`,
          color_name: `Color ${i}`,
          quantity_meters: 800,
          process_date: new Date(),
          batch_number: `BATCH-DYE-${i}`,
          location_id: company.locations[0],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      dyeingCounter++;

      await prisma.garment_manufacturing.create({
        data: {
          id: uuidv4(),
          company_id: company.id,
          garment_id: `GARM${String(garmentCounter).padStart(3, '0')}`,
          code: `GAR-${String(garmentCounter).padStart(3, '0')}`,
          garment_type: 'SHIRT',
          style_number: `STY-${i}`,
          size: 'M',
          color: 'White',
          quantity: 100,
          production_stage: 'CUTTING',
          location_id: company.locations[0],
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      garmentCounter++;

      await prisma.design_patterns.create({
        data: {
          id: uuidv4(),
          company_id: company.id,
          design_id: `DES${String(designCounter).padStart(3, '0')}`,
          code: `DES-${String(designCounter).padStart(3, '0')}`,
          design_name: `Design ${i}`,
          design_category: 'PRINT',
          status: 'DRAFT',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      designCounter++;
    }

    console.log(`  ✅ ${company.name}: Textile operations`);
  }

  console.log('\n✨ Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('  - 1 User: testuser@lavoro.com (Password: Test@123)');
  console.log('  - 2 Companies: Ayphen Textiles Ltd, Global Fabrics Inc');
  console.log('  - 5 Locations per company');
  console.log('  - 5 Customers & 5 Suppliers per company');
  console.log('  - 5 Products per company');
  console.log('  - Inventory across locations');
  console.log('  - 10 Stock adjustments per company');
  console.log('  - 8 Sales orders per company');
  console.log('  - 6 Purchase orders per company');
  console.log('  - 10 Invoices per company');
  console.log('  - 8 Bills per company');
  console.log('  - 6 Machines per company');
  console.log('  - Quality control: checkpoints, defects, inspections, compliance');
  console.log('  - Textile operations: fabric, yarn, dyeing, garments, designs');
  console.log('\n🎯 Login with testuser@lavoro.com / Test@123 to explore!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
