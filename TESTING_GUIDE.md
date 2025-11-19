# Testing Guide - Company Creation with Location

## Quick Test

Run the automated test script:
```bash
./test-company-location.sh
```

## Manual Testing Steps

### 1. Start Backend Server
```bash
npm run dev
```

### 2. Register a User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "Test@123456",
    "phone": "+919876543210"
  }'
```

Save the `accessToken` from the response.

### 3. Create Company (Success Case)
```bash
curl -X POST http://localhost:3000/api/v1/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "My Textile Company",
    "slug": "my-textile-co",
    "industry": "Textile Manufacturing",
    "country": "India",
    "addressLine1": "123 Industrial Area",
    "addressLine2": "Near Railway Station",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "contactInfo": "Contact: +91-9876543210, Email: info@mytextile.com",
    "email": "info@mytextile.com",
    "phone": "+91-9876543210",
    "establishedDate": "2024-01-01",
    "businessType": "Manufacturing",
    "defaultLocation": "My Textile Headquarters"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Company created successfully",
  "data": {
    "id": "...",
    "companyId": "C001",
    "name": "My Textile Company",
    "addressLine1": "123 Industrial Area",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "contactInfo": "Contact: +91-9876543210, Email: info@mytextile.com",
    "defaultLocation": "My Textile Headquarters",
    "role": "OWNER"
  }
}
```

### 4. Verify Location in Database
```bash
psql -h localhost -U nivetharamdev -d lavoro_dev -c \
  "SELECT location_id, name, address_line_1, city, state, country, 
          contact_info, is_default, is_headquarters 
   FROM company_locations 
   WHERE company_id = 'YOUR_COMPANY_ID';"
```

**Expected Output:**
```
location_id | name                   | address_line_1      | city   | state       | country | is_default | is_headquarters
L001        | My Textile Headquarters| 123 Industrial Area | Mumbai | Maharashtra | India   | t          | t
```

### 5. Test Validation (Failure Case)
```bash
curl -X POST http://localhost:3000/api/v1/companies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Invalid Company",
    "industry": "Textile",
    "country": "India",
    "contactInfo": "Test",
    "establishedDate": "2024-01-01",
    "businessType": "Manufacturing",
    "defaultLocation": "HQ"
  }'
```

**Expected Response:**
```json
{
  "success": false,
  "message": "Address Line 1 is required for creating default location"
}
```

## Frontend Testing

### 1. Start Frontend
```bash
cd frontend
npm run dev
```

### 2. Test Flow
1. Navigate to `http://localhost:5173`
2. Register/Login
3. Click "Create Company"
4. Fill in company details including:
   - Company Name
   - Industry
   - **Address Line 1** (required)
   - **City** (required)
   - **State** (required)
   - **Country** (required)
   - **Contact Info** (required)
5. Submit form
6. Verify success message
7. Check that location was created

### 3. Test Validation
1. Try to create company without address fields
2. Verify validation errors appear
3. Verify form cannot be submitted

## Database Queries

### Check All Locations
```sql
SELECT 
  cl.location_id,
  cl.name,
  c.name as company_name,
  cl.address_line_1,
  cl.city,
  cl.state,
  cl.country,
  cl.is_default,
  cl.is_headquarters
FROM company_locations cl
JOIN companies c ON cl.company_id = c.id
ORDER BY cl.created_at DESC;
```

### Check Company with Location
```sql
SELECT 
  c.company_id,
  c.name as company_name,
  c.address_line_1 as company_address,
  cl.location_id,
  cl.name as location_name,
  cl.address_line_1 as location_address,
  cl.is_default,
  cl.is_headquarters
FROM companies c
LEFT JOIN company_locations cl ON c.id = cl.company_id
WHERE c.company_id = 'C001';
```

### Verify Required Fields
```sql
SELECT 
  location_id,
  name,
  CASE 
    WHEN address_line_1 IS NULL THEN '❌ Missing'
    ELSE '✅ Present'
  END as address_line_1_status,
  CASE 
    WHEN city IS NULL THEN '❌ Missing'
    ELSE '✅ Present'
  END as city_status,
  CASE 
    WHEN state IS NULL THEN '❌ Missing'
    ELSE '✅ Present'
  END as state_status,
  CASE 
    WHEN country IS NULL THEN '❌ Missing'
    ELSE '✅ Present'
  END as country_status
FROM company_locations;
```

## Expected Test Results

### ✅ Success Criteria
- [ ] Company created successfully
- [ ] Location created with company
- [ ] All required address fields present
- [ ] contactInfo copied correctly
- [ ] is_default = true
- [ ] is_headquarters = true
- [ ] location_type = 'BRANCH'
- [ ] Validation rejects missing fields
- [ ] Clear error messages displayed

### ❌ Failure Indicators
- Company created but no location
- Location missing required fields
- Validation not working
- Unclear error messages
- Transaction not rolled back on error

## Troubleshooting

### Issue: Location not created
**Check:**
```sql
SELECT COUNT(*) FROM company_locations WHERE company_id = 'YOUR_COMPANY_ID';
```
**Solution:** Check backend logs for errors

### Issue: Missing address fields
**Check:**
```sql
SELECT * FROM company_locations WHERE address_line_1 IS NULL OR city IS NULL;
```
**Solution:** Run migration again

### Issue: Validation not working
**Check:** Backend logs for validation errors
**Solution:** Restart backend server

### Issue: Transaction rollback not working
**Check:**
```sql
SELECT c.company_id, COUNT(cl.id) as location_count
FROM companies c
LEFT JOIN company_locations cl ON c.id = cl.company_id
GROUP BY c.company_id
HAVING COUNT(cl.id) = 0;
```
**Solution:** These companies should not exist if validation is working

## Performance Testing

### Test Multiple Companies
```bash
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/v1/companies \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
    -d "{
      \"name\": \"Company $i\",
      \"industry\": \"Textile\",
      \"country\": \"India\",
      \"addressLine1\": \"Address $i\",
      \"city\": \"Mumbai\",
      \"state\": \"Maharashtra\",
      \"contactInfo\": \"Contact $i\",
      \"establishedDate\": \"2024-01-01\",
      \"businessType\": \"Manufacturing\",
      \"defaultLocation\": \"HQ $i\"
    }"
  echo ""
done
```

### Verify All Locations Created
```sql
SELECT 
  COUNT(DISTINCT c.id) as total_companies,
  COUNT(cl.id) as total_locations,
  COUNT(CASE WHEN cl.is_headquarters THEN 1 END) as headquarters_count
FROM companies c
LEFT JOIN company_locations cl ON c.id = cl.company_id;
```

**Expected:** total_companies = total_locations = headquarters_count

## Cleanup

### Remove Test Data
```sql
-- Delete test companies and their locations (cascade)
DELETE FROM companies WHERE name LIKE 'Test%' OR name LIKE 'Company %';

-- Verify cleanup
SELECT COUNT(*) FROM companies;
SELECT COUNT(*) FROM company_locations;
```

## Continuous Testing

Add to CI/CD pipeline:
```yaml
- name: Test Company Creation
  run: |
    npm run dev &
    sleep 5
    ./test-company-location.sh
    kill %1
```
