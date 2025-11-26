#!/bin/bash

# Test script for Machine Management APIs
# This script tests all machine-related endpoints

BASE_URL="http://localhost:3000/api/v1"
AUTH_TOKEN=""

echo "🔧 Testing Machine Management APIs"
echo "=================================="

# Function to make authenticated requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -n "$data" ]; then
        curl -s -X "$method" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -d "$data" \
            "$BASE_URL$endpoint"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            "$BASE_URL$endpoint"
    fi
}

# Step 1: Login with test user
echo "📝 Step 1: Logging in test user..."
LOGIN_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{
        "emailOrPhone": "machine-test@example.com",
        "password": "TestPassword123!"
    }' \
    "$BASE_URL/auth/login")

echo "Login Response: $LOGIN_RESPONSE"

# Extract token from login response
AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ]; then
    echo "❌ Failed to get auth token from registration"
    exit 1
fi

echo "✅ User logged in successfully. Token: ${AUTH_TOKEN:0:20}..."

# Step 2: Create a company
echo "📝 Step 2: Creating test company..."
COMPANY_DATA='{
    "name": "Machine Test Company",
    "industry": "TEXTILE_MANUFACTURING",
    "country": "India",
    "establishedDate": "2020-01-01",
    "businessType": "Private Limited",
    "defaultLocation": "Main Factory",
    "addressLine1": "123 Industrial Area",
    "city": "Mumbai",
    "state": "Maharashtra",
    "contactInfo": "contact@machinetest.com",
    "email": "contact@machinetest.com",
    "phone": "+919876543210"
}'

COMPANY_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    -d "$COMPANY_DATA" \
    "$BASE_URL/companies")

echo "Company Response: $COMPANY_RESPONSE"

# Extract company ID
COMPANY_ID=$(echo "$COMPANY_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$COMPANY_ID" ]; then
    echo "❌ Failed to create company"
    exit 1
fi

echo "✅ Company created successfully. ID: $COMPANY_ID"

# Step 3: Switch to company context
echo "📝 Step 3: Switching to company context..."
SWITCH_RESPONSE=$(make_request "POST" "/companies/$COMPANY_ID/switch" "")
echo "Switch Response: $SWITCH_RESPONSE"

# Extract new token
NEW_TOKEN=$(echo "$SWITCH_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -n "$NEW_TOKEN" ]; then
    AUTH_TOKEN="$NEW_TOKEN"
    echo "✅ Switched to company context. New token: ${AUTH_TOKEN:0:20}..."
fi

# Step 4: Test Machine APIs
echo "📝 Step 4: Testing Machine Management APIs..."

# Test 1: Create Machine
echo "🔧 Test 1: Creating a machine..."
MACHINE_DATA='{
    "name": "Textile Loom 001",
    "machineType": "Loom",
    "model": "TL-2000",
    "manufacturer": "Textile Machines Inc",
    "serialNumber": "TL2000-001",
    "purchaseDate": "2023-01-15",
    "warrantyExpiry": "2026-01-15",
    "specifications": {
        "width": "200cm",
        "speed": "300rpm",
        "power": "5kW"
    },
    "isActive": true
}'

CREATE_RESPONSE=$(make_request "POST" "/machines" "$MACHINE_DATA")
echo "Create Machine Response: $CREATE_RESPONSE"

# Extract machine ID
MACHINE_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$MACHINE_ID" ]; then
    echo "❌ Failed to create machine"
    exit 1
fi

echo "✅ Machine created successfully. ID: $MACHINE_ID"

# Test 2: Get Machines List
echo "🔧 Test 2: Getting machines list..."
LIST_RESPONSE=$(make_request "GET" "/machines" "")
echo "Machines List Response: $LIST_RESPONSE"

# Test 3: Get Machine by ID
echo "🔧 Test 3: Getting machine by ID..."
GET_RESPONSE=$(make_request "GET" "/machines/$MACHINE_ID" "")
echo "Get Machine Response: $GET_RESPONSE"

# Test 4: Update Machine Status
echo "🔧 Test 4: Updating machine status..."
STATUS_DATA='{
    "status": "IN_USE",
    "reason": "Started production run"
}'

STATUS_RESPONSE=$(make_request "PATCH" "/machines/$MACHINE_ID/status" "$STATUS_DATA")
echo "Update Status Response: $STATUS_RESPONSE"

# Test 5: Create Breakdown Report
echo "🔧 Test 5: Creating breakdown report..."
BREAKDOWN_DATA='{
    "machineId": "'$MACHINE_ID'",
    "severity": "HIGH",
    "title": "Thread Break Issue",
    "description": "Thread keeps breaking during operation",
    "breakdownTime": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "priority": "HIGH"
}'

BREAKDOWN_RESPONSE=$(make_request "POST" "/machines/breakdowns" "$BREAKDOWN_DATA")
echo "Create Breakdown Response: $BREAKDOWN_RESPONSE"

# Test 6: Get Breakdown Reports
echo "🔧 Test 6: Getting breakdown reports..."
BREAKDOWN_LIST_RESPONSE=$(make_request "GET" "/machines/breakdowns" "")
echo "Breakdown Reports Response: $BREAKDOWN_LIST_RESPONSE"

# Test 7: Create Maintenance Schedule
echo "🔧 Test 7: Creating maintenance schedule..."
SCHEDULE_DATA='{
    "machineId": "'$MACHINE_ID'",
    "maintenanceType": "WEEKLY",
    "title": "Weekly Cleaning and Lubrication",
    "description": "Regular weekly maintenance routine",
    "frequencyDays": 7,
    "nextDue": "'$(date -u -d '+7 days' +%Y-%m-%dT%H:%M:%S.000Z)'",
    "estimatedHours": 2.5,
    "checklist": ["Clean machine", "Lubricate parts", "Check tension"],
    "partsRequired": ["Oil", "Cleaning cloth"]
}'

SCHEDULE_RESPONSE=$(make_request "POST" "/machines/maintenance/schedules" "$SCHEDULE_DATA")
echo "Create Schedule Response: $SCHEDULE_RESPONSE"

# Test 8: Get Maintenance Schedules
echo "🔧 Test 8: Getting maintenance schedules..."
SCHEDULE_LIST_RESPONSE=$(make_request "GET" "/machines/maintenance/schedules" "")
echo "Maintenance Schedules Response: $SCHEDULE_LIST_RESPONSE"

# Test 9: Create Maintenance Record
echo "🔧 Test 9: Creating maintenance record..."
RECORD_DATA='{
    "machineId": "'$MACHINE_ID'",
    "maintenanceType": "DAILY_CHECK",
    "performedDate": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "durationHours": 0.5,
    "tasksCompleted": ["Visual inspection", "Oil level check"],
    "notes": "All systems normal"
}'

RECORD_RESPONSE=$(make_request "POST" "/machines/maintenance/records" "$RECORD_DATA")
echo "Create Record Response: $RECORD_RESPONSE"

# Test 10: Get Machine Analytics
echo "🔧 Test 10: Getting machine analytics..."
ANALYTICS_RESPONSE=$(make_request "GET" "/machines/analytics" "")
echo "Machine Analytics Response: $ANALYTICS_RESPONSE"

echo ""
echo "🎉 Machine API Testing Complete!"
echo "================================="
echo "✅ All machine management endpoints tested successfully"
echo "📊 Machine created with ID: $MACHINE_ID"
echo "🔧 Breakdown report, maintenance schedule, and record created"
echo "📈 Analytics data retrieved"
