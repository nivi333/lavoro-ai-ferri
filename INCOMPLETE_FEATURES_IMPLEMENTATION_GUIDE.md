# Incomplete Features & Implementation Guide

> **Last Updated:** 2026-02-08  
> **Application:** Ayphen Textile - Textile Manufacturing ERP  
> **Status:** Implementation In Progress - Many Items Completed

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Security Issues](#critical-security-issues)
3. [Authentication & Authorization](#authentication--authorization)
4. [Backend Incomplete Features](#backend-incomplete-features)
5. [Frontend Incomplete Features](#frontend-incomplete-features)
6. [Missing Frontend-Backend Integrations](#missing-frontend-backend-integrations)
7. [Code Quality Issues](#code-quality-issues)
8. [Disabled Routes & Controllers](#disabled-routes--controllers)
9. [Placeholder Pages](#placeholder-pages)
10. [Feature-Specific Implementation Guides](#feature-specific-implementation-guides)
11. [Priority Matrix](#priority-matrix)
12. [Quick Wins](#quick-wins)

---

## Executive Summary

| Category | Total | Completed | Remaining | Omitted |
|----------|-------|-----------|-----------|---------|
| 🔴 Security Issues | 4 | 0 | 2 | 2 (S1, S2) |
| 🟠 Authentication Gaps | 5 | 2 | 0 | 3 (A1, A3, A5) |
| 🟡 Backend TODOs | 9 | 2 | 6 | 1 (B9) |
| 🟡 Frontend Incomplete | 15 | 7 | 5 | 3 (F8, I1, I3) |
| 🟢 Code Quality | 8 | 2 | 4 | 2 (CQ5, CQ6) |
| 🟢 Placeholder Pages | 4 | 0 | 3 | 1 (P1) |

**Total Issues Identified:** 53+  
**Completed:** 13 ✅  
**Remaining:** 20  
**Omitted (per user request):** 12

---

## Critical Security Issues

### S1. Rate Limiting Completely Disabled ⚠️ CRITICAL [OMITTED]

**Status:** ⏭️ Omitted per user request

**File:** `src/middleware/rateLimiter.ts`

**Current State:**
```typescript
// Lines 3-10: ALL rate limiters just call next()
export const generalRateLimit = (req, res, next) => next();
export const authRateLimit = (req, res, next) => next();
export const registrationRateLimit = (req, res, next) => next();
export const passwordResetRateLimit = (req, res, next) => next();
export const userRateLimit = (req, res, next) => next();
export const tenantRateLimit = (req, res, next) => next();
export const sensitiveOperationRateLimit = (req, res, next) => next();
```

**Risk:** Application is vulnerable to:
- Brute force attacks on login
- DDoS attacks
- Credential stuffing
- API abuse

**Implementation Guide:**
1. Uncomment the actual rate limiting implementation (lines 31-377)
2. Configure Redis for rate limit storage
3. Set appropriate limits:
   - Auth endpoints: 5 requests/minute
   - General API: 100 requests/minute
   - Sensitive operations: 10 requests/hour

---

### S2. Stripe Placeholder Keys [OMITTED]

**Status:** ⏭️ Omitted per user request (Subscription/Stripe features not needed)

**Files:**
- `src/services/paymentGatewayService.ts` (Line 7)
- `src/controllers/subscriptionController.ts` (Line 7)

**Current State:** Uses `sk_test_placeholder` - not a real test key.

**Implementation Guide:**
1. Create Stripe account and get test keys
2. Set `STRIPE_SECRET_KEY` in `.env`
3. Set `STRIPE_WEBHOOK_SECRET` for webhook verification
4. Test with Stripe CLI before production

---

### S3. TypeScript Type Bypass

**File:** `src/services/analyticsService.ts` (Line 461)

**Current State:** `@ts-ignore` suppresses type checking.

**Implementation Guide:**
```typescript
// Replace @ts-ignore with proper typing
interface ComplianceReportResult {
  status: string;
  _count: { id: number };
}
const complianceStats = await globalPrisma.compliance_reports.groupBy({...}) as ComplianceReportResult[];
```

---

### S4. ESLint Rules Disabled

**Files:**
- `frontend-new/src/pages/company/CompaniesListPage.tsx` (Line 39)
- `frontend-new/src/components/company/CompanyCreationSheet.tsx` (Line 160)

**Issue:** `eslint-disable-next-line react-hooks/exhaustive-deps` used.

**Implementation Guide:**
1. Add missing dependencies to useEffect arrays
2. Or properly memoize callbacks with useCallback
3. Remove eslint-disable comments

---

## Authentication & Authorization

### A1. Google OAuth Not Implemented [OMITTED]

**Status:** ⏭️ Omitted per user request

**Files:**
- `frontend-new/src/components/auth/GoogleAuthCallback.tsx`
- `frontend-new/src/pages/auth/LoginPage.tsx` (Line 147)

**Current State:**
```typescript
// GoogleAuthCallback.tsx - Lines 10-24
// TODO: Implement Google OAuth callback handling
const code = searchParams.get('code');
// TODO: Exchange code for tokens with backend
console.log('Google auth code:', code);
navigate('/login'); // Just redirects back
```

**Implementation Guide:**

**Backend (New file: `src/routes/v1/authRoutes.ts`):**
```typescript
// Add endpoint
router.post('/google/callback', authController.googleCallback);

// In authController.ts
async googleCallback(req, res) {
  const { code } = req.body;
  // 1. Exchange code for tokens with Google
  const { tokens } = await oauth2Client.getToken(code);
  // 2. Get user info from Google
  const userInfo = await google.oauth2('v2').userinfo.get({ auth: oauth2Client });
  // 3. Create or find user in database
  // 4. Generate JWT tokens
  // 5. Return tokens to frontend
}
```

**Frontend (GoogleAuthCallback.tsx):**
```typescript
if (code) {
  const response = await fetch(`${API_BASE_URL}/auth/google/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  const { tokens, user } = await response.json();
  AuthStorage.setTokens(tokens);
  navigate('/companies');
}
```

---

### A2. Refresh Token API Not Implemented ✅ COMPLETED

**Status:** ✅ Implemented on 2026-02-08

**Implementation:**
- Backend: `POST /api/v1/auth/refresh` endpoint added in `authRoutes.ts`
- Backend: `refreshToken` method in `authService.ts` with session rotation
- Frontend: `refreshToken` function in `AuthContext.tsx` calls the API

**File:** `frontend-new/src/contexts/AuthContext.tsx` (Lines 330-337)

**Previous State:**
```typescript
const refreshToken = useCallback(async () => {
  try {
    // TODO: Implement real refresh token API call here
    throw new Error('refreshToken API not implemented');
  } catch {
    logout();
  }
}, [logout]);
```

**Implementation Guide:**

**Backend (authRoutes.ts):**
```typescript
router.post('/refresh', authController.refreshToken);

// In authController.ts
async refreshToken(req, res) {
  const { refreshToken } = req.body;
  // 1. Verify refresh token
  const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
  // 2. Check if token is in Redis (not revoked)
  // 3. Generate new access token
  // 4. Optionally rotate refresh token
  res.json({ accessToken: newAccessToken });
}
```

**Frontend (AuthContext.tsx):**
```typescript
const refreshToken = useCallback(async () => {
  try {
    const tokens = AuthStorage.getTokens();
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: tokens?.refreshToken }),
    });
    if (!response.ok) throw new Error('Refresh failed');
    const { accessToken } = await response.json();
    AuthStorage.setTokens({ ...tokens, accessToken });
    dispatch({ type: 'SET_TOKENS', payload: { ...tokens, accessToken } });
  } catch {
    logout();
  }
}, [logout]);
```

---

### A3. Password Reset Email Not Sent [OMITTED]

**Status:** ⏭️ Omitted per user request (SMTP/Email features not needed)

**File:** `frontend-new/src/pages/auth/ForgotPasswordPage.tsx`

**Current State:** Page exists but no email service integration.

**Implementation Guide:**

1. **Install email service:**
```bash
npm install nodemailer @sendgrid/mail
```

2. **Create email service (`src/services/emailService.ts`):**
```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendPasswordResetEmail(email: string, resetToken: string) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  await sgMail.send({
    to: email,
    from: 'noreply@ayphen-textile.com',
    subject: 'Password Reset Request',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password.</p>`,
  });
}
```

3. **Add backend endpoints:**
```typescript
// POST /api/v1/auth/forgot-password
// POST /api/v1/auth/reset-password
```

---

### A4. Password Change Not Implemented ✅ COMPLETED

**Status:** ✅ Implemented on 2026-02-08

**Implementation:**
- Backend: `POST /api/v1/auth/change-password` endpoint added in `authRoutes.ts`
- Backend: `changePassword` method in `authService.ts` with validation
- Validates current password, hashes new password, invalidates other sessions

**File:** `frontend-new/src/pages/users/UserProfilePage.tsx` (Line 259)

**Previous State:**
```typescript
{/* Placeholder for change password - often separate logic */}
<PrimaryButton variant='secondary'>Change Password</PrimaryButton>
```

**Implementation Guide:**

**Backend (userRoutes.ts):**
```typescript
router.put('/change-password', userController.changePassword);

// In userController.ts
async changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const user = await globalPrisma.users.findUnique({ where: { id: req.userId } });
  const isValid = await bcrypt.compare(currentPassword, user.password);
  if (!isValid) return res.status(400).json({ error: 'Current password incorrect' });
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await globalPrisma.users.update({
    where: { id: req.userId },
    data: { password: hashedPassword },
  });
  res.json({ message: 'Password changed successfully' });
}
```

**Frontend:**
```typescript
// Create ChangePasswordModal component
// Call PUT /api/v1/users/change-password
```

---

### A5. Two-Factor Authentication (2FA) Not Implemented

**Current State:** Only username/password authentication exists.

**Implementation Guide:**

1. **Install dependencies:**
```bash
npm install speakeasy qrcode
```

2. **Add 2FA fields to users table:**
```prisma
model users {
  // ... existing fields
  two_factor_secret String?
  two_factor_enabled Boolean @default(false)
}
```

3. **Create 2FA endpoints:**
- `POST /api/v1/auth/2fa/setup` - Generate secret and QR code
- `POST /api/v1/auth/2fa/verify` - Verify TOTP code
- `POST /api/v1/auth/2fa/disable` - Disable 2FA

---

## Backend Incomplete Features

### B1. Total Inventory Value Returns Zero ✅ COMPLETED

**Status:** ✅ Implemented on 2026-02-08

**Implementation:**
- Added SQL query to calculate `SUM(stock_quantity * cost_price)` from `location_inventory` joined with `products`
- Value now correctly returned in analytics response

**File:** `src/services/analyticsService.ts` (Line 249)

**Previous State:**
```typescript
totalInventoryValue: 0, // TODO: Calculate from products * stock * cost_price
```

**Implementation:**
```typescript
const inventoryValue = await globalPrisma.$queryRaw<[{ total: number }]>`
  SELECT COALESCE(SUM(li.stock_quantity * COALESCE(p.cost_price, p.selling_price, 0)), 0) as total
  FROM location_inventory li
  JOIN products p ON li.product_id = p.id
  WHERE li.company_id = ${tenantId}
`;
totalInventoryValue: Number(inventoryValue[0]?.total || 0),
```

---

### B2. Active Breakdowns Count Returns Zero ✅ COMPLETED

**Status:** ✅ Implemented on 2026-02-08

**Implementation:**
- Added Prisma count query for `breakdown_reports` with status `OPEN` or `IN_PROGRESS`
- Value now correctly returned in analytics response

**File:** `src/services/analyticsService.ts` (Line 262)

**Previous State:**
```typescript
activeBreakdowns: 0, // TODO: Get from breakdown_reports table
```

**Implementation:**
```typescript
const activeBreakdowns = await globalPrisma.breakdown_reports.count({
  where: {
    company_id: tenantId,
    status: { in: ['OPEN', 'IN_PROGRESS'] },
  },
});
```

---

### B3. Cash Flow - Investing Activities Returns Zero

**File:** `src/services/reportService.ts` (Line 1186)

```typescript
const investingCashFlow = 0; // TODO: Implement Asset Purchases
```

**Requires:** Create `fixed_assets` table for tracking asset purchases/sales.

**Implementation:**
```prisma
model fixed_assets {
  id            String   @id @default(uuid())
  asset_id      String
  company_id    String
  name          String
  category      String   // PROPERTY, EQUIPMENT, VEHICLE, etc.
  purchase_date DateTime
  purchase_cost Decimal  @db.Decimal(12, 2)
  current_value Decimal  @db.Decimal(12, 2)
  depreciation  Decimal  @db.Decimal(12, 2)
  disposal_date DateTime?
  disposal_value Decimal? @db.Decimal(12, 2)
  is_active     Boolean  @default(true)
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  
  @@unique([company_id, asset_id])
}
```

---

### B4. Cash Flow - Financing Activities Returns Zero

**File:** `src/services/reportService.ts` (Line 1187)

```typescript
const financingCashFlow = 0; // TODO: Implement Loans/Equity Injections
```

**Requires:** Create `loans` table for tracking loan transactions.

**Implementation:**
```prisma
model loans {
  id              String   @id @default(uuid())
  loan_id         String
  company_id      String
  lender_name     String
  loan_type       String   // BANK_LOAN, LINE_OF_CREDIT, OWNER_LOAN
  principal       Decimal  @db.Decimal(12, 2)
  interest_rate   Decimal  @db.Decimal(5, 2)
  start_date      DateTime
  end_date        DateTime?
  monthly_payment Decimal  @db.Decimal(12, 2)
  balance         Decimal  @db.Decimal(12, 2)
  status          String   @default("ACTIVE")
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  
  @@unique([company_id, loan_id])
}

model loan_transactions {
  id               String   @id @default(uuid())
  loan_id          String
  transaction_type String   // DISBURSEMENT, PAYMENT, INTEREST
  amount           Decimal  @db.Decimal(12, 2)
  transaction_date DateTime
  notes            String?
  created_at       DateTime @default(now())
}
```

---

### B5. Balance Sheet - Equity Accounts Placeholder

**File:** `src/services/reportService.ts` (Lines 1110-1114)

**Current State:** Owner's Capital = 0, Retained Earnings = balancing figure.

**Implementation:**
```prisma
model equity_accounts {
  id               String   @id @default(uuid())
  company_id       String
  account_type     String   // OWNERS_CAPITAL, DRAWINGS, RETAINED_EARNINGS
  amount           Decimal  @db.Decimal(12, 2)
  transaction_date DateTime
  description      String?
  created_at       DateTime @default(now())
}
```

---

### B6. Balance Sheet - Accrued Expenses Not Calculated

**File:** `src/services/reportService.ts` (Line 1088)

**Current State:** Returns `{ category: 'Accrued Expenses', amount: 0 }`

**Implementation:**
```typescript
// Calculate accrued expenses from unpaid bills past due date
const accruedExpenses = await globalPrisma.bills.aggregate({
  where: {
    company_id: tenantId,
    status: { in: ['PENDING', 'OVERDUE'] },
    due_date: { lt: new Date() },
  },
  _sum: { balance_due: true },
});
```

---

### B7. Trial Balance - Simplified Placeholder

**File:** `src/services/reportService.ts` (Line 1236)

**Current State:** Comment says "Simplified trial balance with placeholder accounts"

**Implementation:** Requires full chart of accounts implementation with double-entry bookkeeping.

---

### B8. User Activity Tracking Placeholder

**File:** `src/services/userService.ts` (Line 625)

**Current State:** Only returns session data, not actual activity.

**Implementation:**
```prisma
model user_activities {
  id            String   @id @default(uuid())
  user_id       String
  company_id    String?
  activity_type String   // LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW
  entity_type   String?  // ORDER, INVOICE, PRODUCT, etc.
  entity_id     String?
  ip_address    String?
  user_agent    String?
  metadata      Json?
  created_at    DateTime @default(now())
  
  @@index([user_id, created_at])
  @@index([company_id, created_at])
}
```

---

### B9. Email Service Not Configured [OMITTED]

**Status:** ⏭️ Omitted per user request (SMTP/Email features not needed)

**Current State:** No email provider integrated.

**Required for:**
- Password reset emails
- User invitation emails
- Invoice notification emails
- Order confirmation emails

**Implementation:**
1. Choose provider: SendGrid, AWS SES, or Mailgun
2. Create `src/services/emailService.ts`
3. Add email templates in `src/templates/emails/`
4. Configure environment variables

---

## Frontend Incomplete Features

### F1. Machine Management - Schedule Maintenance ✅ COMPLETED

**Status:** ✅ Implemented on 2026-02-08

**Implementation:**
- Created `MaintenanceScheduleSheet.tsx` component
- Integrated with MachineListPage dropdown menu
- Calls `machineService.scheduleMaintenance()` API

**File:** `frontend-new/src/pages/machines/MachineListPage.tsx` (Line 373)

**Previous State:**
```typescript
onClick={() => toast.info('Schedule Maintenance coming soon'))
```

**Implementation:**
1. Create `MaintenanceScheduleSheet.tsx` component
2. Connect to `POST /api/v1/machines/maintenance/schedules`
3. Add calendar view for scheduled maintenance

---

### F2. Machine Management - Report Breakdown ✅ COMPLETED

**Status:** ✅ Implemented on 2026-02-08

**Implementation:**
- Created `BreakdownReportSheet.tsx` component
- Integrated with MachineListPage dropdown menu
- Calls `machineService.reportBreakdown()` API

**File:** `frontend-new/src/pages/machines/MachineListPage.tsx` (Line 380)

---

### F3. Machine Management - View History ✅ COMPLETED

**Status:** ✅ Implemented on 2026-02-08

**Implementation:**
- Created `MachineHistoryDialog.tsx` component
- Integrated with MachineListPage dropdown menu
- Calls `machineService.getMachineStatusHistory()` API

**File:** `frontend-new/src/pages/machines/MachineListPage.tsx` (Line 385)

---

### F4. Machine Management - Assign Operator ✅ COMPLETED

**Status:** ✅ Implemented on 2026-02-08

**Implementation:**
- Created `AssignOperatorSheet.tsx` component
- Integrated with MachineListPage dropdown menu
- Calls `machineService.assignOperator()` API

**File:** `frontend-new/src/pages/machines/MachineListPage.tsx` (Line 389)

---

### F5. Inventory - Stock History ✅ COMPLETED

**Status:** ✅ Implemented on 2026-02-08

**Implementation:**
- Created `StockHistoryDialog.tsx` component
- Integrated with InventoryListPage
- Fetches stock movements from API

**File:** `frontend-new/src/pages/inventory/InventoryListPage.tsx` (Line 154)

---

### F6. Supplier - Create PO ✅ COMPLETED

**Status:** ✅ Implemented on 2026-02-08

**Implementation:**
- Added navigation to `/purchase/orders/new?supplierId=X`
- Supplier context passed via URL params

**File:** `frontend-new/src/pages/purchase/SupplierListPage.tsx` (Line 133)

---

### F7. Supplier - View POs ✅ COMPLETED

**Status:** ✅ Implemented on 2026-02-08

**Implementation:**
- Added navigation to `/purchase/orders?supplierId=X`
- Filters POs by supplier

**File:** `frontend-new/src/pages/purchase/SupplierListPage.tsx` (Line 137)

---

### F8. Google Sign-In Button [OMITTED]

**Status:** ⏭️ Omitted per user request (Google OAuth not needed)

**File:** `frontend-new/src/pages/auth/LoginPage.tsx` (Line 149)

**Implementation:** See [A1. Google OAuth Not Implemented](#a1-google-oauth-not-implemented)

---

## Missing Frontend-Backend Integrations

### I1. Audit Log Viewing UI [OMITTED]

**Status:** ⏭️ Omitted per user request

**Backend:** `src/routes/v1/auditRoutes.ts` exists with endpoints
**Frontend:** No UI to view audit logs

---

### I2. GDPR Data Export/Delete

**Backend:** `src/routes/v1/gdprRoutes.ts` exists
**Frontend:** No UI for GDPR requests

**Implementation:**
1. Add "Export My Data" button in UserProfilePage
2. Add "Delete My Account" in security settings
3. Connect to GDPR endpoints

---

### I3. Subscription Management UI [OMITTED]

**Status:** ⏭️ Omitted per user request (Subscription/Stripe features not needed)

**Backend:** `src/routes/v1/subscriptionRoutes.ts` exists
**Frontend:** `SubscriptionPlansPage` is a placeholder

---

## Code Quality Issues

### CQ1. Debug Console.logs in Production Code ✅ PARTIALLY COMPLETED

**Status:** ✅ Partially implemented on 2026-02-08

**Completed:**
- Removed debug logs from `CompaniesListPage.tsx`
- Removed debug logs from `companyService.ts`

**Remaining:**
| File | Lines | Content |
|------|-------|---------|
| `frontend-new/src/config/api.ts` | 65-66 | Logs API config (acceptable in dev) |
| `frontend-new/src/components/auth/GoogleAuthCallback.tsx` | 22 | Logs OAuth code |

**Fix:**
```bash
# Find all console.logs
grep -rn "console.log" frontend-new/src --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v test

# Remove or wrap in development check
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}
```

---

### CQ2. Deprecated Function Still Present

**File:** `src/database/connection.ts` (Lines 72-115)

```typescript
// @deprecated Tenant-specific Prisma clients are no longer used
getTenantPrisma(tenantId: string): PrismaClient {
  logger.warn(`getTenantPrisma called for tenant ${tenantId}. This is deprecated.`);
  // ... 50+ lines of deprecated code
}
```

**Fix:** Remove the deprecated function and related code (~50 lines).

---

### CQ3. Duplicate Route Registration ✅ COMPLETED

**Status:** ✅ Implemented on 2026-02-08

**Implementation:**
- Removed duplicate `/machines` route from `AppRouter.tsx`

**File:** `frontend-new/src/router/AppRouter.tsx`

---

### CQ4. Redis SCAN Not Used for Production

**File:** `src/utils/redis.ts` (Line 354)

```typescript
// Note: This is a simple implementation. For production, consider using SCAN
```

**Risk:** Using KEYS command blocks Redis on large datasets.

**Fix:** Implement SCAN-based iteration for key operations.

---

## Disabled Routes & Controllers

### D1. Inventory Item Routes Disabled

**File:** `src/routes/v1/inventoryRoutes.ts.disabled`

**Contains:**
- CRUD for inventory items
- Stock movements
- Low stock alerts
- Inventory summary

**Fix:**
```bash
mv src/routes/v1/inventoryRoutes.ts.disabled src/routes/v1/inventoryRoutes.ts
# Note: Current inventoryRoutes.ts has different endpoints - merge if needed
```

---

### D2. Production Routes Disabled ✅ COMPLETED

**Status:** ✅ Implemented on 2026-02-08

**Implementation:**
- Renamed `productionRoutes.ts.disabled` to `productionRoutes.ts`
- Registered routes in `src/routes/v1/index.ts`

**File:** `src/routes/v1/productionRoutes.ts`

---

### D3. Production Controller Disabled ✅ COMPLETED

**Status:** ✅ Implemented on 2026-02-08

**Implementation:**
- Renamed `productionController.ts.disabled` to `productionController.ts`

**File:** `src/controllers/productionController.ts`

---

## Placeholder Pages

### P1. Subscription Plans Page [OMITTED]

**Status:** ⏭️ Omitted per user request (Subscription/Stripe features not needed)

**File:** `frontend-new/src/pages/index.ts` (Line 70)

---

### P2. Legal Page

**File:** `frontend-new/src/pages/index.ts` (Line 80)

```typescript
export const LegalPage = PlaceholderPage;
```

**Implementation:** Create pages for:
- Terms of Service
- Privacy Policy
- Cookie Policy
- GDPR Compliance

---

### P3. Custom Reports Page

**File:** `frontend-new/src/pages/reports/CustomReportsPage.tsx`

**Current State:** Shows "Custom Reports Coming Soon" empty state.

**Implementation:**
1. Create report builder UI
2. Allow selecting metrics, dimensions, filters
3. Save custom report configurations
4. Generate and export reports

---

### P4. Settings Page

**File:** `frontend-new/src/router/AppRouter.tsx` (Lines 539-548)

**Current State:** `/settings` renders `UserProfilePage` instead of dedicated settings.

**Implementation:**
1. Create `SettingsPage.tsx` with sections:
   - Company Settings
   - Notification Preferences
   - Theme Settings
   - Integration Settings
   - API Keys

---

## Feature-Specific Implementation Guides

### Guide 1: Complete Email Service Setup

**Step 1: Install dependencies**
```bash
cd /Users/nivetharamdev/Projects/ayphen-textile
npm install @sendgrid/mail nodemailer
```

**Step 2: Create email service**
```typescript
// src/services/emailService.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  await sgMail.send({
    to: options.to,
    from: options.from || 'noreply@ayphen-textile.com',
    subject: options.subject,
    html: options.html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Password Reset Request - Ayphen Textile',
    html: `
      <h1>Password Reset</h1>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    `,
  });
}

export async function sendInvitationEmail(email: string, companyName: string, inviterName: string): Promise<void> {
  const acceptUrl = `${process.env.FRONTEND_URL}/accept-invitation?email=${encodeURIComponent(email)}`;
  await sendEmail({
    to: email,
    subject: `You've been invited to join ${companyName}`,
    html: `
      <h1>Company Invitation</h1>
      <p>${inviterName} has invited you to join ${companyName} on Ayphen Textile.</p>
      <a href="${acceptUrl}">Accept Invitation</a>
    `,
  });
}
```

**Step 3: Add environment variables**
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
FRONTEND_URL=https://your-domain.com
```

---

### Guide 2: Enable Rate Limiting

**Step 1: Uncomment rate limiting code**

In `src/middleware/rateLimiter.ts`, remove lines 3-10 and uncomment lines 31-377.

**Step 2: Configure Redis**

Ensure Redis is running and `REDIS_URL` is set in `.env`.

**Step 3: Set appropriate limits**

```typescript
export const authRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 5,
  onLimitReached: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
  },
});

export const generalRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  maxRequests: 100,
});
```

---

### Guide 3: Implement Production Module

**Step 1: Enable routes and controller**
```bash
mv src/routes/v1/productionRoutes.ts.disabled src/routes/v1/productionRoutes.ts
mv src/controllers/productionController.ts.disabled src/controllers/productionController.ts
```

**Step 2: Register routes**

In `src/routes/v1/index.ts`:
```typescript
import productionRoutes from './productionRoutes';
// ...
router.use('/production', productionRoutes);
```

**Step 3: Create frontend pages**
- `ProductionOrdersListPage.tsx`
- `WorkOrdersListPage.tsx`
- `ProductionDashboardPage.tsx`

**Step 4: Add navigation**

In `frontend-new/src/config/navigationConfig.ts`:
```typescript
{
  title: 'Production',
  icon: Factory,
  children: [
    { title: 'Production Orders', href: '/production/orders' },
    { title: 'Work Orders', href: '/production/work-orders' },
    { title: 'Dashboard', href: '/production/dashboard' },
  ],
}
```

---

## Priority Matrix

| Priority | ID | Issue | Effort | Impact |
|----------|-----|-------|--------|--------|
| 🔴 Critical | S1 | Rate Limiting Disabled | Low | Critical |
| 🔴 Critical | A2 | Refresh Token API | Low | High |
| 🔴 Critical | A1 | Google OAuth | Medium | High |
| 🟠 High | CQ1 | Debug Console.logs | Low | Medium |
| 🟠 High | B1 | Inventory Value Calculation | Low | Medium |
| 🟠 High | B2 | Active Breakdowns Count | Low | Low |
| 🟠 High | D1-D3 | Disabled Routes | Low | Medium |
| 🟡 Medium | B3-B7 | Financial Report Fixes | High | Medium |
| 🟡 Medium | F1-F4 | Machine Management Features | Medium | Medium |
| 🟡 Medium | A3-A4 | Password Reset/Change | Medium | Medium |
| 🟢 Low | P1-P4 | Placeholder Pages | Medium | Low |
| 🟢 Low | CQ2-CQ4 | Code Quality | Low | Low |

---

## Quick Wins

These can be completed in under 30 minutes each:

1. ✅ **Remove debug console.logs** (4 files, ~15 lines)
   ```bash
   grep -rn "console.log" frontend-new/src --include="*.ts" --include="*.tsx" | grep -v test
   ```

2. ✅ **Fix inventory value calculation** (1 SQL query in analyticsService.ts)

3. ✅ **Fix active breakdowns count** (add Prisma count query)

4. ✅ **Enable productionRoutes** (rename file, add import)

5. ✅ **Remove duplicate /machines route** (delete 10 lines in AppRouter.tsx)

6. ✅ **Remove deprecated getTenantPrisma** (delete ~50 lines in connection.ts)

7. ✅ **Fix ESLint disable comments** (2 files, add proper dependencies)

---

## Commands for Quick Fixes

```bash
# Remove debug console.logs (find them first)
grep -rn "console.log" frontend-new/src --include="*.ts" --include="*.tsx" | grep -v node_modules | grep -v test

# Enable disabled routes
mv src/routes/v1/productionRoutes.ts.disabled src/routes/v1/productionRoutes.ts
mv src/controllers/productionController.ts.disabled src/controllers/productionController.ts

# Find all TODO comments
grep -rn "TODO" src --include="*.ts" | wc -l
grep -rn "TODO" frontend-new/src --include="*.ts" --include="*.tsx" | wc -l

# Find all placeholder implementations
grep -rn "coming soon\|Coming Soon\|placeholder\|not implemented" frontend-new/src --include="*.tsx"
```

---

## Notes

- **Test coverage exists** (unit, integration, performance, security tests in `src/__tests__/`)
- **Stripe SDK is installed** but needs configuration
- **Redis is configured** and working
- **Application is functional** for core features
- **Security issues should be addressed** before production deployment
- **Email service is critical** for password reset and invitations

---

## Recommended Implementation Order

1. **Week 1: Security & Auth**
   - Enable rate limiting (S1)
   - Implement refresh token (A2)
   - Configure Stripe keys (S2)

2. **Week 2: Core Functionality**
   - Fix analytics calculations (B1, B2)
   - Enable production module (D1-D3)
   - Remove debug logs (CQ1)

3. **Week 3: User Experience**
   - Implement Google OAuth (A1)
   - Password reset/change (A3, A4)
   - Machine management features (F1-F4)

4. **Week 4: Polish**
   - Complete placeholder pages (P1-P4)
   - Financial report fixes (B3-B7)
   - Code quality cleanup (CQ2-CQ4)

---

*Generated by comprehensive file-by-file audit on 2026-02-06*
