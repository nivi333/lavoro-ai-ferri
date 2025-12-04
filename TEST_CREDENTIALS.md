# Test Credentials for Lavoro AI Ferri

## Permanent Test User (For Manual Testing)

Use these credentials to login and test the application manually:

### Login Credentials
- **Email**: `test@lavoro.com`
- **Phone**: `+919876543210`
- **Password**: `Test@123`

### Usage
You can use either email or phone to login:

**Login with Email:**
```json
{
  "emailOrPhone": "test@lavoro.com",
  "password": "Test@123"
}
```

**Login with Phone:**
```json
{
  "emailOrPhone": "+919876543210",
  "password": "Test@123"
}
```

### API Endpoints

**Register (if needed):**
```bash
curl -X POST "http://localhost:3000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@lavoro.com",
    "phone": "+919876543210",
    "password": "Test@123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Login:**
```bash
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "test@lavoro.com",
    "password": "Test@123"
  }'
```

---

## Comprehensive Data Seeding

For creating a complete test environment with multiple companies, users, and data:

```bash
./seed-test-data.sh
```

This script creates:
- 5 companies with different industries
- Multiple locations, products, customers, suppliers
- User invitations and role assignments
- Quality control and textile operations data

See `DATA_SEEDING_GUIDE.md` for detailed information.

---

## Automated API Testing

For automated testing of all textile operations APIs:

```bash
./test-textile-operations.sh
```

**Note:** The API test script creates unique users for each run using timestamps to avoid conflicts. These are temporary test users and cannot be reused for manual login.

---

## Frontend Login

1. Navigate to: `http://localhost:5173/login`
2. Enter: `test@lavoro.com` (or `+919876543210`)
3. Password: `Test@123`
4. Click Login

After login, you'll be prompted to create a company if you haven't already.

---

## Company Creation (After Login)

After logging in with the test user, you can create a test company:

```json
{
  "name": "Test Textile Company",
  "slug": "test-textile",
  "industry": "textile_manufacturing",
  "country": "India",
  "establishedDate": "2024-01-01",
  "businessType": "PRIVATE_LIMITED",
  "defaultLocation": "Test HQ",
  "addressLine1": "123 Test Street",
  "city": "Mumbai",
  "state": "Maharashtra",
  "contactInfo": "{\"email\": \"test@textile.com\", \"phone\": \"+919876543210\"}"
}
```

---

## Test Data Created

The test user has been successfully registered and can be used for:
- ✅ Manual login testing
- ✅ Frontend UI testing
- ✅ API endpoint testing
- ✅ Company creation and management
- ✅ Textile operations testing

---

## Important Notes

1. **Permanent User**: The credentials above are for a permanent test user that persists in the database
2. **Automated Tests**: The `test-textile-operations.sh` script creates temporary users with timestamps
3. **Password**: All test users use the same password: `Test@123`
4. **Multi-Tenant**: After login, you need to create or select a company to access tenant-specific features

---

## Troubleshooting

### "User not registered" error
- Make sure the backend server is running on `http://localhost:3000`
- Verify the user exists by trying to register first
- Check the database connection

### 404 errors
- Ensure backend is running: `npm run dev` in the root directory
- Check the API base URL: `http://localhost:3000/api/v1`
- Verify routes are properly registered

### Token expired
- Login again to get a new token
- Tokens expire after 3 days (259200 seconds)
