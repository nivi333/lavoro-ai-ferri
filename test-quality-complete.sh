#!/bin/bash

# Complete Quality Control API Test
BASE_URL="http://localhost:3000/api/v1"

echo "=== COMPLETE QUALITY CONTROL API TEST ==="
echo ""

# Step 1: Register user
echo "1. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "QC",
    "lastName": "Complete",
    "email": "qc.complete@example.com",
    "password": "Test@123"
  }')

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.tokens.accessToken')
echo "✅ User registered successfully"
echo ""

# Step 2: Create company
echo "2. Creating company..."
COMPANY_RESPONSE=$(curl -s -X POST "$BASE_URL/companies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "QC Complete Test Company",
    "industry": "TEXTILE_MANUFACTURING",
    "country": "India",
    "addressLine1": "123 QC Complete St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "establishedDate": "2020-01-01",
    "businessType": "Manufacturing",
    "contactInfo": "+91-9876543210",
    "defaultLocation": "HQ"
  }')

COMPANY_ID=$(echo $COMPANY_RESPONSE | jq -r '.data.id')
echo "✅ Company created: $COMPANY_ID"

# Step 3: Switch to company context
echo "3. Switching to company context..."
SWITCH_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/switch" \
  -H "Authorization: Bearer $TOKEN")

NEW_TOKEN=$(echo $SWITCH_RESPONSE | jq -r '.data.tokens.accessToken')
TOKEN=$NEW_TOKEN
echo "✅ Switched to company context"
echo ""

# Step 4: Create product with productCode
echo "4. Creating product..."
PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Premium Cotton Yarn",
    "description": "High quality cotton yarn for testing",
    "productType": "OWN_MANUFACTURE",
    "material": "Cotton",
    "color": "White",
    "unitOfMeasure": "KG",
    "costPrice": 100.00,
    "sellingPrice": 150.00,
    "stockQuantity": 1000
  }')

PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r '.data.id')
PRODUCT_CODE=$(echo $PRODUCT_RESPONSE | jq -r '.data.productCode')
echo "✅ Product created: $PRODUCT_ID"
echo "✅ Product code: $PRODUCT_CODE"
echo ""

# Step 5: Verify products list shows productCode
echo "5. Verifying products list..."
PRODUCTS_LIST=$(curl -s -X GET "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN")

echo "Products with codes:"
echo $PRODUCTS_LIST | jq '.data.products[] | {productCode, name}'
echo ""

# Step 6: Create quality checkpoint with BATCH_TEST
echo "6. Creating quality checkpoint with BATCH_TEST..."
CHECKPOINT_RESPONSE=$(curl -s -X POST "$BASE_URL/quality/checkpoints" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "checkpointType": "BATCH_TEST",
    "checkpointName": "Cotton Yarn Batch Quality Test",
    "inspectorName": "QC Inspector",
    "inspectionDate": "2024-11-24T10:00:00.000Z",
    "productId": "'"$PRODUCT_ID"'",
    "totalBatch": 10,
    "lotNumber": "LOT-A-001",
    "sampleSize": 1000,
    "testedQuantity": 50,
    "notes": "Testing new batch testing functionality with total batch count"
  }')

CHECKPOINT_ID=$(echo $CHECKPOINT_RESPONSE | jq -r '.data.id // .data.checkpointId')
echo "Checkpoint response:"
echo $CHECKPOINT_RESPONSE | jq .
echo ""

# Step 7: Create quality defect
echo "7. Creating quality defect..."
DEFECT_RESPONSE=$(curl -s -X POST "$BASE_URL/quality/defects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "checkpointId": "'"$CHECKPOINT_ID"'",
    "productId": "'"$PRODUCT_ID"'",
    "defectCategory": "COLOR",
    "defectType": "Color variation in batch",
    "severity": "MAJOR",
    "quantity": 5,
    "affectedItems": 25,
    "batchNumber": "BATCH-7",
    "lotNumber": "LOT-A-001",
    "description": "Color difference observed in Batch-7, affecting yarn consistency"
  }')

echo "Defect response:"
echo $DEFECT_RESPONSE | jq .
echo ""

# Step 8: Test company invite
echo "8. Testing company invite..."
INVITE_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/invite" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "manager@example.com",
    "role": "MANAGER"
  }')

echo "Invite response:"
echo $INVITE_RESPONSE | jq .
echo ""

echo "=== COMPLETE QUALITY CONTROL API TEST FINISHED ==="
