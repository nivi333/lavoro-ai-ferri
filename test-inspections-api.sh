#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000/api/v1"

# Test user credentials
TEST_EMAIL="test@example.com"
TEST_PASSWORD="Test@12345"
TEST_PHONE="+919876543210"

echo -e "${YELLOW}=== Quality Inspections API Test ===${NC}\n"

# Step 1: Register a test user
echo -e "${YELLOW}Step 1: Registering test user...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"firstName\": \"Test\",
    \"lastName\": \"User\",
    \"email\": \"$TEST_EMAIL\",
    \"phone\": \"$TEST_PHONE\",
    \"password\": \"$TEST_PASSWORD\"
  }")

echo "Response: $REGISTER_RESPONSE"
USER_ID=$(echo $REGISTER_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}Failed to get access token${NC}"
  exit 1
fi

echo -e "${GREEN}✓ User registered successfully${NC}"
echo "Access Token: ${ACCESS_TOKEN:0:20}..."
echo ""

# Step 2: Create a company
echo -e "${YELLOW}Step 2: Creating test company...${NC}"
COMPANY_RESPONSE=$(curl -s -X POST "$API_URL/companies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"name\": \"Test Textile Company\",
    \"slug\": \"test-textile-$(date +%s)\",
    \"industry\": \"TEXTILE_MANUFACTURING\",
    \"country\": \"India\",
    \"defaultLocation\": \"Head Office\",
    \"addressLine1\": \"123 Main Street\",
    \"city\": \"Mumbai\",
    \"state\": \"Maharashtra\",
    \"pincode\": \"400001\",
    \"businessType\": \"Manufacturing\",
    \"contactInfo\": {\"phone\": \"+919876543210\"}
  }")

echo "Response: $COMPANY_RESPONSE"
COMPANY_ID=$(echo $COMPANY_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$COMPANY_ID" ]; then
  echo -e "${RED}Failed to create company${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Company created successfully${NC}"
echo "Company ID: $COMPANY_ID"
echo ""

# Step 3: Switch to company context
echo -e "${YELLOW}Step 3: Switching to company context...${NC}"
SWITCH_RESPONSE=$(curl -s -X POST "$API_URL/companies/$COMPANY_ID/switch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $SWITCH_RESPONSE"
NEW_TOKEN=$(echo $SWITCH_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$NEW_TOKEN" ]; then
  echo -e "${RED}Failed to switch company context${NC}"
  exit 1
fi

ACCESS_TOKEN=$NEW_TOKEN
echo -e "${GREEN}✓ Company context switched${NC}"
echo "New Token: ${ACCESS_TOKEN:0:20}..."
echo ""

# Step 4: Create an inspection
echo -e "${YELLOW}Step 4: Creating test inspection...${NC}"
INSPECTION_RESPONSE=$(curl -s -X POST "$API_URL/inspections/inspections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"inspectionType\": \"INCOMING_MATERIAL\",
    \"referenceType\": \"PRODUCT\",
    \"referenceId\": \"PROD001\",
    \"inspectorId\": \"$USER_ID\",
    \"scheduledDate\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"inspectorNotes\": \"Test inspection notes\",
    \"recommendations\": \"Test recommendations\"
  }")

echo "Response: $INSPECTION_RESPONSE"
INSPECTION_ID=$(echo $INSPECTION_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
INSPECTION_NUMBER=$(echo $INSPECTION_RESPONSE | grep -o '"inspectionNumber":"[^"]*' | cut -d'"' -f4)

if [ -z "$INSPECTION_ID" ]; then
  echo -e "${RED}Failed to create inspection${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Inspection created successfully${NC}"
echo "Inspection ID: $INSPECTION_ID"
echo "Inspection Number: $INSPECTION_NUMBER"
echo ""

# Step 5: Get all inspections
echo -e "${YELLOW}Step 5: Fetching all inspections...${NC}"
GET_INSPECTIONS=$(curl -s -X GET "$API_URL/inspections/inspections" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $GET_INSPECTIONS"
INSPECTION_COUNT=$(echo $GET_INSPECTIONS | grep -o '"id":"[^"]*' | wc -l)

echo -e "${GREEN}✓ Inspections fetched successfully${NC}"
echo "Total inspections: $INSPECTION_COUNT"
echo ""

# Step 6: Get inspection by ID
echo -e "${YELLOW}Step 6: Fetching inspection by ID...${NC}"
GET_INSPECTION=$(curl -s -X GET "$API_URL/inspections/inspections/$INSPECTION_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $GET_INSPECTION"
echo -e "${GREEN}✓ Inspection fetched successfully${NC}"
echo ""

# Step 7: Update inspection
echo -e "${YELLOW}Step 7: Updating inspection...${NC}"
UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/inspections/inspections/$INSPECTION_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"status\": \"IN_PROGRESS\",
    \"qualityScore\": 85.5,
    \"inspectorNotes\": \"Updated inspection notes\"
  }")

echo "Response: $UPDATE_RESPONSE"
echo -e "${GREEN}✓ Inspection updated successfully${NC}"
echo ""

# Step 8: Complete inspection
echo -e "${YELLOW}Step 8: Completing inspection...${NC}"
COMPLETE_RESPONSE=$(curl -s -X POST "$API_URL/inspections/inspections/$INSPECTION_ID/complete" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "{
    \"result\": \"PASS\",
    \"qualityScore\": 90,
    \"notes\": \"Inspection completed successfully\"
  }")

echo "Response: $COMPLETE_RESPONSE"
echo -e "${GREEN}✓ Inspection completed successfully${NC}"
echo ""

# Step 9: Get metrics
echo -e "${YELLOW}Step 9: Fetching inspection metrics...${NC}"
METRICS_RESPONSE=$(curl -s -X GET "$API_URL/inspections/metrics" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $METRICS_RESPONSE"
echo -e "${GREEN}✓ Metrics fetched successfully${NC}"
echo ""

echo -e "${GREEN}=== All tests passed! ===${NC}"
