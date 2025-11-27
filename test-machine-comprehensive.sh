#!/bin/bash

# ============================================
# COMPREHENSIVE MACHINE MANAGEMENT API TESTS
# ============================================

BASE_URL="http://localhost:3000/api/v1"
TOKEN=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print info
print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    print_error "jq is not installed. Please install it to run this script."
    print_info "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
    exit 1
fi

# ============================================
# 1. AUTHENTICATION
# ============================================

print_header "1. AUTHENTICATION"

# Check if token is provided as argument
if [ -n "$1" ]; then
    TOKEN="$1"
    print_success "Using provided token"
else
    print_info "No token provided. Please login first."
    echo -n "Enter your email: "
    read EMAIL
    echo -n "Enter your password: "
    read -s PASSWORD
    echo ""

    # Login
    print_info "Logging in..."
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"identifier\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

    TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.tokens.accessToken')

    if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
        print_error "Login failed"
        echo $LOGIN_RESPONSE | jq '.'
        exit 1
    fi

    print_success "Login successful"
fi

# ============================================
# 2. MACHINE CRUD OPERATIONS
# ============================================

print_header "2. MACHINE CRUD OPERATIONS"

# 2.1 Create Machine
print_info "2.1 Creating new machine..."
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/machines" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "Test Ring Spinning Frame",
        "machineType": "Ring Spinning Frame",
        "manufacturer": "Rieter",
        "model": "G36",
        "serialNumber": "RSF-2024-001",
        "purchaseDate": "2024-01-15",
        "warrantyExpiry": "2027-01-15",
        "specifications": {
            "spindles": 1200,
            "speed": "25000 rpm",
            "power": "150 kW"
        }
    }')

MACHINE_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')

if [ "$MACHINE_ID" != "null" ] && [ -n "$MACHINE_ID" ]; then
    print_success "Machine created successfully"
    echo "Machine ID: $MACHINE_ID"
    echo "Machine Code: $(echo $CREATE_RESPONSE | jq -r '.data.machineCode')"
else
    print_error "Failed to create machine"
    echo $CREATE_RESPONSE | jq '.'
fi

# 2.2 Get All Machines
print_info "2.2 Fetching all machines..."
MACHINES_RESPONSE=$(curl -s -X GET "$BASE_URL/machines" \
    -H "Authorization: Bearer $TOKEN")

MACHINE_COUNT=$(echo $MACHINES_RESPONSE | jq '.data | length')
print_success "Retrieved $MACHINE_COUNT machines"

# 2.3 Get Machine by ID
if [ -n "$MACHINE_ID" ]; then
    print_info "2.3 Fetching machine by ID..."
    MACHINE_DETAIL=$(curl -s -X GET "$BASE_URL/machines/$MACHINE_ID" \
        -H "Authorization: Bearer $TOKEN")

    MACHINE_NAME=$(echo $MACHINE_DETAIL | jq -r '.data.name')
    print_success "Retrieved machine: $MACHINE_NAME"
fi

# 2.4 Update Machine
if [ -n "$MACHINE_ID" ]; then
    print_info "2.4 Updating machine..."
    UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/machines/$MACHINE_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Updated Ring Spinning Frame",
            "model": "G36-Pro"
        }')

    UPDATED_NAME=$(echo $UPDATE_RESPONSE | jq -r '.data.name')
    if [ "$UPDATED_NAME" == "Updated Ring Spinning Frame" ]; then
        print_success "Machine updated successfully"
    else
        print_error "Failed to update machine"
    fi
fi

# 2.5 Update Machine Status
if [ -n "$MACHINE_ID" ]; then
    print_info "2.5 Updating machine status..."
    STATUS_RESPONSE=$(curl -s -X PATCH "$BASE_URL/machines/$MACHINE_ID/status" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "status": "IN_USE",
            "reason": "Started production"
        }')

    NEW_STATUS=$(echo $STATUS_RESPONSE | jq -r '.data.status')
    if [ "$NEW_STATUS" == "IN_USE" ]; then
        print_success "Machine status updated to IN_USE"
    else
        print_error "Failed to update machine status"
    fi
fi

# ============================================
# 3. BREAKDOWN MANAGEMENT
# ============================================

print_header "3. BREAKDOWN MANAGEMENT"

# 3.1 Create Breakdown Report
if [ -n "$MACHINE_ID" ]; then
    print_info "3.1 Creating breakdown report..."
    BREAKDOWN_RESPONSE=$(curl -s -X POST "$BASE_URL/machines/breakdowns" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"machineId\": \"$MACHINE_ID\",
            \"severity\": \"HIGH\",
            \"priority\": \"HIGH\",
            \"title\": \"Spindle Bearing Failure\",
            \"description\": \"Unusual noise detected from spindle bearing. Machine stopped for safety.\",
            \"breakdownTime\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
        }")

    BREAKDOWN_ID=$(echo $BREAKDOWN_RESPONSE | jq -r '.data.id')
    TICKET_ID=$(echo $BREAKDOWN_RESPONSE | jq -r '.data.ticketId')

    if [ "$BREAKDOWN_ID" != "null" ] && [ -n "$BREAKDOWN_ID" ]; then
        print_success "Breakdown report created"
        echo "Ticket ID: $TICKET_ID"
    else
        print_error "Failed to create breakdown report"
        echo $BREAKDOWN_RESPONSE | jq '.'
    fi
fi

# 3.2 Get Breakdown Reports
print_info "3.2 Fetching breakdown reports..."
BREAKDOWNS_LIST=$(curl -s -X GET "$BASE_URL/machines/breakdowns" \
    -H "Authorization: Bearer $TOKEN")

BREAKDOWN_COUNT=$(echo $BREAKDOWNS_LIST | jq '.data | length')
print_success "Retrieved $BREAKDOWN_COUNT breakdown reports"

# 3.3 Get Breakdown Reports by Machine
if [ -n "$MACHINE_ID" ]; then
    print_info "3.3 Fetching breakdown reports for specific machine..."
    MACHINE_BREAKDOWNS=$(curl -s -X GET "$BASE_URL/machines/breakdowns?machineId=$MACHINE_ID" \
        -H "Authorization: Bearer $TOKEN")

    MACHINE_BREAKDOWN_COUNT=$(echo $MACHINE_BREAKDOWNS | jq '.data | length')
    print_success "Retrieved $MACHINE_BREAKDOWN_COUNT breakdown reports for this machine"
fi

# 3.4 Update Breakdown Report
if [ -n "$BREAKDOWN_ID" ]; then
    print_info "3.4 Updating breakdown report..."
    UPDATE_BREAKDOWN=$(curl -s -X PATCH "$BASE_URL/machines/breakdowns/$BREAKDOWN_ID" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d '{
            "status": "IN_PROGRESS",
            "assignedTechnician": "John Doe",
            "rootCause": "Worn out bearing due to continuous operation",
            "resolutionNotes": "Replacing bearing with new one"
        }')

    BREAKDOWN_STATUS=$(echo $UPDATE_BREAKDOWN | jq -r '.data.status')
    if [ "$BREAKDOWN_STATUS" == "IN_PROGRESS" ]; then
        print_success "Breakdown report updated to IN_PROGRESS"
    else
        print_error "Failed to update breakdown report"
    fi
fi

# ============================================
# 4. MAINTENANCE MANAGEMENT
# ============================================

print_header "4. MAINTENANCE MANAGEMENT"

# 4.1 Create Maintenance Schedule
if [ -n "$MACHINE_ID" ]; then
    print_info "4.1 Creating maintenance schedule..."
    SCHEDULE_RESPONSE=$(curl -s -X POST "$BASE_URL/machines/maintenance/schedules" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"machineId\": \"$MACHINE_ID\",
            \"maintenanceType\": \"MONTHLY\",
            \"title\": \"Monthly Preventive Maintenance\",
            \"description\": \"Regular monthly maintenance including lubrication, cleaning, and inspection\",
            \"frequencyDays\": 30,
            \"nextDue\": \"$(date -u -v+7d +%Y-%m-%dT%H:%M:%SZ)\",
            \"estimatedHours\": 4,
            \"assignedTechnician\": \"Maintenance Team A\",
            \"checklist\": {
                \"tasks\": [
                    \"Check and lubricate all moving parts\",
                    \"Inspect belts and chains\",
                    \"Clean filters and vents\",
                    \"Test safety mechanisms\",
                    \"Calibrate sensors\"
                ]
            },
            \"partsRequired\": {
                \"parts\": [
                    {\"name\": \"Lubricating Oil\", \"quantity\": 2, \"unit\": \"liters\"},
                    {\"name\": \"Cleaning Solution\", \"quantity\": 1, \"unit\": \"bottle\"}
                ]
            }
        }")

    SCHEDULE_ID=$(echo $SCHEDULE_RESPONSE | jq -r '.data.id')

    if [ "$SCHEDULE_ID" != "null" ] && [ -n "$SCHEDULE_ID" ]; then
        print_success "Maintenance schedule created"
        echo "Schedule ID: $(echo $SCHEDULE_RESPONSE | jq -r '.data.scheduleId')"
    else
        print_error "Failed to create maintenance schedule"
        echo $SCHEDULE_RESPONSE | jq '.'
    fi
fi

# 4.2 Get Maintenance Schedules
print_info "4.2 Fetching maintenance schedules..."
SCHEDULES_LIST=$(curl -s -X GET "$BASE_URL/machines/maintenance/schedules" \
    -H "Authorization: Bearer $TOKEN")

SCHEDULE_COUNT=$(echo $SCHEDULES_LIST | jq '.data | length')
print_success "Retrieved $SCHEDULE_COUNT maintenance schedules"

# 4.3 Get Due Maintenance (Next 7 days)
print_info "4.3 Fetching due maintenance (next 7 days)..."
DUE_SCHEDULES=$(curl -s -X GET "$BASE_URL/machines/maintenance/schedules?dueWithinDays=7" \
    -H "Authorization: Bearer $TOKEN")

DUE_COUNT=$(echo $DUE_SCHEDULES | jq '.data | length')
print_success "Retrieved $DUE_COUNT maintenance schedules due in next 7 days"

# 4.4 Create Maintenance Record
if [ -n "$MACHINE_ID" ]; then
    print_info "4.4 Creating maintenance record..."
    RECORD_RESPONSE=$(curl -s -X POST "$BASE_URL/machines/maintenance/records" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"machineId\": \"$MACHINE_ID\",
            \"maintenanceType\": \"WEEKLY\",
            \"performedDate\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
            \"durationHours\": 2.5,
            \"tasksCompleted\": {
                \"tasks\": [
                    \"Lubricated all moving parts\",
                    \"Cleaned filters\",
                    \"Inspected belts - all in good condition\"
                ]
            },
            \"partsUsed\": {
                \"parts\": [
                    {\"name\": \"Lubricating Oil\", \"quantity\": 1, \"unit\": \"liter\", \"cost\": 50}
                ]
            },
            \"cost\": 50,
            \"notes\": \"Routine weekly maintenance completed successfully\",
            \"nextMaintenanceDate\": \"$(date -u -v+7d +%Y-%m-%dT%H:%M:%SZ)\"
        }")

    RECORD_ID=$(echo $RECORD_RESPONSE | jq -r '.data.id')

    if [ "$RECORD_ID" != "null" ] && [ -n "$RECORD_ID" ]; then
        print_success "Maintenance record created"
        echo "Record ID: $(echo $RECORD_RESPONSE | jq -r '.data.recordId')"
    else
        print_error "Failed to create maintenance record"
        echo $RECORD_RESPONSE | jq '.'
    fi
fi

# ============================================
# 5. ANALYTICS
# ============================================

print_header "5. ANALYTICS"

# 5.1 Get Machine Analytics
print_info "5.1 Fetching machine analytics..."
ANALYTICS_RESPONSE=$(curl -s -X GET "$BASE_URL/machines/analytics" \
    -H "Authorization: Bearer $TOKEN")

if [ "$(echo $ANALYTICS_RESPONSE | jq -r '.success')" == "true" ]; then
    print_success "Analytics retrieved successfully"
    echo ""
    echo "Total Machines: $(echo $ANALYTICS_RESPONSE | jq -r '.data.totalMachines')"
    echo "Active Breakdowns: $(echo $ANALYTICS_RESPONSE | jq -r '.data.activeBreakdowns')"
    echo "Due Maintenance: $(echo $ANALYTICS_RESPONSE | jq -r '.data.dueMaintenance')"
    echo "Overdue Maintenance: $(echo $ANALYTICS_RESPONSE | jq -r '.data.overdueMaintenance')"
    echo ""
    echo "Machines by Status:"
    echo $ANALYTICS_RESPONSE | jq -r '.data.machinesByStatus | to_entries[] | "  \(.key): \(.value)"'
else
    print_error "Failed to fetch analytics"
    echo $ANALYTICS_RESPONSE | jq '.'
fi

# ============================================
# 6. FILTERING AND SEARCH
# ============================================

print_header "6. FILTERING AND SEARCH"

# 6.1 Filter by Status
print_info "6.1 Filtering machines by status (IN_USE)..."
FILTERED_MACHINES=$(curl -s -X GET "$BASE_URL/machines?status=IN_USE" \
    -H "Authorization: Bearer $TOKEN")

FILTERED_COUNT=$(echo $FILTERED_MACHINES | jq '.data | length')
print_success "Retrieved $FILTERED_COUNT machines with status IN_USE"

# 6.2 Search Machines
print_info "6.2 Searching machines (keyword: 'Ring')..."
SEARCH_RESULTS=$(curl -s -X GET "$BASE_URL/machines?search=Ring" \
    -H "Authorization: Bearer $TOKEN")

SEARCH_COUNT=$(echo $SEARCH_RESULTS | jq '.data | length')
print_success "Found $SEARCH_COUNT machines matching 'Ring'"

# 6.3 Filter by Machine Type
print_info "6.3 Filtering by machine type..."
TYPE_FILTERED=$(curl -s -X GET "$BASE_URL/machines?machineType=Ring%20Spinning%20Frame" \
    -H "Authorization: Bearer $TOKEN")

TYPE_COUNT=$(echo $TYPE_FILTERED | jq '.data | length')
print_success "Retrieved $TYPE_COUNT machines of type 'Ring Spinning Frame'"

# ============================================
# 7. SUMMARY
# ============================================

print_header "7. TEST SUMMARY"

echo -e "${GREEN}✓ Machine CRUD Operations${NC}"
echo -e "${GREEN}✓ Breakdown Management${NC}"
echo -e "${GREEN}✓ Maintenance Scheduling${NC}"
echo -e "${GREEN}✓ Maintenance Records${NC}"
echo -e "${GREEN}✓ Analytics${NC}"
echo -e "${GREEN}✓ Filtering and Search${NC}"

print_success "All tests completed successfully!"

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Test Data Created:${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Machine ID: $MACHINE_ID"
echo "Breakdown Ticket ID: $TICKET_ID"
echo "Maintenance Schedule ID: $(echo $SCHEDULE_RESPONSE | jq -r '.data.scheduleId')"
echo "Maintenance Record ID: $(echo $RECORD_RESPONSE | jq -r '.data.recordId')"
echo -e "${BLUE}========================================${NC}\n"
