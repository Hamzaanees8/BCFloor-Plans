# BC Floor - PROJECT_CONTEXT

Full technical architecture reference. Read AI_INDEX.md first.

---

## System Overview

BC Floor is a **multi-tenant, multi-portal booking and service management platform** for flooring services. It enables:

1. **Admins** to manage the entire system, create agents/vendors, configure services
2. **Agents** to book services for clients, assign vendors, manage teams
3. **Vendors** to view assigned work, manage availability, track earnings

The system handles:
- Complex order workflows (Pending → Scheduled → Completed → Invoiced)
- Multi-vendor assignments with travel time optimization
- Tax calculations based on location (Canada: GST/HST/QST; USA: Sales Tax)
- Payment splitting between agents and co-agents
- Real-time notifications
- S3-based file management

---

## Architecture

### Frontend Architecture

**Framework**: Next.js 15 with App Router (TypeScript)

**Portal Routing** (via middleware):
```
Request → middleware.ts detects domain
         ↓
    Portal type determined (Admin/Agent/Vendor)
         ↓
    Routes rewritten (/agent/*, /vendor/*, /dashboard/*)
         ↓
    User portal loads
```

**Three User Portals**:
1. **Admin Portal**: `/dashboard/*`
   - Full system access
   - Manage users, services, organizations

2. **Agent Portal**: `/agent/*` OR `/dashboard/*` (shared)
   - Create bookings
   - Manage team (co-agents)
   - View invoices

3. **Vendor Portal**: `/vendor/*` OR `/dashboard/*` (shared)
   - View scheduled work
   - Manage availability
   - View earnings

**Context Providers** (in `app/context/`):
- `AppContext`: Global app state (theme, navigation)
- `UserContext`: Current user info, permissions
- `OrderContext`: Order state during creation/editing
- `GlobalFileUploadContext`: Multi-file upload queue
- `GlobalDownloadContext`: Multi-file download queue
- `UploadQueueContext`: Upload progress tracking

**Component Structure**:
```
Components:
├── UI Components (Radix UI wrapped)
│   ├── Button, Dialog, Dropdown, Select, etc.
│   └── Located in: /components/ui/
│
├── Feature Components
│   ├── DataTable (TanStack React Table)
│   ├── OrderQuickViewCard
│   ├── OrderDetailView
│   ├── PaymentDialog
│   ├── AddCoAgentDialog
│   └── Etc.
│
├── Upload/Download Components
│   ├── GlobalUploadProgressOverlay
│   ├── GlobalDownloadProgressOverlay
│   └── UploadProgressToast
│
└── Pages (Next.js route components)
    └── Located in: /app/dashboard/*, /app/agent/*, /app/vendor/*
```

### Backend Architecture (REST API)

**Authentication**:
- Method: JWT Bearer token
- Flow: Login → Get token → Store in localStorage → Include in all requests
- Interceptor: `lib/api.ts` adds `Authorization: Bearer ${token}` to all requests
- Expiration: Server returns 401 → Client redirects to login

**API Base URL**: `process.env.NEXT_PUBLIC_API_URL`
Typical value: `https://api-stage.bcfloorplans.com/api`

**API Endpoints** (client-side calls):

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | User authentication |
| `/auth/logout` | POST | Logout |
| `/users/{id}` | GET | User details |
| `/users` | GET | List users |
| `/orders` | GET | List orders |
| `/orders/{id}` | GET | Order details |
| `/orders` | POST | Create order |
| `/orders/{id}` | PUT | Update order |
| `/orders/{id}/cancel` | POST | Cancel order |
| `/services` | GET | List services |
| `/services/{id}` | GET | Service details |
| `/vendors` | GET | List vendors |
| `/vendors/{id}` | GET | Vendor details |
| `/vendors/{id}` | PUT | Update vendor |
| `/agents` | GET | List agents |
| `/agents/{id}` | GET | Agent details |
| `/payments` | GET | List payments |
| `/invoices` | GET | List invoices |
| `/invoices/{id}` | GET | Invoice details |
| `/invoices` | POST | Create invoice |
| `/notifications` | GET | List notifications |
| `/uploads/presigned-urls` | POST | Get S3 presigned URLs |
| `/uploads/confirm` | POST | Confirm upload completion |
| `/downloads` | POST | Download files |

**Error Handling**:
```javascript
// All requests go through lib/api.ts interceptor
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired
      toast.error("Session expired — you've been logged out");
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

### Database Schema (Backend)

**Core Tables**:

```sql
-- Users & Auth
users
  id, uuid, email, password_hash, first_name, last_name, avatar_url, created_at

-- User Roles & Organizations
organizations
  id, name, slug, created_at

user_organization_roles
  id, user_id, organization_id, role_id

roles
  id, name (Admin, Agent, Vendor, CoAgent)

permissions
  id, name (CREATE_ORDERS, EDIT_ORDERS, etc.)

role_permissions
  id, role_id, permission_id

-- Agents & Co-Agents
agents
  id, uuid, user_id, company_name, first_name, last_name, email, primary_phone,
  secondary_phone, headquarter_address, status, organization_id, created_at

co_agents
  id, uuid, agent_id, name, email, split_percentage, primary_phone, created_at

-- Vendors
vendors
  id, uuid, user_id, company_name, first_name, last_name, email, primary_phone,
  secondary_phone, status, organization_id, created_at

vendor_addresses
  id, uuid, vendor_id, type, address_line_1, address_line_2, city, province,
  country, created_at

vendor_work_hours
  id, uuid, vendor_id, start_time, end_time, work_days (JSON), repeat_weekly,
  break_start, break_end, commute_minutes, timezone, created_at

vendor_settings
  id, uuid, vendor_id, payment_per_km, enable_service_area, force_service_area

-- Services
services
  id, uuid, name, category_id, thumbnail_url, description, background_color,
  border_color, status, created_at

vendor_services
  id, uuid, vendor_id, service_id, hourly_rate, time_needed, status, created_at

-- Orders (Bookings)
orders
  id, uuid, agent_id, property_id, order_status (pending, scheduled, completed,
  invoiced, cancelled), payment_status, amount, tax_amount, paid_amount,
  split_invoice, created_at

order_services
  id, uuid, order_id, service_id, quantity, hourly_rate, amount, created_at

order_slots
  id, uuid, order_id, vendor_id, service_id, start_time, end_time, date,
  travel_distance, travel_cost, created_at

-- Payments & Invoices
invoices
  id, uuid, order_id, vendor_id, amount, tax_amount, tax_rate, tax_type,
  status (draft, sent, paid, overdue), due_date, created_at

payments
  id, uuid, invoice_id, amount, payment_method, transaction_id, status,
  paid_at, created_at

-- Notifications
notifications
  id, uuid, user_id, type (order_created, order_assigned, payment_received,
  etc.), source, source_id, subject, description, is_read, read_at, created_at

-- Audit
model_audit_logs
  id, model_type, model_id, action (created, updated, deleted), user_id,
  data (JSON with before/after), ip_address, user_agent, created_at
```

### Service Integrations

**Google Maps API**:
- Purpose: Calculate travel distance/time between addresses
- Method: DistanceMatrix API (batch mode)
- Batch Calculation (OPTIMIZED): All legs in ONE call instead of N calls
- Located in: `lib/batchTravelCalculator.ts`
- Usage: When scheduling orders, calculate vendor travel costs

```typescript
// OLD (N API calls):
for (let i = 0; i < legs.length; i++) {
  await calculateDistance(leg[i]); // 1 call per leg
}

// NEW (1 API call):
await batchCalculateTravelCosts(legs); // All legs batched
```

**AWS S3**:
- Purpose: Store user uploads (images, PDFs, etc.)
- Method: Presigned URL flow
- Steps:
  1. Request presigned URL from backend
  2. Upload file directly to S3 using presigned URL
  3. Confirm upload with backend

Located in: `lib/upload/s3-service.ts`

**Email (Nodemailer)**:
- Purpose: Send notifications, invoices, confirmations
- Integrated: Backend sends emails (not frontend)
- Templates: `lib/email-templates.ts` (optional for preview)

---

## Folder Structure Explanation

```
bcf-admin/
│
├── app/                                 # Next.js App Router
│   ├── (auth)/                         # Auth routes (grouped, not in URL)
│   │   ├── login/page.tsx              # Login form
│   │   ├── forget-password/page.tsx    # Password reset flow
│   │   ├── new-password/page.tsx       # New password form
│   │   └── logout.ts                   # Logout handler
│   │
│   ├── agent/                          # Agent portal routes
│   │   ├── page.tsx                    # Agent dashboard
│   │   ├── login/page.tsx              # Agent login
│   │   ├── tours/page.tsx              # Virtual tours
│   │   └── layout.tsx                  # Agent layout wrapper
│   │
│   ├── vendor/                         # Vendor portal (if separate)
│   │
│   ├── dashboard/                      # Shared dashboard (admin/agent)
│   │   ├── page.tsx                    # Dashboard home
│   │   ├── calendar/                   # Calendar/scheduling
│   │   ├── orders/                     # Order management
│   │   ├── services/                   # Service management
│   │   ├── vendors/                    # Vendor management
│   │   ├── agents/                     # Agent management
│   │   ├── billing/                    # Billing & invoices
│   │   ├── vendor-billing/             # Vendor invoice management
│   │   ├── notifications/              # Notification center
│   │   ├── file-manager/               # File management
│   │   ├── global-settings/            # System settings
│   │   ├── invoice/                    # Invoice detail pages
│   │   └── [other features]/
│   │
│   ├── api/                            # Next.js API routes (rarely used)
│   │   └── tax/                        # Tax calculation endpoint
│   │
│   ├── context/                        # React Context providers
│   │   ├── AppContext.tsx              # Global app state
│   │   ├── UserContext.tsx             # User info + permissions
│   │   ├── OrganizationContext.tsx     # Org-specific state
│   │   └── [others]/
│   │
│   ├── Http/                           # Backend-style controllers (optional)
│   │   └── Controllers/
│   │
│   ├── Services/                       # Backend-style services (optional)
│   │
│   ├── Models/                         # Backend-style models (empty)
│   │
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Root page (redirects to /dashboard)
│   └── globals.css                     # Global styles
│
├── components/                         # Reusable UI components
│   ├── ui/                            # Radix UI wrapped components
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── [other primitives]/
│   │
│   ├── upload/                        # Upload-related components
│   │   ├── GlobalUploadProgressOverlay.tsx
│   │   ├── UploadProgressToast.tsx
│   │   └── [upload utilities]/
│   │
│   ├── download/                      # Download-related components
│   │   └── GlobalDownloadProgressOverlay.tsx
│   │
│   ├── DataTable.tsx                  # TanStack React Table wrapper
│   ├── Header.tsx                     # App header
│   ├── app-sidebar.tsx                # Navigation sidebar
│   ├── ProtectedAdminRoute.tsx        # Route protection HOC
│   ├── WithAuth.tsx                   # Auth wrapper HOC
│   ├── [Feature-specific components]/
│   └── [Dialogs, Cards, etc]/
│
├── context/                            # Global React Context
│   ├── UserContext.tsx                # User + permissions
│   ├── AppContext.tsx                 # App-wide state
│   ├── GlobalFileUploadContext.tsx    # Upload queue manager
│   ├── GlobalDownloadContext.tsx      # Download queue manager
│   └── UploadQueueContext.tsx         # Upload state tracking
│
├── hooks/                             # Custom React hooks
│   ├── use-mobile.tsx                 # Mobile detection
│   ├── useConfirmation.ts             # Confirmation dialog hook
│   ├── useOptimizedPreview.ts         # Image preview optimization
│   ├── useS3Upload.ts                 # S3 upload hook
│   └── usePermissions.ts              # Permission checking hook
│
├── lib/                               # Utilities and helpers
│   ├── types.ts                       # All TypeScript interfaces
│   ├── api.ts                         # Axios instance + auth interceptor
│   ├── permissions.ts                 # Permission CRUD + checking
│   ├── taxCalculator.ts               # Tax rate by location
│   ├── batchTravelCalculator.ts       # Google Maps batch API
│   ├── email-templates.ts             # Email template definitions
│   ├── validation.ts                  # Form validation rules
│   ├── utils.ts                       # General utilities
│   │
│   ├── upload/                        # S3 upload service
│   │   ├── s3-service.ts              # 3-step upload process
│   │   ├── types.ts                   # Upload interfaces
│   │   └── audio-upload.ts            # Audio-specific upload
│   │
│   ├── api/                           # API utilities
│   │   ├── user.ts                    # User API client
│   │   └── [other API modules]/
│   │
│   ├── config/                        # Configuration
│   │   ├── domains.ts                 # Portal domain mappings
│   │   └── [other configs]/
│   │
│   └── utils/                         # Utility functions
│
├── public/                            # Static assets
│   ├── audio/                         # Audio files
│   └── [images, fonts, etc]/
│
├── docs/                              # AI DOCUMENTATION SYSTEM
│   ├── AI_INDEX.md                    # Entry point (this file)
│   ├── PROJECT_CONTEXT.md             # Technical architecture
│   ├── PROJECT_SCOPE.md               # Business requirements
│   ├── FLOW_TREE.md                   # System flows
│   ├── DECISIONS.md                   # Architecture decisions
│   ├── CHANGELOG_AI.md                # Change history
│   └── modules/                       # Feature documentation
│       ├── AUTH.md
│       ├── BOOKING.md
│       ├── ORDERS.md
│       ├── PAYMENTS.md
│       ├── SERVICES.md
│       ├── VENDORS.md
│       ├── NOTIFICATIONS.md
│       └── FILE_MANAGER.md
│
└── [Config files]
    ├── next.config.ts                 # Next.js config
    ├── tsconfig.json                  # TypeScript config
    ├── tailwind.config.ts             # Tailwind CSS config
    ├── eslint.config.mjs              # ESLint config
    ├── postcss.config.mjs             # PostCSS config
    ├── middleware.ts                  # Next.js middleware (portal routing)
    └── package.json                   # Dependencies
```

---

## Core Components

### DataTable Component
**Purpose**: Universal table for displaying lists (orders, vendors, services, etc.)

**Props**:
```typescript
{
  columns: ColumnDef[];        // Column definitions (TanStack React Table)
  data: any[];                  // Table data
  isLoading?: boolean;          // Loading state
  pageCount?: number;           // Total pages
  onRowClick?: (row) => void;   // Row click handler
  renderActions?: (row) => JSX; // Custom actions per row
}
```

**Dependencies**:
- `@tanstack/react-table` - Table library
- `lucide-react` - Icons
- Radix UI components

**Located in**: `components/DataTable.tsx`

### Dialog Components
**Purpose**: Modals for forms (create order, add vendor, etc.)

**Examples**:
- `AddAreaPopup` - Add service area
- `PaymentDialog` - Process payment
- `AddCoAgentDialog` - Add team member
- `CreateOrganizationDialog` - Create new org
- `ConfirmationDialog` - Confirmation prompts

**Pattern**:
```typescript
const [open, setOpen] = useState(false);
const handleSubmit = async (data) => {
  await api.post(...);
  setOpen(false);
  toast.success("Success");
};

return (
  <>
    <Button onClick={() => setOpen(true)}>Open</Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <Form onSubmit={handleSubmit} />
      </DialogContent>
    </Dialog>
  </>
);
```

**Located in**: `components/*.tsx` (individual files per dialog)

### OrderQuickViewCard
**Purpose**: Quick preview of order details without full page load

**Features**:
- Shows order summary (address, services, vendor, slot)
- Allows quick actions (edit, cancel, assign)

**Located in**: `components/QuickViewCard.tsx`

### Calendar Component
**Purpose**: Visual scheduling of appointments

**Features**:
- Day/week/month views
- Drag-to-reschedule
- Vendor work hours overlay
- Travel time visualization

**Located in**: `app/dashboard/calendar/components/BigCalendar.tsx`

### Upload/Download Components
**Purpose**: Manage file operations with progress tracking

**Features**:
- Batch upload to S3
- Progress overlay
- Toast notifications
- Concurrent upload limiting

**Located in**: `components/upload/`, `components/download/`

---

## Pages Overview

### Dashboard Pages (Shared)

| Route | Purpose | APIs Used | Data Flow |
|-------|---------|-----------|-----------|
| `/dashboard/calendar` | Appointment scheduling | GET orders, GET slots, POST slots, PUT slots | Load → Display → Interact → Update |
| `/dashboard/orders` | Order list & management | GET orders, PUT orders, DELETE orders | Load list → Filter → View details → Edit |
| `/dashboard/services` | Service management | GET services, POST services, PUT services | CRUD operations |
| `/dashboard/vendors` | Vendor list | GET vendors, PUT vendors | View → Edit profile |
| `/dashboard/agents` | Agent list | GET agents, POST agents | Manage agents |
| `/dashboard/billing` | Invoice list | GET invoices, GET payments | View → Generate |
| `/dashboard/vendor-billing` | Vendor payments | GET invoices (vendor scope), POST payments | Calculate → Invoice → Pay |
| `/dashboard/notifications` | Notification center | GET notifications, PUT read status | Load → Display → Mark read |
| `/dashboard/file-manager` | File browser | GET files, DELETE files, POST uploads | Browse → Upload → Download |
| `/dashboard/global-settings` | System config | GET settings, PUT settings | Edit → Save |
| `/dashboard/admin` | Admin panel | GET users, POST users, PUT users | Manage users |
| `/dashboard/invoice/[uuid]` | Invoice detail | GET invoice, GET order | View → Print → Download |

### Auth Pages

| Route | Purpose | APIs Used | Data Flow |
|-------|---------|-----------|-----------|
| `/login` | Login form | POST /auth/login | Submit → Store token → Redirect |
| `/forget-password` | Password reset | POST /auth/reset | Submit email → Get reset link |
| `/new-password` | New password | POST /auth/confirm-reset | Submit new password |
| `/login-first-time` | First login flow | POST /auth/login, PUT /auth/setup | Special onboarding |
| `/logout.ts` | Logout handler | POST /auth/logout | Clear token → Redirect |

### Agent Portal Pages

| Route | Purpose | Notes |
|-------|---------|-------|
| `/agent` | Agent dashboard | Redirects to `/dashboard` |
| `/agent/login` | Agent login | Uses main login UI |
| `/agent/tours` | Virtual tour management | Tour creation/editing |
| `/agent/forget-password` | Agent password reset | |

---

## API Documentation

### Authentication API

**POST /auth/login**
```
Request:
{
  email: string
  password: string
}

Response (201):
{
  token: string (JWT)
  user: {
    uuid: string
    email: string
    first_name: string
    last_name: string
    roles: Array<{id, name}>
    permissions: Array<{id, name}>
    organization_id?: number
  }
}

Error (401): { message: "Invalid credentials" }
```

**POST /auth/logout**
```
Headers: Authorization: Bearer ${token}

Response (200):
{ message: "Logged out successfully" }
```

### Order API

**GET /orders** (list)
```
Query params:
  page: number (default 1)
  per_page: number (default 20)
  status: string (pending|scheduled|completed|invoiced|cancelled)
  order_by: string (field name)
  organization_id: number

Response (200):
{
  data: Array<Order>
  meta: {
    current_page: number
    per_page: number
    total: number
    last_page: number
  }
}
```

**POST /orders** (create)
```
Request:
{
  agent_id: number
  property_id: number
  services: Array<{
    service_id: number
    quantity: number
  }>
  notes?: string
}

Response (201):
{
  order: Order (with slots array)
}
```

**PUT /orders/{id}** (update)
```
Request: Partial Order fields
Response (200): Updated Order
```

**POST /orders/{id}/assign-vendor**
```
Request:
{
  vendor_id: number
  slot_ids: Array<number>
}

Response (200): Updated Order with assigned slots
```

### Vendor API

**GET /vendors** (list)
```
Response (200):
{
  data: Array<Vendor>
  meta: { ... }
}
```

**GET /vendors/{id}** (detail)
```
Response (200):
{
  vendor: Vendor (includes work_hours, services, addresses)
}
```

**PUT /vendors/{id}** (update)
```
Request: Partial Vendor fields
Response (200): Updated Vendor
```

### Service API

**GET /services** (list)
```
Response (200):
{
  data: Array<Service>
}
```

**POST /services** (create)
```
Request:
{
  name: string
  category_id: number
  description?: string
  thumbnail_url?: string
  background_color?: string
  border_color?: string
}

Response (201): Created Service
```

### Invoice API

**GET /invoices** (list)
```
Response (200):
{
  data: Array<Invoice>
  meta: { ... }
}
```

**POST /invoices** (generate)
```
Request:
{
  order_id: number
  vendor_ids?: Array<number> // for multi-vendor invoicing
}

Response (201): Created Invoice
```

**POST /invoices/{id}/send**
```
Request:
{
  email: string
}

Response (200): { message: "Invoice sent" }
```

### Upload API

**POST /uploads/presigned-urls**
```
Request:
{
  files: Array<{
    name: string
    size: number
    type: string (mime type)
  }>
}

Response (200):
{
  presigned_urls: Array<{
    key: string
    url: string (presigned URL for S3)
    expires_in: number
  }>
}
```

**POST /uploads/confirm**
```
Request:
{
  uploads: Array<{
    key: string
    size: number
    type: string
  }>
}

Response (200):
{
  confirmed: Array<{
    key: string
    url: string (permanent S3 URL)
  }>
}
```

### Notification API

**GET /notifications**
```
Query params:
  page: number
  is_read?: boolean

Response (200):
{
  data: Array<Notification>
  meta: { ... }
}
```

**PUT /notifications/{id}/read**
```
Response (200): { is_read: true, read_at: timestamp }
```

---

## Database Models (TypeScript)

Located in: `lib/types.ts`

### User Model
```typescript
export type Admin = {
    uuid?: string
    full_name: string
    email: string
    primary_phone?: string
    secondary_phone?: string
    avatar_url?: string
    address?: string
    permissions?: Permission[]
    roles?: Role[]
    organization_id?: number
    organization?: Organization
}

export type Agent = {
    uuid?: string
    first_name: string
    last_name: string
    email: string
    company_name: string
    primary_phone?: string
    secondary_phone?: string
    headquarter_address?: string
    notes: string
    co_agents?: CoAgent[]
    organization_id?: number
}

export type Vendor = {
    uuid?: string
    full_name: string
    email: string
    company_name: string
    primary_phone?: string
    addresses: Address[]
    vendor_services: VendorService[]
    settings: VendorSettings
    organization_id?: number
}
```

### Order Model
```typescript
export type Order = {
    id: number
    uuid: string
    agent_id: number
    property_id: number
    order_status: 'pending' | 'scheduled' | 'completed' | 'invoiced' | 'cancelled'
    payment_status: 'pending' | 'partial' | 'paid' | 'overdue'
    amount: string
    paid_amount: string
    tax_amount?: string
    services: OrderService[]
    slots: Slot[]
    property_address: string
    created_at: string
}

export interface OrderService {
    id: number
    service_id: number
    service: Service
    quantity: number
    hourly_rate: string
    amount: string
}

export interface Slot {
    id: number
    uuid: string
    order_id: number
    vendor_id: number
    service_id: number
    date: string
    start_time: string
    end_time: string
    travel?: string
    distance?: string
    km_price?: string
}
```

### Service Model
```typescript
export interface Service {
    id: number
    uuid: string
    name: string
    category_id: number
    description?: string
    thumbnail_url?: string
    background_color?: string
    border_color?: string
    status: boolean
    created_at: string
}

export interface VendorService {
    id: number
    vendor_id: number
    service_id: number
    hourly_rate: string
    time_needed: number
    status: boolean
    service: Service
}
```

### Invoice Model
```typescript
export interface Invoice {
    id: number
    uuid: string
    order_id: number
    vendor_id: number
    amount: string
    tax_amount: string
    tax_rate: string
    tax_type: string // e.g., "GST (5%)", "HST (13%)"
    status: 'draft' | 'sent' | 'paid' | 'overdue'
    due_date: string
    created_at: string
}

export interface Payment {
    id: number
    uuid: string
    invoice_id: number
    amount: string
    payment_method: string
    transaction_id?: string
    status: 'pending' | 'completed' | 'failed'
    paid_at?: string
}
```

### Notification Model
```typescript
export interface NotificationData {
    id?: number
    uuid?: string
    type: string // 'order_created', 'order_assigned', 'payment_received', etc.
    source?: string // 'order', 'invoice', 'payment', etc.
    source_id?: string // ID of the source entity
    Subject: string
    description?: string
    is_read?: boolean
    read_at?: string
    created_at: string
    diff_data?: {
        amount?: { before: string | number, after: string | number }
        payment_details?: { before?: object, after?: object }
        slots?: Record<string, { before: Slot | null, after: Slot | null }>
    }
}
```

---

## Business Logic

### 1. Order Booking Flow

```
Step 1: Create Order
  Input: Agent selects services for property
  → POST /orders { agent_id, property_id, services[] }
  → Server creates order with status='pending'
  → Auto-generates Slot placeholders for each service

Step 2: Assign Vendors
  Input: Admin/Agent selects vendors for slots
  → POST /orders/{id}/assign-vendor { vendor_id, slot_ids[] }
  → Server:
    - Checks vendor availability (work hours)
    - Checks vendor services (can vendor do this service?)
    - Calculates travel distance (Google Maps batch API)
    - Calculates travel cost (km * payment_per_km)
    - Updates slot with vendor_id, travel_distance, travel_cost
  → Order status → 'scheduled'

Step 3: Calculate Invoice
  Input: Order completed, needs invoice
  → POST /invoices { order_id, vendor_ids[] }
  → Server:
    - Sums all service amounts
    - Sums all travel costs
    - Total = services + travel
    - Gets vendor location → tax rate
    - tax_amount = total * tax_rate
    - final_amount = total + tax_amount
  → Creates Invoice record

Step 4: Mark Paid
  Input: Payment received
  → PUT /invoices/{id} { status: 'paid', paid_amount: X }
  → Order payment_status → 'paid'
```

### 2. Tax Calculation

**Principle**: Tax based on vendor's location (province/state)

**Implementation**: `lib/taxCalculator.ts`

```typescript
getTaxRateByLocation(province, country)

Canada:
- Alberta, BC, Manitoba, Saskatchewan: 5% (GST only)
- Ontario: 13% (HST)
- Atlantic provinces: 15% (HST)
- Quebec: 14.975% (GST 5% + QST 9.975%)

USA:
- State-by-state rates (0% to 7.25%)
```

**Usage**:
```typescript
const vendor = await getVendor(vendor_id);
const taxInfo = getTaxRateByLocation(vendor.addresses[0].province, "Canada");
const tax_amount = total * (taxInfo.rate / 100);
```

### 3. Travel Cost Calculation

**Problem**: Calling Google Maps for each leg = N API calls (expensive)

**Solution**: Batch all legs in 1 API call

**Implementation**: `lib/batchTravelCalculator.ts`

```typescript
// Define all legs (vendor → order1 → order2 → ... → vendor)
const legs: TravelLeg[] = [
  { from: vendorAddress, to: order1Address, legIndex: 0 },
  { from: order1Address, to: order2Address, legIndex: 1 },
  { from: order2Address, to: vendorAddress, legIndex: 2 },
]

// ONE API call for all
const result = await batchCalculateTravelCosts(legs);

// result.legs[] contains distances, durations
// total_distance = result.totalDistance
// total_cost = total_distance * vendor.settings.payment_per_km
```

### 4. Multi-Agent Payment Split

**Scenario**: Order assigned to Agent A, with Co-Agent B at 30% split

**Calculation**:
```
Order amount: $1000
Agent A: 70% = $700
Agent B (Co-Agent): 30% = $300

Plus tax:
Total with tax: $1050 (5% tax = $50)
Agent A share: $735 (70% of $1050)
Agent B share: $315 (30% of $1050)
```

**Implementation**:
- Store co_agents on Agent model with split_percentage
- When invoicing: multiply each co-agent's percentage by final amount
- Create separate payment records for each co-agent

### 5. Order Status Workflow

```
pending
  ↓
  (Assign vendors + schedule slots)
  ↓
scheduled
  ↓
  (Service completed by vendor)
  ↓
completed
  ↓
  (Generate invoice)
  ↓
invoiced
  ↓
  (Mark as paid)
  ↓
paid

Alternative: cancelled (at any point)
```

### 6. Notification Triggers

**Events that trigger notifications**:
1. Order created → Send to admin/agent
2. Order assigned to vendor → Send to vendor
3. Slot date changed → Send to vendor + agent
4. Order completed → Send to customer/agent
5. Invoice sent → Send to vendor
6. Payment received → Send to agent/vendor
7. Service area changed → Send affected vendors

**Implementation**: Backend sends to queue, frontend polls `/notifications` API

### 7. Permission System

**Locations**: `lib/permissions.ts`

**Permission Types**:
- `VIEW_ORDERS`, `CREATE_ORDERS`, `EDIT_ORDERS`
- `VIEW_VENDORS`, `CREATE_VENDOR`, `UPDATE_VENDOR`
- `VIEW_AGENTS`, `CREATE_AGENT`
- `ACCESS_BILLING`, `ACCESS_VENDOR_BILLING`
- `CREATE_SERVICES`, `VIEW_SERVICES`
- `SET_DISCOUNTS`
- `CREATE_LISTING`, `VIEW_LISTING`
- `CREATE_TOUR_SETTINGS`
- Etc.

**Usage**:
```typescript
const { permissions } = useContext(UserContext);

if (hasPermission(permissions, 'CREATE_ORDERS')) {
  // Show create order button
}
```

---

## Environment Variables

```bash
# Frontend
NEXT_PUBLIC_API_URL=https://api-stage.bcfloorplans.com/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_api_key

# Backend (not in frontend, but referenced)
DB_HOST=...
DB_USER=...
DB_PASS=...
JWT_SECRET=...
S3_BUCKET=...
S3_REGION=...
MAIL_FROM=noreply@bcfloor.com
```

---

## Key Technical Decisions

| Decision | Reason | Impact |
|----------|--------|--------|
| **Multi-portal routing via middleware** | Single codebase, different UIs per domain | Efficient deployment, reduced duplication |
| **React Context instead of Redux** | Smaller bundle, sufficient for current state needs | Easier to understand, less boilerplate |
| **TanStack React Table for DataTable** | Headless, unstyled, highly customizable | Full control over appearance + behavior |
| **Radix UI for base components** | Accessible, headless, works with Tailwind | Professional, accessible UI layer |
| **Batch Google Maps API** | Reduces API quota usage by 75%+ | Significant cost savings for travel calculations |
| **S3 presigned URLs** | Client uploads directly to S3, no backend bandwidth | Faster uploads, reduced server load |
| **JWT in localStorage** | Simpler than cookies, works with SPA | Vulnerable to XSS, but acceptable for non-financial app |
| **TypeScript strict mode** | Catch errors at compile time | Reduced runtime bugs, better DX |

---

## Last Updated

Generated: 2026-06-02
Review Frequency: When architecture changes significantly
