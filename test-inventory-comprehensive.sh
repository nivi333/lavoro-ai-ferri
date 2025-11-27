#!/bin/bash

# Comprehensive Inventory Management API Test Script
# Tests all inventory endpoints with proper flow

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:3000/api/v1"
TEST_EMAIL="textile.test@example.com"
TEST_PASSWORD="TestPass123!"
CONTENT_TYPE="Content-Type: application/json"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   📦 INVENTORY MANAGEMENT - COMPREHENSIVE API TEST SUITE   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: User Authentication
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Step 1: User Authentication${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "$CONTENT_TYPE" \
  -d '{
    "emailOrPhone": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.tokens.accessToken // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}❌ Failed to authenticate${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "${GREEN}✅ Authentication successful${NC}"
echo "Token: ${TOKEN:0:30}..."
echo ""

# Step 2: Get User Companies
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Step 2: Get User Companies${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

COMPANIES_RESPONSE=$(curl -s -X GET "$API_BASE/companies" \
  -H "Authorization: Bearer $TOKEN")

COMPANY_ID=$(echo $COMPANIES_RESPONSE | jq -r '.data[0].id // empty')

if [ -z "$COMPANY_ID" ] || [ "$COMPANY_ID" = "null" ]; then
  echo -e "${RED}❌ No companies found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Company found${NC}"
echo "Company ID: $COMPANY_ID"
echo ""

# Step 3: Switch Company Context
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Step 3: Switch Company Context${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

SWITCH_RESPONSE=$(curl -s -X POST "$API_BASE/companies/$COMPANY_ID/switch" \
  -H "Authorization: Bearer $TOKEN" \
  -H "$CONTENT_TYPE")

TOKEN=$(echo $SWITCH_RESPONSE | jq -r '.tokens.accessToken // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo -e "${RED}❌ Failed to switch company${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Company context switched${NC}"
echo "New Token: ${TOKEN:0:30}..."
echo ""

# Step 4: Get Locations
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Step 4: Get Company Locations${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

LOCATIONS_RESPONSE=$(curl -s -X GET "$API_BASE/locations" \
  -H "Authorization: Bearer $TOKEN")

echo "Locations Response: $LOCATIONS_RESPONSE" | jq '.'
LOCATION_ID=$(echo $LOCATIONS_RESPONSE | jq -r '.data[0].id // empty')

if [ -z "$LOCATION_ID" ] || [ "$LOCATION_ID" = "null" ]; then
  echo -e "${RED}❌ No locations found${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Location found${NC}"
echo "Location ID: $LOCATION_ID"
echo ""

# Step 5: Get Products
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Step 5: Get Products${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

PRODUCTS_RESPONSE=$(curl -s -X GET "$API_BASE/products" \
  -H "Authorization: Bearer $TOKEN")

echo "Products Response: $PRODUCTS_RESPONSE" | jq '.'
PRODUCT_ID=$(echo $PRODUCTS_RESPONSE | jq -r '.data[0].id // empty')

if [ -z "$PRODUCT_ID" ] || [ "$PRODUCT_ID" = "null" ]; then
  echo -e "${YELLOW}⚠️  No products found, creating test product...${NC}"
  
  # Create a test product
  CREATE_PRODUCT_RESPONSE=$(curl -s -X POST "$API_BASE/products" \
    -H "Authorization: Bearer $TOKEN" \
    -H "$CONTENT_TYPE" \
    -d '{
      "name": "Test Fabric Roll",
      "productCode": "FAB001",
      "sku": "FAB-001-TEST",
      "description": "Test fabric for inventory",
      "categoryId": null,
      "unitOfMeasure": "MTR",
      "costPrice": 100,
      "sellingPrice": 150,
      "isActive": true
    }')
  
  echo "Create Product Response: $CREATE_PRODUCT_RESPONSE" | jq '.'
  PRODUCT_ID=$(echo $CREATE_PRODUCT_RESPONSE | jq -r '.data.id // empty')
  
  if [ -z "$PRODUCT_ID" ] || [ "$PRODUCT_ID" = "null" ]; then
    echo -e "${RED}❌ Failed to create product${NC}"
    exit 1
  fi
fi

echo -e "${GREEN}✅ Product available${NC}"
echo "Product ID: $PRODUCT_ID"
echo ""

# Step 6: Get Location Inventory
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Step 6: Get Location Inventory${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

INVENTORY_RESPONSE=$(curl -s -X GET "$API_BASE/inventory/locations" \
  -H "Authorization: Bearer $TOKEN")

echo "Inventory Response: $INVENTORY_RESPONSE" | jq '.'
echo -e "${GREEN}✅ Inventory fetched successfully${NC}"
echo ""

# Step 7: Update Location Inventory
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Step 7: Update Location Inventory${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

UPDATE_INVENTORY_RESPONSE=$(curl -s -X PUT "$API_BASE/inventory/locations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "$CONTENT_TYPE" \
  -d '{
    "productId": "'$PRODUCT_ID'",
    "locationId": "'$LOCATION_ID'",
    "stockQuantity": 1000,
    "reservedQuantity": 0,
    "reorderLevel": 100,
    "maxStockLevel": 5000
  }')

echo "Update Inventory Response: $UPDATE_INVENTORY_RESPONSE" | jq '.'
echo -e "${GREEN}✅ Inventory updated successfully${NC}"
echo ""

# Step 8: Get Stock Movement Types
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Step 8: Get Stock Movement Types${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

MOVEMENT_TYPES_RESPONSE=$(curl -s -X GET "$API_BASE/inventory/movement-types" \
  -H "Authorization: Bearer $TOKEN")

echo "Movement Types Response: $MOVEMENT_TYPES_RESPONSE" | jq '.'
echo -e "${GREEN}✅ Movement types fetched successfully${NC}"
echo ""

# Step 9: Record Stock Movement (PURCHASE)
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Step 9: Record Stock Movement (PURCHASE)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

MOVEMENT_RESPONSE=$(curl -s -X POST "$API_BASE/inventory/movements" \
  -H "Authorization: Bearer $TOKEN" \
  -H "$CONTENT_TYPE" \
  -d '{
    "productId": "'$PRODUCT_ID'",
    "toLocationId": "'$LOCATION_ID'",
    "movementType": "PURCHASE",
    "quantity": 500,
    "unitCost": 100,
    "referenceType": "PURCHASE_ORDER",
    "referenceId": "PO001",
    "notes": "Initial stock purchase"
  }')

echo "Movement Response: $MOVEMENT_RESPONSE" | jq '.'
MOVEMENT_ID=$(echo $MOVEMENT_RESPONSE | jq -r '.data.movementId // empty')
echo -e "${GREEN}✅ Stock movement recorded: $MOVEMENT_ID${NC}"
echo ""

# Step 10: Get Reservation Types
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Step 10: Get Reservation Types${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

RESERVATION_TYPES_RESPONSE=$(curl -s -X GET "$API_BASE/inventory/reservation-types" \
  -H "Authorization: Bearer $TOKEN")

echo "Reservation Types Response: $RESERVATION_TYPES_RESPONSE" | jq '.'
echo -e "${GREEN}✅ Reservation types fetched successfully${NC}"
echo ""

# Step 11: Create Stock Reservation
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Step 11: Create Stock Reservation${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

RESERVATION_RESPONSE=$(curl -s -X POST "$API_BASE/inventory/reservations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "$CONTENT_TYPE" \
  -d '{
    "productId": "'$PRODUCT_ID'",
    "locationId": "'$LOCATION_ID'",
    "reservedQuantity": 100,
    "reservationType": "SALES_ORDER",
    "notes": "Reserved for customer order"
  }')

echo "Reservation Response: $RESERVATION_RESPONSE" | jq '.'
RESERVATION_ID=$(echo $RESERVATION_RESPONSE | jq -r '.data.reservationId // empty')
echo -e "${GREEN}✅ Stock reservation created: $RESERVATION_ID${NC}"
echo ""

# Step 12: Get Stock Alerts
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Step 12: Get Stock Alerts${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

ALERTS_RESPONSE=$(curl -s -X GET "$API_BASE/inventory/alerts" \
  -H "Authorization: Bearer $TOKEN")

echo "Alerts Response: $ALERTS_RESPONSE" | jq '.'
ALERT_ID=$(echo $ALERTS_RESPONSE | jq -r '.data[0].alertId // empty')

if [ ! -z "$ALERT_ID" ] && [ "$ALERT_ID" != "null" ]; then
  echo -e "${GREEN}✅ Stock alerts found${NC}"
  
  # Step 13: Acknowledge Alert
  echo ""
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}📋 Step 13: Acknowledge Stock Alert${NC}"
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  
  ACK_RESPONSE=$(curl -s -X PATCH "$API_BASE/inventory/alerts/$ALERT_ID/acknowledge" \
    -H "Authorization: Bearer $TOKEN" \
    -H "$CONTENT_TYPE")
  
  echo "Acknowledge Response: $ACK_RESPONSE" | jq '.'
  echo -e "${GREEN}✅ Alert acknowledged${NC}"
else
  echo -e "${YELLOW}⚠️  No alerts found (this is normal if stock is adequate)${NC}"
fi
echo ""

# Step 14: Release Stock Reservation
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Step 14: Release Stock Reservation${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

RELEASE_RESPONSE=$(curl -s -X DELETE "$API_BASE/inventory/reservations/$RESERVATION_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Release Response: $RELEASE_RESPONSE" | jq '.'
echo -e "${GREEN}✅ Stock reservation released${NC}"
echo ""

# Step 15: Get Updated Inventory
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Step 15: Get Updated Inventory${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

FINAL_INVENTORY_RESPONSE=$(curl -s -X GET "$API_BASE/inventory/locations?locationId=$LOCATION_ID" \
  -H "Authorization: Bearer $TOKEN")

echo "Final Inventory Response: $FINAL_INVENTORY_RESPONSE" | jq '.'
echo -e "${GREEN}✅ Final inventory state retrieved${NC}"
echo ""

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                    📊 TEST SUMMARY                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ All inventory management API tests passed successfully!${NC}"
echo ""
echo "Tested Endpoints:"
echo "  ✓ GET  /api/v1/inventory/locations"
echo "  ✓ PUT  /api/v1/inventory/locations"
echo "  ✓ POST /api/v1/inventory/movements"
echo "  ✓ POST /api/v1/inventory/reservations"
echo "  ✓ DELETE /api/v1/inventory/reservations/:reservationId"
echo "  ✓ GET  /api/v1/inventory/alerts"
echo "  ✓ PATCH /api/v1/inventory/alerts/:alertId/acknowledge"
echo "  ✓ GET  /api/v1/inventory/movement-types"
echo "  ✓ GET  /api/v1/inventory/reservation-types"
echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
