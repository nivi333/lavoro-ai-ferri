#!/bin/bash

# Simple Machine API Test
BASE_URL="http://localhost:3000/api/v1"

echo "🔧 Simple Machine API Test"
echo "=========================="

# Step 1: Login
echo "📝 Step 1: Login..."
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"emailOrPhone": "machine-test@example.com", "password": "TestPassword123!"}' \
    "$BASE_URL/auth/login")

echo "Login Response: $LOGIN_RESPONSE"

# Extract token
AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ]; then
    echo "❌ Failed to get auth token"
    exit 1
fi

echo "✅ Login successful. Token: ${AUTH_TOKEN:0:20}..."

# Step 2: Get existing companies
echo "📝 Step 2: Getting companies..."
COMPANIES_RESPONSE=$(curl -s -X GET \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    "$BASE_URL/companies")

echo "Companies Response: $COMPANIES_RESPONSE"

# Extract first company ID
COMPANY_ID=$(echo "$COMPANIES_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$COMPANY_ID" ]; then
    echo "❌ No companies found. Please create a company first."
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

# Test 1: Get Machines List (should be empty initially)
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
        "name": "Test Loom 001",
        "machineType": "Loom",
        "model": "TL-2000",
        "manufacturer": "Test Machines Inc",
        "serialNumber": "TL2000-001",
        "isActive": true
    }' \
    "$BASE_URL/machines")

echo "Create Machine Response: $CREATE_RESPONSE"

# Extract machine ID
MACHINE_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -n "$MACHINE_ID" ]; then
    echo "✅ Machine created successfully. ID: $MACHINE_ID"
    
    # Test 3: Get Machine by ID
    echo "🔧 Test 3: Getting machine by ID..."
    GET_RESPONSE=$(curl -s -X GET \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BASE_URL/machines/$MACHINE_ID")
    
    echo "Get Machine Response: $GET_RESPONSE"
    
    # Test 4: Update Machine Status
    echo "🔧 Test 4: Updating machine status..."
    STATUS_RESPONSE=$(curl -s -X PATCH \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        -d '{"status": "IN_USE", "reason": "Started production"}' \
        "$BASE_URL/machines/$MACHINE_ID/status")
    
    echo "Update Status Response: $STATUS_RESPONSE"
    
    # Test 5: Get Machine Analytics
    echo "🔧 Test 5: Getting machine analytics..."
    ANALYTICS_RESPONSE=$(curl -s -X GET \
        -H "Authorization: Bearer $AUTH_TOKEN" \
        "$BASE_URL/machines/analytics")
    
    echo "Machine Analytics Response: $ANALYTICS_RESPONSE"
    
else
    echo "❌ Failed to create machine"
fi

echo ""
echo "🎉 Simple Machine API Test Complete!"
echo "===================================="
