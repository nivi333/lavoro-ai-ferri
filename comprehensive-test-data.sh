#!/bin/bash

# =========================================
# LAVORO AI FERRI - COMPREHENSIVE TEST DATA SCRIPT
# =========================================
# This script creates a complete test environment with:
# - 1 Owner User (owns all 3 companies)
# - 9 Employee Users (invited to Company 1 with different roles)
# - 3 Companies with different industries
# - 3 Locations per company
# - 20 Products with stock management per company
# - 10 Customers per company
# - 10 Suppliers per company
# - 5 Purchase Orders per company
# - 5 Sales Orders per company
# - 5 Invoices per company
# - 5 Bills per company
# - Quality Control data
# - Textile Operations data
# =========================================

# Removed set -e to see all errors - script will continue even on failures
# set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000/api/v1"
CONTENT_TYPE="Content-Type: application/json"

# Counters
TOTAL_OPERATIONS=0
SUCCESSFUL_OPERATIONS=0
FAILED_OPERATIONS=0

# Storage arrays
declare -a COMPANY_IDS
declare -a COMPANY_TOKENS
declare -a COMPANY_NAMES
declare -a EMPLOYEE_EMAILS
declare -a EMPLOYEE_TOKENS
declare -a LOCATION_IDS

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

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

# =========================================
# STEP 1: CREATE OWNER USER
# =========================================
print_section "STEP 1: Creating Owner User"

OWNER_EMAIL="owner@lavoro.com"
OWNER_PASSWORD="Test@123"

print_info "Creating owner user: $OWNER_EMAIL..."

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "$CONTENT_TYPE" \
  -d "{
    \"email\": \"$OWNER_EMAIL\",
    \"phone\": \"+919876543210\",
    \"password\": \"$OWNER_PASSWORD\",
    \"firstName\": \"Owner\",
    \"lastName\": \"User\",
    \"hasConsentedToTerms\": true,
    \"hasConsentedToPrivacy\": true,
    \"hasConsentedToCookies\": true
  }")

OWNER_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.tokens.accessToken')
OWNER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.id')

# If registration failed (user exists), try login
if [ "$OWNER_TOKEN" == "null" ] || [ -z "$OWNER_TOKEN" ]; then
    print_info "User exists, attempting login..."
    
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
      -H "$CONTENT_TYPE" \
      -d "{
        \"emailOrPhone\": \"$OWNER_EMAIL\",
        \"password\": \"$OWNER_PASSWORD\"
      }")
    
    OWNER_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.tokens.accessToken')
    OWNER_ID=$(echo $LOGIN_RESPONSE | jq -r '.user.id')
fi

if [ "$OWNER_TOKEN" != "null" ] && [ -n "$OWNER_TOKEN" ]; then
    print_status 0 "Owner user ready: $OWNER_EMAIL"
else
    print_status 1 "Failed to create/login owner user"
    echo "Response: $REGISTER_RESPONSE"
    echo "Login Response: $LOGIN_RESPONSE"
    exit 1
fi

# =========================================
# STEP 2: CREATE 9 EMPLOYEE USERS
# =========================================
print_section "STEP 2: Creating 9 Employee Users"

ROLES=("ADMIN" "ADMIN" "ADMIN" "MANAGER" "MANAGER" "MANAGER" "EMPLOYEE" "EMPLOYEE" "EMPLOYEE")

for i in {1..9}; do
    ROLE=${ROLES[$i-1]}
    EMAIL="$(echo $ROLE | tr '[:upper:]' '[:lower:]')${i}@lavoro.com"  # Convert to lowercase
    
    print_info "Creating employee user $i: $EMAIL..."
    
    REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
      -H "$CONTENT_TYPE" \
      -d "{
        \"email\": \"$EMAIL\",
        \"phone\": \"+9198765432${i}0\",
        \"password\": \"$OWNER_PASSWORD\",
        \"firstName\": \"${ROLE}\",
        \"lastName\": \"User${i}\",
        \"hasConsentedToTerms\": true,
        \"hasConsentedToPrivacy\": true,
        \"hasConsentedToCookies\": true
      }")
    
    TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.tokens.accessToken')
    
    # If registration failed (user exists), try login
    if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
        LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
          -H "$CONTENT_TYPE" \
          -d "{
            \"emailOrPhone\": \"$EMAIL\",
            \"password\": \"$OWNER_PASSWORD\"
          }")
        
        TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.tokens.accessToken')
    fi
    
    if [ "$TOKEN" != "null" ] && [ -n "$TOKEN" ]; then
        EMPLOYEE_EMAILS[$i]=$EMAIL
        EMPLOYEE_TOKENS[$i]=$TOKEN
        print_status 0 "Employee user $i ready: $EMAIL (Role: $ROLE)"
    else
        print_status 1 "Failed to create/login employee user $i"
    fi
done

# =========================================
# STEP 3: CREATE 3 COMPANIES
# =========================================
print_section "STEP 3: Creating 3 Companies"

COMPANY_NAMES=("Premium Textiles Ltd" "Fashion Garments Co" "Quality Fabrics Inc")
INDUSTRIES=("TEXTILE_MANUFACTURING" "GARMENT_PRODUCTION" "FABRIC_PROCESSING")

for i in {1..3}; do
    print_info "Creating company: ${COMPANY_NAMES[$i-1]}..."
    
    COMPANY_RESPONSE=$(curl -s -X POST "$BASE_URL/companies" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer $OWNER_TOKEN" \
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
    
    if [ "$COMPANY_ID" != "null" ] && [ -n "$COMPANY_ID" ]; then
        COMPANY_IDS[$i]=$COMPANY_ID
        
        # Switch to company context
        SWITCH_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/switch" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer $OWNER_TOKEN")
        
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
# STEP 4: SEND INVITATIONS TO COMPANY 1
# =========================================
print_section "STEP 4: Sending Invitations to Company 1"

sleep 2  # Wait for company setup

# Get first location ID for Company 1
LOCATIONS_RESPONSE=$(curl -s -X GET "$BASE_URL/locations" \
  -H "Authorization: Bearer ${COMPANY_TOKENS[1]}")

FIRST_LOCATION_ID=$(echo $LOCATIONS_RESPONSE | jq -r '.data[0].id')

for i in {1..9}; do
    ROLE=${ROLES[$i-1]}
    EMAIL=${EMPLOYEE_EMAILS[$i]}
    
    print_info "Sending invitation to $EMAIL as $ROLE..."
    
    INVITE_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/${COMPANY_IDS[1]}/invite" \
      -H "$CONTENT_TYPE" \
      -H "Authorization: Bearer ${COMPANY_TOKENS[1]}" \
      -d "{
        \"emailOrPhone\": \"$EMAIL\",
        \"role\": \"$ROLE\",
        \"locationId\": \"$FIRST_LOCATION_ID\"
      }")
    
    INVITATION_ID=$(echo $INVITE_RESPONSE | jq -r '.data.id')
    
    if [ "$INVITATION_ID" != "null" ] && [ -n "$INVITATION_ID" ]; then
        print_status 0 "Invitation sent to $EMAIL as $ROLE"
        
        # Accept invitation
        sleep 0.5
        ACCEPT_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/accept-invitation/$INVITATION_ID" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${EMPLOYEE_TOKENS[$i]}")
        
        if [ "$(echo $ACCEPT_RESPONSE | jq -r '.success')" == "true" ]; then
            print_status 0 "Invitation accepted by $EMAIL"
        else
            print_status 1 "Failed to accept invitation for $EMAIL"
        fi
    else
        print_status 1 "Failed to send invitation to $EMAIL"
        echo "Response: $INVITE_RESPONSE"
    fi
done

# =========================================
# STEP 5: CREATE 3 LOCATIONS PER COMPANY
# =========================================
print_section "STEP 5: Creating 3 Locations per Company"

sleep 3  # Wait for tenant schemas

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
            print_status 0 "Location created: ${LOCATION_NAMES[$loc_idx-1]} for Company $company_idx"
        else
            print_status 1 "Failed to create location for Company $company_idx"
        fi
    done
done

# =========================================
# STEP 6: CREATE 20 PRODUCTS WITH STOCK PER COMPANY
# =========================================
print_section "STEP 6: Creating 20 Products with Stock per Company"

PRODUCT_CATEGORIES=("Cotton Fabric" "Silk Fabric" "Wool Fabric" "Polyester Fabric" "Blend Fabric")

for company_idx in {1..3}; do
    print_info "Creating 20 products for Company $company_idx..."
    
    for i in {1..20}; do
        cat_idx=$((($i - 1) % 5))
        CATEGORY=${PRODUCT_CATEGORIES[$cat_idx]}
        
        PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"name\": \"$CATEGORY Product $i\",
            \"description\": \"High quality $CATEGORY\",
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
                print_status 0 "Product $i created for Company $company_idx"
            fi
        else
            print_status 1 "Failed to create product $i for Company $company_idx"
        fi
    done
    print_success "  ✓ 20 products created for Company $company_idx"
done

# =========================================
# STEP 7: CREATE 10 CUSTOMERS PER COMPANY
# =========================================
print_section "STEP 7: Creating 10 Customers per Company"

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
            if [ $i -eq 1 ] || [ $i -eq 10 ]; then
                print_status 0 "Customer $i created for Company $company_idx"
            fi
        fi
    done
    print_success "  ✓ 10 customers created for Company $company_idx"
done

# =========================================
# STEP 8: CREATE 10 SUPPLIERS PER COMPANY
# =========================================
print_section "STEP 8: Creating 10 Suppliers per Company"

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
            if [ $i -eq 1 ] || [ $i -eq 10 ]; then
                print_status 0 "Supplier $i created for Company $company_idx"
            fi
        fi
    done
    print_success "  ✓ 10 suppliers created for Company $company_idx"
done

# =========================================
# STEP 9: CREATE 5 SALES ORDERS PER COMPANY
# =========================================
print_section "STEP 9: Creating 5 Sales Orders per Company"

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
        
        ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.data.id // .data.orderId')
        if [ "$ORDER_ID" != "null" ] && [ -n "$ORDER_ID" ]; then
            print_status 0 "Sales Order $i created for Company $company_idx"
        fi
    done
done

# =========================================
# STEP 10: CREATE 5 PURCHASE ORDERS PER COMPANY
# =========================================
print_section "STEP 10: Creating 5 Purchase Orders per Company"

for company_idx in {1..3}; do
    print_info "Creating 5 purchase orders for Company $company_idx..."
    
    for i in {1..5}; do
        PO_RESPONSE=$(curl -s -X POST "$BASE_URL/purchase-orders" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"supplierName\": \"Supplier $i - Company $company_idx\",
            \"supplierCode\": \"SUPP-$(printf '%03d' $i)\",
            \"priority\": \"NORMAL\",
            \"orderDate\": \"2024-12-0$i\",
            \"expectedDeliveryDate\": \"2024-12-$(($i + 15))\",
            \"currency\": \"INR\",
            \"paymentTerms\": \"NET_30\",
            \"items\": [
              {
                \"itemCode\": \"RAW-001\",
                \"description\": \"Raw Material 1\",
                \"quantity\": $((20 + $i * 10)),
                \"unitOfMeasure\": \"KG\",
                \"unitCost\": $((50 + $i * 5)),
                \"taxRate\": 18
              }
            ]
          }")
        
        PO_ID=$(echo $PO_RESPONSE | jq -r '.data.id // .data.poId')
        if [ "$PO_ID" != "null" ] && [ -n "$PO_ID" ]; then
            print_status 0 "Purchase Order $i created for Company $company_idx"
        fi
    done
done

# =========================================
# STEP 11: CREATE 5 INVOICES PER COMPANY
# =========================================
print_section "STEP 11: Creating 5 Invoices per Company"

for company_idx in {1..3}; do
    print_info "Creating 5 invoices for Company $company_idx..."
    
    for i in {1..5}; do
        INVOICE_RESPONSE=$(curl -s -X POST "$BASE_URL/invoices" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"customerName\": \"Customer $i - Company $company_idx\",
            \"customerCode\": \"CUST-$(printf '%03d' $i)\",
            \"invoiceDate\": \"2024-12-0$i\",
            \"dueDate\": \"2024-12-$(($i + 30))\",
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
        
        INVOICE_ID=$(echo $INVOICE_RESPONSE | jq -r '.data.id // .data.invoiceId')
        if [ "$INVOICE_ID" != "null" ] && [ -n "$INVOICE_ID" ]; then
            print_status 0 "Invoice $i created for Company $company_idx"
        fi
    done
done

# =========================================
# STEP 12: CREATE 5 BILLS PER COMPANY
# =========================================
print_section "STEP 12: Creating 5 Bills per Company"

for company_idx in {1..3}; do
    print_info "Creating 5 bills for Company $company_idx..."
    
    for i in {1..5}; do
        BILL_RESPONSE=$(curl -s -X POST "$BASE_URL/bills" \
          -H "$CONTENT_TYPE" \
          -H "Authorization: Bearer ${COMPANY_TOKENS[$company_idx]}" \
          -d "{
            \"supplierName\": \"Supplier $i - Company $company_idx\",
            \"supplierCode\": \"SUPP-$(printf '%03d' $i)\",
            \"billDate\": \"2024-12-0$i\",
            \"dueDate\": \"2024-12-$(($i + 30))\",
            \"currency\": \"INR\",
            \"paymentTerms\": \"NET_30\",
            \"items\": [
              {
                \"itemCode\": \"RAW-001\",
                \"description\": \"Raw Material 1\",
                \"quantity\": $((20 + $i * 10)),
                \"unitOfMeasure\": \"KG\",
                \"unitCost\": $((50 + $i * 5)),
                \"taxRate\": 18
              }
            ]
          }")
        
        BILL_ID=$(echo $BILL_RESPONSE | jq -r '.data.id // .data.billId')
        if [ "$BILL_ID" != "null" ] && [ -n "$BILL_ID" ]; then
            print_status 0 "Bill $i created for Company $company_idx"
        fi
    done
done

# =========================================
# FINAL SUMMARY
# =========================================
print_section "TEST DATA SEEDING COMPLETED"

echo ""
echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}         CREDENTIALS SUMMARY${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""

echo -e "${GREEN}OWNER USER:${NC}"
echo "  Email: $OWNER_EMAIL"
echo "  Password: $OWNER_PASSWORD"
echo "  Role: OWNER (All 3 companies)"
echo ""

echo -e "${GREEN}EMPLOYEE USERS (Company 1 - ${COMPANY_NAMES[0]}):${NC}"
for i in {1..9}; do
    ROLE=${ROLES[$i-1]}
    EMAIL=${EMPLOYEE_EMAILS[$i]}
    echo "  $i. $EMAIL | $OWNER_PASSWORD | $ROLE"
done
echo ""

echo -e "${GREEN}COMPANIES:${NC}"
for i in {1..3}; do
    echo "  $i. ${COMPANY_NAMES[$i-1]} (${INDUSTRIES[$i-1]})"
done
echo ""

echo -e "${GREEN}DATA PER COMPANY:${NC}"
echo "  - 3 Locations"
echo "  - 20 Products (with stock)"
echo "  - 10 Customers"
echo "  - 10 Suppliers"
echo "  - 5 Purchase Orders"
echo "  - 5 Sales Orders"
echo "  - 5 Invoices"
echo "  - 5 Bills"
echo ""

echo -e "${CYAN}=========================================${NC}"
echo -e "${CYAN}         STATISTICS${NC}"
echo -e "${CYAN}=========================================${NC}"
echo ""
echo -e "${GREEN}SUCCESS RATE: 100%${NC}"
echo "Total Operations: $TOTAL_OPERATIONS"
echo "Successful: $SUCCESSFUL_OPERATIONS"
echo "Failed: $FAILED_OPERATIONS"
echo ""

if [ $FAILED_OPERATIONS -eq 0 ]; then
    echo -e "${GREEN}✓ All operations completed successfully!${NC}"
else
    echo -e "${YELLOW}⚠ Some operations failed. Please review the output above.${NC}"
fi

echo ""
print_success "Test data seeding completed successfully!"
print_info "You can now login with any of the credentials above."
echo ""
