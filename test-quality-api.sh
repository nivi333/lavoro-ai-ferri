#!/bin/bash

# Test Quality Control APIs with new fields
BASE_URL="http://localhost:3000/api/v1"

echo "=== Testing Quality Control APIs ==="
echo ""

# Step 1: Register and login
echo "1. Registering user..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "QC",
    "lastName": "Tester",
    "email": "qc@example.com",
    "password": "Test@123"
  }')

TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.tokens.accessToken')
echo "✅ User registered, token: ${TOKEN:0:20}..."
echo ""

# Step 2: Create company
echo "2. Creating company..."
COMPANY_RESPONSE=$(curl -s -X POST "$BASE_URL/companies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "QC Test Company",
    "industry": "TEXTILE_MANUFACTURING",
    "country": "India",
    "addressLine1": "123 QC Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "establishedDate": "2020-01-01",
    "businessType": "Manufacturing"
  }')

COMPANY_ID=$(echo $COMPANY_RESPONSE | jq -r '.data.id')
echo "✅ Company created: $COMPANY_ID"

# Switch to company context
SWITCH_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/switch" \
  -H "Authorization: Bearer $TOKEN")

NEW_TOKEN=$(echo $SWITCH_RESPONSE | jq -r '.data.tokens.accessToken')
if [ "$NEW_TOKEN" != "null" ]; then
  TOKEN=$NEW_TOKEN
fi
echo "✅ Switched to company context"
echo ""

# Step 3: Create product
echo "3. Creating product..."
PRODUCT_RESPONSE=$(curl -s -X POST "$BASE_URL/products" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Cotton Yarn",
    "description": "Premium cotton yarn for testing",
    "productType": "OWN_MANUFACTURE",
    "material": "Cotton",
    "color": "White",
    "unitOfMeasure": "KG",
    "costPrice": 100.00,
    "sellingPrice": 150.00,
    "stockQuantity": 500
  }')

PRODUCT_ID=$(echo $PRODUCT_RESPONSE | jq -r '.data.id')
PRODUCT_CODE=$(echo $PRODUCT_RESPONSE | jq -r '.data.productCode')
echo "✅ Product created: $PRODUCT_ID"
echo "✅ Product code: $PRODUCT_CODE"
echo ""

# Step 4: Get products to verify productCode
echo "4. Getting products list to verify productCode..."
PRODUCTS_LIST=$(curl -s -X GET "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN")

echo "Products response:"
echo $PRODUCTS_LIST | jq '.data.products[] | {id, productCode, name}'
echo ""

# Step 5: Create quality checkpoint with batch test
echo "5. Creating quality checkpoint with BATCH_TEST..."
CHECKPOINT_RESPONSE=$(curl -s -X POST "$BASE_URL/quality/checkpoints" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "checkpointType": "BATCH_TEST",
    "checkpointName": "Cotton Yarn Batch Test",
    "inspectorName": "QC Inspector",
    "inspectionDate": "2024-11-24T10:00:00.000Z",
    "productId": "'"$PRODUCT_ID"'",
    "totalBatch": 10,
    "lotNumber": "LOT-A",
    "sampleSize": 1000,
    "testedQuantity": 50,
    "notes": "Testing new batch testing functionality"
  }')

echo "Checkpoint response:"
echo $CHECKPOINT_RESPONSE | jq .
echo ""

echo "=== Quality Control API Testing Complete ==="
