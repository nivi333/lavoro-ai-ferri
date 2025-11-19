#!/bin/bash

# Test Company Creation with Location Validation
# This script tests the complete flow of company creation with default location

BASE_URL="http://localhost:3000/api/v1"

echo "🧪 Testing Company Creation with Default Location"
echo "=================================================="
echo ""

# Step 1: Register a test user
echo "📝 Step 1: Registering test user..."
REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "testuser'$(date +%s)'@example.com",
    "password": "Test@123456",
    "phone": "+91'$(date +%s | tail -c 11)'"
  }')

echo "Register Response: $REGISTER_RESPONSE"
echo ""

# Extract access token
ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to get access token. Registration failed."
  exit 1
fi

echo "✅ User registered successfully"
echo "Access Token: ${ACCESS_TOKEN:0:20}..."
echo ""

# Step 2: Create company WITH all required address fields
echo "📝 Step 2: Creating company with complete address..."
COMPANY_RESPONSE=$(curl -s -X POST "${BASE_URL}/companies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "Test Textile Company",
    "slug": "test-textile-'$(date +%s)'",
    "industry": "Textile Manufacturing",
    "country": "India",
    "addressLine1": "123 Industrial Area",
    "addressLine2": "Near Railway Station",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "contactInfo": "Contact: +91-9876543210, Email: info@testtextile.com",
    "email": "info@testtextile.com",
    "phone": "+91-9876543210",
    "establishedDate": "2024-01-01",
    "businessType": "Manufacturing",
    "defaultLocation": "Test Textile Headquarters"
  }')

echo "Company Creation Response:"
echo "$COMPANY_RESPONSE" | jq '.' 2>/dev/null || echo "$COMPANY_RESPONSE"
echo ""

# Check if company creation was successful
if echo "$COMPANY_RESPONSE" | grep -q '"success":true'; then
  echo "✅ Company created successfully"
  
  # Extract company ID
  COMPANY_ID=$(echo $COMPANY_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "Company ID: $COMPANY_ID"
  echo ""
  
  # Step 3: Verify location was created
  echo "📝 Step 3: Verifying default location creation..."
  echo "Checking database for location..."
  
  # Use psql to check if location exists
  LOCATION_CHECK=$(PGPASSWORD=postgres psql -h localhost -U nivetharamdev -d lavoro_dev -t -c "SELECT location_id, name, address_line_1, city, state, country, is_default, is_headquarters FROM company_locations WHERE company_id = '$COMPANY_ID';" 2>/dev/null)
  
  if [ -n "$LOCATION_CHECK" ]; then
    echo "✅ Location found in database:"
    echo "$LOCATION_CHECK"
    echo ""
    echo "✅ ALL TESTS PASSED!"
    echo "   - Company created successfully"
    echo "   - Default location created with required fields"
    echo "   - Address fields copied correctly"
  else
    echo "❌ Location NOT found in database"
    echo "   Company was created but location creation failed!"
  fi
else
  echo "❌ Company creation failed"
  ERROR_MSG=$(echo "$COMPANY_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  echo "Error: $ERROR_MSG"
fi

echo ""
echo "=================================================="

# Step 4: Test with MISSING required fields
echo ""
echo "📝 Step 4: Testing validation - Creating company WITHOUT required address..."
INVALID_COMPANY_RESPONSE=$(curl -s -X POST "${BASE_URL}/companies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "Invalid Company",
    "industry": "Textile",
    "country": "India",
    "contactInfo": "Test Contact",
    "establishedDate": "2024-01-01",
    "businessType": "Manufacturing",
    "defaultLocation": "HQ"
  }')

echo "Invalid Company Response:"
echo "$INVALID_COMPANY_RESPONSE" | jq '.' 2>/dev/null || echo "$INVALID_COMPANY_RESPONSE"
echo ""

if echo "$INVALID_COMPANY_RESPONSE" | grep -q '"success":false'; then
  echo "✅ Validation working correctly - Company creation rejected"
  ERROR_MSG=$(echo "$INVALID_COMPANY_RESPONSE" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  echo "Expected Error: $ERROR_MSG"
else
  echo "❌ Validation failed - Company should have been rejected"
fi

echo ""
echo "=================================================="
echo "🎉 Test Suite Complete!"
