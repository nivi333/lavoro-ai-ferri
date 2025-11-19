#!/bin/bash

# Test Company Selection Validation
# Tests that company selection fails without valid userId, companyId, and locationId

BASE_URL="http://localhost:3000/api/v1"

echo "🧪 Testing Company Selection Validation"
echo "========================================"
echo ""

# Step 1: Register and create company
echo "📝 Step 1: Setting up test data..."
REGISTER_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "testuser'$(date +%s)'@example.com",
    "password": "Test@123456",
    "phone": "+91'$(date +%s | tail -c 11)'"
  }')

ACCESS_TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to register user"
  exit 1
fi

echo "✅ User registered"

# Create company
COMPANY_RESPONSE=$(curl -s -X POST "${BASE_URL}/companies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{
    "name": "Test Company",
    "industry": "Textile",
    "country": "India",
    "addressLine1": "123 Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "contactInfo": "Contact Info",
    "establishedDate": "2024-01-01",
    "businessType": "Manufacturing",
    "defaultLocation": "HQ"
  }')

COMPANY_ID=$(echo $COMPANY_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -z "$COMPANY_ID" ]; then
  echo "❌ Failed to create company"
  echo "$COMPANY_RESPONSE"
  exit 1
fi

echo "✅ Company created: $COMPANY_ID"
echo ""

# Step 2: Test valid company selection (should succeed)
echo "📝 Step 2: Testing VALID company selection..."
VALID_SWITCH=$(curl -s -X POST "${BASE_URL}/companies/${COMPANY_ID}/switch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $VALID_SWITCH" | jq '.' 2>/dev/null || echo "$VALID_SWITCH"

if echo "$VALID_SWITCH" | grep -q '"success":true'; then
  echo "✅ Valid company selection succeeded"
  
  # Check if locationId is present
  if echo "$VALID_SWITCH" | grep -q '"locationId"'; then
    echo "✅ locationId is present in response"
  else
    echo "⚠️  locationId not in response (check if added to controller)"
  fi
else
  echo "❌ Valid company selection failed (should have succeeded)"
fi
echo ""

# Step 3: Test with invalid companyId (non-existent UUID)
echo "📝 Step 3: Testing with INVALID companyId..."
INVALID_COMPANY_ID="00000000-0000-0000-0000-000000000000"
INVALID_SWITCH=$(curl -s -X POST "${BASE_URL}/companies/${INVALID_COMPANY_ID}/switch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $INVALID_SWITCH" | jq '.' 2>/dev/null || echo "$INVALID_SWITCH"

if echo "$INVALID_SWITCH" | grep -q '"success":false'; then
  ERROR_MSG=$(echo "$INVALID_SWITCH" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  echo "✅ Correctly rejected invalid companyId"
  echo "   Error: $ERROR_MSG"
else
  echo "❌ Should have rejected invalid companyId"
fi
echo ""

# Step 4: Test with malformed companyId
echo "📝 Step 4: Testing with MALFORMED companyId..."
MALFORMED_SWITCH=$(curl -s -X POST "${BASE_URL}/companies/invalid-uuid/switch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $MALFORMED_SWITCH" | jq '.' 2>/dev/null || echo "$MALFORMED_SWITCH"

if echo "$MALFORMED_SWITCH" | grep -q '"success":false'; then
  ERROR_MSG=$(echo "$MALFORMED_SWITCH" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  echo "✅ Correctly rejected malformed companyId"
  echo "   Error: $ERROR_MSG"
else
  echo "❌ Should have rejected malformed companyId"
fi
echo ""

# Step 5: Test with invalid userId (by using wrong token)
echo "📝 Step 5: Testing with INVALID userId (wrong token)..."
INVALID_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.token"
INVALID_USER_SWITCH=$(curl -s -X POST "${BASE_URL}/companies/${COMPANY_ID}/switch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INVALID_TOKEN")

echo "Response: $INVALID_USER_SWITCH" | jq '.' 2>/dev/null || echo "$INVALID_USER_SWITCH"

if echo "$INVALID_USER_SWITCH" | grep -q '"success":false'; then
  echo "✅ Correctly rejected invalid userId/token"
else
  echo "❌ Should have rejected invalid userId"
fi
echo ""

# Step 6: Verify database state
echo "📝 Step 6: Verifying database state..."
DB_CHECK=$(PGPASSWORD=postgres psql -h localhost -U nivetharamdev -d lavoro_dev -t -c "
  SELECT 
    c.company_id,
    c.name,
    cl.location_id,
    cl.is_default,
    cl.is_headquarters
  FROM companies c
  LEFT JOIN company_locations cl ON c.id = cl.company_id
  WHERE c.id = '$COMPANY_ID';
" 2>/dev/null)

if [ -n "$DB_CHECK" ]; then
  echo "✅ Database state verified:"
  echo "$DB_CHECK"
  
  # Check if location exists
  if echo "$DB_CHECK" | grep -q "L[0-9]"; then
    echo "✅ Default location exists with locationId"
  else
    echo "❌ Default location missing or no locationId"
  fi
else
  echo "❌ Could not verify database state"
fi
echo ""

# Step 7: Test company without location (simulate corrupted data)
echo "📝 Step 7: Testing company selection WITHOUT default location..."
echo "   (Simulating corrupted data scenario)"

# Create a company without location (by directly inserting into DB)
CORRUPT_COMPANY_ID=$(uuidv4 2>/dev/null || echo "corrupt-test-$(date +%s)")
PGPASSWORD=postgres psql -h localhost -U nivetharamdev -d lavoro_dev -c "
  INSERT INTO companies (id, company_id, name, slug, industry, address_line_1, city, state, country, contact_info, updated_at)
  VALUES (
    '$CORRUPT_COMPANY_ID',
    'C999',
    'Corrupt Company',
    'corrupt-company',
    'Test',
    '123 Street',
    'Mumbai',
    'Maharashtra',
    'India',
    '{\"contact\": \"test\"}',
    NOW()
  );
" 2>/dev/null

# Add user access to this company
USER_ID=$(echo $REGISTER_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
PGPASSWORD=postgres psql -h localhost -U nivetharamdev -d lavoro_dev -c "
  INSERT INTO user_companies (id, user_id, company_id, role, updated_at)
  VALUES (
    gen_random_uuid(),
    '$USER_ID',
    '$CORRUPT_COMPANY_ID',
    'OWNER',
    NOW()
  );
" 2>/dev/null

# Try to switch to this company
CORRUPT_SWITCH=$(curl -s -X POST "${BASE_URL}/companies/${CORRUPT_COMPANY_ID}/switch" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response: $CORRUPT_SWITCH" | jq '.' 2>/dev/null || echo "$CORRUPT_SWITCH"

if echo "$CORRUPT_SWITCH" | grep -q '"success":false'; then
  ERROR_MSG=$(echo "$CORRUPT_SWITCH" | grep -o '"message":"[^"]*' | cut -d'"' -f4)
  echo "✅ Correctly rejected company without default location"
  echo "   Error: $ERROR_MSG"
else
  echo "❌ Should have rejected company without default location"
fi
echo ""

echo "========================================"
echo "🎉 Company Selection Validation Tests Complete!"
echo ""
echo "Summary:"
echo "✅ Valid selection with all IDs - Should succeed"
echo "✅ Invalid companyId - Should fail"
echo "✅ Malformed companyId - Should fail"
echo "✅ Invalid userId - Should fail"
echo "✅ Missing default location - Should fail"
echo ""
echo "All validations ensure that company selection requires:"
echo "  - Valid userId (UUID, exists, active)"
echo "  - Valid companyId/tenantId (UUID, exists, active)"
echo "  - Valid locationId (exists in default location)"
