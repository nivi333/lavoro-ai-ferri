#!/bin/bash

# Test Supplier APIs with existing company
BASE_URL="http://localhost:3000/api/v1"

echo "🔧 Testing Supplier APIs with Company Context"
echo "============================================"

# Step 0: Check Health
echo "📝 Step 0: Checking API Health..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
echo "Health Response: $HEALTH_RESPONSE"

if [[ $HEALTH_RESPONSE != *"status"* ]]; then
    echo "❌ API is not running. Please start the server with 'npm run dev' in a separate terminal."
    exit 1
fi

# Step 0.5: Register User (if not exists)
echo "📝 Step 0.5: Registering User..."
REGISTER_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "firstName": "Test",
        "lastName": "User",
        "email": "test@example.com",
        "password": "TestPassword123!"
    }' \
    "$BASE_URL/auth/register")

echo "Register Response: $REGISTER_RESPONSE"

# Step 1: Login
echo "📝 Step 1: Login..."
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"emailOrPhone": "test@example.com", "password": "TestPassword123!"}' \
    "$BASE_URL/auth/login")

echo "Login Response: $LOGIN_RESPONSE"

# Extract token
AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ]; then
    echo "❌ Failed to get auth token."
    exit 1
fi

echo "✅ Login successful. Token: ${AUTH_TOKEN:0:20}..."

# Step 2: Get companies
echo "📝 Step 2: Getting companies..."
COMPANIES_RESPONSE=$(curl -s -X GET \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    "$BASE_URL/companies")

echo "Companies Response: $COMPANIES_RESPONSE"

# Extract first company ID
COMPANY_ID=$(echo "$COMPANIES_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$COMPANY_ID" ]; then
    echo "❌ No companies found. Please create a company through the frontend first."
    exit 1
fi

echo "✅ Using company ID: $COMPANY_ID"

# Step 3: Switch to company context
echo "📝 Step 3: Switching to company context..."
SWITCH_RESPONSE=$(curl -s -X POST \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    "$BASE_URL/companies/$COMPANY_ID/switch")

echo "Switch Response: $SWITCH_RESPONSE"

# Extract new token
NEW_TOKEN=$(echo "$SWITCH_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -n "$NEW_TOKEN" ]; then
    AUTH_TOKEN="$NEW_TOKEN"
    echo "✅ Switched to company context. New token: ${AUTH_TOKEN:0:20}..."
fi

# Step 4: Test Supplier APIs
echo "📝 Step 4: Testing Supplier APIs..."

# Test 1: Get Suppliers List
echo "🔧 Test 1: Getting suppliers list..."
LIST_RESPONSE=$(curl -s -X GET \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    "$BASE_URL/companies/$COMPANY_ID/suppliers")

echo "Suppliers List Response: $LIST_RESPONSE"

# Test 2: Create Supplier
echo "🔧 Test 2: Creating a supplier..."
CREATE_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{
        "name": "Test Supplier",
        "supplierType": "MANUFACTURER",
        "primaryContactPerson": "Jane Doe",
        "email": "supplier@example.com",
        "phone": "+1234567890",
        "city": "New York",
        "state": "NY",
        "country": "USA",
        "postalCode": "10001",
        "isActive": true
    }' \
    "$BASE_URL/companies/$COMPANY_ID/suppliers")

echo "Create Supplier Response: $CREATE_RESPONSE"

# Extract Supplier ID
SUPPLIER_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$SUPPLIER_ID" ]; then
    echo "✅ Created Supplier ID: $SUPPLIER_ID"

    # Test 3: Get Supplier by ID
    echo "🔧 Test 3: Getting supplier by ID..."
    GET_RESPONSE=$(curl -s -X GET \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BASE_URL/companies/$COMPANY_ID/suppliers/$SUPPLIER_ID")
    
    echo "Get Supplier Response: $GET_RESPONSE"

    # Test 4: Update Supplier
    echo "🔧 Test 4: Updating supplier..."
    UPDATE_RESPONSE=$(curl -s -X PUT \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{
            "name": "Updated Test Supplier",
            "notes": "Updated notes"
        }' \
        "$BASE_URL/companies/$COMPANY_ID/suppliers/$SUPPLIER_ID")
    
    echo "Update Supplier Response: $UPDATE_RESPONSE"

    # Test 5: Delete Supplier
    echo "🔧 Test 5: Deleting supplier..."
    DELETE_RESPONSE=$(curl -s -X DELETE \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BASE_URL/companies/$COMPANY_ID/suppliers/$SUPPLIER_ID")
    
    echo "Delete Supplier Response: $DELETE_RESPONSE"
else
    echo "❌ Failed to create supplier, skipping remaining tests"
fi

echo ""
echo "🎉 Supplier API Testing Complete!"
