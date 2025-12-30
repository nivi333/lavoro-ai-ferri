# Frontend Component Documentation

> **Source of Truth**: This document describes the EXACT implementation from `/frontend` folder.
> All new implementations MUST match these specifications exactly.

## Authentication Screens

### LoginPage (`/src/pages/auth/LoginPage.tsx`)

**Component**: `LoginForm.tsx`

**Fields**:
| Field | Variable | Type | Mandatory | Validation |
|-------|----------|------|-----------|------------|
| Email or Phone Number | `emailOrPhone` | string | ✓ | Email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` OR Phone regex: `/^\+?[1-9]\d{1,14}$/` |
| Password | `password` | string | ✓ | Min 8 characters |
| Remember Me | `rememberMe` | boolean | ✗ | - |

**Remember Me Behavior**:
- When checked: Save `emailOrPhone` in localStorage as `rememberedUser`
- On mount: Auto-fill `emailOrPhone` if `rememberedUser` exists
- **NOTE**: Current implementation only saves email/phone, NOT password

**UI Elements**:
- Google Sign-In button (with PKCE flow)
- Social media buttons: Facebook, YouTube, Instagram (circular, with icons)
- "Forgot Password" link
- "Sign up" link to register

**API**: `POST /api/v1/auth/login`

**Redirect**: `/companies` (NOT `/dashboard`)

---

### RegisterPage (`/src/pages/auth/RegisterPage.tsx`)

**Component**: `RegistrationWizard.tsx`

**Fields**:
| Field | Variable | Type | Mandatory | Validation |
|-------|----------|------|-----------|------------|
| First Name | `firstName` | string | ✓ | Min 3, Max 50 chars, Pattern: `/^[a-zA-Z\s'-]+$/` |
| Last Name | `lastName` | string | ✓ | Min 3, Max 50 chars, Pattern: `/^[a-zA-Z\s'-]+$/` |
| Email or Phone Number | `emailOrPhone` | string | ✓ | Email regex OR Phone regex (same as login) |
| Password | `password` | string | ✓ | Min 8 chars, Pattern: `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/` (must have uppercase, lowercase, number) |
| Confirm Password | `confirmPassword` | string | ✓ | Must match `password` |
| Terms Agreement | `agreeToTerms` | boolean | ✓ | Must be checked |

**Help Text**:
- Below emailOrPhone field: "Enter your email address or phone number with country code (e.g., +1 for US, +91 for India)"

**Logic**:
```typescript
// Determine if emailOrPhone is email or phone
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const registrationData = {
  firstName: values.firstName,
  lastName: values.lastName,
  password: values.password,
  ...(emailRegex.test(values.emailOrPhone || '')
    ? { email: values.emailOrPhone }
    : { phone: values.emailOrPhone }),
};
```

**UI Elements**:
- Input icons: UserOutlined for name fields, LockOutlined for password
- Terms checkbox with links to Terms and Privacy Policy
- "Sign in" link to login

**API**: `POST /api/v1/auth/register`

**Redirect**: `/login` after success

---

### ForgotPasswordPage (`/src/pages/auth/ForgotPasswordPage.tsx`)

**Component**: `ForgotPasswordForm.tsx`

**Fields**:
| Field | Variable | Type | Mandatory | Validation |
|-------|----------|------|-----------|------------|
| Email | `email` | string | ✓ | Email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |

**API**: `POST /api/v1/auth/forgot-password`

**Redirect**: `/login` after success

---

## Company Management

### CompaniesListPage (`/src/pages/company/CompaniesListPage.tsx`)

**UI Elements**:
- Top bar:
  - Brand logo (top-left)
  - "Add Company" button (opens CompanyCreationDrawer)
  - "Logout" button (with confirmation modal)
- Two tabs: "Owner" and "Roles"
- Company cards display:
  - Logo/avatar (or first letter if no logo)
  - Company name
  - Industry
  - Role badge with colors:
    - OWNER: `#1890ff` (blue)
    - ADMIN: `#722ed1` (purple)
    - MANAGER: `#52c41a` (green)
    - EMPLOYEE: `#fa8c16` (orange)
  - Team icon
  - "Accept" button (for PENDING status)
- Lazy loading: 2.5s delay with spinner
- Empty state when no companies

**APIs**:
- `GET /api/v1/companies` - Fetch companies
- `POST /api/v1/companies/{id}/switch` - Switch company

**On Company Select**: Call `switchCompany()` → navigate to `/dashboard`

---

### CompanyCreationDrawer (`/src/components/CompanyCreationDrawer.tsx`)

**Mode**: `create` | `edit`

**Sections**:

#### 1. Basic Information
| Field | Variable | Type | Mandatory | Max Length | Validation |
|-------|----------|------|-----------|------------|------------|
| Logo | `logoUrl` | file | ✗ | 2MB | PNG/JPG/SVG |
| Company Name | `name` | string | ✓ | 48 | - |
| Company Slug | `slug` | string | ✓ | 32 | Pattern: `/^[a-z0-9-]+$/`, Must be unique |
| Industry | `industry` | select | ✓ | - | Options: TEXTILE_MANUFACTURING, GARMENT_PRODUCTION, etc. |
| Description | `description` | textarea | ✗ | 80 | - |
| Country | `country` | select | ✓ | - | Options: India, USA, UK, China, etc. |
| Default Location Name | `defaultLocation` | string | ✓ | 32 | - |

**Slug Logic**:
- Auto-generated from name: `name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')`
- Displayed as: `lavoro.ai/{slug}`
- Check uniqueness via API: `companyService.checkSlugAvailability(slug)`

#### 2. Address
| Field | Variable | Type | Mandatory | Max Length |
|-------|----------|------|-----------|------------|
| Address Line 1 | `addressLine1` | string | ✓ | 64 |
| Address Line 2 | `addressLine2` | string | ✗ | 64 |
| City | `city` | string | ✓ | 32 |
| State | `state` | string | ✓ | 32 |
| Pincode | `pincode` | string | ✓ | 12 |

#### 3. Business Details
| Field | Variable | Type | Mandatory | Validation |
|-------|----------|------|-----------|------------|
| Established Date | `establishedDate` | date | ✓ | Format: YYYY-MM-DD |
| Business Type | `businessType` | select | ✓ | Options: Manufacturer, Trader, Exporter, Other |
| Certifications | `certifications` | string | ✗ | Comma-separated, Max 64 |

#### 4. Contact Information
| Field | Variable | Type | Mandatory | Max Length | Validation |
|-------|----------|------|-----------|------------|------------|
| Contact Info | `contactInfo` | string | ✓ | - | Email OR Phone (uses EmailPhoneInput component) |
| Website | `website` | string | ✗ | 48 | - |
| Tax ID | `taxId` | string | ✗ | 24 | - |

**Additional**:
- Active/Inactive toggle (only in edit mode)
- `isActive` field (boolean, default: true for new companies)

**API**:
- Create: `POST /api/v1/companies`
- Update: `PUT /api/v1/companies/{id}`
- Check slug: `GET /api/v1/companies/check-slug/{slug}`

**On Success**: 
- Create: Refresh companies list, close drawer
- Update: Call `onCompanyUpdated`, close drawer

---

## User Management

### UsersListPage (`/src/pages/users/UsersListPage.tsx`)

**UI Elements**:
- Page header with "Team Members" title
- Header action: "Invite User" button (PrimaryButton)
- Filters:
  - Search input (name, email, or role)
  - Role filter dropdown (All Roles, OWNER, ADMIN, MANAGER, EMPLOYEE)
  - Status filter dropdown (All Status, Active, Inactive)
- Bulk actions bar (when users selected):
  - Change Role button
  - Activate/Deactivate buttons
  - Remove button (DangerButton)
  - Clear Selection button
- Data table with columns:
  - Checkbox (for bulk selection, max 10)
  - User (Avatar + Name + Email)
  - Role (Badge with color coding)
  - Status (Active/Inactive badge)
  - Last Active (formatted time)
  - Actions (Dropdown menu)
- Empty state when no users

**Role Badge Colors**:
- OWNER: `info` variant (blue)
- ADMIN: `default` variant (gray)
- MANAGER: `success` variant (green)
- EMPLOYEE: `warning` variant (orange)

**Actions Dropdown**:
- Edit User
- Change Role
- Activate/Deactivate
- Remove (red text)

**APIs**:
- `GET /api/v1/users` - List company users with filters
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Remove user from company
- `PATCH /api/v1/users/bulk/update` - Bulk update users
- `DELETE /api/v1/users/bulk/remove` - Bulk remove users

---

### UserInviteSheet (`/src/components/users/UserInviteSheet.tsx`)

**Component Type**: Sheet (Drawer replacement)

**Fields**:
| Field | Variable | Type | Mandatory | Validation |
|-------|----------|------|-----------|------------|
| Email or Phone | `emailOrPhone` | string | ✓ | Email regex OR Phone regex (same as login) |
| Role | `role` | select | ✓ | Options: EMPLOYEE, MANAGER, ADMIN |
| Location | `locationId` | select | ✓ | Dropdown of company locations |

**Role Options**:
- EMPLOYEE (default)
- MANAGER
- ADMIN
- Note: OWNER role cannot be assigned via invitation

**Help Text**:
- "Only existing users can be invited to join your company"
- "User will receive an invitation to accept or decline"
- "Invalid or non-existent users will be reported"

**Logic**:
```typescript
const inviteData = {
  emailOrPhone: values.emailOrPhone.trim(),
  role: values.role,
  companyId: currentCompany.id,
  locationId: values.locationId,
};
```

**API**: `POST /api/v1/companies/{companyId}/invite`

**On Success**: Close sheet, show success toast, refresh users list

---

### UserEditSheet (`/src/components/users/UserEditSheet.tsx`)

**Component Type**: Sheet (Drawer replacement)

**Sections**:

#### 1. Personal Information
| Field | Variable | Type | Mandatory | Validation |
|-------|----------|------|-----------|------------|
| Avatar | `avatarUrl` | file | ✗ | JPG/PNG/WEBP, Max 2MB |
| First Name | `firstName` | string | ✓ | Min 1 char |
| Last Name | `lastName` | string | ✓ | Min 1 char |

#### 2. Contact Details
| Field | Variable | Type | Mandatory | Validation |
|-------|----------|------|-----------|------------|
| Email | `email` | string | ✓ | Email format |
| Phone | `phone` | string | ✗ | Phone format |

#### 3. Role & Permissions
| Field | Variable | Type | Mandatory | Options |
|-------|----------|------|-----------|----------|
| Role | `role` | select | ✓ | OWNER, ADMIN, MANAGER, EMPLOYEE |
| Department | `department` | string | ✗ | Free text |
| Location | `locationId` | select | ✗ | Company locations |
| Active Status | `isActive` | switch | ✓ | Boolean toggle |

**Role Change Warning**:
- Alert shown when role is changed
- Confirmation dialog before saving
- Warning text: "Changing the user's role will immediately affect their access permissions."

**Avatar Upload**:
- Click to upload
- Preview in circular avatar
- File validation (type and size)
- Base64 conversion for upload

**API**: `PUT /api/v1/users/{id}`

**On Success**: Close sheet, show success toast, refresh users list

---

## Notes

1. **Email or Phone**: Both login and register use a SINGLE `emailOrPhone` field, not separate fields
2. **Validation**: All regex patterns must match exactly
3. **Remember Me**: Currently only saves email/phone, password saving is a new requirement
4. **Logo Placement**: All auth pages have logo in AuthLayout (top-left), NOT inside card
5. **Company Selection**: MUST call `switchCompany()` before navigating to dashboard
6. **Role Colors**: Must match exact hex values for consistency
7. **User Invitation**: Only existing registered users can be invited to companies
8. **Bulk Operations**: Maximum 10 users can be selected at once for bulk actions
9. **Role Hierarchy**: OWNER > ADMIN > MANAGER > EMPLOYEE
