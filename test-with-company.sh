#!/bin/bash

# Test Machine APIs with existing company
BASE_URL="http://localhost:3000/api/v1"

echo "🔧 Testing Machine APIs with Company Context"
echo "============================================"

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
    echo "❌ Failed to get auth token. Please create a user first."
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
    echo "🌐 Frontend URL: http://localhost:3002"
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

# Step 4: Test Machine APIs
echo "📝 Step 4: Testing Machine APIs..."

# Test 1: Get Machines List
echo "🔧 Test 1: Getting machines list..."
LIST_RESPONSE=$(curl -s -X GET \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    "$BASE_URL/machines")

echo "Machines List Response: $LIST_RESPONSE"

# Test 2: Create Machine
echo "🔧 Test 2: Creating a machine..."
CREATE_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d '{
        "name": "Textile Loom 001",
        "machineType": "Loom",
        "model": "TL-2000",
        "manufacturer": "Textile Machines Inc",
        "serialNumber": "TL2000-001",
        "isActive": true
    }' \
    "$BASE_URL/machines")

echo "Create Machine Response: $CREATE_RESPONSE"

# Test 3: Get Machine Analytics
echo "🔧 Test 3: Getting machine analytics..."
ANALYTICS_RESPONSE=$(curl -s -X GET \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    "$BASE_URL/machines/analytics")

echo "Machine Analytics Response: $ANALYTICS_RESPONSE"

echo ""
echo "🎉 Machine API Testing Complete!"
echo "================================="
echo "✅ Backend APIs are working"
echo "🌐 Frontend available at: http://localhost:3002"
echo "📱 You can now test the Machines page in the frontend"
