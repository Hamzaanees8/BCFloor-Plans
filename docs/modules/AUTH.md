# BC Floor - Module Documentation: AUTH

Authentication system. Read AI_INDEX.md first.

---

## Feature Overview

**Purpose**: Secure multi-role authentication for Admin, Agent, Vendor, Co-Agent users

**Core Responsibility**:
- User login/logout
- JWT token management
- Permission checking
- Role-based access control

**User Scope**:
- Admin: Full system access
- Agent: Create orders, manage team, view team data
- Co-Agent: Assist agent, view assigned orders
- Vendor: View assigned work, manage availability

---

## Business Logic

### Authentication Flow

```
Step 1: USER SUBMITS LOGIN
  Input: email, password
  Action: POST /auth/login
  
  Backend:
  ├─ Hash password
  ├─ Compare with stored hash
  ├─ If match:
  │  ├─ Generate JWT token
  │  ├─ Return token + user info
  │  └─ Status: 200
  └─ If no match:
     └─ Status: 401, message: "Invalid credentials"

Step 2: FRONTEND STORES TOKEN
  ├─ localStorage.setItem("token", jwt)
  ├─ localStorage.setItem("userInfo", JSON.stringify(user))
  └─ Store: { uuid, email, first_name, permissions[], roles[] }

Step 3: INCLUDE TOKEN IN REQUESTS
  ├─ All API calls add header:
  │  └─ Authorization: Bearer ${token}
  │
  ├─ Interceptor (lib/api.ts):
  │  ├─ On request: add Authorization header
  │  └─ On 401: clear localStorage, redirect to /login

Step 4: USER LOGOUT
  Action: POST /auth/logout
  
  Frontend:
  ├─ localStorage.removeItem("token")
  ├─ localStorage.removeItem("userInfo")
  └─ Redirect to /login

Step 5: REFRESH / EXPIRY
  On 401 response:
  ├─ Server: Token expired
  ├─ Frontend: Clear token
  ├─ Redirect to /login
  └─ User must re-authenticate
```

### Permission System

**Permissions** (defined in `lib/permissions.ts`):
```typescript
export const PERMISSIONS = {
  VIEW_ORDERS, CREATE_ORDERS, EDIT_ORDERS, DELETE_ORDERS,
  VIEW_VENDORS, CREATE_VENDOR, UPDATE_VENDOR,
  VIEW_AGENTS, CREATE_AGENT,
  VIEW_ADMIN, CREATE_ADMIN,
  CREATE_SERVICES, VIEW_SERVICES,
  ACCESS_BILLING, ACCESS_VENDOR_BILLING,
  SET_DISCOUNTS, PRINT_REQUESTS,
  BOOK_APPOINTMENTS, EDIT_APPOINTMENTS,
  CREATE_LISTING, VIEW_LISTING,
  CREATE_TOUR_SETTINGS,
  CREATE_SUB_ACCOUNTS,
  VIEW_ALL_APPOINTMENTS,
  VIEW_ONLY_APPOINTMENTS_FOR_CO_AGENT,
  ...more
}
```

**Permission Checking** (in components):
```typescript
const { permissions } = useContext(UserContext);

if (hasPermission(permissions, 'CREATE_ORDERS')) {
  // Show create order button
}

if (hasAllPermissions(permissions, ['CREATE_ORDERS', 'EDIT_ORDERS'])) {
  // Show advanced features
}

if (hasAnyPermission(permissions, ['ACCESS_BILLING', 'ACCESS_VENDOR_BILLING'])) {
  // Show billing option
}
```

---

## APIs

### POST /auth/login

**Purpose**: User authentication

**Request**:
```json
{
  "email": "agent@company.com",
  "password": "SecurePassword123"
}
```

**Success Response (200)**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "uuid": "usr-abc123",
    "email": "agent@company.com",
    "first_name": "John",
    "last_name": "Doe",
    "roles": [
      { "id": 1, "name": "Agent" }
    ],
    "permissions": [
      { "id": 1, "name": "CREATE_ORDERS" },
      { "id": 2, "name": "VIEW_ORDERS" },
      ...
    ],
    "organization_id": 1,
    "avatar_url": "https://s3.../avatar.jpg"
  }
}
```

**Error Response (401)**:
```json
{
  "message": "Invalid credentials"
}
```

---

### POST /auth/logout

**Purpose**: User logout (backend session cleanup if applicable)

**Headers**: 
```
Authorization: Bearer ${token}
```

**Success Response (200)**:
```json
{
  "message": "Logged out successfully"
}
```

---

### POST /auth/forgot-password

**Purpose**: Request password reset link

**Request**:
```json
{
  "email": "user@company.com"
}
```

**Success Response (200)**:
```json
{
  "message": "Reset link sent to email"
}
```

---

### POST /auth/reset-password

**Purpose**: Set new password with reset token

**Request**:
```json
{
  "token": "reset-token-from-email",
  "password": "NewPassword123",
  "password_confirmation": "NewPassword123"
}
```

**Success Response (200)**:
```json
{
  "message": "Password reset successful"
}
```

---

## Data Models

### User (TypeScript)

```typescript
export type Admin = {
    uuid?: string
    full_name: string
    email: string
    created_at: string
    status?: boolean
    permissions?: Permission[]
    roles?: Role[]
    address?: string
    primary_phone?: string
    secondary_phone?: string
    avatar_url?: string
    organization_id?: number | null
    organization?: { id: number; name: string } | null
}

export type Agent = {
    uuid?: string
    first_name: string
    last_name: string
    payment_status: string
    email: string
    created_at: string
    status?: boolean
    permissions?: Permission[]
    roles?: Role[]
    headquarter_address?: string
    primary_phone?: string
    secondary_phone?: string
    avatar_url?: string
    company_name: string
    notes: string
    co_agents?: CoAgent[]
    organization_id?: number | null
}

export type Vendor = {
    uuid?: string
    full_name: string
    first_name: string
    last_name: string
    email: string
    created_at: string
    status?: boolean
    vendor_services: VendorService[]
    company?: { uuid: string, company_name: string }
    address?: string
    primary_phone?: string
    secondary_phone?: string
    company_name: string
    avatar_url?: string
    addresses: Address[]
    settings: VendorSettings
    organization_id?: number | null
}

export type Permission = {
    id: number
    name: string
    created_at?: string
    updated_at?: string
}

export type Role = {
    id: number
    name: string
    permissions?: Permission[]
}

export type UserInfo = {
    uuid: string
    first_name: string
    last_name: string
    email: string
    permissions?: Permission[]
    roles?: Role[]
}
```

---

## Components

### Login Form
**File**: `app/(auth)/login/page.tsx`

**Props**: None (page component)

**Features**:
- Email input
- Password input
- "Remember me" checkbox (optional)
- "Forgot password" link
- Submit button
- Error message display

**Flow**:
1. User enters email + password
2. POST /auth/login
3. If success: Store token, redirect to /dashboard
4. If error: Show error message

---

### Logout Handler
**File**: `app/(auth)/logout.ts`

**Effect**:
- Clears localStorage
- Redirects to /login

---

### Protected Routes (HOC)
**File**: `components/ProtectedAdminRoute.tsx`

**Purpose**: Wrapper to enforce authentication + admin role

**Usage**:
```typescript
<ProtectedAdminRoute>
  <AdminPanel />
</ProtectedAdminRoute>
```

---

## Hooks & Utilities

### useContext(UserContext)

**Returns**:
```typescript
{
  user: UserInfo | null
  permissions: Permission[]
  roles: Role[]
  loading: boolean
  logout: () => void
}
```

**Usage**:
```typescript
const { user, permissions } = useContext(UserContext);

if (!user) {
  return <div>Not logged in</div>;
}

if (hasPermission(permissions, 'CREATE_ORDERS')) {
  // Show feature
}
```

---

### hasPermission()

**Signature**:
```typescript
function hasPermission(
  permissions: Permission[] | undefined,
  permissionName: string
): boolean
```

**Usage**:
```typescript
if (hasPermission(permissions, 'CREATE_ORDERS')) {
  // Show button
}
```

---

### hasAllPermissions()

**Signature**:
```typescript
function hasAllPermissions(
  permissions: Permission[] | undefined,
  permissionNames: string[]
): boolean
```

**Usage**:
```typescript
if (hasAllPermissions(permissions, ['CREATE_ORDERS', 'EDIT_ORDERS'])) {
  // Show advanced features (requires both)
}
```

---

### hasAnyPermission()

**Signature**:
```typescript
function hasAnyPermission(
  permissions: Permission[] | undefined,
  permissionNames: string[]
): boolean
```

**Usage**:
```typescript
if (hasAnyPermission(permissions, ['ACCESS_BILLING', 'ACCESS_VENDOR_BILLING'])) {
  // Show billing option (requires one of them)
}
```

---

### getUserInfo()

**Signature**:
```typescript
function getUserInfo(): UserInfo | null
```

**Returns**: Parsed user from localStorage or null

**Usage**:
```typescript
const user = getUserInfo();
if (user?.uuid === current_user_id) {
  // User is viewing their own profile
}
```

---

## API Integration

**Base URL**: `process.env.NEXT_PUBLIC_API_URL`

**Interceptor** (`lib/api.ts`):
```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      toast.error("Session expired — you've been logged out");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

---

## Edge Cases

### Case 1: Token Expiration
**Scenario**: User makes API call with expired token

**Behavior**:
1. Server returns 401
2. Interceptor clears localStorage
3. Interceptor redirects to /login
4. User must login again

**Code**:
```typescript
if (error.response?.status === 401) {
  localStorage.removeItem("token");
  window.location.href = "/login";
}
```

---

### Case 2: Missing Permissions
**Scenario**: User tries to access feature without permission

**Behavior**:
1. Component checks permission
2. If missing: Feature not shown (graceful degradation)
3. If forced access: Show error toast

**Code**:
```typescript
if (!hasPermission(permissions, 'CREATE_ORDERS')) {
  return <div>You don't have permission</div>;
}
```

---

### Case 3: Multi-Tab Login
**Scenario**: User logs in on multiple tabs

**Behavior**:
1. Tab 1 logs out
2. localStorage cleared on Tab 1
3. Tab 2 makes API call (token gone)
4. 401 → redirect to login
5. User sees "Session expired"

---

### Case 4: Role Change
**Scenario**: Admin user permission updated on backend

**Behavior**:
1. User's cached permissions in localStorage don't update
2. Next API call might fail (if permission-based)
3. Solution: Refresh token/user info after permission changes

**Fix**: Reload user context after permission update
```typescript
const refreshUserContext = async () => {
  const response = await api.get('/auth/me');
  setUserContext(response.data);
};
```

---

## Related Features

- **Access Control**: Permission checking in all pages
- **Multi-Portal Routing**: Domain determines user portal
- **Order Management**: Requires CREATE_ORDERS permission
- **Vendor Management**: Requires CREATE_VENDOR permission
- **Billing**: Requires ACCESS_BILLING permission

---

## Testing Checklist

- [ ] Login with valid credentials
- [ ] Login with invalid credentials (error)
- [ ] Login with wrong password (error)
- [ ] Login with non-existent email (error)
- [ ] Token stored in localStorage after login
- [ ] API calls include Authorization header
- [ ] 401 response clears token and redirects
- [ ] Logout clears localStorage
- [ ] Permission checking works (hasPermission)
- [ ] Multiple portals can be accessed with correct user

---

## Known Issues

- None reported

---

## Last Updated

Generated: 2026-06-02
Related: PROJECT_SCOPE.md (User Roles section)
