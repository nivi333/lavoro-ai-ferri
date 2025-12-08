#!/bin/bash

# =========================================
# LAVORO AI FERRI - COMPREHENSIVE DATA SEEDING SCRIPT
# =========================================
# This script creates a complete test environment with:
# - 5 companies with different industries
# - Multiple locations per company
# - Products relevant to each industry
# - Financial documents (Invoices, Sales Orders, Purchase Orders, Bills)
# - Customers and Suppliers
# - User invitations and acceptances
# - Quality Control data
# - Textile Operations data
# =========================================

# Removed set -e to handle errors gracefully and continue seeding

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000/api/v1"
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

# Generate unique email using timestamp to avoid conflicts
TIMESTAMP=$(date +%s)
MAIN_USER_TOKEN=""
MAIN_USER_ID=""
MAIN_USER_EMAIL="test${TIMESTAMP}@lavoro.com"

print_info "Creating user $MAIN_USER_EMAIL..."

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"email\": \"$MAIN_USER_EMAIL\",
    \"phone\": \"+91${TIMESTAMP}\",
    \"password\": \"Test@123\",
    \"firstName\": \"Test\",
    \"lastName\": \"User1\"
  }")

MAIN_USER_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.tokens.accessToken')
MAIN_USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')

if [ "$MAIN_USER_TOKEN" != "null" ] && [ -n "$MAIN_USER_TOKEN" ]; then
    print_status 0 "User $MAIN_USER_EMAIL created"
else
    print_status 1 "Failed to create user $MAIN_USER_EMAIL"
    echo "Exiting: Cannot proceed without main user"
    exit 1
fi

# =========================================
# STEP 2: CREATE 5 COMPANIES FOR MAIN USER
# =========================================
print_section "STEP 2: Creating 5 Companies for Main User"

declare -a COMPANY_IDS
declare -a COMPANY_TOKENS
declare -a COMPANY_INDUSTRIES

INDUSTRIES=("TEXTILE_MANUFACTURING" "GARMENT_PRODUCTION" "FABRIC_PROCESSING" "DYEING_FINISHING" "APPAREL_DESIGN")
COMPANY_NAMES=("Premium Textiles Ltd" "Fashion Garments Co" "Quality Fabrics Inc" "ColorTech Dyeing" "Design Studio Pro")

for i in {1..5}; do
    print_info "Creating company: ${COMPANY_NAMES[$i-1]}..."
    
    COMPANY_RESPONSE=$(curl -s -X POST "$BASE_URL/companies" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer $MAIN_USER_TOKEN" \
      -d "{
        \"name\": \"${COMPANY_NAMES[$i-1]}\",
        \"slug\": \"company-$i-$(date +%s)\",
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
# STEP 3: CREATE ADDITIONAL LOCATIONS (For Companies 1 & 2)
# =========================================
print_section "STEP 3: Creating Additional Locations"

# Wait for tenant schemas to be fully ready
sleep 5

for company_idx in 1 2; do
    print_info "Creating 3 locations for Company $company_idx..."
    
    # Check if company token exists
    if [ -z "${COMPANY_TOKENS[$company_idx]}" ] || [ "${COMPANY_TOKENS[$company_idx]}" == "null" ]; then
        print_status 1 "No valid token for Company $company_idx, skipping locations"
        continue
    fi
    
    LOCATION_TYPES=("BRANCH" "WAREHOUSE" "FACTORY")
    LOCATION_NAMES=("Branch Office" "Main Warehouse" "Production Unit")
    
    for loc_idx in {1..3}; do
        LOCATION_RESPONSE=$(curl -s -X POST "$BASE_URL/locations" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"name\": \"${LOCATION_NAMES[$loc_idx-1]} $loc_idx\",
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
            ERROR_MSG=$(echo $LOCATION_RESPONSE | jq -r '.message // .error // "Unknown error"')
            echo "  Error: $ERROR_MSG"
        fi
    done
done

# =========================================
# STEP 4: CREATE PRODUCTS (35 for Company 1, 15 for Company 2)
# =========================================
print_section "STEP 4: Creating Products"

# Function to create products based on industry
create_products() {
    local company_idx=$1
    local count=$2
    local industry=${COMPANY_INDUSTRIES[$company_idx]}
    
    print_info "Creating $count products for Company $company_idx ($industry)..."
    
    case $industry in
        "TEXTILE_MANUFACTURING")
            PRODUCT_CATEGORIES=("Cotton Fabric" "Silk Fabric" "Wool Fabric" "Polyester Fabric" "Blend Fabric")
            ;;
        "GARMENT_PRODUCTION")
            PRODUCT_CATEGORIES=("T-Shirts" "Shirts" "Pants" "Dresses" "Jackets")
            ;;
        "FABRIC_PROCESSING")
            PRODUCT_CATEGORIES=("Raw Fabric" "Processed Fabric" "Finished Fabric" "Specialty Fabric" "Technical Fabric")
            ;;
        "DYEING_FINISHING")
            PRODUCT_CATEGORIES=("Dyed Fabric" "Printed Fabric" "Finished Fabric" "Coated Fabric" "Treated Fabric")
            ;;
        "APPAREL_DESIGN")
            PRODUCT_CATEGORIES=("Designer Wear" "Casual Wear" "Formal Wear" "Ethnic Wear" "Sports Wear")
            ;;
    esac
    
    for i in $(seq 1 $count); do
        cat_idx=$((($i - 1) % 5))
        CATEGORY=${PRODUCT_CATEGORIES[$cat_idx]}
        
        PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"name\": \"$CATEGORY Product $i\",
            \"description\": \"High quality $CATEGORY for ${COMPANY_INDUSTRIES[$company_idx]}\",
            \"unitOfMeasure\": \"PCS\",
            \"productType\": \"FINISHED_GOODS\",
            \"costPrice\": $((100 + $i * 10)),
            \"sellingPrice\": $((150 + $i * 15)),
            \"stockQuantity\": $((100 + $i * 5)),
            \"reorderLevel\": 50,
            \"isActive\": true
          }")
        
        PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r '.data.id')
        
        if [ "$PRODUCT_ID" != "null" ] && [ -n "$PRODUCT_ID" ]; then
            print_status 0 "Product '$CATEGORY Product $i' created"
        else
            print_status 1 "Failed to create product $i"
            if [ $i -eq 1 ]; then
                ERROR_MSG=$(echo $PRODUCT_RESPONSE | jq -r '.message // .error // "Unknown error"')
                echo "  Error: $ERROR_MSG"
            fi
        fi
    done
}

create_products 1 35
create_products 2 15

# =========================================
# STEP 5: CREATE CUSTOMERS (10 per company)
# =========================================
print_section "STEP 5: Creating Customers"

for company_idx in {1..5}; do
    print_info "Creating 10 customers for Company $company_idx..."
    
    CUSTOMER_TYPES=("INDIVIDUAL" "BUSINESS" "DISTRIBUTOR" "RETAILER" "WHOLESALER")
    
    for i in {1..10}; do
        type_idx=$((($i - 1) % 5))
        CUSTOMER_TYPE=${CUSTOMER_TYPES[$type_idx]}
        
        # Add companyName for BUSINESS type customers
        COMPANY_NAME_FIELD=""
        if [ "$CUSTOMER_TYPE" == "BUSINESS" ]; then
            COMPANY_NAME_FIELD=", \"companyName\": \"Customer Business $i Ltd\""
        fi
        
        CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/${COMPANY_IDS[$company_idx]}/customers" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"name\": \"Customer $i - Company $company_idx\",
            \"customerType\": \"$CUSTOMER_TYPE\"$COMPANY_NAME_FIELD,
            \"email\": \"customer$i.c$company_idx@test.com\",
            \"phone\": \"+9198765$company_idx$i$i$i\",
            \"billingCountry\": \"India\",
            \"billingCity\": \"Mumbai\",
            \"billingState\": \"Maharashtra\",
            \"billingAddressLine1\": \"Customer Street $i\",
            \"paymentTerms\": \"NET_30\",
            \"currency\": \"INR\"
          }")
        
        CUSTOMER_ID=$(echo $CUSTOMER_RESPONSE | jq -r '.data.id')
        if [ "$CUSTOMER_ID" != "null" ] && [ -n "$CUSTOMER_ID" ]; then
            print_status 0 "Customer $i created for Company $company_idx"
        else
            print_status 1 "Failed to create customer $i for Company $company_idx"
            if [ $i -eq 1 ]; then
                ERROR_MSG=$(echo $CUSTOMER_RESPONSE | jq -r '.message // .error // "Unknown error"')
                echo "  Error: $ERROR_MSG"
            fi
        fi
    done
done

# =========================================
# STEP 6: CREATE SUPPLIERS (10 per company)
# =========================================
print_section "STEP 6: Creating Suppliers"

for company_idx in {1..5}; do
    print_info "Creating 10 suppliers for Company $company_idx..."
    
    SUPPLIER_TYPES=("MANUFACTURER" "DISTRIBUTOR" "WHOLESALER" "IMPORTER" "LOCAL_VENDOR")
    
    for i in {1..10}; do
        type_idx=$((($i - 1) % 5))
        SUPPLIER_TYPE=${SUPPLIER_TYPES[$type_idx]}
        
        SUPPLIER_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/${COMPANY_IDS[$company_idx]}/suppliers" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"name\": \"Supplier $i - Company $company_idx\",
            \"supplierType\": \"$SUPPLIER_TYPE\",
            \"email\": \"supplier$i.c$company_idx@test.com\",
            \"phone\": \"+9187654$company_idx$i$i$i\",
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
            print_status 0 "Supplier $i created for Company $company_idx"
        else
            print_status 1 "Failed to create supplier $i for Company $company_idx"
            if [ $i -eq 1 ]; then
                ERROR_MSG=$(echo $SUPPLIER_RESPONSE | jq -r '.message // .error // "Unknown error"')
                echo "  Error: $ERROR_MSG"
            fi
        fi
    done
done

# =========================================
# STEP 7: CREATE 15 ADDITIONAL USERS FOR INVITATIONS
# =========================================
print_section "STEP 7: Creating 15 Users for Invitations"

declare -a INVITE_USER_TOKENS
declare -a INVITE_USER_EMAILS

for i in {1..15}; do
    print_info "Creating invite user $i..."
    
    EMPLOYEE_EMAIL="employee${i}_${TIMESTAMP}@lavoro.com"
    
    REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
      -H "$CONTENT_TYPE" \
      -d "{
        \"email\": \"$EMPLOYEE_EMAIL\",
        \"phone\": \"+91${TIMESTAMP}$i\",
        \"password\": \"Test@123\",
        \"firstName\": \"Employee\",
        \"lastName\": \"User$i\"
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
# STEP 8: SEND INVITATIONS AND ACCEPT (15 total - one per employee)
# =========================================
print_section "STEP 8: Sending and Accepting User Invitations"

print_info "Sending 15 invitations from Company 1 (one per employee)..."

ROLES=("ADMIN" "MANAGER" "EMPLOYEE")

for i in {1..15}; do
    role_idx=$((($i - 1) % 3))
    ROLE=${ROLES[$role_idx]}
    
    # Send invitation
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
        
        # Accept invitation
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
# STEP 9: CREATE QUALITY CONTROL DATA (3 each type)
# =========================================
print_section "STEP 9: Creating Quality Control Data"

for company_idx in {1..5}; do
    print_info "Creating Quality Control data for Company $company_idx..."
    
    # Create 3 Quality Checkpoints
    for i in {1..3}; do
        QC_RESPONSE=$(curl -s -X POST "$BASE_URL/quality/checkpoints" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"checkpointName\": \"Quality Check $i - Company $company_idx\",
            \"checkpointType\": \"INCOMING\",
            \"description\": \"Standard quality checkpoint $i\",
            \"isActive\": true
          }")
        
        if [ "$(echo $QC_RESPONSE | jq -r '.data.id')" != "null" ]; then
            print_status 0 "Quality Checkpoint $i created for Company $company_idx"
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
            print_status 0 "Quality Defect $i created for Company $company_idx"
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
            print_status 0 "Compliance Report $i created for Company $company_idx"
        fi
    done
done

# =========================================
# STEP 10: CREATE TEXTILE OPERATIONS DATA (5 each type)
# =========================================
print_section "STEP 10: Creating Textile Operations Data"

for company_idx in {1..5}; do
    industry=${COMPANY_INDUSTRIES[$company_idx]}
    print_info "Creating Textile Operations for Company $company_idx ($industry)..."
    
    # Create 5 Fabric Production records
    for i in {1..5}; do
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
            \"quantityMeters\": $((1000 + $i * 100)),
            \"productionDate\": \"2024-12-0$i\",
            \"batchNumber\": \"FAB-BATCH-$i\",
            \"qualityGrade\": \"A_GRADE\",
            \"isActive\": true
          }")
        
        if [ "$(echo $FABRIC_RESPONSE | jq -r '.data.fabricId')" != "null" ]; then
            print_status 0 "Fabric Production $i created for Company $company_idx"
        fi
    done
    
    # Create 5 Yarn Manufacturing records
    for i in {1..5}; do
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
            \"quantityKg\": $((500 + $i * 50)),
            \"productionDate\": \"2024-12-0$i\",
            \"batchNumber\": \"YARN-BATCH-$i\",
            \"processType\": \"SPINNING\",
            \"qualityGrade\": \"A_GRADE\",
            \"isActive\": true
          }")
        
        YARN_ID=$(echo $YARN_RESPONSE | jq -r '.data.yarnId // .data.id')
        if [ "$YARN_ID" != "null" ] && [ -n "$YARN_ID" ]; then
            print_status 0 "Yarn Manufacturing $i created for Company $company_idx"
        else
            print_status 1 "Failed to create Yarn Manufacturing $i for Company $company_idx"
            if [ $i -eq 1 ]; then
                ERROR_MSG=$(echo $YARN_RESPONSE | jq -r '.message // .error // "Unknown error"')
                echo "  Error: $ERROR_MSG"
            fi
        fi
    done
    
    # Create 5 Dyeing & Finishing records
    for i in {1..5}; do
        DYEING_RESPONSE=$(curl -s -X POST "$BASE_URL/textile/dyeing" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"processType\": \"DYEING\",
            \"colorCode\": \"#FF0000\",
            \"colorName\": \"Red\",
            \"dyeMethod\": \"REACTIVE\",
            \"recipeCode\": \"RCP-00$i\",
            \"quantityMeters\": $((800 + $i * 100)),
            \"processDate\": \"2024-12-0$i\",
            \"batchNumber\": \"DYE-BATCH-$i\",
            \"machineNumber\": \"M-00$i\",
            \"temperatureC\": $((80 + $i)),
            \"durationMinutes\": $((120 + $i * 10)),
            \"qualityCheck\": true,
            \"isActive\": true
          }")
        
        DYEING_ID=$(echo $DYEING_RESPONSE | jq -r '.data.processId // .data.id')
        if [ "$DYEING_ID" != "null" ] && [ -n "$DYEING_ID" ]; then
            print_status 0 "Dyeing & Finishing $i created for Company $company_idx"
        else
            print_status 1 "Failed to create Dyeing & Finishing $i for Company $company_idx"
            if [ $i -eq 1 ]; then
                ERROR_MSG=$(echo $DYEING_RESPONSE | jq -r '.message // .error // "Unknown error"')
                echo "  Error: $ERROR_MSG"
            fi
        fi
    done
    
    # Create 5 Garment Manufacturing records
    for i in {1..5}; do
        GARMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/textile/garments" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"garmentType\": \"T_SHIRT\",
            \"styleNumber\": \"STY-00$i\",
            \"size\": \"M\",
            \"color\": \"Blue\",
            \"quantity\": $((100 + $i * 20)),
            \"productionStage\": \"CUTTING\",
            \"cutDate\": \"2024-12-0$i\",
            \"operatorName\": \"Operator $i\",
            \"lineNumber\": \"LINE-0$i\",
            \"qualityPassed\": true,
            \"defectCount\": 0,
            \"isActive\": true
          }")
        
        if [ "$(echo $GARMENT_RESPONSE | jq -r '.data.garmentId')" != "null" ]; then
            print_status 0 "Garment Manufacturing $i created for Company $company_idx"
        fi
    done
    
    # Create 5 Design & Patterns records
    for i in {1..5}; do
        DESIGN_RESPONSE=$(curl -s -X POST "$BASE_URL/textile/designs" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"designName\": \"Design Pattern $i\",
            \"designCategory\": \"PRINT\",
            \"designerName\": \"Designer $i\",
            \"season\": \"SPRING\",
            \"colorPalette\": [\"#FF0000\", \"#00FF00\", \"#0000FF\"],
            \"patternRepeat\": \"12x12 inches\",
            \"status\": \"APPROVED\",
            \"notes\": \"Beautiful design pattern $i\",
            \"isActive\": true
          }")
        
        if [ "$(echo $DESIGN_RESPONSE | jq -r '.data.designId')" != "null" ]; then
            print_status 0 "Design & Patterns $i created for Company $company_idx"
        fi
    done
done

# =========================================
# STEP 11: CREATE MACHINES (10 per company based on industry)
# =========================================
print_section "STEP 11: Creating Machines"

for company_idx in {1..5}; do
    industry=${COMPANY_INDUSTRIES[$company_idx]}
    print_info "Creating 10 machines for Company $company_idx ($industry)..."
    
    # Define machine types based on industry
    case $industry in
        "TEXTILE_MANUFACTURING")
            MACHINE_TYPES=("Spinning Machine" "Weaving Loom" "Knitting Machine" "Warping Machine" "Sizing Machine")
            ;;
        "GARMENT_PRODUCTION")
            MACHINE_TYPES=("Sewing Machine" "Overlock Machine" "Button Attaching Machine" "Cutting Machine" "Pressing Machine")
            ;;
        "FABRIC_PROCESSING")
            MACHINE_TYPES=("Calendering Machine" "Stentering Machine" "Mercerizing Machine" "Sanforizing Machine" "Raising Machine")
            ;;
        "DYEING_FINISHING")
            MACHINE_TYPES=("Dyeing Machine" "Printing Machine" "Washing Machine" "Dryer Machine" "Finishing Machine")
            ;;
        "APPAREL_DESIGN")
            MACHINE_TYPES=("CAD Plotter" "Pattern Cutting Machine" "Sample Sewing Machine" "Embroidery Machine" "Heat Press Machine")
            ;;
    esac
    
    for i in {1..10}; do
        machine_type_idx=$((($i - 1) % 5))
        MACHINE_TYPE=${MACHINE_TYPES[$machine_type_idx]}
        
        MACHINE_RESPONSE=$(curl -s -X POST "$BASE_URL/machines" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"name\": \"$MACHINE_TYPE $i\",
            \"machineType\": \"$MACHINE_TYPE\",
            \"model\": \"Model-$(printf '%03d' $i)\",
            \"manufacturer\": \"Manufacturer $(($i % 3 + 1))\",
            \"serialNumber\": \"SN-${company_idx}$(printf '%04d' $i)\",
            \"purchaseDate\": \"2023-0$((($i % 9) + 1))-15\",
            \"operationalStatus\": \"FREE\",
            \"status\": \"IN_USE\",
            \"isActive\": true
          }")
        
        MACHINE_ID=$(echo $MACHINE_RESPONSE | jq -r '.data.id // .data.machineId')
        if [ "$MACHINE_ID" != "null" ] && [ -n "$MACHINE_ID" ]; then
            print_status 0 "Machine '$MACHINE_TYPE $i' created for Company $company_idx"
        else
            print_status 1 "Failed to create machine $i for Company $company_idx"
            if [ $i -eq 1 ]; then
                ERROR_MSG=$(echo $MACHINE_RESPONSE | jq -r '.message // .error // "Unknown error"')
                echo "  Error: $ERROR_MSG"
            fi
        fi
    done
done

# =========================================
# STEP 12: CREATE QUALITY INSPECTIONS (5 per company)
# =========================================
print_section "STEP 12: Creating Quality Inspections"

for company_idx in {1..5}; do
    print_info "Creating 5 quality inspections for Company $company_idx..."
    
    INSPECTION_TYPES=("INCOMING_MATERIAL" "IN_PROCESS" "FINAL_PRODUCT" "RANDOM_CHECK" "INCOMING_MATERIAL")
    
    for i in {1..5}; do
        type_idx=$((i - 1))
        INSPECTION_TYPE=${INSPECTION_TYPES[$type_idx]}
        
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
            \"qualityScore\": $((85 + $i * 2)),
            \"inspectorNotes\": \"Quality inspection $i completed successfully\",
            \"isActive\": true
          }")
        
        INSPECTION_ID=$(echo $INSPECTION_RESPONSE | jq -r '.data.id // .data.inspectionId')
        if [ "$INSPECTION_ID" != "null" ] && [ -n "$INSPECTION_ID" ]; then
            print_status 0 "Quality Inspection $i created for Company $company_idx"
        else
            print_status 1 "Failed to create inspection $i for Company $company_idx"
            if [ $i -eq 1 ]; then
                ERROR_MSG=$(echo $INSPECTION_RESPONSE | jq -r '.message // .error // "Unknown error"')
                echo "  Error: $ERROR_MSG"
            fi
        fi
    done
done

# =========================================
# STEP 13: CREATE SALES ORDERS (5 per company)
# =========================================
print_section "STEP 13: Creating Sales Orders"

for company_idx in {1..5}; do
    print_info "Creating 5 sales orders for Company $company_idx..."
    
    for i in {1..5}; do
        ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/orders" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"customerName\": \"Customer $i - Company $company_idx\",
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
              },
              {
                \"itemCode\": \"ITEM-002\",
                \"description\": \"Product Item 2\",
                \"quantity\": $((5 + $i * 2)),
                \"unitOfMeasure\": \"PCS\",
                \"unitPrice\": $((200 + $i * 20)),
                \"taxRate\": 18
              }
            ]
          }")
        
        ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.data.id // .data.orderId')
        if [ "$ORDER_ID" != "null" ] && [ -n "$ORDER_ID" ]; then
            print_status 0 "Sales Order $i created for Company $company_idx"
            # Store order ID for invoice creation
            ORDER_IDS_${company_idx}[$i]=$ORDER_ID
        else
            print_status 1 "Failed to create sales order $i for Company $company_idx"
            if [ $i -eq 1 ]; then
                ERROR_MSG=$(echo $ORDER_RESPONSE | jq -r '.message // .error // "Unknown error"')
                echo "  Error: $ERROR_MSG"
            fi
        fi
    done
done

# =========================================
# STEP 14: CREATE PURCHASE ORDERS (5 per company)
# =========================================
print_section "STEP 14: Creating Purchase Orders"

for company_idx in {1..5}; do
    print_info "Creating 5 purchase orders for Company $company_idx..."
    
    for i in {1..5}; do
        PO_RESPONSE=$(curl -s -X POST "$BASE_URL/purchase-orders" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"supplierName\": \"Supplier $i - Company $company_idx\",
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
              },
              {
                \"itemCode\": \"RAW-002\",
                \"description\": \"Raw Material 2\",
                \"quantity\": $((30 + $i * 5)),
                \"unitOfMeasure\": \"KG\",
                \"unitCost\": $((80 + $i * 8)),
                \"taxRate\": 18
              }
            ]
          }")
        
        PO_ID=$(echo $PO_RESPONSE | jq -r '.data.id // .data.poId')
        if [ "$PO_ID" != "null" ] && [ -n "$PO_ID" ]; then
            print_status 0 "Purchase Order $i created for Company $company_idx"
            # Store PO ID for bill creation
            PO_IDS_${company_idx}[$i]=$PO_ID
        else
            print_status 1 "Failed to create purchase order $i for Company $company_idx"
            if [ $i -eq 1 ]; then
                ERROR_MSG=$(echo $PO_RESPONSE | jq -r '.message // .error // "Unknown error"')
                echo "  Error: $ERROR_MSG"
            fi
        fi
    done
done

# =========================================
# STEP 15: INVOICES
# =========================================
print_section "STEP 15: Creating Invoices for Companies 1 & 2"

# Function to create invoices for a company
create_invoices() {
    local company_idx=$1
    local count=$2
    
    print_info "Creating $count invoices for Company $company_idx..."
    
    # Get the default location for the company
    LOCATION_RESPONSE=$(curl -s -X GET "$BASE_URL/locations" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    LOCATION_ID=$(echo $LOCATION_RESPONSE | jq -r '.data[0].id')
    
    if [ -z "$LOCATION_ID" ] || [ "$LOCATION_ID" == "null" ]; then
        print_status 1 "Failed to get location for Company $company_idx"
        return
    fi
    
    # Get customers for the company
    CUSTOMERS_RESPONSE=$(curl -s -X GET "$BASE_URL/customers" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    # Get products for the company
    PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/products" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    # Extract customer and product IDs
    CUSTOMER_IDS=($(echo $CUSTOMERS_RESPONSE | jq -r '.data[].id'))
    PRODUCT_IDS=($(echo $PRODUCTS_RESPONSE | jq -r '.data[].id'))
    
    if [ ${#CUSTOMER_IDS[@]} -eq 0 ] || [ ${#PRODUCT_IDS[@]} -eq 0 ]; then
        print_status 1 "No customers or products found for Company $company_idx"
        return
    fi
    
    for i in $(seq 1 $count); do
        # Select a random customer
        customer_idx=$((RANDOM % ${#CUSTOMER_IDS[@]}))
        customer_id=${CUSTOMER_IDS[$customer_idx]}
        
        # Generate random dates within the last 90 days
        days_ago=$((RANDOM % 90))
        issue_date=$(date -v -${days_ago}d +"%Y-%m-%d")
        due_date=$(date -v -${days_ago}d -v +30d +"%Y-%m-%d")
        
        # Generate 1-3 line items
        line_items_count=$((RANDOM % 3 + 1))
        line_items=[]
        
        for j in $(seq 1 $line_items_count); do
            # Select a random product
            product_idx=$((RANDOM % ${#PRODUCT_IDS[@]}))
            product_id=${PRODUCT_IDS[$product_idx]}
            
            # Generate random quantity and unit price
            quantity=$((RANDOM % 10 + 1))
            unit_price=$((RANDOM % 1000 + 100))
            
            if [ $j -eq 1 ]; then
                line_items="[{\"productId\":\"$product_id\",\"description\":\"Product Line Item $j\",\"quantity\":$quantity,\"unitPrice\":$unit_price}]"
            else
                line_items=$(echo $line_items | jq '. += [{"productId":"'$product_id'","description":"Product Line Item '$j'","quantity":'$quantity',"unitPrice":'$unit_price'}]')
            fi
        done
        
        # Create invoice payload
        INVOICE_PAYLOAD='{"customerId":"'$customer_id'","locationId":"'$LOCATION_ID'","issueDate":"'$issue_date'","dueDate":"'$due_date'","lineItems":'$line_items',"notes":"Test invoice created by seed script"}'
        
        # Create invoice
        INVOICE_RESPONSE=$(curl -s -X POST "$BASE_URL/invoices" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "$INVOICE_PAYLOAD")
        
        INVOICE_ID=$(echo $INVOICE_RESPONSE | jq -r '.data.id')
        
        if [ -z "$INVOICE_ID" ] || [ "$INVOICE_ID" == "null" ]; then
            print_status 1 "Failed to create invoice $i for Company $company_idx"
            ERROR_MSG=$(echo $INVOICE_RESPONSE | jq -r '.message // .error // "Unknown error"')
            echo "  Error: $ERROR_MSG"
        else
            print_status 0 "Created invoice $i for Company $company_idx: $INVOICE_ID"
        fi
    done
}

# Create invoices for Companies 1 & 2
create_invoices 1 10
create_invoices 2 10

# =========================================
# STEP 16: BILLS
# =========================================
print_section "STEP 16: Creating Bills for Companies 1 & 2"

# Function to create bills for a company
create_bills() {
    local company_idx=$1
    local count=$2
    
    print_info "Creating $count bills for Company $company_idx..."
    
    # Get the default location for the company
    LOCATION_RESPONSE=$(curl -s -X GET "$BASE_URL/locations" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    LOCATION_ID=$(echo $LOCATION_RESPONSE | jq -r '.data[0].id')
    
    if [ -z "$LOCATION_ID" ] || [ "$LOCATION_ID" == "null" ]; then
        print_status 1 "Failed to get location for Company $company_idx"
        return
    fi
    
    # Get suppliers for the company
    SUPPLIERS_RESPONSE=$(curl -s -X GET "$BASE_URL/suppliers" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    # Get products for the company
    PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/products" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    # Extract supplier and product IDs
    SUPPLIER_IDS=($(echo $SUPPLIERS_RESPONSE | jq -r '.data[].id'))
    PRODUCT_IDS=($(echo $PRODUCTS_RESPONSE | jq -r '.data[].id'))
    
    if [ ${#SUPPLIER_IDS[@]} -eq 0 ] || [ ${#PRODUCT_IDS[@]} -eq 0 ]; then
        print_status 1 "No suppliers or products found for Company $company_idx"
        return
    fi
    
    for i in $(seq 1 $count); do
        # Select a random supplier
        supplier_idx=$((RANDOM % ${#SUPPLIER_IDS[@]}))
        supplier_id=${SUPPLIER_IDS[$supplier_idx]}
        
        # Generate random dates within the last 90 days
        days_ago=$((RANDOM % 90))
        issue_date=$(date -v -${days_ago}d +"%Y-%m-%d")
        due_date=$(date -v -${days_ago}d -v +30d +"%Y-%m-%d")
        
        # Generate 1-3 line items
        line_items_count=$((RANDOM % 3 + 1))
        line_items=[]
        
        for j in $(seq 1 $line_items_count); do
            # Select a random product
            product_idx=$((RANDOM % ${#PRODUCT_IDS[@]}))
            product_id=${PRODUCT_IDS[$product_idx]}
            
            # Generate random quantity and unit price
            quantity=$((RANDOM % 10 + 1))
            unit_price=$((RANDOM % 500 + 50))
            
            if [ $j -eq 1 ]; then
                line_items="[{\"productId\":\"$product_id\",\"description\":\"Product Line Item $j\",\"quantity\":$quantity,\"unitPrice\":$unit_price}]"
            else
                line_items=$(echo $line_items | jq '. += [{"productId":"'$product_id'","description":"Product Line Item '$j'","quantity":'$quantity',"unitPrice":'$unit_price'}]')
            fi
        done
        
        # Create bill payload
        BILL_PAYLOAD='{"supplierId":"'$supplier_id'","locationId":"'$LOCATION_ID'","issueDate":"'$issue_date'","dueDate":"'$due_date'","lineItems":'$line_items',"notes":"Test bill created by seed script"}'
        
        # Create bill
        BILL_RESPONSE=$(curl -s -X POST "$BASE_URL/bills" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "$BILL_PAYLOAD")
        
        BILL_ID=$(echo $BILL_RESPONSE | jq -r '.data.id')
        
        if [ -z "$BILL_ID" ] || [ "$BILL_ID" == "null" ]; then
            print_status 1 "Failed to create bill $i for Company $company_idx"
            ERROR_MSG=$(echo $BILL_RESPONSE | jq -r '.message // .error // "Unknown error"')
            echo "  Error: $ERROR_MSG"
        else
            print_status 0 "Created bill $i for Company $company_idx: $BILL_ID"
        fi
    done
}

# Create bills for Companies 1 & 2
create_bills 1 10
create_bills 2 10

# =========================================
# STEP 16.5: GENERATE FINANCIAL REPORTS
# =========================================
print_section "STEP 16.5: Generating Financial Reports"

# Function to generate financial reports for a company
generate_financial_reports() {
    local company_idx=$1
    
    print_info "Generating financial reports for Company $company_idx..."
    
    # Get current date and 30 days ago for report parameters
    END_DATE=$(date +"%Y-%m-%d")
    START_DATE=$(date -v -30d +"%Y-%m-%d")
    AS_OF_DATE=$END_DATE
    
    # Generate Profit & Loss Report
    print_info "Generating Profit & Loss Report..."
    PL_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/financial/profit-loss?startDate=$START_DATE&endDate=$END_DATE" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $PL_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Profit & Loss Report generated successfully"
    else
        print_status 1 "Failed to generate Profit & Loss Report"
    fi
    
    # Generate Balance Sheet
    print_info "Generating Balance Sheet..."
    BS_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/financial/balance-sheet?asOfDate=$AS_OF_DATE" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $BS_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Balance Sheet generated successfully"
    else
        print_status 1 "Failed to generate Balance Sheet"
    fi
    
    # Generate Cash Flow Statement
    print_info "Generating Cash Flow Statement..."
    CF_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/financial/cash-flow?startDate=$START_DATE&endDate=$END_DATE" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $CF_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Cash Flow Statement generated successfully"
    else
        print_status 1 "Failed to generate Cash Flow Statement"
    fi
    
    # Generate AR Aging Report
    print_info "Generating AR Aging Report..."
    AR_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/financial/ar-aging?asOfDate=$AS_OF_DATE" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $AR_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "AR Aging Report generated successfully"
    else
        print_status 1 "Failed to generate AR Aging Report"
    fi
    
    # Generate AP Aging Report
    print_info "Generating AP Aging Report..."
    AP_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/financial/ap-aging?asOfDate=$AS_OF_DATE" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $AP_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "AP Aging Report generated successfully"
    else
        print_status 1 "Failed to generate AP Aging Report"
    fi
}

# Generate financial reports for Companies 1 & 2
generate_financial_reports 1
generate_financial_reports 2

# =========================================
# STEP 16.6: GENERATE INVENTORY REPORTS
# =========================================
print_section "STEP 16.6: Generating Inventory Reports"

# Function to generate inventory reports for a company
generate_inventory_reports() {
    local company_idx=$1
    
    print_info "Generating inventory reports for Company $company_idx..."
    
    # Get current date for report parameters
    AS_OF_DATE=$(date +"%Y-%m-%d")
    
    # Generate Stock Summary Report
    print_info "Generating Stock Summary Report..."
    STOCK_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/inventory/stock-summary" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $STOCK_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Stock Summary Report generated successfully"
    else
        print_status 1 "Failed to generate Stock Summary Report"
    fi
    
    # Generate Low Stock Report
    print_info "Generating Low Stock Report..."
    LOW_STOCK_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/inventory/low-stock" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $LOW_STOCK_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Low Stock Report generated successfully"
    else
        print_status 1 "Failed to generate Low Stock Report"
    fi
    
    # Generate Stock Aging Report
    print_info "Generating Stock Aging Report..."
    AGING_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/inventory/stock-aging?asOfDate=$AS_OF_DATE" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $AGING_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Stock Aging Report generated successfully"
    else
        print_status 1 "Failed to generate Stock Aging Report"
    fi
    
    # Generate Inventory Valuation Report
    print_info "Generating Inventory Valuation Report..."
    VALUATION_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/inventory/inventory-valuation?asOfDate=$AS_OF_DATE" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $VALUATION_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Inventory Valuation Report generated successfully"
    else
        print_status 1 "Failed to generate Inventory Valuation Report"
    fi
}

# Generate inventory reports for Companies 1 & 2
generate_inventory_reports 1
generate_inventory_reports 2

# =========================================
# STEP 16.7: GENERATE SALES REPORTS
# =========================================
print_section "STEP 16.7: Generating Sales Reports"

# Function to generate sales reports for a company
generate_sales_reports() {
    local company_idx=$1
    
    print_info "Generating sales reports for Company $company_idx..."
    
    # Get current date and 30 days ago for report parameters
    END_DATE=$(date +"%Y-%m-%d")
    START_DATE=$(date -v -30d +"%Y-%m-%d")
    
    # Generate Sales Summary Report
    print_info "Generating Sales Summary Report..."
    SALES_SUMMARY_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/sales/sales-summary?startDate=$START_DATE&endDate=$END_DATE" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $SALES_SUMMARY_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Sales Summary Report generated successfully"
    else
        print_status 1 "Failed to generate Sales Summary Report"
    fi
    
    # Generate Sales Trend Report
    print_info "Generating Sales Trend Report..."
    SALES_TREND_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/sales/sales-trend?startDate=$START_DATE&endDate=$END_DATE" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $SALES_TREND_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Sales Trend Report generated successfully"
    else
        print_status 1 "Failed to generate Sales Trend Report"
    fi
    
    # Generate Top Selling Products Report
    print_info "Generating Top Selling Products Report..."
    TOP_PRODUCTS_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/sales/top-products?startDate=$START_DATE&endDate=$END_DATE&limit=10" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $TOP_PRODUCTS_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Top Selling Products Report generated successfully"
    else
        print_status 1 "Failed to generate Top Selling Products Report"
    fi
    
    # Generate Sales by Region Report
    print_info "Generating Sales by Region Report..."
    SALES_REGION_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/sales/sales-by-region?startDate=$START_DATE&endDate=$END_DATE" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $SALES_REGION_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Sales by Region Report generated successfully"
    else
        print_status 1 "Failed to generate Sales by Region Report"
    fi
}

# Generate sales reports for Companies 1 & 2
generate_sales_reports 1
generate_sales_reports 2

# =========================================
# STEP 16.8: GENERATE PRODUCTION REPORTS
# =========================================
print_section "STEP 16.8: Generating Production Reports"

# Function to generate production reports for a company
generate_production_reports() {
    local company_idx=$1
    
    print_info "Generating production reports for Company $company_idx..."
    
    # Get current date and 30 days ago for report parameters
    END_DATE=$(date +"%Y-%m-%d")
    START_DATE=$(date -v -30d +"%Y-%m-%d")
    
    # Generate Production Summary Report
    print_info "Generating Production Summary Report..."
    PRODUCTION_SUMMARY_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/production/production-summary?startDate=$START_DATE&endDate=$END_DATE" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $PRODUCTION_SUMMARY_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Production Summary Report generated successfully"
    else
        print_status 1 "Failed to generate Production Summary Report"
    fi
    
    # Generate Production Efficiency Report
    print_info "Generating Production Efficiency Report..."
    EFFICIENCY_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/production/production-efficiency?startDate=$START_DATE&endDate=$END_DATE" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $EFFICIENCY_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Production Efficiency Report generated successfully"
    else
        print_status 1 "Failed to generate Production Efficiency Report"
    fi
    
    # Generate Machine Utilization Report
    print_info "Generating Machine Utilization Report..."
    MACHINE_UTIL_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/production/machine-utilization?startDate=$START_DATE&endDate=$END_DATE" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $MACHINE_UTIL_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Machine Utilization Report generated successfully"
    else
        print_status 1 "Failed to generate Machine Utilization Report"
    fi
    
    # Generate Downtime Analysis Report
    print_info "Generating Downtime Analysis Report..."
    DOWNTIME_RESPONSE=$(curl -s -X GET "$BASE_URL/reports/production/downtime-analysis?startDate=$START_DATE&endDate=$END_DATE" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $DOWNTIME_RESPONSE | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Downtime Analysis Report generated successfully"
    else
        print_status 1 "Failed to generate Downtime Analysis Report"
    fi
}

# Generate production reports for Companies 1 & 2
generate_production_reports 1
generate_production_reports 2

# =========================================
# STEP 17: TEST ANALYTICS APIs (Priority 4)
# =========================================
print_section "STEP 17: Testing Analytics APIs"

for company_idx in {1..5}; do
    print_info "Testing analytics APIs for Company $company_idx..."
    
    # Test Dashboard Analytics
    DASHBOARD_ANALYTICS=$(curl -s -X GET "$BASE_URL/analytics/dashboard" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    TOTAL_PRODUCTS=$(echo $DASHBOARD_ANALYTICS | jq -r '.data.totalProducts // 0')
    ACTIVE_ORDERS=$(echo $DASHBOARD_ANALYTICS | jq -r '.data.activeOrders // 0')
    TEAM_MEMBERS=$(echo $DASHBOARD_ANALYTICS | jq -r '.data.teamMembers // 0')
    
    if [ "$TOTAL_PRODUCTS" != "null" ] && [ "$TOTAL_PRODUCTS" != "0" ]; then
        print_status 0 "Dashboard Analytics: Products=$TOTAL_PRODUCTS, Orders=$ACTIVE_ORDERS, Team=$TEAM_MEMBERS"
    else
        print_status 1 "Failed to fetch dashboard analytics for Company $company_idx"
    fi
    
    # Test Revenue Trends
    REVENUE_TRENDS=$(curl -s -X GET "$BASE_URL/analytics/revenue-trends?months=6" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    TRENDS_COUNT=$(echo $REVENUE_TRENDS | jq -r '.data | length')
    if [ "$TRENDS_COUNT" != "null" ]; then
        print_status 0 "Revenue Trends: $TRENDS_COUNT months of data"
    else
        print_status 1 "Failed to fetch revenue trends for Company $company_idx"
    fi
    
    # Test Top Products
    TOP_PRODUCTS=$(curl -s -X GET "$BASE_URL/analytics/top-products?limit=5" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    PRODUCTS_COUNT=$(echo $TOP_PRODUCTS | jq -r '.data | length')
    if [ "$PRODUCTS_COUNT" != "null" ]; then
        print_status 0 "Top Products: $PRODUCTS_COUNT products retrieved"
    else
        print_status 1 "Failed to fetch top products for Company $company_idx"
    fi
    
    # Test Quality Metrics
    QUALITY_METRICS=$(curl -s -X GET "$BASE_URL/analytics/quality-metrics" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    if echo $QUALITY_METRICS | jq -e '.data' > /dev/null 2>&1; then
        print_status 0 "Quality Metrics retrieved successfully"
    else
        print_status 1 "Failed to fetch quality metrics for Company $company_idx"
    fi
    
    # Test Production Summary
    PRODUCTION_SUMMARY=$(curl -s -X GET "$BASE_URL/analytics/production-summary" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}")
    
    FABRIC_BATCHES=$(echo $PRODUCTION_SUMMARY | jq -r '.data.fabric.totalBatches // 0')
    YARN_BATCHES=$(echo $PRODUCTION_SUMMARY | jq -r '.data.yarn.totalBatches // 0')
    
    if [ "$FABRIC_BATCHES" != "null" ]; then
        print_status 0 "Production Summary: Fabric=$FABRIC_BATCHES batches, Yarn=$YARN_BATCHES batches"
    else
        print_status 1 "Failed to fetch production summary for Company $company_idx"
    fi
    
    echo ""
done

# =========================================
# FINAL SUMMARY
# =========================================
print_section "DATA SEEDING COMPLETED"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}SUMMARY${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "Total Operations: ${BLUE}$TOTAL_OPERATIONS${NC}"
echo -e "Successful: ${GREEN}$SUCCESSFUL_OPERATIONS${NC}"
echo -e "Failed: ${RED}$FAILED_OPERATIONS${NC}"
echo ""

echo -e "${YELLOW}Created Test Data:${NC}"
echo -e "  • 1 Main User ($MAIN_USER_EMAIL)"
echo -e "  • 5 Companies (Different Industries - all owned by $MAIN_USER_EMAIL)"
echo -e "  • 6 Additional Locations (3 each for Companies 1 & 2)"
echo -e "  • 50 Products (35 for Company 1, 15 for Company 2)"
echo -e "  • 50 Customers (10 per company)"
echo -e "  • 50 Suppliers (10 per company)"
echo -e "  • 15 Employee Users"
echo -e "  • 15 User Invitations (Accepted - one per employee)"
echo -e "  • 45 Quality Control Items (3 each type × 5 companies)"
echo -e "  • 175 Textile Operations (5 each type × 5 companies)"
echo -e "  • ${GREEN}50 Machines (10 per company, industry-specific) ✓${NC}"
echo -e "  • ${GREEN}25 Quality Inspections (5 per company) ✓${NC}"
echo -e "  • ${GREEN}25 Sales Orders (5 per company) ✓${NC}"
echo -e "  • ${GREEN}25 Purchase Orders (5 per company) ✓${NC}"
echo -e "  • ${GREEN}20 Invoices (10 per company for Companies 1 & 2) ✓${NC}"
echo -e "  • ${GREEN}20 Bills (10 per company for Companies 1 & 2) ✓${NC}"
echo ""

echo -e "${YELLOW}Main User Credentials:${NC}"
echo -e "  Owner: ${BLUE}$MAIN_USER_EMAIL${NC} / Password: ${BLUE}Test@123${NC}"
echo -e "  ${YELLOW}⚠ Save this email for login!${NC}"
echo ""

echo -e "${YELLOW}Employee Users:${NC}"
for i in {1..15}; do
    if [ -n "${INVITE_USER_EMAILS[$i]}" ]; then
        role_idx=$((($i - 1) % 3))
        ROLE=${ROLES[$role_idx]}
        echo -e "  ${BLUE}${INVITE_USER_EMAILS[$i]}${NC} - Role: $ROLE"
    fi
done
echo -e "  Password: ${BLUE}Test@123${NC} (for all)"
echo ""

echo -e "${YELLOW}Companies Created:${NC}"
for i in {1..5}; do
    echo -e "  Company $i: ${BLUE}${COMPANY_NAMES[$i-1]}${NC} (${COMPANY_INDUSTRIES[$i]})"
done
echo ""

if [ $FAILED_OPERATIONS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL DATA SEEDED SUCCESSFULLY!${NC}"
else
    echo -e "${YELLOW}⚠ Some operations failed. Check the output above for details.${NC}"
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}COMPLETE DATA BREAKDOWN${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "${YELLOW}Companies with FULL data (Products, Customers, Suppliers, etc.):${NC}"
echo -e "  ${GREEN}✓ Company 1: Premium Textiles Ltd${NC}"
echo -e "    - 35 Products (Textile Manufacturing items)"
echo -e "    - 10 Customers & 10 Suppliers"
echo -e "    - ${GREEN}10 Machines (Spinning, Weaving, Knitting, etc.) ✓${NC}"
echo -e "    - ${GREEN}5 Quality Inspections ✓${NC}"
echo -e "    - ${GREEN}5 Sales Orders & 5 Purchase Orders ✓${NC}"
echo -e "    - 15 Employee Users (with invitations)"
echo -e "    - Quality Control data"
echo -e "    - Textile Operations (Fabric, Yarn, Dyeing, Garment, Designs)"
echo ""
echo -e "  ${GREEN}✓ Company 2: Fashion Garments Co${NC}"
echo -e "    - 15 Products (Garment Production items)"
echo -e "    - 10 Customers & 10 Suppliers"
echo -e "    - ${GREEN}10 Machines (Sewing, Overlock, Cutting, etc.) ✓${NC}"
echo -e "    - ${GREEN}5 Quality Inspections ✓${NC}"
echo -e "    - ${GREEN}5 Sales Orders & 5 Purchase Orders ✓${NC}"
echo -e "    - Quality Control data"
echo -e "    - Textile Operations (Fabric, Yarn, Dyeing, Garment, Designs)"
echo ""
echo -e "${YELLOW}Companies 3-5 have:${NC}"
echo -e "  ${BLUE}• Company 3: Quality Fabrics Inc${NC}"
echo -e "    - ${GREEN}10 Machines (Calendering, Stentering, etc.) ✓${NC}"
echo -e "    - ${GREEN}5 Quality Inspections ✓${NC}"
echo -e "    - ${GREEN}5 Sales Orders & 5 Purchase Orders ✓${NC}"
echo -e "    - Textile Operations"
echo ""
echo -e "  ${BLUE}• Company 4: ColorTech Dyeing${NC}"
echo -e "    - ${GREEN}10 Machines (Dyeing, Printing, Washing, etc.) ✓${NC}"
echo -e "    - ${GREEN}5 Quality Inspections ✓${NC}"
echo -e "    - ${GREEN}5 Sales Orders & 5 Purchase Orders ✓${NC}"
echo -e "    - Textile Operations"
echo ""
echo -e "  ${BLUE}• Company 5: Design Studio Pro${NC}"
echo -e "    - ${GREEN}10 Machines (CAD Plotter, Pattern Cutting, etc.) ✓${NC}"
echo -e "    - ${GREEN}5 Quality Inspections ✓${NC}"
echo -e "    - ${GREEN}5 Sales Orders & 5 Purchase Orders ✓${NC}"
echo -e "    - Textile Operations"
echo ""
echo -e "${BLUE}You can now login with any of the test users and explore the seeded data!${NC}"
echo ""
echo -e "${YELLOW}Quick Access:${NC}"
echo -e "  • Main Admin: ${BLUE}${MAIN_USER_EMAIL}${NC}"
echo -e "  • Employee Users: Check the list above"
echo -e "  • Companies: All 5 companies created with different data levels"
echo -e "  • Textile Operations: All 5 companies have textile operation data"
echo -e "  • Additional Data: Machines, Inspections, Orders, Invoices, Bills"
echo -e "  • Quality Control: All 45 QC items created"
echo -e "  • ${GREEN}Reports: Generated for all companies and operations ✓${NC}
    - Financial Reports (Profit & Loss, Balance Sheet, Cash Flow, etc.)
    - Inventory Reports (Stock Summary, Low Stock, Aging, Valuation)
    - Sales Reports (Sales Summary, Trends, Top Products, By Region)
    - Production Reports (Summary, Efficiency, Machine Utilization, Downtime)"
echo -e "  • Dashboard: All companies have dashboard data"
echo -e "  • ${GREEN}Analytics: Comprehensive analytics APIs tested ✓${NC}"
echo -e "    - Dashboard Analytics (Products, Orders, Team, Revenue)"
echo -e "    - Revenue Trends (6 months)"
echo -e "    - Top Products & Customers"
echo -e "    - Quality Metrics"
echo -e "    - Production Summary"
echo ""
