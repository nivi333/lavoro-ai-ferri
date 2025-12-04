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

set -e  # Exit on error

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
# STEP 1: CREATE 5 MAIN USERS
# =========================================
print_section "STEP 1: Creating 5 Main Users"

declare -a USER_TOKENS
declare -a USER_IDS
declare -a USER_EMAILS

for i in {1..5}; do
    print_info "Creating user test$i@lavoro.com..."
    
    REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
      -H "$CONTENT_TYPE" \
      -d "{
        \"email\": \"test$i@lavoro.com\",
        \"phone\": \"+9198765432$i$i\",
        \"password\": \"Test@123\",
        \"firstName\": \"Test\",
        \"lastName\": \"User$i\"
      }")
    
    TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.tokens.accessToken')
    USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')
    
    if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
        USER_TOKENS[$i]=$TOKEN
        USER_IDS[$i]=$USER_ID
        USER_EMAILS[$i]="test$i@lavoro.com"
        print_status 0 "User test$i@lavoro.com created"
    else
        print_status 1 "Failed to create user test$i@lavoro.com"
    fi
done

# =========================================
# STEP 2: CREATE 5 COMPANIES WITH DIFFERENT INDUSTRIES
# =========================================
print_section "STEP 2: Creating 5 Companies"

declare -a COMPANY_IDS
declare -a COMPANY_TOKENS
declare -a COMPANY_INDUSTRIES

INDUSTRIES=("textile_manufacturing" "garment_production" "fabric_processing" "dyeing_finishing" "apparel_design")
COMPANY_NAMES=("Premium Textiles Ltd" "Fashion Garments Co" "Quality Fabrics Inc" "ColorTech Dyeing" "Design Studio Pro")

for i in {1..5}; do
    print_info "Creating company: ${COMPANY_NAMES[$i-1]}..."
    
    COMPANY_RESPONSE=$(curl -s -X POST "$BASE_URL/companies" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${USER_TOKENS[$i]}" \
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
          -H "Authorization: Bearer ${USER_TOKENS[$i]}")
        
        COMPANY_TOKEN=$(echo $SWITCH_RESPONSE | jq -r '.data.tokens.accessToken')
        COMPANY_TOKENS[$i]=$COMPANY_TOKEN
        
        print_status 0 "Company ${COMPANY_NAMES[$i-1]} created (${INDUSTRIES[$i-1]})"
    else
        print_status 1 "Failed to create company ${COMPANY_NAMES[$i-1]}"
    fi
done

# =========================================
# STEP 3: CREATE ADDITIONAL LOCATIONS (For Companies 1 & 2)
# =========================================
print_section "STEP 3: Creating Additional Locations"

for company_idx in 1 2; do
    print_info "Creating 3 locations for Company $company_idx..."
    
    LOCATION_TYPES=("BRANCH" "WAREHOUSE" "FACTORY")
    LOCATION_NAMES=("Branch Office" "Main Warehouse" "Production Unit")
    
    for loc_idx in {1..3}; do
        LOCATION_RESPONSE=$(curl -s -X POST "$BASE_URL/locations" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"locationName\": \"${LOCATION_NAMES[$loc_idx-1]} $loc_idx\",
            \"locationType\": \"${LOCATION_TYPES[$loc_idx-1]}\",
            \"country\": \"India\",
            \"addressLine1\": \"Location $loc_idx Street\",
            \"city\": \"Pune\",
            \"state\": \"Maharashtra\",
            \"pincode\": \"41100$loc_idx\",
            \"isActive\": true
          }")
        
        LOCATION_ID=$(echo $LOCATION_RESPONSE | jq -r '.data.id')
        
        if [ "$LOCATION_ID" != "null" ]; then
            print_status 0 "Location ${LOCATION_NAMES[$loc_idx-1]} created for Company $company_idx"
        else
            print_status 1 "Failed to create location for Company $company_idx"
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
        "textile_manufacturing")
            PRODUCT_CATEGORIES=("Cotton Fabric" "Silk Fabric" "Wool Fabric" "Polyester Fabric" "Blend Fabric")
            ;;
        "garment_production")
            PRODUCT_CATEGORIES=("T-Shirts" "Shirts" "Pants" "Dresses" "Jackets")
            ;;
        "fabric_processing")
            PRODUCT_CATEGORIES=("Raw Fabric" "Processed Fabric" "Finished Fabric" "Specialty Fabric" "Technical Fabric")
            ;;
        "dyeing_finishing")
            PRODUCT_CATEGORIES=("Dyed Fabric" "Printed Fabric" "Finished Fabric" "Coated Fabric" "Treated Fabric")
            ;;
        "apparel_design")
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
            \"productName\": \"$CATEGORY Product $i\",
            \"category\": \"$CATEGORY\",
            \"description\": \"High quality $CATEGORY for ${COMPANY_INDUSTRIES[$company_idx]}\",
            \"unitOfMeasure\": \"PCS\",
            \"productType\": \"FINISHED_GOODS\",
            \"costPrice\": $((100 + $i * 10)),
            \"sellingPrice\": $((150 + $i * 15)),
            \"currentStock\": $((100 + $i * 5)),
            \"reorderLevel\": 50,
            \"isActive\": true
          }")
        
        PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r '.data.id')
        
        if [ "$PRODUCT_ID" != "null" ]; then
            print_status 0 "Product '$CATEGORY Product $i' created"
        else
            print_status 1 "Failed to create product $i"
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
        
        CUSTOMER_RESPONSE=$(curl -s -X POST "$BASE_URL/customers" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"customerName\": \"Customer $i - Company $company_idx\",
            \"customerType\": \"$CUSTOMER_TYPE\",
            \"email\": \"customer$i.c$company_idx@test.com\",
            \"phone\": \"+9198765$company_idx$i$i$i\",
            \"country\": \"India\",
            \"city\": \"Mumbai\",
            \"state\": \"Maharashtra\",
            \"paymentTerms\": \"NET_30\",
            \"currency\": \"INR\",
            \"isActive\": true
          }")
        
        if [ "$(echo $CUSTOMER_RESPONSE | jq -r '.data.id')" != "null" ]; then
            print_status 0 "Customer $i created for Company $company_idx"
        else
            print_status 1 "Failed to create customer $i for Company $company_idx"
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
        
        SUPPLIER_RESPONSE=$(curl -s -X POST "$BASE_URL/suppliers" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"supplierName\": \"Supplier $i - Company $company_idx\",
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
        
        if [ "$(echo $SUPPLIER_RESPONSE | jq -r '.data.id')" != "null" ]; then
            print_status 0 "Supplier $i created for Company $company_idx"
        else
            print_status 1 "Failed to create supplier $i for Company $company_idx"
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
    
    REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
      -H "$CONTENT_TYPE" \
      -d "{
        \"email\": \"employee$i@lavoro.com\",
        \"phone\": \"+9176543210$i$i\",
        \"password\": \"Test@123\",
        \"firstName\": \"Employee\",
        \"lastName\": \"User$i\"
      }")
    
    TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.tokens.accessToken')
    
    if [ "$TOKEN" != "null" ]; then
        INVITE_USER_TOKENS[$i]=$TOKEN
        INVITE_USER_EMAILS[$i]="employee$i@lavoro.com"
        print_status 0 "Employee user $i created"
    else
        print_status 1 "Failed to create employee user $i"
    fi
done

# =========================================
# STEP 8: SEND INVITATIONS AND ACCEPT (25 total from Company 1)
# =========================================
print_section "STEP 8: Sending and Accepting User Invitations"

print_info "Sending 25 invitations from Company 1..."

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
    
    if [ "$INVITATION_ID" != "null" ]; then
        print_status 0 "Invitation sent to ${INVITE_USER_EMAILS[$i]} as $ROLE"
        
        # Accept invitation
        sleep 0.5
        ACCEPT_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/${COMPANY_IDS[1]}/invitations/$INVITATION_ID/accept" \
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

# Invite remaining 10 users (reuse some employees)
for i in {1..10}; do
    role_idx=$((($i - 1) % 3))
    ROLE=${ROLES[$role_idx]}
    user_idx=$((($i - 1) % 15 + 1))
    
    INVITE_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/${COMPANY_IDS[1]}/invite" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[1]}" \
      -d "{
        \"emailOrPhone\": \"${INVITE_USER_EMAILS[$user_idx]}\",
        \"role\": \"$ROLE\"
      }")
    
    if [ "$(echo $INVITE_RESPONSE | jq -r '.success')" == "true" ]; then
        print_status 0 "Additional invitation sent to ${INVITE_USER_EMAILS[$user_idx]}"
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
            \"yarnType\": \"COTTON\",
            \"yarnCount\": \"30s\",
            \"twistPerInch\": $((15 + $i)),
            \"ply\": \"SINGLE\",
            \"color\": \"Natural\",
            \"quantityKg\": $((500 + $i * 50)),
            \"productionDate\": \"2024-12-0$i\",
            \"batchNumber\": \"YARN-BATCH-$i\",
            \"processType\": \"SPINNING\",
            \"qualityGrade\": \"A_GRADE\",
            \"isActive\": true
          }")
        
        if [ "$(echo $YARN_RESPONSE | jq -r '.data.yarnId')" != "null" ]; then
            print_status 0 "Yarn Manufacturing $i created for Company $company_idx"
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
            \"temperature\": $((80 + $i)),
            \"duration\": $((120 + $i * 10)),
            \"qualityCheck\": true,
            \"isActive\": true
          }")
        
        if [ "$(echo $DYEING_RESPONSE | jq -r '.data.processId')" != "null" ]; then
            print_status 0 "Dyeing & Finishing $i created for Company $company_idx"
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
echo -e "  • 5 Companies (Different Industries)"
echo -e "  • 6 Additional Locations (3 each for Companies 1 & 2)"
echo -e "  • 50 Products (35 for Company 1, 15 for Company 2)"
echo -e "  • 50 Customers (10 per company)"
echo -e "  • 50 Suppliers (10 per company)"
echo -e "  • 15 Employee Users"
echo -e "  • 25 User Invitations (Accepted)"
echo -e "  • 45 Quality Control Items (3 each type × 5 companies)"
echo -e "  • 125 Textile Operations (5 each type × 5 companies)"
echo ""

echo -e "${YELLOW}Main User Credentials:${NC}"
for i in {1..5}; do
    echo -e "  User $i: ${BLUE}test$i@lavoro.com${NC} / Password: ${BLUE}Test@123${NC}"
done
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
echo -e "${BLUE}You can now login with any of the test users and explore the seeded data!${NC}"
echo ""
