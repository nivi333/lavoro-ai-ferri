#!/usr/bin/env bash

# =========================================
# LAVORO AI FERRI - COMPREHENSIVE API TEST
# =========================================
# Tests ALL APIs with full CRUD operations
# Goal: 100% Success Rate
# =========================================

set +e  # Continue on errors to test all endpoints

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000/api/v1}"
CONTENT_TYPE="Content-Type: application/json"

# Counters
TOTAL=0
SUCCESS=0
FAILED=0

# Storage for created IDs (using simple variables instead of associative array)
COMPANY_ID_CREATED=""
LOCATION_ID_CREATED=""
PRODUCT_ID_CREATED=""

print_status() {
    local status=$1
    local message=$2
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $message"
        ((SUCCESS++))
    else
        echo -e "${RED}✗${NC} $message"
        ((FAILED++))
    fi
    ((TOTAL++))
}

print_section() {
    echo ""
    echo -e "${YELLOW}=========================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}=========================================${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Test API endpoint
test_api() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_field=$4
    local description=$5
    
    local response
    if [ "$method" == "GET" ] || [ "$method" == "DELETE" ]; then
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
          -H "Authorization: Bearer $COMPANY_TOKEN")
    else
        response=$(curl -s -X $method "$BASE_URL$endpoint" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer $COMPANY_TOKEN" \
          -d "$data")
    fi
    
    local success=$(echo $response | jq -r '.success // "false"')
    local field_value=$(echo $response | jq -r ".$expected_field // .data.$expected_field // .data.id // \"null\"")
    
    if [ "$success" == "true" ] || [ "$field_value" != "null" ]; then
        print_status 0 "$description"
        echo "$field_value"
        return 0
    else
        print_status 1 "$description"
        echo "Response: $(echo $response | jq -c '.')" >&2
        echo "null"
        return 1
    fi
}

# =========================================
# STEP 1: AUTHENTICATION
# =========================================
print_section "STEP 1: Authentication"

TIMESTAMP=$(date +%s)
USER_EMAIL="comprehensive${TIMESTAMP}@lavoro.com"

print_info "Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"phone\": \"+91${TIMESTAMP}\",
    \"password\": \"Test@123\",
    \"firstName\": \"Comprehensive\",
    \"lastName\": \"Test\",
    \"hasConsentedToTerms\": true,
    \"hasConsentedToPrivacy\": true,
    \"hasConsentedToCookies\": true
  }")

USER_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.tokens.accessToken')
USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')

if [ "$USER_TOKEN" != "null" ] && [ -n "$USER_TOKEN" ]; then
    print_status 0 "User registration"
else
    print_status 1 "User registration"
    echo "Cannot proceed without user. Exiting."
    exit 1
fi

# =========================================
# STEP 2: COMPANY MANAGEMENT
# =========================================
print_section "STEP 2: Company Management"

print_info "Creating company..."
COMPANY_RESPONSE=$(curl -s -X POST "$BASE_URL/companies" \
  -H "$CONTENT_TYPE" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
  "name": "Comprehensive Test Co",
  "slug": "comprehensive-test-'$TIMESTAMP'",
  "industry": "TEXTILE_MANUFACTURING",
  "country": "India",
  "establishedDate": "2020-01-01",
  "businessType": "PRIVATE_LIMITED",
  "defaultLocation": "HQ",
  "addressLine1": "123 Test St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "contactInfo": "{\"email\": \"test@test.com\", \"phone\": \"+919876543210\"}"
}')

COMPANY_ID=$(echo $COMPANY_RESPONSE | jq -r '.data.id')

if [ "$COMPANY_ID" != "null" ] && [ -n "$COMPANY_ID" ]; then
    print_status 0 "Create company"
    COMPANY_ID_CREATED=$COMPANY_ID
else
    print_status 1 "Create company"
    echo "Response: $(echo $COMPANY_RESPONSE | jq -c '.')" >&2
    echo "Cannot proceed without company. Exiting."
    exit 1
fi

print_info "Switching to company context..."
SWITCH_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/switch" \
  -H "$CONTENT_TYPE" \
  -H "Authorization: Bearer $USER_TOKEN")

COMPANY_TOKEN=$(echo $SWITCH_RESPONSE | jq -r '.data.tokens.accessToken')

if [ "$COMPANY_TOKEN" != "null" ] && [ -n "$COMPANY_TOKEN" ]; then
    print_status 0 "Switch company context"
else
    print_status 1 "Switch company context"
    echo "Cannot proceed without company context. Exiting."
    exit 1
fi

test_api "GET" "/companies" "" "success" "Get user companies"
test_api "GET" "/companies/$COMPANY_ID" "" "success" "Get company by ID"
test_api "PUT" "/companies/$COMPANY_ID" '{"description": "Updated description"}' "success" "Update company"

# =========================================
# STEP 3: LOCATIONS
# =========================================
print_section "STEP 3: Locations (CRUD)"

LOCATION_ID=$(test_api "POST" "/locations" '{
  "name": "Test Branch",
  "locationType": "BRANCH",
  "country": "India",
  "addressLine1": "456 Branch St",
  "city": "Delhi",
  "state": "Delhi",
  "pincode": "110001",
  "isActive": true
}' "data.id" "Create location")

CREATED_IDS[LOCATION]=$LOCATION_ID

test_api "GET" "/locations" "" "success" "Get all locations"
test_api "GET" "/locations/$LOCATION_ID" "" "success" "Get location by ID"
test_api "PUT" "/locations/$LOCATION_ID" '{"name": "Updated Branch"}' "success" "Update location"

# =========================================
# STEP 4: PRODUCTS
# =========================================
print_section "STEP 4: Products (CRUD)"

PRODUCT_ID=$(test_api "POST" "/products" '{
  "name": "Test Product",
  "description": "Test product description",
  "unitOfMeasure": "PCS",
  "productType": "FINISHED_GOODS",
  "costPrice": 100,
  "sellingPrice": 150,
  "stockQuantity": 100,
  "reorderLevel": 20,
  "isActive": true
}' "data.id" "Create product")

CREATED_IDS[PRODUCT]=$PRODUCT_ID

test_api "GET" "/products" "" "success" "Get all products"
test_api "GET" "/products/$PRODUCT_ID" "" "success" "Get product by ID"
test_api "PUT" "/products/$PRODUCT_ID" '{"sellingPrice": 175}' "success" "Update product"

# =========================================
# STEP 5: CUSTOMERS
# =========================================
print_section "STEP 5: Customers (CRUD)"

CUSTOMER_ID=$(test_api "POST" "/companies/$COMPANY_ID/customers" '{
  "name": "Test Customer",
  "customerType": "BUSINESS",
  "companyName": "Customer Co Ltd",
  "email": "customer@test.com",
  "phone": "+919876543210",
  "billingCountry": "India",
  "billingCity": "Mumbai",
  "billingState": "Maharashtra",
  "billingAddressLine1": "Customer St",
  "paymentTerms": "NET_30",
  "currency": "INR"
}' "data.id" "Create customer")

CREATED_IDS[CUSTOMER]=$CUSTOMER_ID

test_api "GET" "/companies/$COMPANY_ID/customers" "" "success" "Get all customers"
test_api "GET" "/companies/$COMPANY_ID/customers/$CUSTOMER_ID" "" "success" "Get customer by ID"
test_api "PUT" "/companies/$COMPANY_ID/customers/$CUSTOMER_ID" '{"creditLimit": 50000}' "success" "Update customer"

# =========================================
# STEP 6: SUPPLIERS
# =========================================
print_section "STEP 6: Suppliers (CRUD)"

SUPPLIER_ID=$(test_api "POST" "/companies/$COMPANY_ID/suppliers" '{
  "name": "Test Supplier",
  "supplierType": "MANUFACTURER",
  "email": "supplier@test.com",
  "phone": "+918765432109",
  "country": "India",
  "addressLine1": "Supplier St",
  "city": "Delhi",
  "state": "Delhi",
  "postalCode": "110001",
  "paymentTerms": "NET_30",
  "currency": "INR",
  "isActive": true
}' "data.id" "Create supplier")

CREATED_IDS[SUPPLIER]=$SUPPLIER_ID

test_api "GET" "/companies/$COMPANY_ID/suppliers" "" "success" "Get all suppliers"
test_api "GET" "/companies/$COMPANY_ID/suppliers/$SUPPLIER_ID" "" "success" "Get supplier by ID"
test_api "PUT" "/companies/$COMPANY_ID/suppliers/$SUPPLIER_ID" '{"creditLimit": 100000}' "success" "Update supplier"

# =========================================
# STEP 7: MACHINES
# =========================================
print_section "STEP 7: Machines (CRUD)"

MACHINE_ID=$(test_api "POST" "/machines" '{
  "name": "Test Machine",
  "machineType": "Spinning Machine",
  "model": "SM-001",
  "manufacturer": "Test Mfg",
  "serialNumber": "SN-001",
  "purchaseDate": "2023-01-01",
  "operationalStatus": "FREE",
  "status": "IN_USE",
  "isActive": true
}' "data.id" "Create machine")

CREATED_IDS[MACHINE]=$MACHINE_ID

test_api "GET" "/machines" "" "success" "Get all machines"
test_api "GET" "/machines/$MACHINE_ID" "" "success" "Get machine by ID"
test_api "PUT" "/machines/$MACHINE_ID" '{"operationalStatus": "IN_USE"}' "success" "Update machine"
test_api "GET" "/machines/analytics" "" "success" "Get machine analytics"

# =========================================
# STEP 8: QUALITY CONTROL
# =========================================
print_section "STEP 8: Quality Control (CRUD)"

# Quality Checkpoints
CHECKPOINT_ID=$(test_api "POST" "/quality/checkpoints" '{
  "checkpointName": "Test Checkpoint",
  "checkpointType": "INCOMING",
  "description": "Test checkpoint",
  "isActive": true
}' "data.id" "Create quality checkpoint")

CREATED_IDS[CHECKPOINT]=$CHECKPOINT_ID

test_api "GET" "/quality/checkpoints" "" "success" "Get all checkpoints"
test_api "GET" "/quality/checkpoints/$CHECKPOINT_ID" "" "success" "Get checkpoint by ID"
test_api "PUT" "/quality/checkpoints/$CHECKPOINT_ID" '{"description": "Updated"}' "success" "Update checkpoint"

# Quality Defects
DEFECT_ID=$(test_api "POST" "/quality/defects" '{
  "defectName": "Test Defect",
  "severity": "MEDIUM",
  "description": "Test defect",
  "isActive": true
}' "data.id" "Create quality defect")

CREATED_IDS[DEFECT]=$DEFECT_ID

test_api "GET" "/quality/defects" "" "success" "Get all defects"
test_api "GET" "/quality/defects/$DEFECT_ID" "" "success" "Get defect by ID"
test_api "PUT" "/quality/defects/$DEFECT_ID" '{"severity": "HIGH"}' "success" "Update defect"

# Compliance Reports
COMPLIANCE_ID=$(test_api "POST" "/quality/compliance" '{
  "reportName": "Test Compliance",
  "certificationType": "ISO_9001",
  "reportDate": "2024-12-01",
  "status": "COMPLIANT",
  "notes": "Test notes"
}' "data.id" "Create compliance report")

test_api "GET" "/quality/compliance" "" "success" "Get all compliance reports"

# =========================================
# STEP 9: TEXTILE OPERATIONS
# =========================================
print_section "STEP 9: Textile Operations (CRUD)"

# Fabric Production
FABRIC_ID=$(test_api "POST" "/textile/fabrics" '{
  "fabricType": "COTTON",
  "fabricName": "Test Fabric",
  "composition": "100% Cotton",
  "weightGsm": 150,
  "widthInches": 60,
  "color": "White",
  "quantityMeters": 1000,
  "productionDate": "2024-12-01",
  "batchNumber": "FAB-001",
  "qualityGrade": "A_GRADE",
  "isActive": true
}' "data.fabricId" "Create fabric production")

test_api "GET" "/textile/fabrics" "" "success" "Get all fabrics"
test_api "GET" "/textile/fabrics/$FABRIC_ID" "" "success" "Get fabric by ID"
test_api "PUT" "/textile/fabrics/$FABRIC_ID" '{"quantityMeters": 1100}' "success" "Update fabric"

# Yarn Manufacturing
YARN_ID=$(test_api "POST" "/textile/yarns" '{
  "yarnName": "Test Yarn",
  "yarnType": "COTTON",
  "yarnCount": "30s",
  "fiberContent": "100% Cotton",
  "twistPerInch": 15,
  "ply": 1,
  "color": "Natural",
  "quantityKg": 500,
  "productionDate": "2024-12-01",
  "batchNumber": "YARN-001",
  "processType": "SPINNING",
  "qualityGrade": "A_GRADE",
  "isActive": true
}' "data.yarnId" "Create yarn manufacturing")

test_api "GET" "/textile/yarns" "" "success" "Get all yarns"
test_api "GET" "/textile/yarns/$YARN_ID" "" "success" "Get yarn by ID"
test_api "PUT" "/textile/yarns/$YARN_ID" '{"quantityKg": 550}' "success" "Update yarn"

# Dyeing & Finishing
DYEING_ID=$(test_api "POST" "/textile/dyeing" '{
  "processType": "DYEING",
  "colorCode": "#FF0000",
  "colorName": "Red",
  "dyeMethod": "REACTIVE",
  "recipeCode": "RCP-001",
  "quantityMeters": 800,
  "processDate": "2024-12-01",
  "batchNumber": "DYE-001",
  "machineNumber": "M-001",
  "temperatureC": 80,
  "durationMinutes": 120,
  "qualityCheck": true,
  "isActive": true
}' "data.processId" "Create dyeing process")

test_api "GET" "/textile/dyeing" "" "success" "Get all dyeing processes"
test_api "GET" "/textile/dyeing/$DYEING_ID" "" "success" "Get dyeing by ID"
test_api "PUT" "/textile/dyeing/$DYEING_ID" '{"temperatureC": 85}' "success" "Update dyeing"

# Garment Manufacturing
GARMENT_ID=$(test_api "POST" "/textile/garments" '{
  "garmentType": "T_SHIRT",
  "styleNumber": "STY-001",
  "size": "M",
  "color": "Blue",
  "quantity": 100,
  "productionStage": "CUTTING",
  "cutDate": "2024-12-01",
  "operatorName": "Test Operator",
  "lineNumber": "LINE-01",
  "qualityPassed": true,
  "defectCount": 0,
  "isActive": true
}' "data.garmentId" "Create garment manufacturing")

test_api "GET" "/textile/garments" "" "success" "Get all garments"
test_api "GET" "/textile/garments/$GARMENT_ID" "" "success" "Get garment by ID"
test_api "PUT" "/textile/garments/$GARMENT_ID" '{"quantity": 120}' "success" "Update garment"

# Design & Patterns
DESIGN_ID=$(test_api "POST" "/textile/designs" '{
  "designName": "Test Design",
  "designCategory": "PRINT",
  "designerName": "Test Designer",
  "season": "SPRING",
  "colorPalette": ["#FF0000", "#00FF00"],
  "patternRepeat": "12x12",
  "status": "APPROVED",
  "notes": "Test design",
  "isActive": true
}' "data.designId" "Create design pattern")

test_api "GET" "/textile/designs" "" "success" "Get all designs"

# =========================================
# STEP 10: SALES ORDERS
# =========================================
print_section "STEP 10: Sales Orders (CRUD)"

ORDER_ID=$(test_api "POST" "/orders" '{
  "customerName": "Test Customer",
  "customerCode": "CUST-001",
  "priority": "NORMAL",
  "orderDate": "2024-12-01",
  "expectedDeliveryDate": "2024-12-15",
  "currency": "INR",
  "paymentTerms": "NET_30",
  "items": [
    {
      "itemCode": "ITEM-001",
      "description": "Test Item",
      "quantity": 10,
      "unitOfMeasure": "PCS",
      "unitPrice": 100,
      "taxRate": 18
    }
  ]
}' "data.id" "Create sales order")

CREATED_IDS[ORDER]=$ORDER_ID

test_api "GET" "/orders" "" "success" "Get all sales orders"
test_api "GET" "/orders/$ORDER_ID" "" "success" "Get sales order by ID"
test_api "PUT" "/orders/$ORDER_ID" '{"priority": "HIGH"}' "success" "Update sales order"

# =========================================
# STEP 11: PURCHASE ORDERS
# =========================================
print_section "STEP 11: Purchase Orders (CRUD)"

PO_ID=$(test_api "POST" "/purchase-orders" '{
  "supplierName": "Test Supplier",
  "supplierCode": "SUP-001",
  "orderDate": "2024-12-01",
  "expectedDeliveryDate": "2024-12-15",
  "currency": "INR",
  "paymentTerms": "NET_30",
  "items": [
    {
      "itemCode": "ITEM-001",
      "description": "Test Item",
      "quantity": 20,
      "unitOfMeasure": "PCS",
      "unitPrice": 80,
      "taxRate": 18
    }
  ]
}' "data.id" "Create purchase order")

CREATED_IDS[PO]=$PO_ID

test_api "GET" "/purchase-orders" "" "success" "Get all purchase orders"
test_api "GET" "/purchase-orders/$PO_ID" "" "success" "Get purchase order by ID"
test_api "PUT" "/purchase-orders/$PO_ID" '{"status": "APPROVED"}' "success" "Update purchase order"

# =========================================
# STEP 12: INVOICES
# =========================================
print_section "STEP 12: Invoices (CRUD)"

INVOICE_ID=$(test_api "POST" "/invoices" '{
  "customerName": "Test Customer",
  "invoiceDate": "2024-12-01",
  "dueDate": "2024-12-31",
  "currency": "INR",
  "items": [
    {
      "description": "Test Item",
      "quantity": 10,
      "unitPrice": 150,
      "taxRate": 18
    }
  ]
}' "data.id" "Create invoice")

CREATED_IDS[INVOICE]=$INVOICE_ID

test_api "GET" "/invoices" "" "success" "Get all invoices"
test_api "GET" "/invoices/$INVOICE_ID" "" "success" "Get invoice by ID"
test_api "PUT" "/invoices/$INVOICE_ID" '{"status": "PAID"}' "success" "Update invoice"

# =========================================
# STEP 13: BILLS
# =========================================
print_section "STEP 13: Bills (CRUD)"

BILL_ID=$(test_api "POST" "/bills" '{
  "supplierName": "Test Supplier",
  "billDate": "2024-12-01",
  "dueDate": "2024-12-31",
  "currency": "INR",
  "items": [
    {
      "description": "Test Item",
      "quantity": 20,
      "unitPrice": 80,
      "taxRate": 18
    }
  ]
}' "data.id" "Create bill")

CREATED_IDS[BILL]=$BILL_ID

test_api "GET" "/bills" "" "success" "Get all bills"
test_api "GET" "/bills/$BILL_ID" "" "success" "Get bill by ID"
test_api "PUT" "/bills/$BILL_ID" '{"status": "PAID"}' "success" "Update bill"

# =========================================
# STEP 14: QUALITY INSPECTIONS
# =========================================
print_section "STEP 14: Quality Inspections (CRUD)"

INSPECTION_ID=$(test_api "POST" "/inspections/inspections" '{
  "inspectionType": "INCOMING_MATERIAL",
  "referenceType": "BATCH",
  "referenceId": "BATCH-001",
  "inspectorName": "Test Inspector",
  "inspectionDate": "2024-12-01",
  "status": "PASSED",
  "qualityScore": 95,
  "inspectorNotes": "All good",
  "isActive": true
}' "data.id" "Create quality inspection")

test_api "GET" "/inspections/inspections" "" "success" "Get all inspections"

# =========================================
# STEP 15: ANALYTICS
# =========================================
print_section "STEP 15: Analytics (All Endpoints)"

test_api "GET" "/analytics/dashboard" "" "success" "Dashboard analytics"
test_api "GET" "/analytics/revenue-trends?months=6" "" "success" "Revenue trends"
test_api "GET" "/analytics/top-products?limit=10" "" "success" "Top products"
test_api "GET" "/analytics/top-customers?limit=10" "" "success" "Top customers"
test_api "GET" "/analytics/quality-metrics" "" "success" "Quality metrics"
test_api "GET" "/analytics/production-summary" "" "success" "Production summary"

# =========================================
# STEP 16: REPORTS
# =========================================
print_section "STEP 16: Reports (All Types)"

# Financial Reports
test_api "POST" "/reports/profit-loss" '{"startDate": "2024-01-01", "endDate": "2024-12-31"}' "success" "Profit & Loss report"
test_api "POST" "/reports/balance-sheet" '{"asOfDate": "2024-12-31"}' "success" "Balance Sheet report"
test_api "POST" "/reports/cash-flow" '{"startDate": "2024-01-01", "endDate": "2024-12-31"}' "success" "Cash Flow report"
test_api "POST" "/reports/trial-balance" '{"asOfDate": "2024-12-31"}' "success" "Trial Balance report"
test_api "POST" "/reports/gst" '{"startDate": "2024-01-01", "endDate": "2024-12-31", "period": "MONTHLY"}' "success" "GST report"
test_api "POST" "/reports/accounts-receivable" '{"asOfDate": "2024-12-31"}' "success" "Accounts Receivable report"
test_api "POST" "/reports/accounts-payable" '{"asOfDate": "2024-12-31"}' "success" "Accounts Payable report"
test_api "POST" "/reports/expense-summary" '{"startDate": "2024-01-01", "endDate": "2024-12-31"}' "success" "Expense Summary report"

# Inventory Reports
test_api "POST" "/reports/inventory-summary" '{"asOfDate": "2024-12-31"}' "success" "Inventory Summary report"
test_api "POST" "/reports/stock-aging" '{"asOfDate": "2024-12-31"}' "success" "Stock Aging report"
test_api "POST" "/reports/inventory-valuation" '{"asOfDate": "2024-12-31"}' "success" "Inventory Valuation report"

# Sales Reports
test_api "POST" "/reports/top-selling-products" '{"startDate": "2024-01-01", "endDate": "2024-12-31", "limit": 10}' "success" "Top Selling Products report"
test_api "POST" "/reports/customer-purchase-history" '{"startDate": "2024-01-01", "endDate": "2024-12-31"}' "success" "Customer Purchase History report"
test_api "POST" "/reports/sales-by-region" '{"startDate": "2024-01-01", "endDate": "2024-12-31"}' "success" "Sales by Region report"

# Operational Reports
test_api "POST" "/reports/production-efficiency" '{"startDate": "2024-01-01", "endDate": "2024-12-31"}' "success" "Production Efficiency report"
test_api "POST" "/reports/machine-utilization" '{"startDate": "2024-01-01", "endDate": "2024-12-31"}' "success" "Machine Utilization report"
test_api "POST" "/reports/quality-metrics" '{"startDate": "2024-01-01", "endDate": "2024-12-31"}' "success" "Quality Metrics report"

# =========================================
# STEP 17: DELETE OPERATIONS
# =========================================
print_section "STEP 17: Delete Operations"

test_api "DELETE" "/locations/${CREATED_IDS[LOCATION]}" "" "success" "Delete location"
test_api "DELETE" "/products/${CREATED_IDS[PRODUCT]}" "" "success" "Delete product"
test_api "DELETE" "/machines/${CREATED_IDS[MACHINE]}" "" "success" "Delete machine"

# =========================================
# FINAL SUMMARY
# =========================================
print_section "COMPREHENSIVE TEST SUMMARY"

echo -e "${BLUE}Total Tests:${NC} $TOTAL"
echo -e "${GREEN}Successful:${NC} $SUCCESS"
echo -e "${RED}Failed:${NC} $FAILED"

SUCCESS_RATE=$((SUCCESS * 100 / TOTAL))
echo -e "${BLUE}Success Rate:${NC} ${SUCCESS_RATE}%"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 100% SUCCESS! ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠ ${FAILED} tests failed. Success rate: ${SUCCESS_RATE}%${NC}"
    exit 1
fi
