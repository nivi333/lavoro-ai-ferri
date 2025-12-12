#!/bin/bash

# =========================================
# LAVORO AI FERRI - PRODUCTION DATA SEEDING SCRIPT
# =========================================
# Minimal seed script for production with:
# - 2 companies with different industries
# - 2 locations per company
# - 5 products per company
# - 5 customers per company
# - 5 suppliers per company
# - 3 users for invitations
# - 5 sales orders, purchase orders, invoices, bills per company
# - Quality control and textile operations data
# - All reports generation
# =========================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - PRODUCTION URL
BASE_URL="https://lavoro-ai-ferri.onrender.com/api/v1"
CONTENT_TYPE="Content-Type: application/json"

# Counters
TOTAL_OPERATIONS=0
SUCCESSFUL_OPERATIONS=0
FAILED_OPERATIONS=0

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ $status -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $message"
        ((SUCCESSFUL_OPERATIONS++))
    else
        echo -e "${RED}✗${NC} $message"
        ((FAILED_OPERATIONS++))
    fi
    ((TOTAL_OPERATIONS++))
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_section() {
    echo ""
    echo -e "${YELLOW}=========================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}=========================================${NC}"
}

# =========================================
# STEP 1: CREATE MAIN USER
# =========================================
print_section "STEP 1: Creating Main User"

TIMESTAMP=$(date +%s)
MAIN_USER_TOKEN=""
MAIN_USER_ID=""
MAIN_USER_EMAIL="prod_admin_${TIMESTAMP}@lavoro.com"

print_info "Creating user $MAIN_USER_EMAIL..."

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"email\": \"$MAIN_USER_EMAIL\",
    \"phone\": \"+91${TIMESTAMP}\",
    \"password\": \"ProdAdmin@123\",
    \"firstName\": \"Production\",
    \"lastName\": \"Admin\",
    \"hasConsentedToTerms\": true,
    \"hasConsentedToPrivacy\": true,
    \"hasConsentedToCookies\": true
  }")

MAIN_USER_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.tokens.accessToken')
MAIN_USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')

if [ "$MAIN_USER_TOKEN" != "null" ] && [ -n "$MAIN_USER_TOKEN" ]; then
    print_status 0 "User $MAIN_USER_EMAIL created"
else
    print_status 1 "Failed to create user $MAIN_USER_EMAIL"
    echo "Response: $REGISTER_RESPONSE"
    echo "Exiting: Cannot proceed without main user"
    exit 1
fi

# =========================================
# STEP 2: CREATE 2 COMPANIES
# =========================================
print_section "STEP 2: Creating 2 Companies"

declare -a COMPANY_IDS
declare -a COMPANY_TOKENS
declare -a COMPANY_INDUSTRIES

INDUSTRIES=("TEXTILE_MANUFACTURING" "GARMENT_PRODUCTION")
COMPANY_NAMES=("Premium Textiles Ltd" "Fashion Garments Co")

for i in {1..2}; do
    print_info "Creating company: ${COMPANY_NAMES[$i-1]}..."
    
    COMPANY_RESPONSE=$(curl -s -X POST "$BASE_URL/companies" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer $MAIN_USER_TOKEN" \
      -d "{
        \"name\": \"${COMPANY_NAMES[$i-1]}\",
        \"slug\": \"prod-company-$i-$(date +%s)\",
        \"industry\": \"${INDUSTRIES[$i-1]}\",
        \"country\": \"India\",
        \"establishedDate\": \"2020-01-0$i\",
        \"businessType\": \"PRIVATE_LIMITED\",
        \"defaultLocation\": \"Head Office\",
        \"addressLine1\": \"$i Main Street\",
        \"city\": \"Mumbai\",
        \"state\": \"Maharashtra\",
        \"contactInfo\": \"{\\\"email\\\": \\\"contact$i@company.com\\\", \\\"phone\\\": \\\"+919876543210\\\"}\"
      }")
    
    COMPANY_ID=$(echo $COMPANY_RESPONSE | jq -r '.data.id')
    COMPANY_INDUSTRIES[$i]=${INDUSTRIES[$i-1]}
    
    if [ "$COMPANY_ID" != "null" ] && [ -n "$COMPANY_ID" ]; then
        COMPANY_IDS[$i]=$COMPANY_ID
        
        # Switch to company context
        SWITCH_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/switch" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer $MAIN_USER_TOKEN")
        
        COMPANY_TOKEN=$(echo $SWITCH_RESPONSE | jq -r '.data.tokens.accessToken')
        COMPANY_TOKENS[$i]=$COMPANY_TOKEN
        
        if [ "$COMPANY_TOKEN" != "null" ] && [ -n "$COMPANY_TOKEN" ]; then
            print_status 0 "Company ${COMPANY_NAMES[$i-1]} created (${INDUSTRIES[$i-1]})"
        else
            print_status 1 "Company ${COMPANY_NAMES[$i-1]} created but failed to get token"
        fi
    else
        print_status 1 "Failed to create company ${COMPANY_NAMES[$i-1]}"
    fi
done

# =========================================
# STEP 3: CREATE 2 LOCATIONS PER COMPANY
# =========================================
print_section "STEP 3: Creating Locations"

sleep 3

for company_idx in {1..2}; do
    print_info "Creating 2 locations for Company $company_idx..."
    
    if [ -z "${COMPANY_TOKENS[$company_idx]}" ] || [ "${COMPANY_TOKENS[$company_idx]}" == "null" ]; then
        print_status 1 "No valid token for Company $company_idx, skipping locations"
        continue
    fi
    
    LOCATION_TYPES=("BRANCH" "WAREHOUSE")
    LOCATION_NAMES=("Branch Office" "Main Warehouse")
    
    for loc_idx in {1..2}; do
        LOCATION_RESPONSE=$(curl -s -X POST "$BASE_URL/locations" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"name\": \"${LOCATION_NAMES[$loc_idx-1]}\",
            \"locationType\": \"${LOCATION_TYPES[$loc_idx-1]}\",
            \"country\": \"India\",
            \"addressLine1\": \"Location $loc_idx Street\",
            \"city\": \"Pune\",
            \"state\": \"Maharashtra\",
            \"pincode\": \"41100$loc_idx\",
            \"isActive\": true
          }")
        
        LOCATION_ID=$(echo $LOCATION_RESPONSE | jq -r '.data.id')
        
        if [ "$LOCATION_ID" != "null" ] && [ -n "$LOCATION_ID" ]; then
            print_status 0 "Location ${LOCATION_NAMES[$loc_idx-1]} created for Company $company_idx"
        else
            print_status 1 "Failed to create location for Company $company_idx"
        fi
    done
done

# =========================================
# STEP 4: CREATE 5 PRODUCTS PER COMPANY
# =========================================
print_section "STEP 4: Creating Products (5 per company)"

for company_idx in {1..2}; do
    industry=${COMPANY_INDUSTRIES[$company_idx]}
    print_info "Creating 5 products for Company $company_idx ($industry)..."
    
    case $industry in
        "TEXTILE_MANUFACTURING")
            PRODUCT_NAMES=("Cotton Fabric Roll" "Silk Fabric Premium" "Wool Blend Fabric" "Polyester Sheet" "Linen Fabric")
            ;;
        "GARMENT_PRODUCTION")
            PRODUCT_NAMES=("Cotton T-Shirt" "Formal Shirt" "Denim Pants" "Summer Dress" "Winter Jacket")
            ;;
    esac
    
    for i in {1..5}; do
        PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"name\": \"${PRODUCT_NAMES[$i-1]}\",
            \"description\": \"High quality ${PRODUCT_NAMES[$i-1]} for ${industry}\",
            \"unitOfMeasure\": \"PCS\",
            \"productType\": \"FINISHED_GOODS\",
            \"costPrice\": $((100 + $i * 50)),
            \"sellingPrice\": $((150 + $i * 75)),
            \"stockQuantity\": $((50 + $i * 10)),
            \"reorderLevel\": 20,
            \"isActive\": true
          }")
        
        PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r '.data.id')
        
        if [ "$PRODUCT_ID" != "null" ] && [ -n "$PRODUCT_ID" ]; then
            print_status 0 "Product '${PRODUCT_NAMES[$i-1]}' created"
        else
            print_status 1 "Failed to create product ${PRODUCT_NAMES[$i-1]}"
        fi
    done
done

# =========================================
# STEP 5: CREATE 5 CUSTOMERS PER COMPANY
# =========================================
print_section "STEP 5: Creating Customers (5 per company)"

for company_idx in {1..2}; do
    print_info "Creating 5 customers for Company $company_idx..."
    
    CUSTOMER_TYPES=("INDIVIDUAL" "BUSINESS" "DISTRIBUTOR" "RETAILER" "WHOLESALER")
    CUSTOMER_NAMES=("Raj Textiles" "Fashion Hub" "Garment World" "Style Mart" "Fabric House")
    
    for i in {1..5}; do
        CUSTOMER_TYPE=${CUSTOMER_TYPES[$i-1]}
        
        COMPANY_NAME_FIELD=""
        if [ "$CUSTOMER_TYPE" == "BUSINESS" ]; then
            COMPANY_NAME_FIELD=", \"companyName\": \"${CUSTOMER_NAMES[$i-1]} Ltd\""
        fi
        
        CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/${COMPANY_IDS[$company_idx]}/customers" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"name\": \"${CUSTOMER_NAMES[$i-1]}\",
            \"customerType\": \"$CUSTOMER_TYPE\"$COMPANY_NAME_FIELD,
            \"email\": \"customer$i.c$company_idx@test.com\",
            \"phone\": \"+9198765${company_idx}${i}000\",
            \"billingCountry\": \"India\",
            \"billingCity\": \"Mumbai\",
            \"billingState\": \"Maharashtra\",
            \"billingAddressLine1\": \"Customer Street $i\",
            \"paymentTerms\": \"NET_30\",
            \"currency\": \"INR\"
          }")
        
        CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.data.id')
        if [ "$CUSTOMER_ID" != "null" ] && [ -n "$CUSTOMER_ID" ]; then
            print_status 0 "Customer '${CUSTOMER_NAMES[$i-1]}' created for Company $company_idx"
        else
            print_status 1 "Failed to create customer for Company $company_idx"
        fi
    done
done

# =========================================
# STEP 6: CREATE 5 SUPPLIERS PER COMPANY
# =========================================
print_section "STEP 6: Creating Suppliers (5 per company)"

for company_idx in {1..2}; do
    print_info "Creating 5 suppliers for Company $company_idx..."
    
    SUPPLIER_TYPES=("MANUFACTURER" "DISTRIBUTOR" "WHOLESALER" "IMPORTER" "LOCAL_VENDOR")
    SUPPLIER_NAMES=("Raw Materials Co" "Fabric Suppliers Inc" "Thread Masters" "Dye House" "Accessories Plus")
    
    for i in {1..5}; do
        SUPPLIER_TYPE=${SUPPLIER_TYPES[$i-1]}
        
        SUPPLIER_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/${COMPANY_IDS[$company_idx]}/suppliers" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"name\": \"${SUPPLIER_NAMES[$i-1]}\",
            \"supplierType\": \"$SUPPLIER_TYPE\",
            \"email\": \"supplier$i.c$company_idx@test.com\",
            \"phone\": \"+9187654${company_idx}${i}000\",
            \"country\": \"India\",
            \"addressLine1\": \"Supplier Street $i\",
            \"city\": \"Delhi\",
            \"state\": \"Delhi\",
            \"postalCode\": \"11000$i\",
            \"paymentTerms\": \"NET_30\",
            \"currency\": \"INR\",
            \"isActive\": true
          }")
        
        SUPPLIER_ID=$(echo $SUPPLIER_RESPONSE | jq -r '.data.id')
        if [ "$SUPPLIER_ID" != "null" ] && [ -n "$SUPPLIER_ID" ]; then
            print_status 0 "Supplier '${SUPPLIER_NAMES[$i-1]}' created for Company $company_idx"
        else
            print_status 1 "Failed to create supplier for Company $company_idx"
        fi
    done
done

# =========================================
# STEP 7: CREATE 3 USERS FOR INVITATIONS
# =========================================
print_section "STEP 7: Creating 3 Users for Invitations"

declare -a INVITE_USER_TOKENS
declare -a INVITE_USER_EMAILS

for i in {1..3}; do
    print_info "Creating invite user $i..."
    
    EMPLOYEE_EMAIL="employee${i}_${TIMESTAMP}@lavoro.com"
    
    REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
      -H "$CONTENT_TYPE" \
      -d "{
        \"email\": \"$EMPLOYEE_EMAIL\",
        \"phone\": \"+91${TIMESTAMP}$i\",
        \"password\": \"Employee@123\",
        \"firstName\": \"Employee\",
        \"lastName\": \"User$i\",
        \"hasConsentedToTerms\": true,
        \"hasConsentedToPrivacy\": true,
        \"hasConsentedToCookies\": true
      }")
    
    TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.tokens.accessToken')
    
    if [ "$TOKEN" != "null" ]; then
        INVITE_USER_TOKENS[$i]=$TOKEN
        INVITE_USER_EMAILS[$i]=$EMPLOYEE_EMAIL
        print_status 0 "Employee user $i created ($EMPLOYEE_EMAIL)"
    else
        print_status 1 "Failed to create employee user $i"
    fi
done

# =========================================
# STEP 8: SEND AND ACCEPT INVITATIONS
# =========================================
print_section "STEP 8: Sending and Accepting User Invitations"

ROLES=("ADMIN" "MANAGER" "EMPLOYEE")

for i in {1..3}; do
    ROLE=${ROLES[$i-1]}
    
    INVITE_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/${COMPANY_IDS[1]}/invite" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[1]}" \
      -d "{
        \"emailOrPhone\": \"${INVITE_USER_EMAILS[$i]}\",
        \"role\": \"$ROLE\"
      }")
    
    INVITATION_ID=$(echo $INVITE_RESPONSE | jq -r '.data.id')
    
    if [ "$INVITATION_ID" != "null" ] && [ -n "$INVITATION_ID" ]; then
        print_status 0 "Invitation sent to ${INVITE_USER_EMAILS[$i]} as $ROLE"
        
        sleep 0.5
        ACCEPT_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/accept-invitation/$INVITATION_ID" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${INVITE_USER_TOKENS[$i]}")
        
        if [ "$(echo $ACCEPT_RESPONSE | jq -r '.success')" == "true" ]; then
            print_status 0 "Invitation accepted by ${INVITE_USER_EMAILS[$i]}"
        else
            print_status 1 "Failed to accept invitation for ${INVITE_USER_EMAILS[$i]}"
        fi
    else
        print_status 1 "Failed to send invitation to ${INVITE_USER_EMAILS[$i]}"
    fi
done

# =========================================
# STEP 9: CREATE QUALITY CONTROL DATA
# =========================================
print_section "STEP 9: Creating Quality Control Data"

for company_idx in {1..2}; do
    print_info "Creating Quality Control data for Company $company_idx..."
    
    # Create 3 Quality Checkpoints
    for i in {1..3}; do
        QC_RESPONSE=$(curl -s -X POST "$BASE_URL/quality/checkpoints" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"checkpointName\": \"Quality Check $i\",
            \"checkpointType\": \"INCOMING\",
            \"description\": \"Standard quality checkpoint $i\",
            \"isActive\": true
          }")
        
        if [ "$(echo $QC_RESPONSE | jq -r '.data.id')" != "null" ]; then
            print_status 0 "Quality Checkpoint $i created"
        fi
    done
    
    # Create 3 Quality Defects
    for i in {1..3}; do
        DEFECT_RESPONSE=$(curl -s -X POST "$BASE_URL/quality/defects" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"defectName\": \"Defect Type $i\",
            \"severity\": \"MEDIUM\",
            \"description\": \"Common defect type $i\",
            \"isActive\": true
          }")
        
        if [ "$(echo $DEFECT_RESPONSE | jq -r '.data.id')" != "null" ]; then
            print_status 0 "Quality Defect $i created"
        fi
    done
    
    # Create 3 Compliance Reports
    for i in {1..3}; do
        COMPLIANCE_RESPONSE=$(curl -s -X POST "$BASE_URL/quality/compliance" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"reportName\": \"Compliance Report $i\",
            \"certificationType\": \"ISO_9001\",
            \"reportDate\": \"2024-12-0$i\",
            \"status\": \"COMPLIANT\",
            \"notes\": \"Compliance report $i for quality standards\"
          }")
        
        if [ "$(echo $COMPLIANCE_RESPONSE | jq -r '.data.id')" != "null" ]; then
            print_status 0 "Compliance Report $i created"
        fi
    done
done

# =========================================
# STEP 10: CREATE TEXTILE OPERATIONS DATA
# =========================================
print_section "STEP 10: Creating Textile Operations Data"

for company_idx in {1..2}; do
    industry=${COMPANY_INDUSTRIES[$company_idx]}
    print_info "Creating Textile Operations for Company $company_idx ($industry)..."
    
    # Create 3 Fabric Production records
    for i in {1..3}; do
        FABRIC_RESPONSE=$(curl -s -X POST "$BASE_URL/textile/fabrics" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"fabricType\": \"COTTON\",
            \"fabricName\": \"Cotton Fabric $i\",
            \"composition\": \"100% Cotton\",
            \"weightGsm\": $((150 + $i * 10)),
            \"widthInches\": 60,
            \"color\": \"White\",
            \"quantityMeters\": $((500 + $i * 100)),
            \"productionDate\": \"2024-12-0$i\",
            \"batchNumber\": \"FAB-BATCH-$i\",
            \"qualityGrade\": \"A_GRADE\",
            \"isActive\": true
          }")
        
        if [ "$(echo $FABRIC_RESPONSE | jq -r '.data.fabricId')" != "null" ]; then
            print_status 0 "Fabric Production $i created"
        fi
    done
    
    # Create 3 Yarn Manufacturing records
    for i in {1..3}; do
        YARN_RESPONSE=$(curl -s -X POST "$BASE_URL/textile/yarns" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"yarnName\": \"Cotton Yarn $i\",
            \"yarnType\": \"COTTON\",
            \"yarnCount\": \"30s\",
            \"fiberContent\": \"100% Cotton\",
            \"twistPerInch\": $((15 + $i)),
            \"ply\": 1,
            \"color\": \"Natural\",
            \"quantityKg\": $((200 + $i * 50)),
            \"productionDate\": \"2024-12-0$i\",
            \"batchNumber\": \"YARN-BATCH-$i\",
            \"processType\": \"SPINNING\",
            \"qualityGrade\": \"A_GRADE\",
            \"isActive\": true
          }")
        
        if [ "$(echo $YARN_RESPONSE | jq -r '.data.yarnId // .data.id')" != "null" ]; then
            print_status 0 "Yarn Manufacturing $i created"
        fi
    done
    
    # Create 3 Dyeing & Finishing records
    for i in {1..3}; do
        DYEING_RESPONSE=$(curl -s -X POST "$BASE_URL/textile/dyeing" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"processType\": \"DYEING\",
            \"colorCode\": \"#FF0000\",
            \"colorName\": \"Red\",
            \"dyeMethod\": \"REACTIVE\",
            \"recipeCode\": \"RCP-00$i\",
            \"quantityMeters\": $((400 + $i * 100)),
            \"processDate\": \"2024-12-0$i\",
            \"batchNumber\": \"DYE-BATCH-$i\",
            \"machineNumber\": \"M-00$i\",
            \"temperatureC\": $((80 + $i)),
            \"durationMinutes\": $((120 + $i * 10)),
            \"qualityCheck\": true,
            \"isActive\": true
          }")
        
        if [ "$(echo $DYEING_RESPONSE | jq -r '.data.processId // .data.id')" != "null" ]; then
            print_status 0 "Dyeing & Finishing $i created"
        fi
    done
done

# =========================================
# STEP 11: CREATE MACHINES
# =========================================
print_section "STEP 11: Creating Machines (5 per company)"

for company_idx in {1..2}; do
    industry=${COMPANY_INDUSTRIES[$company_idx]}
    print_info "Creating 5 machines for Company $company_idx ($industry)..."
    
    case $industry in
        "TEXTILE_MANUFACTURING")
            MACHINE_TYPES=("Spinning Machine" "Weaving Loom" "Knitting Machine" "Warping Machine" "Sizing Machine")
            ;;
        "GARMENT_PRODUCTION")
            MACHINE_TYPES=("Sewing Machine" "Overlock Machine" "Button Attaching Machine" "Cutting Machine" "Pressing Machine")
            ;;
    esac
    
    for i in {1..5}; do
        MACHINE_TYPE=${MACHINE_TYPES[$i-1]}
        
        MACHINE_RESPONSE=$(curl -s -X POST "$BASE_URL/machines" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"name\": \"$MACHINE_TYPE $i\",
            \"machineType\": \"$MACHINE_TYPE\",
            \"model\": \"Model-$(printf '%03d' $i)\",
            \"manufacturer\": \"Manufacturer $i\",
            \"serialNumber\": \"SN-${company_idx}$(printf '%04d' $i)\",
            \"purchaseDate\": \"2023-0$i-15\",
            \"operationalStatus\": \"FREE\",
            \"status\": \"IN_USE\",
            \"isActive\": true
          }")
        
        MACHINE_ID=$(echo $MACHINE_RESPONSE | jq -r '.data.id // .data.machineId')
        if [ "$MACHINE_ID" != "null" ] && [ -n "$MACHINE_ID" ]; then
            print_status 0 "Machine '$MACHINE_TYPE $i' created"
        else
            print_status 1 "Failed to create machine $i"
        fi
    done
done

# =========================================
# STEP 12: CREATE QUALITY INSPECTIONS
# =========================================
print_section "STEP 12: Creating Quality Inspections (3 per company)"

for company_idx in {1..2}; do
    print_info "Creating 3 quality inspections for Company $company_idx..."
    
    INSPECTION_TYPES=("INCOMING_MATERIAL" "IN_PROCESS" "FINAL_PRODUCT")
    
    for i in {1..3}; do
        INSPECTION_TYPE=${INSPECTION_TYPES[$i-1]}
        
        INSPECTION_RESPONSE=$(curl -s -X POST "$BASE_URL/inspections/inspections" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"inspectionType\": \"$INSPECTION_TYPE\",
            \"referenceType\": \"BATCH\",
            \"referenceId\": \"BATCH-$(printf '%04d' $i)\",
            \"inspectorName\": \"Inspector $i\",
            \"inspectionDate\": \"2024-12-0$i\",
            \"status\": \"PASSED\",
            \"qualityScore\": $((85 + $i * 3)),
            \"inspectorNotes\": \"Quality inspection $i completed successfully\",
            \"isActive\": true
          }")
        
        INSPECTION_ID=$(echo $INSPECTION_RESPONSE | jq -r '.data.id // .data.inspectionId')
        if [ "$INSPECTION_ID" != "null" ] && [ -n "$INSPECTION_ID" ]; then
            print_status 0 "Quality Inspection $i created"
        else
            print_status 1 "Failed to create inspection $i"
        fi
    done
done

# =========================================
# STEP 13: CREATE SALES ORDERS
# =========================================
print_section "STEP 13: Creating Sales Orders (5 per company)"

for company_idx in {1..2}; do
    print_info "Creating 5 sales orders for Company $company_idx..."
    
    for i in {1..5}; do
        ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/orders" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"customerName\": \"Customer $i\",
            \"customerCode\": \"CUST-$(printf '%03d' $i)\",
            \"priority\": \"NORMAL\",
            \"orderDate\": \"2024-12-0$i\",
            \"expectedDeliveryDate\": \"2024-12-$(($i + 10))\",
            \"currency\": \"INR\",
            \"paymentTerms\": \"NET_30\",
            \"items\": [
              {
                \"itemCode\": \"ITEM-001\",
                \"description\": \"Product Item 1\",
                \"quantity\": $((10 + $i * 5)),
                \"unitOfMeasure\": \"PCS\",
                \"unitPrice\": $((100 + $i * 10)),
                \"taxRate\": 18
              }
            ]
          }")
        
        ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.data.id // .data.orderId')
        if [ "$ORDER_ID" != "null" ] && [ -n "$ORDER_ID" ]; then
            print_status 0 "Sales Order $i created"
        else
            print_status 1 "Failed to create sales order $i"
        fi
    done
done

# =========================================
# STEP 14: CREATE PURCHASE ORDERS
# =========================================
print_section "STEP 14: Creating Purchase Orders (5 per company)"

for company_idx in {1..2}; do
    print_info "Creating 5 purchase orders for Company $company_idx..."
    
    for i in {1..5}; do
        PO_RESPONSE=$(curl -s -X POST "$BASE_URL/purchase-orders" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"supplierName\": \"Supplier $i\",
            \"supplierCode\": \"SUP-$(printf '%03d' $i)\",
            \"priority\": \"NORMAL\",
            \"poDate\": \"2024-12-0$i\",
            \"expectedDeliveryDate\": \"2024-12-$(($i + 15))\",
            \"currency\": \"INR\",
            \"paymentTerms\": \"NET_30\",
            \"items\": [
              {
                \"itemCode\": \"RAW-001\",
                \"description\": \"Raw Material 1\",
                \"quantity\": $((50 + $i * 10)),
                \"unitOfMeasure\": \"KG\",
                \"unitCost\": $((50 + $i * 5)),
                \"taxRate\": 18
              }
            ]
          }")
        
        PO_ID=$(echo $PO_RESPONSE | jq -r '.data.id // .data.poId')
        if [ "$PO_ID" != "null" ] && [ -n "$PO_ID" ]; then
            print_status 0 "Purchase Order $i created"
        else
            print_status 1 "Failed to create purchase order $i"
        fi
    done
done

# =========================================
# STEP 15: CREATE INVOICES
# =========================================
print_section "STEP 15: Creating Invoices (5 per company)"

for company_idx in {1..2}; do
    print_info "Creating 5 invoices for Company $company_idx..."
    
    # Get the default location
    LOCATION_RESPONSE=$(curl -s -X GET "$BASE_URL/locations" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    LOCATION_ID=$(echo $LOCATION_RESPONSE | jq -r '.data[0].id')
    
    # Get customers
    CUSTOMERS_RESPONSE=$(curl -s -X GET "$BASE_URL/companies/${COMPANY_IDS[$company_idx]}/customers" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    # Get products
    PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/products" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    CUSTOMER_IDS_ARR=($(echo $CUSTOMERS_RESPONSE | jq -r '.data[].id'))
    PRODUCT_IDS_ARR=($(echo $PRODUCTS_RESPONSE | jq -r '.data[].id'))
    
    if [ ${#CUSTOMER_IDS_ARR[@]} -eq 0 ] || [ ${#PRODUCT_IDS_ARR[@]} -eq 0 ]; then
        print_status 1 "No customers or products found for Company $company_idx"
        continue
    fi
    
    for i in {1..5}; do
        customer_idx=$(($i % ${#CUSTOMER_IDS_ARR[@]}))
        customer_id=${CUSTOMER_IDS_ARR[$customer_idx]}
        product_idx=$(($i % ${#PRODUCT_IDS_ARR[@]}))
        product_id=${PRODUCT_IDS_ARR[$product_idx]}
        
        days_ago=$(($i * 5))
        issue_date=$(date -v -${days_ago}d +"%Y-%m-%d" 2>/dev/null || date -d "-${days_ago} days" +"%Y-%m-%d")
        due_date=$(date -v -${days_ago}d -v +30d +"%Y-%m-%d" 2>/dev/null || date -d "-${days_ago} days +30 days" +"%Y-%m-%d")
        
        INVOICE_PAYLOAD="{\"customerId\":\"$customer_id\",\"locationId\":\"$LOCATION_ID\",\"invoiceDate\":\"$issue_date\",\"dueDate\":\"$due_date\",\"lineItems\":[{\"productId\":\"$product_id\",\"itemCode\":\"ITEM-$i\",\"description\":\"Invoice Item $i\",\"quantity\":$((5 + $i)),\"unitPrice\":$((100 + $i * 20)),\"unitOfMeasure\":\"PCS\"}],\"notes\":\"Production invoice $i\"}"
        
        INVOICE_RESPONSE=$(curl -s -X POST "$BASE_URL/invoices" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "$INVOICE_PAYLOAD")
        
        INVOICE_ID=$(echo $INVOICE_RESPONSE | jq -r '.data.id')
        
        if [ "$INVOICE_ID" != "null" ] && [ -n "$INVOICE_ID" ]; then
            print_status 0 "Invoice $i created"
        else
            print_status 1 "Failed to create invoice $i"
        fi
    done
done

# =========================================
# STEP 16: CREATE BILLS
# =========================================
print_section "STEP 16: Creating Bills (5 per company)"

for company_idx in {1..2}; do
    print_info "Creating 5 bills for Company $company_idx..."
    
    # Get the default location
    LOCATION_RESPONSE=$(curl -s -X GET "$BASE_URL/locations" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    LOCATION_ID=$(echo $LOCATION_RESPONSE | jq -r '.data[0].id')
    
    # Get suppliers
    SUPPLIERS_RESPONSE=$(curl -s -X GET "$BASE_URL/companies/${COMPANY_IDS[$company_idx]}/suppliers" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    # Get products
    PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/products" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    SUPPLIER_IDS_ARR=($(echo $SUPPLIERS_RESPONSE | jq -r '.data[].id'))
    PRODUCT_IDS_ARR=($(echo $PRODUCTS_RESPONSE | jq -r '.data[].id'))
    
    if [ ${#SUPPLIER_IDS_ARR[@]} -eq 0 ] || [ ${#PRODUCT_IDS_ARR[@]} -eq 0 ]; then
        print_status 1 "No suppliers or products found for Company $company_idx"
        continue
    fi
    
    for i in {1..5}; do
        supplier_idx=$(($i % ${#SUPPLIER_IDS_ARR[@]}))
        supplier_id=${SUPPLIER_IDS_ARR[$supplier_idx]}
        product_idx=$(($i % ${#PRODUCT_IDS_ARR[@]}))
        product_id=${PRODUCT_IDS_ARR[$product_idx]}
        
        days_ago=$(($i * 5))
        issue_date=$(date -v -${days_ago}d +"%Y-%m-%d" 2>/dev/null || date -d "-${days_ago} days" +"%Y-%m-%d")
        due_date=$(date -v -${days_ago}d -v +30d +"%Y-%m-%d" 2>/dev/null || date -d "-${days_ago} days +30 days" +"%Y-%m-%d")
        
        BILL_PAYLOAD="{\"supplierId\":\"$supplier_id\",\"locationId\":\"$LOCATION_ID\",\"billDate\":\"$issue_date\",\"dueDate\":\"$due_date\",\"lineItems\":[{\"productId\":\"$product_id\",\"itemCode\":\"RAW-$i\",\"description\":\"Bill Item $i\",\"quantity\":$((10 + $i * 2)),\"unitCost\":$((50 + $i * 10)),\"unitOfMeasure\":\"KG\"}],\"notes\":\"Production bill $i\"}"
        
        BILL_RESPONSE=$(curl -s -X POST "$BASE_URL/bills" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "$BILL_PAYLOAD")
        
        BILL_ID=$(echo $BILL_RESPONSE | jq -r '.data.id')
        
        if [ "$BILL_ID" != "null" ] && [ -n "$BILL_ID" ]; then
            print_status 0 "Bill $i created"
        else
            print_status 1 "Failed to create bill $i"
        fi
    done
done

# =========================================
# STEP 17: GENERATE ALL REPORTS
# =========================================
print_section "STEP 17: Generating Reports"

for company_idx in {1..2}; do
    print_info "Generating reports for Company $company_idx..."
    
    END_DATE=$(date +"%Y-%m-%d")
    START_DATE=$(date -v -30d +"%Y-%m-%d" 2>/dev/null || date -d "-30 days" +"%Y-%m-%d")
    AS_OF_DATE=$END_DATE
    PERIOD=$(date +"%Y-%m")
    
    # Financial Reports
    curl -s -X GET "$BASE_URL/reports/profit-loss?startDate=$START_DATE&endDate=$END_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Profit & Loss Report" || print_status 1 "Profit & Loss Report"
    
    curl -s -X GET "$BASE_URL/reports/balance-sheet?asOfDate=$AS_OF_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Balance Sheet" || print_status 1 "Balance Sheet"
    
    curl -s -X GET "$BASE_URL/reports/cash-flow?startDate=$START_DATE&endDate=$END_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Cash Flow Statement" || print_status 1 "Cash Flow Statement"
    
    curl -s -X GET "$BASE_URL/reports/ar-aging?asOfDate=$AS_OF_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "AR Aging Report" || print_status 1 "AR Aging Report"
    
    curl -s -X GET "$BASE_URL/reports/ap-aging?asOfDate=$AS_OF_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "AP Aging Report" || print_status 1 "AP Aging Report"
    
    curl -s -X GET "$BASE_URL/reports/trial-balance?asOfDate=$AS_OF_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Trial Balance" || print_status 1 "Trial Balance"
    
    curl -s -X GET "$BASE_URL/reports/expense-summary?startDate=$START_DATE&endDate=$END_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Expense Summary" || print_status 1 "Expense Summary"
    
    curl -s -X GET "$BASE_URL/reports/gst?period=$PERIOD" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "GST Report" || print_status 1 "GST Report"
    
    # Inventory Reports
    curl -s -X GET "$BASE_URL/reports/inventory-summary" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Inventory Summary" || print_status 1 "Inventory Summary"
    
    curl -s -X GET "$BASE_URL/reports/low-stock" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Low Stock Report" || print_status 1 "Low Stock Report"
    
    curl -s -X GET "$BASE_URL/reports/stock-aging?asOfDate=$AS_OF_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Stock Aging Report" || print_status 1 "Stock Aging Report"
    
    curl -s -X GET "$BASE_URL/reports/inventory-movement?startDate=$START_DATE&endDate=$END_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Inventory Movement" || print_status 1 "Inventory Movement"
    
    # Sales Reports
    curl -s -X GET "$BASE_URL/reports/sales-summary?startDate=$START_DATE&endDate=$END_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Sales Summary" || print_status 1 "Sales Summary"
    
    curl -s -X GET "$BASE_URL/reports/sales-trends?startDate=$START_DATE&endDate=$END_DATE&groupBy=month" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Sales Trends" || print_status 1 "Sales Trends"
    
    curl -s -X GET "$BASE_URL/reports/product-performance?startDate=$START_DATE&endDate=$END_DATE&limit=10" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Product Performance" || print_status 1 "Product Performance"
    
    curl -s -X GET "$BASE_URL/reports/customer-insights?startDate=$START_DATE&endDate=$END_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Customer Insights" || print_status 1 "Customer Insights"
    
    curl -s -X GET "$BASE_URL/reports/sales-by-region?startDate=$START_DATE&endDate=$END_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Sales by Region" || print_status 1 "Sales by Region"
    
    curl -s -X GET "$BASE_URL/reports/business-performance?startDate=$START_DATE&endDate=$END_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Business Performance" || print_status 1 "Business Performance"
    
    curl -s -X GET "$BASE_URL/reports/textile-analytics?startDate=$START_DATE&endDate=$END_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Textile Analytics" || print_status 1 "Textile Analytics"
    
    # Production Reports
    curl -s -X GET "$BASE_URL/analytics/production-summary" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Production Summary" || print_status 1 "Production Summary"
    
    curl -s -X GET "$BASE_URL/reports/production-efficiency?startDate=$START_DATE&endDate=$END_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Production Efficiency" || print_status 1 "Production Efficiency"
    
    curl -s -X GET "$BASE_URL/reports/machine-utilization?startDate=$START_DATE&endDate=$END_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Machine Utilization" || print_status 1 "Machine Utilization"
    
    curl -s -X GET "$BASE_URL/reports/quality-metrics?startDate=$START_DATE&endDate=$END_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Quality Metrics" || print_status 1 "Quality Metrics"
    
    curl -s -X GET "$BASE_URL/reports/production-planning?startDate=$START_DATE&endDate=$END_DATE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" > /dev/null && print_status 0 "Production Planning" || print_status 1 "Production Planning"
done

# =========================================
# STEP 18: TEST ANALYTICS APIs
# =========================================
print_section "STEP 18: Testing Analytics APIs"

for company_idx in {1..2}; do
    print_info "Testing analytics APIs for Company $company_idx..."
    
    DASHBOARD_ANALYTICS=$(curl -s -X GET "$BASE_URL/analytics/dashboard" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    TOTAL_PRODUCTS=$(echo $DASHBOARD_ANALYTICS | jq -r '.data.totalProducts // 0')
    ACTIVE_ORDERS=$(echo $DASHBOARD_ANALYTICS | jq -r '.data.activeOrders // 0')
    TEAM_MEMBERS=$(echo $DASHBOARD_ANALYTICS | jq -r '.data.teamMembers // 0')
    
    if [ "$TOTAL_PRODUCTS" != "null" ] && [ "$TOTAL_PRODUCTS" != "0" ]; then
        print_status 0 "Dashboard Analytics: Products=$TOTAL_PRODUCTS, Orders=$ACTIVE_ORDERS, Team=$TEAM_MEMBERS"
    else
        print_status 1 "Failed to fetch dashboard analytics"
    fi
    
    REVENUE_TRENDS=$(curl -s -X GET "$BASE_URL/analytics/revenue-trends?months=6" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    TRENDS_COUNT=$(echo $REVENUE_TRENDS | jq -r '.data | length')
    if [ "$TRENDS_COUNT" != "null" ]; then
        print_status 0 "Revenue Trends: $TRENDS_COUNT months of data"
    else
        print_status 1 "Failed to fetch revenue trends"
    fi
    
    TOP_PRODUCTS=$(curl -s -X GET "$BASE_URL/analytics/top-products?limit=5" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    PRODUCTS_COUNT=$(echo $TOP_PRODUCTS | jq -r '.data | length')
    if [ "$PRODUCTS_COUNT" != "null" ]; then
        print_status 0 "Top Products: $PRODUCTS_COUNT products retrieved"
    else
        print_status 1 "Failed to fetch top products"
    fi
    
    QUALITY_METRICS=$(curl -s -X GET "$BASE_URL/analytics/quality-metrics" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $QUALITY_METRICS | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Quality Metrics retrieved successfully"
    else
        print_status 1 "Failed to fetch quality metrics"
    fi
    
    echo ""
done

# =========================================
# FINAL SUMMARY
# =========================================
print_section "PRODUCTION DATA SEEDING COMPLETED"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}SUMMARY${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "Total Operations: ${BLUE}$TOTAL_OPERATIONS${NC}"
echo -e "Successful: ${GREEN}$SUCCESSFUL_OPERATIONS${NC}"
echo -e "Failed: ${RED}$FAILED_OPERATIONS${NC}"
echo ""

echo -e "${YELLOW}Created Production Data:${NC}"
echo -e "  • 1 Main Admin User"
echo -e "  • 2 Companies (Textile Manufacturing & Garment Production)"
echo -e "  • 4 Locations (2 per company)"
echo -e "  • 10 Products (5 per company)"
echo -e "  • 10 Customers (5 per company)"
echo -e "  • 10 Suppliers (5 per company)"
echo -e "  • 3 Employee Users (with invitations)"
echo -e "  • 10 Sales Orders (5 per company)"
echo -e "  • 10 Purchase Orders (5 per company)"
echo -e "  • 10 Invoices (5 per company)"
echo -e "  • 10 Bills (5 per company)"
echo -e "  • 10 Machines (5 per company)"
echo -e "  • 6 Quality Inspections (3 per company)"
echo -e "  • Quality Control Data (Checkpoints, Defects, Compliance)"
echo -e "  • Textile Operations (Fabric, Yarn, Dyeing)"
echo -e "  • All Reports Generated"
echo -e "  • Analytics APIs Tested"
echo ""

echo -e "${YELLOW}Login Credentials:${NC}"
echo -e "  ${GREEN}Main Admin:${NC} ${BLUE}$MAIN_USER_EMAIL${NC}"
echo -e "  ${GREEN}Password:${NC} ${BLUE}ProdAdmin@123${NC}"
echo ""

echo -e "${YELLOW}Employee Users:${NC}"
for i in {1..3}; do
    if [ -n "${INVITE_USER_EMAILS[$i]}" ]; then
        echo -e "  ${BLUE}${INVITE_USER_EMAILS[$i]}${NC} - Role: ${ROLES[$i-1]}"
    fi
done
echo -e "  Password: ${BLUE}Employee@123${NC} (for all)"
echo ""

echo -e "${YELLOW}Companies:${NC}"
echo -e "  1. ${BLUE}Premium Textiles Ltd${NC} (TEXTILE_MANUFACTURING)"
echo -e "  2. ${BLUE}Fashion Garments Co${NC} (GARMENT_PRODUCTION)"
echo ""

if [ $FAILED_OPERATIONS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL PRODUCTION DATA SEEDED SUCCESSFULLY!${NC}"
else
    echo -e "${YELLOW}⚠ Some operations failed. Check the output above for details.${NC}"
fi

echo ""
echo -e "${YELLOW}⚠ SAVE THESE CREDENTIALS FOR LOGIN!${NC}"
echo -e "  Admin Email: ${BLUE}$MAIN_USER_EMAIL${NC}"
echo -e "  Admin Password: ${BLUE}ProdAdmin@123${NC}"
echo ""
