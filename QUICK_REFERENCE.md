# Quick Reference - Lavoro AI Ferri Test Environment

## 🚀 Quick Start Commands

```bash
# Start backend
npm run dev

# Seed complete test data (run once)
./seed-test-data.sh

# Test all textile APIs
./test-textile-operations.sh
```

---

## 🔑 Login Credentials

### Main Test User (Permanent)
```
Email: test@lavoro.com
Phone: +919876543210
Password: Test@123
```

### Company Owners (After Seeding)
```
test1@lavoro.com → Premium Textiles Ltd (Textile Manufacturing)
test2@lavoro.com → Fashion Garments Co (Garment Production)
test3@lavoro.com → Quality Fabrics Inc (Fabric Processing)
test4@lavoro.com → ColorTech Dyeing (Dyeing & Finishing)
test5@lavoro.com → Design Studio Pro (Apparel Design)

Password: Test@123 (for all)
```

### Employee Users (After Seeding)
```
employee1@lavoro.com through employee15@lavoro.com
Password: Test@123
Can access Company 1 with different roles
```

---

## 📊 Seeded Data Summary

| Item | Count | Notes |
|------|-------|-------|
| Companies | 5 | Different industries |
| Locations | 6 extra | 3 each for Companies 1 & 2 |
| Products | 50 | 35 (Co. 1), 15 (Co. 2) |
| Customers | 50 | 10 per company |
| Suppliers | 50 | 10 per company |
| Users | 20 | 5 owners + 15 employees |
| Invitations | 25 | All accepted in Company 1 |
| Quality Items | 45 | 3 each type × 5 companies |
| Textile Ops | 125 | 5 each type × 5 companies |

---

## 🌐 API Endpoints

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
```bash
# Register
POST /auth/register

# Login
POST /auth/login
```

### Company Management
```bash
# Get companies
GET /companies

# Create company
POST /companies

# Switch company
POST /companies/:id/switch
```

### Textile Operations
```bash
GET/POST /textile/fabrics
GET/POST /textile/yarns
GET/POST /textile/dyeing
GET/POST /textile/garments
GET/POST /textile/designs
```

---

## 🧪 Testing Scenarios

### Test Multi-Tenant Isolation
1. Login as `test1@lavoro.com`
2. View Company 1 data
3. Login as `test2@lavoro.com`
4. Verify Company 2 data is separate

### Test Role-Based Access
1. Login as `employee1@lavoro.com`
2. Access Company 1
3. Verify role-specific permissions

### Test Textile Operations
1. Login as any company owner
2. Navigate to Textile Operations menu
3. View/Edit/Delete records

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| `seed-test-data.sh` | Creates complete test environment |
| `test-textile-operations.sh` | Tests all textile APIs |
| `TEST_CREDENTIALS.md` | Detailed credential information |
| `DATA_SEEDING_GUIDE.md` | Complete seeding documentation |
| `QUICK_REFERENCE.md` | This file |

---

## 🔧 Troubleshooting

### Backend not responding
```bash
# Check if running
curl http://localhost:3000/health

# Restart
npm run dev
```

### Database issues
```bash
# Check connection
psql -U nivetharamdev -d lavoro_ai_ferri -c "SELECT 1;"

# Reset database
npm run db:reset
```

### Script permission denied
```bash
chmod +x seed-test-data.sh
chmod +x test-textile-operations.sh
```

---

## 📝 Notes

- All test users use password: `Test@123`
- Seeding script takes 2-3 minutes
- Safe to run seeding multiple times
- API test script creates temporary users
- Frontend runs on: `http://localhost:5173`
- Backend runs on: `http://localhost:3000`

---

## 🎯 Common Tasks

### Create a new test user
```bash
curl -X POST "http://localhost:3000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "phone": "+919999999999",
    "password": "Test@123",
    "firstName": "New",
    "lastName": "User"
  }'
```

### Login and get token
```bash
curl -X POST "http://localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrPhone": "test@lavoro.com",
    "password": "Test@123"
  }'
```

### Create a company
```bash
curl -X POST "http://localhost:3000/api/v1/companies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "My Company",
    "slug": "my-company",
    "industry": "textile_manufacturing",
    "country": "India",
    "establishedDate": "2024-01-01",
    "businessType": "PRIVATE_LIMITED",
    "defaultLocation": "HQ",
    "addressLine1": "123 Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "contactInfo": "{\"email\": \"contact@company.com\", \"phone\": \"+919876543210\"}"
  }'
```

---

**For detailed information, see the full documentation files!**
