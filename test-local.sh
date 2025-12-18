#!/bin/bash

# =========================================
# LAVORO AI FERRI - LOCAL SERVER TEST SCRIPT
# =========================================
# Quick test script for localhost:3000
# Tests all major APIs with minimal data
# =========================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
BASE_URL="http://localhost:3000/api/v1"
CONTENT_TYPE="Content-Type: application/json"

# Counters
TOTAL=0
SUCCESS=0
FAILED=0

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

# =========================================
# STEP 1: CREATE USER
# =========================================
print_section "STEP 1: Creating Test User"

TIMESTAMP=$(date +%s)
USER_EMAIL="test${TIMESTAMP}@lavoro.com"

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"phone\": \"+91${TIMESTAMP}\",
    \"password\": \"Test@123\",
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"hasConsentedToTerms\": true,
    \"hasConsentedToPrivacy\": true,
    \"hasConsentedToCookies\": true
  }")

USER_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.tokens.accessToken')
USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')

if [ "$USER_TOKEN" != "null" ] && [ -n "$USER_TOKEN" ]; then
    print_status 0 "User created: $USER_EMAIL"
else
    print_status 1 "Failed to create user"
    echo "Response: $REGISTER_RESPONSE"
    exit 1
fi

# =========================================
# STEP 2: CREATE COMPANY
# =========================================
print_section "STEP 2: Creating Company"

COMPANY_RESPONSE=$(curl -s -X POST "$BASE_URL/companies" \
  -H "$CONTENT_TYPE" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "{
    \"name\": \"Test Company ${TIMESTAMP}\",
    \"slug\": \"test-company-${TIMESTAMP}\",
    \"industry\": \"TEXTILE_MANUFACTURING\",
    \"country\": \"India\",
    \"establishedDate\": \"2020-01-01\",
    \"businessType\": \"PRIVATE_LIMITED\",
    \"defaultLocation\": \"Head Office\",
    \"addressLine1\": \"123 Main Street\",
    \"city\": \"Mumbai\",
    \"state\": \"Maharashtra\",
    \"contactInfo\": \"{\\\"email\\\": \\\"contact@company.com\\\", \\\"phone\\\": \\\"+919876543210\\\"}\"
  }")

COMPANY_ID=$(echo $COMPANY_RESPONSE | jq -r '.data.id')

if [ "$COMPANY_ID" != "null" ] && [ -n "$COMPANY_ID" ]; then
    print_status 0 "Company created"
    
    # Switch to company context
    SWITCH_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/switch" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer $USER_TOKEN")
    
    COMPANY_TOKEN=$(echo $SWITCH_RESPONSE | jq -r '.data.tokens.accessToken')
    
    if [ "$COMPANY_TOKEN" != "null" ] && [ -n "$COMPANY_TOKEN" ]; then
        print_status 0 "Switched to company context"
    else
        print_status 1 "Failed to switch company context"
        echo "Response: $SWITCH_RESPONSE"
    fi
else
    print_status 1 "Failed to create company"
    echo "Response: $COMPANY_RESPONSE"
    exit 1
fi

# =========================================
# STEP 3: TEST ANALYTICS ENDPOINTS
# =========================================
print_section "STEP 3: Testing Analytics APIs"

# Dashboard Analytics
DASHBOARD_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/dashboard" \
  -H "Authorization: Bearer $COMPANY_TOKEN")

if [ "$(echo $DASHBOARD_RESPONSE | jq -r '.success')" == "true" ]; then
    print_status 0 "Dashboard analytics"
else
    print_status 1 "Dashboard analytics"
    echo "Response: $DASHBOARD_RESPONSE"
fi

# Revenue Trends
REVENUE_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/revenue-trends?months=6" \
  -H "Authorization: Bearer $COMPANY_TOKEN")

if [ "$(echo $REVENUE_RESPONSE | jq -r '.success')" == "true" ]; then
    print_status 0 "Revenue trends"
else
    print_status 1 "Revenue trends"
    echo "Response: $REVENUE_RESPONSE"
fi

# Top Products
PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/top-products?limit=10" \
  -H "Authorization: Bearer $COMPANY_TOKEN")

if [ "$(echo $PRODUCTS_RESPONSE | jq -r '.success')" == "true" ]; then
    print_status 0 "Top products"
else
    print_status 1 "Top products"
fi

# Quality Metrics
QUALITY_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/quality-metrics" \
  -H "Authorization: Bearer $COMPANY_TOKEN")

if [ "$(echo $QUALITY_RESPONSE | jq -r '.success')" == "true" ]; then
    print_status 0 "Quality metrics"
else
    print_status 1 "Quality metrics"
fi

# Production Summary
PRODUCTION_RESPONSE=$(curl -s -X GET "$BASE_URL/analytics/production-summary" \
  -H "Authorization: Bearer $COMPANY_TOKEN")

if [ "$(echo $PRODUCTION_RESPONSE | jq -r '.success')" == "true" ]; then
    print_status 0 "Production summary"
else
    print_status 1 "Production summary"
fi

# =========================================
# STEP 4: CREATE PRODUCTS
# =========================================
print_section "STEP 4: Creating Products"

for i in {1..3}; do
    PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer $COMPANY_TOKEN" \
      -d "{
        \"name\": \"Test Product $i\",
        \"description\": \"Test product description\",
        \"unitOfMeasure\": \"PCS\",
        \"productType\": \"FINISHED_GOODS\",
        \"costPrice\": $((100 + $i * 10)),
        \"sellingPrice\": $((150 + $i * 15)),
        \"stockQuantity\": $((100 + $i * 5)),
        \"reorderLevel\": 50,
        \"isActive\": true
      }")
    
    if [ "$(echo $PRODUCT_RESPONSE | jq -r '.data.id')" != "null" ]; then
        print_status 0 "Product $i created"
    else
        print_status 1 "Product $i failed"
    fi
done

# =========================================
# STEP 5: CREATE CUSTOMERS
# =========================================
print_section "STEP 5: Creating Customers"

for i in {1..3}; do
    CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/customers" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer $COMPANY_TOKEN" \
      -d "{
        \"name\": \"Test Customer $i\",
        \"customerType\": \"BUSINESS\",
        \"companyName\": \"Customer Business $i Ltd\",
        \"email\": \"customer$i@test.com\",
        \"phone\": \"+919876543$i$i$i\",
        \"billingCountry\": \"India\",
        \"billingCity\": \"Mumbai\",
        \"billingState\": \"Maharashtra\",
        \"billingAddressLine1\": \"Customer Street $i\",
        \"paymentTerms\": \"NET_30\",
        \"currency\": \"INR\"
      }")
    
    if [ "$(echo $CUSTOMER_RESPONSE | jq -r '.data.id')" != "null" ]; then
        print_status 0 "Customer $i created"
    else
        print_status 1 "Customer $i failed"
    fi
done

# =========================================
# STEP 6: CREATE SUPPLIERS
# =========================================
print_section "STEP 6: Creating Suppliers"

for i in {1..3}; do
    SUPPLIER_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/suppliers" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer $COMPANY_TOKEN" \
      -d "{
        \"name\": \"Test Supplier $i\",
        \"supplierType\": \"MANUFACTURER\",
        \"email\": \"supplier$i@test.com\",
        \"phone\": \"+918765432$i$i$i\",
        \"country\": \"India\",
        \"addressLine1\": \"Supplier Street $i\",
        \"city\": \"Delhi\",
        \"state\": \"Delhi\",
        \"postalCode\": \"11000$i\",
        \"paymentTerms\": \"NET_30\",
        \"currency\": \"INR\",
        \"isActive\": true
      }")
    
    if [ "$(echo $SUPPLIER_RESPONSE | jq -r '.data.id')" != "null" ]; then
        print_status 0 "Supplier $i created"
    else
        print_status 1 "Supplier $i failed"
    fi
done

# =========================================
# STEP 7: CREATE MACHINES
# =========================================
print_section "STEP 7: Creating Machines"

for i in {1..3}; do
    MACHINE_RESPONSE=$(curl -s -X POST "$BASE_URL/machines" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer $COMPANY_TOKEN" \
      -d "{
        \"name\": \"Test Machine $i\",
        \"machineType\": \"Spinning Machine\",
        \"model\": \"Model-00$i\",
        \"manufacturer\": \"Test Manufacturer\",
        \"serialNumber\": \"SN-000$i\",
        \"purchaseDate\": \"2023-01-15\",
        \"operationalStatus\": \"FREE\",
        \"status\": \"IN_USE\",
        \"isActive\": true
      }")
    
    if [ "$(echo $MACHINE_RESPONSE | jq -r '.data.id')" != "null" ]; then
        print_status 0 "Machine $i created"
    else
        print_status 1 "Machine $i failed"
    fi
done

# =========================================
# STEP 8: CREATE QUALITY CONTROL DATA
# =========================================
print_section "STEP 8: Creating Quality Control Data"

# Quality Checkpoints
for i in {1..2}; do
    QC_RESPONSE=$(curl -s -X POST "$BASE_URL/quality/checkpoints" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer $COMPANY_TOKEN" \
      -d "{
        \"checkpointName\": \"Test Checkpoint $i\",
        \"checkpointType\": \"INCOMING\",
        \"description\": \"Test checkpoint\",
        \"isActive\": true
      }")
    
    if [ "$(echo $QC_RESPONSE | jq -r '.data.id')" != "null" ]; then
        print_status 0 "Quality Checkpoint $i created"
    else
        print_status 1 "Quality Checkpoint $i failed"
    fi
done

# Quality Defects
for i in {1..2}; do
    DEFECT_RESPONSE=$(curl -s -X POST "$BASE_URL/quality/defects" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer $COMPANY_TOKEN" \
      -d "{
        \"defectName\": \"Test Defect $i\",
        \"severity\": \"MEDIUM\",
        \"description\": \"Test defect\",
        \"isActive\": true
      }")
    
    if [ "$(echo $DEFECT_RESPONSE | jq -r '.data.id')" != "null" ]; then
        print_status 0 "Quality Defect $i created"
    else
        print_status 1 "Quality Defect $i failed"
    fi
done

# =========================================
# STEP 9: CREATE TEXTILE OPERATIONS
# =========================================
print_section "STEP 9: Creating Textile Operations"

# Fabric Production
for i in {1..2}; do
    FABRIC_RESPONSE=$(curl -s -X POST "$BASE_URL/textile/fabrics" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer $COMPANY_TOKEN" \
      -d "{
        \"fabricType\": \"COTTON\",
        \"fabricName\": \"Test Fabric $i\",
        \"composition\": \"100% Cotton\",
        \"weightGsm\": $((150 + $i * 10)),
        \"widthInches\": 60,
        \"color\": \"White\",
        \"quantityMeters\": $((1000 + $i * 100)),
        \"productionDate\": \"2024-12-0$i\",
        \"batchNumber\": \"FAB-TEST-$i\",
        \"qualityGrade\": \"A_GRADE\",
        \"isActive\": true
      }")
    
    if [ "$(echo $FABRIC_RESPONSE | jq -r '.data.fabricId')" != "null" ]; then
        print_status 0 "Fabric Production $i created"
    else
        print_status 1 "Fabric Production $i failed"
    fi
done

# Yarn Manufacturing
for i in {1..2}; do
    YARN_RESPONSE=$(curl -s -X POST "$BASE_URL/textile/yarns" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer $COMPANY_TOKEN" \
      -d "{
        \"yarnName\": \"Test Yarn $i\",
        \"yarnType\": \"COTTON\",
        \"yarnCount\": \"30s\",
        \"fiberContent\": \"100% Cotton\",
        \"twistPerInch\": $((15 + $i)),
        \"ply\": 1,
        \"color\": \"Natural\",
        \"quantityKg\": $((500 + $i * 50)),
        \"productionDate\": \"2024-12-0$i\",
        \"batchNumber\": \"YARN-TEST-$i\",
        \"processType\": \"SPINNING\",
        \"qualityGrade\": \"A_GRADE\",
        \"isActive\": true
      }")
    
    if [ "$(echo $YARN_RESPONSE | jq -r '.data.yarnId')" != "null" ]; then
        print_status 0 "Yarn Manufacturing $i created"
    else
        print_status 1 "Yarn Manufacturing $i failed"
    fi
done

# Dyeing & Finishing
for i in {1..2}; do
    DYEING_RESPONSE=$(curl -s -X POST "$BASE_URL/textile/dyeing" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer $COMPANY_TOKEN" \
      -d "{
        \"processType\": \"DYEING\",
        \"colorCode\": \"#FF0000\",
        \"colorName\": \"Red\",
        \"dyeMethod\": \"REACTIVE\",
        \"recipeCode\": \"RCP-00$i\",
        \"quantityMeters\": $((800 + $i * 100)),
        \"processDate\": \"2024-12-0$i\",
        \"batchNumber\": \"DYE-TEST-$i\",
        \"machineNumber\": \"M-00$i\",
        \"temperatureC\": $((80 + $i)),
        \"durationMinutes\": $((120 + $i * 10)),
        \"qualityCheck\": true,
        \"isActive\": true
      }")
    
    if [ "$(echo $DYEING_RESPONSE | jq -r '.data.processId')" != "null" ]; then
        print_status 0 "Dyeing & Finishing $i created"
    else
        print_status 1 "Dyeing & Finishing $i failed"
    fi
done

# Garment Manufacturing
for i in {1..2}; do
    GARMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/textile/garments" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer $COMPANY_TOKEN" \
      -d "{
        \"garmentType\": \"T_SHIRT\",
        \"styleNumber\": \"STY-00$i\",
        \"size\": \"M\",
        \"color\": \"Blue\",
        \"quantity\": $((100 + $i * 20)),
        \"productionStage\": \"CUTTING\",
        \"cutDate\": \"2024-12-0$i\",
        \"operatorName\": \"Test Operator $i\",
        \"lineNumber\": \"LINE-0$i\",
        \"qualityPassed\": true,
        \"defectCount\": 0,
        \"isActive\": true
      }")
    
    if [ "$(echo $GARMENT_RESPONSE | jq -r '.data.garmentId')" != "null" ]; then
        print_status 0 "Garment Manufacturing $i created"
    else
        print_status 1 "Garment Manufacturing $i failed"
    fi
done

# =========================================
# FINAL SUMMARY
# =========================================
print_section "TEST SUMMARY"

echo -e "${BLUE}Total Tests:${NC} $TOTAL"
echo -e "${GREEN}Successful:${NC} $SUCCESS"
echo -e "${RED}Failed:${NC} $FAILED"

if [ $FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ SOME TESTS FAILED${NC}"
    exit 1
fi
