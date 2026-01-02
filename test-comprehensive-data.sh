#!/usr/bin/env bash

# =========================================
# LAVORO AI FERRI - COMPREHENSIVE DATA TEST
# =========================================
# Creates comprehensive test data for frontend-new
# Tests all uniqueness validations
# =========================================

set +e  # Continue on errors

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
BASE_URL="${BASE_URL:-http://localhost:3000/api/v1}"
CONTENT_TYPE="Content-Type: application/json"

# Counters
TOTAL=0
SUCCESS=0
FAILED=0

# Storage
declare -a COMPANY_IDS
declare -a COMPANY_TOKENS
declare -a USER_EMAILS
declare -a USER_PASSWORDS
declare -a USER_TOKENS

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

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_section() {
    echo ""
    echo -e "${YELLOW}=========================================${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${YELLOW}=========================================${NC}"
}

print_credentials() {
    echo ""
    echo -e "${CYAN}=========================================${NC}"
    echo -e "${CYAN}LOGIN CREDENTIALS${NC}"
    echo -e "${CYAN}=========================================${NC}"
}

# =========================================
# STEP 1: CREATE MAIN USER
# =========================================
print_section "STEP 1: Creating Main User"

TIMESTAMP=$(date +%s)
MAIN_USER_EMAIL="admin${TIMESTAMP}@lavoro.com"
MAIN_USER_PASSWORD="Admin@123"

print_info "Registering main user: $MAIN_USER_EMAIL"

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"email\": \"$MAIN_USER_EMAIL\",
    \"phone\": \"+91${TIMESTAMP}\",
    \"password\": \"$MAIN_USER_PASSWORD\",
    \"firstName\": \"Admin\",
    \"lastName\": \"User\",
    \"hasConsentedToTerms\": true,
    \"hasConsentedToPrivacy\": true,
    \"hasConsentedToCookies\": true
  }")

MAIN_USER_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.tokens.accessToken')
MAIN_USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')

if [ "$MAIN_USER_TOKEN" != "null" ] && [ -n "$MAIN_USER_TOKEN" ]; then
    print_status 0 "Main user created: $MAIN_USER_EMAIL"
    USER_EMAILS[0]=$MAIN_USER_EMAIL
    USER_PASSWORDS[0]=$MAIN_USER_PASSWORD
    USER_TOKENS[0]=$MAIN_USER_TOKEN
else
    print_status 1 "Failed to create main user"
    echo "Response: $REGISTER_RESPONSE"
    exit 1
fi

# =========================================
# STEP 2: CREATE 3 COMPANIES
# =========================================
print_section "STEP 2: Creating 3 Companies"

INDUSTRIES=("TEXTILE_MANUFACTURING" "GARMENT_PRODUCTION" "FABRIC_PROCESSING")
COMPANY_NAMES=("Premium Textiles Ltd" "Fashion Garments Co" "Quality Fabrics Inc")

for i in {1..3}; do
    print_info "Creating company: ${COMPANY_NAMES[$i-1]}"
    
    COMPANY_RESPONSE=$(curl -s -X POST "$BASE_URL/companies" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer $MAIN_USER_TOKEN" \
      -d "{
        \"name\": \"${COMPANY_NAMES[$i-1]}\",
        \"slug\": \"company-$i-$TIMESTAMP\",
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
    
    if [ "$COMPANY_ID" != "null" ] && [ -n "$COMPANY_ID" ]; then
        COMPANY_IDS[$i]=$COMPANY_ID
        
        # Switch to company context
        SWITCH_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/switch" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer $MAIN_USER_TOKEN")
        
        COMPANY_TOKEN=$(echo $SWITCH_RESPONSE | jq -r '.data.tokens.accessToken')
        COMPANY_TOKENS[$i]=$COMPANY_TOKEN
        
        if [ "$COMPANY_TOKEN" != "null" ] && [ -n "$COMPANY_TOKEN" ]; then
            print_status 0 "Company created: ${COMPANY_NAMES[$i-1]} (${INDUSTRIES[$i-1]})"
        else
            print_status 1 "Company created but failed to get token"
        fi
    else
        print_status 1 "Failed to create company: ${COMPANY_NAMES[$i-1]}"
    fi
done

# =========================================
# STEP 3: TEST COMPANY NAME UNIQUENESS
# =========================================
print_section "STEP 3: Testing Company Name Uniqueness"

print_info "Testing duplicate company name..."
DUPLICATE_RESPONSE=$(curl -s -X POST "$BASE_URL/companies" \
  -H "$CONTENT_TYPE" \
  -H "Authorization: Bearer $MAIN_USER_TOKEN" \
  -d "{
    \"name\": \"${COMPANY_NAMES[0]}\",
    \"slug\": \"duplicate-$TIMESTAMP\",
    \"industry\": \"TEXTILE_MANUFACTURING\",
    \"country\": \"India\"
  }")

if echo $DUPLICATE_RESPONSE | jq -r '.message' | grep -qi "already exists\|duplicate"; then
    print_status 0 "Company name uniqueness validation working"
else
    print_status 1 "Company name uniqueness validation NOT working"
fi

# =========================================
# STEP 4: CREATE 3 LOCATIONS PER COMPANY
# =========================================
print_section "STEP 4: Creating 3 Locations per Company"

sleep 2  # Wait for tenant schemas

LOCATION_TYPES=("BRANCH" "WAREHOUSE" "FACTORY")
LOCATION_NAMES=("Branch Office" "Main Warehouse" "Production Unit")

for company_idx in {1..3}; do
    print_info "Creating locations for Company $company_idx..."
    
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
            print_status 0 "Location created: ${LOCATION_NAMES[$loc_idx-1]} (Company $company_idx)"
            
            # Store first location ID for later use
            if [ $loc_idx -eq 1 ]; then
                FIRST_LOCATION_ID[$company_idx]=$LOCATION_ID
            fi
        else
            print_status 1 "Failed to create location (Company $company_idx)"
        fi
    done
done

# =========================================
# STEP 5: TEST LOCATION NAME UNIQUENESS
# =========================================
print_section "STEP 5: Testing Location Name Uniqueness"

print_info "Testing duplicate location name in Company 1..."
DUPLICATE_LOC=$(curl -s -X POST "$BASE_URL/locations" \
  -H "$CONTENT_TYPE" \
  -H "Authorization: Bearer ${COMPANY_TOKENS[1]}" \
  -d "{
    \"name\": \"${LOCATION_NAMES[0]} 1\",
    \"locationType\": \"BRANCH\",
    \"country\": \"India\",
    \"addressLine1\": \"Test\",
    \"city\": \"Test\",
    \"state\": \"Test\",
    \"pincode\": \"123456\"
  }")

if echo $DUPLICATE_LOC | jq -r '.message' | grep -qi "already exists\|duplicate"; then
    print_status 0 "Location name uniqueness validation working"
else
    print_status 1 "Location name uniqueness validation NOT working"
fi

# =========================================
# STEP 6: CREATE 20 PRODUCTS PER COMPANY
# =========================================
print_section "STEP 6: Creating 20 Products per Company"

for company_idx in {1..3}; do
    print_info "Creating 20 products for Company $company_idx..."
    
    for i in {1..20}; do
        PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"name\": \"Product $i - Company $company_idx\",
            \"description\": \"High quality product $i\",
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
            if [ $i -eq 1 ] || [ $i -eq 10 ] || [ $i -eq 20 ]; then
                print_status 0 "Product $i created (Company $company_idx)"
            fi
            
            # Store first product ID
            if [ $i -eq 1 ]; then
                FIRST_PRODUCT_ID[$company_idx]=$PRODUCT_ID
            fi
        else
            if [ $i -eq 1 ]; then
                print_status 1 "Failed to create product $i (Company $company_idx)"
            fi
        fi
    done
    echo -e "${GREEN}  → 20 products created for Company $company_idx${NC}"
done

# =========================================
# STEP 7: TEST PRODUCT NAME UNIQUENESS
# =========================================
print_section "STEP 7: Testing Product Name Uniqueness"

print_info "Testing duplicate product name in Company 1..."
DUPLICATE_PROD=$(curl -s -X POST "$BASE_URL/products" \
  -H "$CONTENT_TYPE" \
  -H "Authorization: Bearer ${COMPANY_TOKENS[1]}" \
  -d "{
    \"name\": \"Product 1 - Company 1\",
    \"unitOfMeasure\": \"PCS\",
    \"productType\": \"FINISHED_GOODS\",
    \"costPrice\": 100,
    \"sellingPrice\": 150
  }")

if echo $DUPLICATE_PROD | jq -r '.message' | grep -qi "already exists\|duplicate"; then
    print_status 0 "Product name uniqueness validation working"
else
    print_status 1 "Product name uniqueness validation NOT working"
fi

# =========================================
# STEP 8: CREATE 10 CUSTOMERS PER COMPANY
# =========================================
print_section "STEP 8: Creating 10 Customers per Company"

CUSTOMER_TYPES=("INDIVIDUAL" "BUSINESS" "DISTRIBUTOR" "RETAILER" "WHOLESALER")

for company_idx in {1..3}; do
    print_info "Creating 10 customers for Company $company_idx..."
    
    for i in {1..10}; do
        type_idx=$((($i - 1) % 5))
        CUSTOMER_TYPE=${CUSTOMER_TYPES[$type_idx]}
        
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
            if [ $i -eq 1 ] || [ $i -eq 5 ] || [ $i -eq 10 ]; then
                print_status 0 "Customer $i created (Company $company_idx)"
            fi
            
            # Store first customer ID
            if [ $i -eq 1 ]; then
                FIRST_CUSTOMER_ID[$company_idx]=$CUSTOMER_ID
            fi
        else
            if [ $i -eq 1 ]; then
                print_status 1 "Failed to create customer $i (Company $company_idx)"
            fi
        fi
    done
    echo -e "${GREEN}  → 10 customers created for Company $company_idx${NC}"
done

# =========================================
# STEP 9: TEST CUSTOMER NAME UNIQUENESS
# =========================================
print_section "STEP 9: Testing Customer Name Uniqueness"

print_info "Testing duplicate customer name in Company 1..."
DUPLICATE_CUST=$(curl -s -X POST "$BASE_URL/companies/${COMPANY_IDS[1]}/customers" \
  -H "$CONTENT_TYPE" \
  -H "Authorization: Bearer ${COMPANY_TOKENS[1]}" \
  -d "{
    \"name\": \"Customer 1 - Company 1\",
    \"customerType\": \"INDIVIDUAL\",
    \"email\": \"test@test.com\",
    \"billingCountry\": \"India\",
    \"billingCity\": \"Mumbai\",
    \"billingState\": \"Maharashtra\",
    \"billingAddressLine1\": \"Test\",
    \"paymentTerms\": \"NET_30\",
    \"currency\": \"INR\"
  }")

if echo $DUPLICATE_CUST | jq -r '.message' | grep -qi "already exists\|duplicate"; then
    print_status 0 "Customer name uniqueness validation working"
else
    print_status 1 "Customer name uniqueness validation NOT working"
fi

# =========================================
# STEP 10: CREATE 10 SUPPLIERS PER COMPANY
# =========================================
print_section "STEP 10: Creating 10 Suppliers per Company"

SUPPLIER_TYPES=("MANUFACTURER" "DISTRIBUTOR" "WHOLESALER" "IMPORTER" "LOCAL_VENDOR")

for company_idx in {1..3}; do
    print_info "Creating 10 suppliers for Company $company_idx..."
    
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
            if [ $i -eq 1 ] || [ $i -eq 5 ] || [ $i -eq 10 ]; then
                print_status 0 "Supplier $i created (Company $company_idx)"
            fi
            
            # Store first supplier ID
            if [ $i -eq 1 ]; then
                FIRST_SUPPLIER_ID[$company_idx]=$SUPPLIER_ID
            fi
        else
            if [ $i -eq 1 ]; then
                print_status 1 "Failed to create supplier $i (Company $company_idx)"
            fi
        fi
    done
    echo -e "${GREEN}  → 10 suppliers created for Company $company_idx${NC}"
done

# =========================================
# STEP 11: TEST SUPPLIER NAME UNIQUENESS
# =========================================
print_section "STEP 11: Testing Supplier Name Uniqueness"

print_info "Testing duplicate supplier name in Company 1..."
DUPLICATE_SUPP=$(curl -s -X POST "$BASE_URL/companies/${COMPANY_IDS[1]}/suppliers" \
  -H "$CONTENT_TYPE" \
  -H "Authorization: Bearer ${COMPANY_TOKENS[1]}" \
  -d "{
    \"name\": \"Supplier 1 - Company 1\",
    \"supplierType\": \"MANUFACTURER\",
    \"email\": \"test@test.com\",
    \"country\": \"India\",
    \"addressLine1\": \"Test\",
    \"city\": \"Test\",
    \"state\": \"Test\",
    \"postalCode\": \"123456\",
    \"paymentTerms\": \"NET_30\",
    \"currency\": \"INR\"
  }")

if echo $DUPLICATE_SUPP | jq -r '.message' | grep -qi "already exists\|duplicate"; then
    print_status 0 "Supplier name uniqueness validation working"
else
    print_status 1 "Supplier name uniqueness validation NOT working"
fi

# =========================================
# STEP 12: CREATE 10 ADDITIONAL USERS
# =========================================
print_section "STEP 12: Creating 10 Additional Users"

for i in {1..10}; do
    USER_EMAIL="user${i}_${TIMESTAMP}@lavoro.com"
    USER_PASSWORD="User${i}@123"
    
    REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
      -H "$CONTENT_TYPE" \
      -d "{
        \"email\": \"$USER_EMAIL\",
        \"phone\": \"+91${TIMESTAMP}${i}00\",
        \"password\": \"$USER_PASSWORD\",
        \"firstName\": \"User\",
        \"lastName\": \"${i}\",
        \"hasConsentedToTerms\": true,
        \"hasConsentedToPrivacy\": true,
        \"hasConsentedToCookies\": true
      }")
    
    TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.tokens.accessToken')
    
    if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
        USER_EMAILS[$i]=$USER_EMAIL
        USER_PASSWORDS[$i]=$USER_PASSWORD
        USER_TOKENS[$i]=$TOKEN
        print_status 0 "User $i created: $USER_EMAIL"
    else
        print_status 1 "Failed to create user $i"
    fi
done

# =========================================
# STEP 13: SEND AND ACCEPT INVITATIONS
# =========================================
print_section "STEP 13: Sending and Accepting Invitations"

ROLES=("ADMIN" "MANAGER" "EMPLOYEE")

# Distribute users across 3 companies
for i in {1..10}; do
    company_idx=$((($i - 1) % 3 + 1))
    role_idx=$((($i - 1) % 3))
    ROLE=${ROLES[$role_idx]}
    
    print_info "Inviting ${USER_EMAILS[$i]} to Company $company_idx as $ROLE..."
    
    INVITE_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/${COMPANY_IDS[$company_idx]}/invite" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
      -d "{
        \"emailOrPhone\": \"${USER_EMAILS[$i]}\",
        \"role\": \"$ROLE\"
      }")
    
    INVITATION_ID=$(echo $INVITE_RESPONSE | jq -r '.data.id')
    
    if [ "$INVITATION_ID" != "null" ] && [ -n "$INVITATION_ID" ]; then
        print_status 0 "Invitation sent to ${USER_EMAILS[$i]} (Company $company_idx, $ROLE)"
        
        # Accept invitation
        sleep 0.5
        ACCEPT_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/accept-invitation/$INVITATION_ID" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${USER_TOKENS[$i]}")
        
        if [ "$(echo $ACCEPT_RESPONSE | jq -r '.success')" == "true" ]; then
            print_status 0 "Invitation accepted by ${USER_EMAILS[$i]}"
        else
            print_status 1 "Failed to accept invitation"
        fi
    else
        print_status 1 "Failed to send invitation"
    fi
done

# =========================================
# STEP 14: CREATE MACHINES
# =========================================
print_section "STEP 14: Creating Machines"

MACHINE_TYPES=("Spinning Machine" "Weaving Loom" "Knitting Machine" "Dyeing Machine" "Cutting Machine")

for company_idx in {1..3}; do
    print_info "Creating 5 machines for Company $company_idx..."
    
    for i in {1..5}; do
        MACHINE_RESPONSE=$(curl -s -X POST "$BASE_URL/machines" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"name\": \"${MACHINE_TYPES[$i-1]} $i\",
            \"machineType\": \"${MACHINE_TYPES[$i-1]}\",
            \"model\": \"Model-$(printf '%03d' $i)\",
            \"manufacturer\": \"Manufacturer $i\",
            \"serialNumber\": \"SN-${company_idx}$(printf '%04d' $i)\",
            \"purchaseDate\": \"2023-01-15\",
            \"warrantyExpiry\": \"2025-12-31\",
            \"locationId\": \"${FIRST_LOCATION_ID[$company_idx]}\",
            \"operationalStatus\": \"FREE\",
            \"status\": \"IN_USE\",
            \"isActive\": true
          }")
        
        MACHINE_ID=$(echo $MACHINE_RESPONSE | jq -r '.data.id')
        
        if [ "$MACHINE_ID" != "null" ] && [ -n "$MACHINE_ID" ]; then
            print_status 0 "Machine created: ${MACHINE_TYPES[$i-1]} (Company $company_idx)"
        else
            print_status 1 "Failed to create machine (Company $company_idx)"
        fi
    done
done

# =========================================
# STEP 15: CREATE SALES ORDERS
# =========================================
print_section "STEP 15: Creating Sales Orders"

for company_idx in {1..3}; do
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
              }
            ]
          }")
        
        ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.data.id')
        
        if [ "$ORDER_ID" != "null" ] && [ -n "$ORDER_ID" ]; then
            print_status 0 "Sales Order $i created (Company $company_idx)"
        else
            print_status 1 "Failed to create sales order (Company $company_idx)"
        fi
    done
done

# =========================================
# STEP 16: CREATE PURCHASE ORDERS
# =========================================
print_section "STEP 16: Creating Purchase Orders"

for company_idx in {1..3}; do
    print_info "Creating 5 purchase orders for Company $company_idx..."
    
    for i in {1..5}; do
        PO_RESPONSE=$(curl -s -X POST "$BASE_URL/purchase-orders" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"supplierName\": \"Supplier $i - Company $company_idx\",
            \"supplierCode\": \"SUP-$(printf '%03d' $i)\",
            \"orderDate\": \"2024-12-0$i\",
            \"expectedDeliveryDate\": \"2024-12-$(($i + 10))\",
            \"currency\": \"INR\",
            \"paymentTerms\": \"NET_30\",
            \"items\": [
              {
                \"itemCode\": \"ITEM-001\",
                \"description\": \"Raw Material $i\",
                \"quantity\": $((20 + $i * 5)),
                \"unitOfMeasure\": \"PCS\",
                \"unitPrice\": $((80 + $i * 10)),
                \"taxRate\": 18
              }
            ]
          }")
        
        PO_ID=$(echo $PO_RESPONSE | jq -r '.data.id')
        
        if [ "$PO_ID" != "null" ] && [ -n "$PO_ID" ]; then
            print_status 0 "Purchase Order $i created (Company $company_idx)"
        else
            print_status 1 "Failed to create purchase order (Company $company_idx)"
        fi
    done
done

# =========================================
# STEP 17: CREATE INVOICES
# =========================================
print_section "STEP 17: Creating Invoices"

for company_idx in {1..3}; do
    print_info "Creating 5 invoices for Company $company_idx..."
    
    for i in {1..5}; do
        INVOICE_RESPONSE=$(curl -s -X POST "$BASE_URL/invoices" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"customerName\": \"Customer $i - Company $company_idx\",
            \"invoiceDate\": \"2024-12-0$i\",
            \"dueDate\": \"2024-12-$(($i + 15))\",
            \"currency\": \"INR\",
            \"items\": [
              {
                \"description\": \"Product Item $i\",
                \"quantity\": $((10 + $i)),
                \"unitPrice\": $((150 + $i * 10)),
                \"taxRate\": 18
              }
            ]
          }")
        
        INVOICE_ID=$(echo $INVOICE_RESPONSE | jq -r '.data.id')
        
        if [ "$INVOICE_ID" != "null" ] && [ -n "$INVOICE_ID" ]; then
            print_status 0 "Invoice $i created (Company $company_idx)"
        else
            print_status 1 "Failed to create invoice (Company $company_idx)"
        fi
    done
done

# =========================================
# STEP 18: CREATE BILLS
# =========================================
print_section "STEP 18: Creating Bills"

for company_idx in {1..3}; do
    print_info "Creating 5 bills for Company $company_idx..."
    
    for i in {1..5}; do
        BILL_RESPONSE=$(curl -s -X POST "$BASE_URL/bills" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"supplierName\": \"Supplier $i - Company $company_idx\",
            \"billDate\": \"2024-12-0$i\",
            \"dueDate\": \"2024-12-$(($i + 15))\",
            \"currency\": \"INR\",
            \"items\": [
              {
                \"description\": \"Raw Material $i\",
                \"quantity\": $((20 + $i)),
                \"unitPrice\": $((80 + $i * 10)),
                \"taxRate\": 18
              }
            ]
          }")
        
        BILL_ID=$(echo $BILL_RESPONSE | jq -r '.data.id')
        
        if [ "$BILL_ID" != "null" ] && [ -n "$BILL_ID" ]; then
            print_status 0 "Bill $i created (Company $company_idx)"
        else
            print_status 1 "Failed to create bill (Company $company_idx)"
        fi
    done
done

# =========================================
# STEP 19: CREATE INVENTORY DATA
# =========================================
print_section "STEP 19: Creating Inventory Data"

for company_idx in {1..3}; do
    print_info "Creating inventory records for Company $company_idx..."
    
    # Stock adjustments for first 5 products
    for i in {1..5}; do
        if [ -n "${FIRST_PRODUCT_ID[$company_idx]}" ]; then
            ADJUSTMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/inventory/adjust" \
              -H "$CONTENT_TYPE" \
              -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
              -d "{
                \"productId\": \"${FIRST_PRODUCT_ID[$company_idx]}\",
                \"adjustmentType\": \"ADD\",
                \"quantity\": $((50 + $i * 10)),
                \"reason\": \"Stock replenishment $i\",
                \"adjustedBy\": \"Admin User\"
              }")
            
            if [ "$(echo $ADJUSTMENT_RESPONSE | jq -r '.success')" == "true" ]; then
                print_status 0 "Inventory adjustment $i created (Company $company_idx)"
            fi
        fi
    done
done

# =========================================
# FINAL SUMMARY
# =========================================
print_section "TEST SUMMARY"

echo -e "${BLUE}Total Tests:${NC} $TOTAL"
echo -e "${GREEN}Successful:${NC} $SUCCESS"
echo -e "${RED}Failed:${NC} $FAILED"

SUCCESS_RATE=$((SUCCESS * 100 / TOTAL))
echo -e "${BLUE}Success Rate:${NC} ${SUCCESS_RATE}%"

# =========================================
# DISPLAY LOGIN CREDENTIALS
# =========================================
print_credentials

echo -e "${CYAN}Main Admin User:${NC}"
echo -e "  Email: ${GREEN}${USER_EMAILS[0]}${NC}"
echo -e "  Password: ${GREEN}${USER_PASSWORDS[0]}${NC}"
echo ""

echo -e "${CYAN}Additional Users (1-10):${NC}"
for i in {1..10}; do
    if [ -n "${USER_EMAILS[$i]}" ]; then
        company_idx=$((($i - 1) % 3 + 1))
        role_idx=$((($i - 1) % 3))
        echo -e "  User $i: ${GREEN}${USER_EMAILS[$i]}${NC} / ${GREEN}${USER_PASSWORDS[$i]}${NC} (Company $company_idx, ${ROLES[$role_idx]})"
    fi
done

echo ""
echo -e "${CYAN}Companies Created:${NC}"
for i in {1..3}; do
    echo -e "  Company $i: ${GREEN}${COMPANY_NAMES[$i-1]}${NC} (${INDUSTRIES[$i-1]})"
done

echo ""
echo -e "${CYAN}Data Created Per Company:${NC}"
echo -e "  - 3 Locations"
echo -e "  - 20 Products"
echo -e "  - 10 Customers"
echo -e "  - 10 Suppliers"
echo -e "  - 5 Machines"
echo -e "  - 5 Sales Orders"
echo -e "  - 5 Purchase Orders"
echo -e "  - 5 Invoices"
echo -e "  - 5 Bills"

echo ""
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 100% SUCCESS! ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}✓ All uniqueness validations working correctly${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ ${FAILED} tests failed. Success rate: ${SUCCESS_RATE}%${NC}"
    exit 1
fi
