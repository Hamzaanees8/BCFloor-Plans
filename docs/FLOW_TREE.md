# BC Floor - FLOW_TREE

System behavior, flows, and interactions. Read AI_INDEX.md first.

---

## User Journey Flow Tree

### Admin Portal Flow

```
LOGIN
  ↓
Dashboard (calendar view, stats)
  ├── Manage Users
  │   ├── Create Admin
  │   ├── Create Agent
  │   ├── Create Vendor
  │   └── Assign Permissions
  │
  ├── Manage Services
  │   ├── Create Service
  │   ├── Assign to Vendor (hourly rate, time needed)
  │   └── Edit / Deactivate
  │
  ├── Manage Vendors
  │   ├── Create Profile
  │   ├── Set Work Hours
  │   ├── Set Service Area (optional)
  │   ├── Enable/Disable Services
  │   └── View Earnings
  │
  ├── Manage Orders (All)
  │   ├── View All Orders
  │   ├── Assign Vendors to Slots
  │   ├── Reschedule Appointments
  │   ├── Generate Invoices
  │   └── Mark Orders Complete/Paid
  │
  ├── Manage Billing
  │   ├── View All Invoices
  │   ├── Generate Invoice from Order
  │   ├── Send Invoice to Vendor
  │   ├── Mark Paid
  │   └── Download PDF
  │
  ├── System Settings
  │   ├── Configure Organization
  │   ├── Set Email Templates
  │   ├── Manage Notification Types
  │   └── White-Label Theme
  │
  └── View Reports
      ├── Vendor Earnings
      ├── Order Statistics
      └── Travel Cost Analysis
```

### Agent Portal Flow

```
LOGIN
  ↓
Dashboard (calendar, team stats)
  ├── Create Order
  │   ├── Select Service(s)
  │   ├── Select Customer Property
  │   ├── Select Preferred Date/Time
  │   ├── Add Notes
  │   └── Submit → System generates slots
  │
  ├── Manage Orders (Team Scope)
  │   ├── View Team Orders
  │   ├── Request Vendor Assignment (to admin)
  │   ├── Reschedule Appointments
  │   ├── Mark Complete
  │   └── Cancel Order
  │
  ├── Manage Team
  │   ├── Add Co-Agent
  │   ├── Set Split Percentage
  │   ├── Remove Team Member
  │   └── View Team Earnings
  │
  ├── Billing
  │   ├── View Generated Invoices
  │   ├── View Team Earnings
  │   ├── Download Invoice PDF
  │   └── View Payment History
  │
  ├── Virtual Tours
  │   ├── Create Tour (MatterPort/Photos)
  │   ├── Attach to Order
  │   └── Send to Customer
  │
  └── File Manager
      ├── Upload Photos/Contracts
      ├── Organize by Order
      └── Share with Vendor
```

### Vendor Portal Flow

```
LOGIN
  ↓
Dashboard (assigned work, earnings)
  ├── View Assigned Work
  │   ├── Calendar View (all assigned slots)
  │   ├── View Order Details
  │   ├── View Customer Location
  │   ├── View Travel Time
  │   └── Accept/Decline Job
  │
  ├── Manage Availability
  │   ├── Set Work Hours (days, times)
  │   ├── Add Break Times
  │   ├── Set Service Area (polygon)
  │   ├── Timezone Preference
  │   └── Commute Minutes
  │
  ├── Manage Services
  │   ├── Accept/Decline Service Assignments
  │   ├── View Offered Services
  │   └── Update Rates (if allowed)
  │
  ├── Billing
  │   ├── View Invoices (assigned orders)
  │   ├── View Earnings
  │   ├── Download Invoice PDF
  │   └── View Payment History
  │
  ├── Notifications
  │   ├── View New Job Assignments
  │   ├── View Appointment Changes
  │   ├── View Payment Confirmations
  │   └── Opt-out of Types (if allowed)
  │
  └── File Manager
      ├── Upload Photos/Documentation
      ├── Download Customer Contracts
      └── Share Files with Agent
```

---

## Core Business Flows

### 1. Order Creation → Completion → Invoicing

```
FLOW: Complete Order Lifecycle

Step 1: CREATE ORDER
  Input User: Agent
  ├── Agent opens "New Order" form
  ├── Selects: Customer, Property, Services, Preferred Date/Time
  ├── Action: POST /orders
  │    {
  │      agent_id: number
  │      property_id: number
  │      services: [
  │        { service_id: 1, quantity: 2 },
  │        { service_id: 2, quantity: 1 }
  │      ]
  │      preferred_date: "2026-06-15"
  │      notes?: string
  │    }
  ├── Response: Order created, status='pending'
  │    Order {
  │      id: 123
  │      uuid: 'ord-xxx'
  │      status: 'pending'
  │      slots: [ 
  │        { id: 1, service_id: 1, date: null, vendor_id: null },
  │        { id: 2, service_id: 2, date: null, vendor_id: null }
  │      ]
  │    }
  └── Notification: "Order created" → sent to Admin

Step 2: ASSIGN VENDORS
  Input User: Admin
  ├── Admin opens Order detail
  ├── For each Slot:
  │   ├── Selects Vendor
  │   ├── Selects Date/Time
  │   ├── Action: POST /orders/123/assign-vendor
  │   │    {
  │   │      vendor_id: 5
  │   │      slot_id: 1
  │   │      date: "2026-06-15"
  │   │      start_time: "09:00"
  │   │      end_time: "11:00"
  │   │    }
  │   ├── Backend Validation:
  │   │   ├── Vendor available at that time? (check work_hours)
  │   │   ├── Vendor offers this service? (check vendor_services)
  │   │   ├── No time conflict? (check other slots)
  │   │   └── Valid time? (end > start, future date)
  │   ├── Backend Calculation:
  │   │   ├── Get vendor primary address
  │   │   ├── Get customer property address
  │   │   ├── Call Google Maps Distance Matrix
  │   │   ├── Get travel_distance, travel_duration
  │   │   ├── Calculate travel_cost = distance * vendor.settings.payment_per_km
  │   │   └── Store in Slot
  │   ├── Response: Slot updated
  │   │    {
  │   │      id: 1
  │   │      vendor_id: 5
  │   │      date: "2026-06-15"
  │   │      start_time: "09:00"
  │   │      end_time: "11:00"
  │   │      travel_distance: 25.5 (km)
  │   │      travel_duration: 45 (min)
  │   │      travel_cost: 127.50 (25.5 * $5/km)
  │   │    }
  │   └── Notification: "Assigned to Job" → sent to Vendor
  │
  ├── Order status: pending → scheduled
  └── Notification: "All vendors assigned" → sent to Agent

Step 3: VENDOR COMPLETES WORK
  Input User: Vendor
  ├── Vendor arrives at location
  ├── Completes service
  ├── Marks job complete in app
  ├── Action: PUT /orders/123/slots/1
  │    { status: 'completed', completed_at: timestamp }
  ├── Response: Slot marked complete
  ├── System checks: All slots complete?
  │    ├── Yes → Order status: scheduled → completed
  │    └── No → Waiting on remaining slots
  └── Notification: "Service completed" → sent to Agent

Step 4: GENERATE INVOICE
  Input User: Admin
  ├── Admin navigates to Order (now status='completed')
  ├── Clicks "Generate Invoice"
  ├── System calculates:
  │   ├── Get Vendor location (primary address province)
  │   ├── Get tax_rate = getTaxRateByLocation(province)
  │   ├── Subtotal = Σ(OrderService.amount) + Σ(Slot.travel_cost)
  │   │   Example:
  │   │   - Service 1 (2x @ $100/hr x 2hrs) = $400
  │   │   - Service 2 (1x @ $150/hr x 3hrs) = $450
  │   │   - Travel cost = $127.50
  │   │   - Subtotal = $977.50
  │   │
  │   ├── tax_amount = Subtotal * (tax_rate / 100)
  │   │   Example: $977.50 * (5% / 100) = $48.88
  │   │
  │   ├── total = Subtotal + tax_amount
  │   │   Example: $977.50 + $48.88 = $1,026.38
  │   │
  │   └── If Co-Agents exist:
  │       ├── agent_split = total * (100 - Σ(co-agent %)) / 100
  │       └── co_agent_X_split = total * co_agent_X_% / 100
  │
  ├── Action: POST /invoices
  │    {
  │      order_id: 123
  │      vendor_id: 5
  │    }
  ├── Response: Invoice created
  │    {
  │      id: 456
  │      uuid: 'inv-xxx'
  │      order_id: 123
  │      vendor_id: 5
  │      amount: 977.50
  │      tax_amount: 48.88
  │      tax_rate: 5.0
  │      tax_type: "GST (5%)"
  │      status: 'draft'
  │      created_at: timestamp
  │    }
  └── Notification: "Invoice generated" → sent to Admin

Step 5: SEND INVOICE
  Input User: Admin
  ├── Admin clicks "Send Invoice"
  ├── Action: POST /invoices/456/send
  │    {
  │      email: vendor@company.com
  │      include_payment_link?: true
  │    }
  ├── Backend sends email:
  │   ├── Uses email template from email_templates.ts
  │   ├── Renders invoice details (amount, tax, due date)
  │   ├── Includes PDF attachment
  │   └── Includes payment link (if enabled)
  ├── Response: { status: "sent" }
  ├── Invoice status: draft → sent
  └── Notification: "Invoice sent" → sent to Vendor

Step 6: MARK PAID
  Input User: Admin / Vendor (if payment link)
  ├── Admin receives payment confirmation
  ├── Action: PUT /invoices/456
  │    {
  │      status: 'paid'
  │      paid_at: timestamp
  │      payment_method: 'bank_transfer' | 'credit_card' | 'manual'
  │      transaction_id?: 'trx-xxx'
  │    }
  ├── Response: Invoice updated
  │    { status: 'paid', payment_confirmed_at: timestamp }
  ├── Order status: completed → invoiced
  ├── Payment recorded in payments table
  └── Notifications sent to:
      ├── Vendor: "Payment received"
      ├── Agent: "Invoice paid"
      └── Admin: "Payment confirmed"

END OF FLOW
```

### 2. Tax Calculation Logic

```
FLOW: Calculate Invoice Tax

Input: Vendor with address, Order with services/travel

Step 1: Locate Vendor
  ├── Get Vendor record
  ├── Get vendor.vendor_addresses (primary address first)
  └── Extract: province, country

Step 2: Get Tax Rate
  ├── Call getTaxRateByLocation(province, country)
  │   ├── Input: province="BC", country="Canada"
  │   ├── Lookup: BC = 5% (GST only)
  │   └── Return: { rate: 5.0, taxType: "GST (5%)" }
  │
  └── If location not found:
      └── Default: 5% (GST)

Step 3: Calculate Tax
  ├── Get Invoice.amount (subtotal)
  ├── Calculate tax_amount = amount * (rate / 100)
  │   Example:
  │   - amount = $1000
  │   - rate = 5%
  │   - tax_amount = $1000 * 0.05 = $50
  │
  └── total_amount = amount + tax_amount = $1050

Step 4: Store Tax Info
  └── Invoice record:
      ├── amount: 1000.00 (subtotal)
      ├── tax_amount: 50.00
      ├── tax_rate: 5.0
      ├── tax_type: "GST (5%)"
      └── total: 1050.00

Tax Rate Reference:
  Canada:
  - AB, BC, MB, SK, YT, NT, NU: 5% (GST only)
  - ON: 13% (HST)
  - NB, NL, NS, PE: 15% (HST)
  - QC: 14.975% (GST 5% + QST 9.975%)

  USA (by state):
  - AK, DE: 0% (no sales tax)
  - CO: 2.9%
  - AL, GA, HI: 4%
  ... (full list in taxCalculator.ts)
```

### 3. Travel Cost Calculation (Batched)

```
FLOW: Calculate Travel Costs for Multi-Stop Route

Problem: Need distance for Vendor → Stop1 → Stop2 → Stop3 → Vendor
OLD: 3 Google Maps API calls (expensive)
NEW: 1 batched call (optimal)

Input: Order with multiple slots for same vendor

Step 1: Prepare Trip Legs
  ├── Order has 3 services from Vendor 5:
  │   ├── Slot 1: Customer A address
  │   ├── Slot 2: Customer B address
  │   └── Slot 3: Customer C address
  │
  ├── Create trip chain:
  │   ├── Leg 0: Vendor office → Customer A
  │   ├── Leg 1: Customer A → Customer B
  │   ├── Leg 2: Customer B → Customer C
  │   └── Leg 3: Customer C → Vendor office
  │
  └── Array of TravelLeg:
      [
        { from: "123 Vendor St", to: "456 Customer A St", legIndex: 0 },
        { from: "456 Customer A St", to: "789 Customer B St", legIndex: 1 },
        { from: "789 Customer B St", to: "321 Customer C St", legIndex: 2 },
        { from: "321 Customer C St", to: "123 Vendor St", legIndex: 3 }
      ]

Step 2: Call Google Maps (BATCHED)
  ├── Call batchCalculateTravelCosts(legs)
  ├── Google Maps Distance Matrix receives:
  │   ├── Origins: [123 Vendor St, 456 Customer A St, ...]
  │   ├── Destinations: [456 Customer A St, 789 Customer B St, ...]
  │   ├── Returns: distance matrix for all origins × destinations
  │
  └── ONE API call instead of 4!

Step 3: Extract Results
  ├── Result: BatchTravelResult
  │   {
  │     status: "OK"
  │     legs: [
  │       {
  │         legIndex: 0,
  │         distance: 15.5 (km),
  │         duration: 25 (min),
  │         from: "123 Vendor St",
  │         to: "456 Customer A St"
  │       },
  │       {
  │         legIndex: 1,
  │         distance: 8.3 (km),
  │         duration: 12 (min),
  │         from: "456 Customer A St",
  │         to: "789 Customer B St"
  │       },
  │       {
  │         legIndex: 2,
  │         distance: 6.2 (km),
  │         duration: 9 (min),
  │         from: "789 Customer B St",
  │         to: "321 Customer C St"
  │       },
  │       {
  │         legIndex: 3,
  │         distance: 12.0 (km),
  │         duration: 20 (min),
  │         from: "321 Customer C St",
  │         to: "123 Vendor St"
  │       }
  │     ],
  │     totalDistance: 42.0 (km),
  │     totalDuration: 66 (min)
  │   }

Step 4: Calculate Costs
  ├── vendor.settings.payment_per_km = $5.00
  ├── Total travel cost = 42.0 km * $5.00/km = $210.00
  │
  ├── Per leg (for display):
  │   ├── Leg 0: 15.5 * $5.00 = $77.50
  │   ├── Leg 1: 8.3 * $5.00 = $41.50
  │   ├── Leg 2: 6.2 * $5.00 = $31.00
  │   └── Leg 3: 12.0 * $5.00 = $60.00

Step 5: Store in Slots
  ├── Update each slot:
  │   ├── Slot 1: travel_distance=15.5, travel_cost=$77.50
  │   ├── Slot 2: travel_distance=8.3, travel_cost=$41.50
  │   └── Slot 3: travel_distance=6.2, travel_cost=$31.00
  │
  └── Invoice calculation uses:
      └── Total travel cost = $77.50 + $41.50 + $31.00 = $150.00
          (+ $60 return to vendor not charged? depends on business rule)

OPTIMIZATION RESULT:
- 4 API calls reduced to 1 API call
- 75% reduction in Google Maps quota usage
- Same accuracy, better performance
```

---

## Data Flow Diagrams

### 1. Authentication Flow

```
┌─────────────┐
│    User     │
└─────────────┘
      │
      │ 1. Submit login (email, password)
      ▼
┌─────────────────────────┐
│  (auth)/login page.tsx  │
│  POST /auth/login       │
└─────────────────────────┘
      │
      │ 2. Response with JWT token
      ▼
┌──────────────────────────────┐
│ localStorage.setItem("token")│
│ localStorage.setItem("user") │
└──────────────────────────────┘
      │
      │ 3. Redirect to /dashboard
      ▼
┌──────────────────┐
│  middleware.ts   │
│ Detect portal:   │
│ Admin/Agent/     │
│ Vendor           │
└──────────────────┘
      │
      │ 4. Rewrite to correct portal
      │    /dashboard → /admin/
      │    /agent/* → /agent/
      │    /vendor/* → /vendor/
      ▼
┌─────────────────┐
│  User Portal    │
│  (authenticated)│
└─────────────────┘

On Every Request:
┌────────────────────┐
│  lib/api.ts        │
│ Axios interceptor  │
│ Add auth header:   │
│ Authorization:     │
│ Bearer ${token}    │
└────────────────────┘

On 401 Response:
┌────────────────────────┐
│ Clear localStorage     │
│ Redirect to /login     │
│ Show "Session expired" │
│ toast                  │
└────────────────────────┘
```

### 2. Order Creation Data Flow

```
User (Agent)
    │
    │ 1. Fill form + Submit
    ▼
CreateOrderDialog / Form
    │
    │ 2. Validate inputs
    ▼
api.post("/orders", orderData)
    │
    ├─ Add auth header (from localStorage.getItem("token"))
    │
    ▼
Backend API
    │
    ├─ Create Order record (status='pending')
    ├─ Create OrderService records (qty, rate from service catalog)
    ├─ Create Slot placeholders (vendor_id=null, date=null)
    └─ Return Order + Slots
    │
    ▼
Frontend Response Handler
    │
    ├─ Store Order in OrderContext
    ├─ Update UI with new Order
    ├─ Show toast: "Order created"
    └─ Trigger notification API call
    │
    ▼
Notifications (Real-time)
    │
    ├─ GET /notifications
    ├─ "New Order 123 created" → Admin
    └─ Update notification UI
```

### 3. Order Completion → Invoice Flow

```
Vendor marks job complete
    │
    ▼
PUT /orders/{id}/slots/{slotId}
    │
    ├─ Update slot status='completed'
    │
    ▼
Backend checks all slots
    │
    ├─ If all completed:
    │  ├─ Update Order status='completed'
    │  └─ Trigger "Order completed" notification
    │
    ▼
Admin views Order detail
    │
    │ "Generate Invoice" button appears
    │
    ▼
POST /invoices { order_id, vendor_id }
    │
    ├─ Get Vendor location
    ├─ Get Tax rate (from taxCalculator.ts)
    ├─ Calculate: subtotal, tax, total
    ├─ Create Invoice record (status='draft')
    └─ Return Invoice
    │
    ▼
Frontend
    │
    ├─ Display Invoice details
    ├─ Show "Send" button
    │
    ▼
POST /invoices/{id}/send
    │
    ├─ Backend renders email template
    ├─ Sends to vendor email
    ├─ Updates Invoice status='sent'
    │
    ▼
Vendor receives email
    │
    ├─ Opens invoice PDF
    ├─ Views amount due
    │
    ▼
Payment received
    │
    ▼
PUT /invoices/{id}
    │
    ├─ Update status='paid'
    ├─ Record transaction_id
    ├─ Update Order status='invoiced'
    └─ Trigger notifications
    │
    ▼
Vendor, Agent, Admin notified
    │
    └─ "Invoice Paid - $X received"
```

### 4. File Upload Flow

```
User clicks "Upload Files"
    │
    ▼
GlobalFileUploadContext
    │
    ├─ Show file picker
    ├─ User selects multiple files
    │
    ▼
S3UploadService.uploadFiles()
    │
    ├─ Step 1: POST /uploads/presigned-urls
    │   {
    │     files: [
    │       { name: "photo1.jpg", size: 2MB, type: "image/jpeg" },
    │       { name: "photo2.jpg", size: 1.5MB, type: "image/jpeg" }
    │     ]
    │   }
    │
    ├─ Response: Presigned URLs
    │   {
    │     presigned_urls: [
    │       { key: "s3-key-1", url: "https://s3.amazonaws.com/...", expires_in: 3600 },
    │       { key: "s3-key-2", url: "https://s3.amazonaws.com/...", expires_in: 3600 }
    │     ]
    │   }
    │
    ▼
    │
    ├─ Step 2: Upload to S3 (client-side, 3 concurrent)
    │   For each presigned URL:
    │   ├─ PUT presigned_url (file binary data)
    │   ├─ Track progress (onProgress callback)
    │   ├─ Show in GlobalUploadProgressOverlay
    │   │
    │   ▼
    │   S3 confirms upload
    │
    ▼
    │
    ├─ Step 3: POST /uploads/confirm
    │   {
    │     uploads: [
    │       { key: "s3-key-1", size: 2MB, type: "image/jpeg" },
    │       { key: "s3-key-2", size: 1.5MB, type: "image/jpeg" }
    │     ]
    │   }
    │
    ├─ Backend marks uploads confirmed
    ├─ Database records created
    │
    ▼
    │
    ├─ Step 4: Display Success
    │   ├─ Show toast: "2 files uploaded"
    │   ├─ Files appear in GlobalFileUploadContext
    │   ├─ Files visible in file-manager page
    │   │
    │   ▼
    │   User can now:
    │   ├─ Share files with others
    │   ├─ Download files
    │   └─ Delete files
```

---

## API Flow Map

### Order Creation API Call

```
UI Action: Agent submits "Create Order" form
    │
    ▼
Event: handleSubmit(formData)
    │
    │ formData = {
    │   agent_id: 1,
    │   property_id: 5,
    │   services: [
    │     { service_id: 1, quantity: 2 },
    │     { service_id: 2, quantity: 1 }
    │   ],
    │   preferred_date: "2026-06-15",
    │   notes: "Customer prefers morning"
    │ }
    │
    ▼
Validation: Check required fields
    │
    ├─ agent_id? ✓
    ├─ property_id? ✓
    ├─ services.length > 0? ✓
    ├─ date in future? ✓
    │
    ▼
API Call: api.post("/orders", formData)
    │
    ├─ Interceptor adds: Authorization: Bearer ${token}
    ├─ URL: ${NEXT_PUBLIC_API_URL}/orders
    ├─ Method: POST
    ├─ Headers: { Authorization, Content-Type: application/json }
    ├─ Body: JSON.stringify(formData)
    │
    ▼
Backend Endpoint: POST /orders
    │
    ├─ Auth check: Token valid?
    ├─ Permission check: agent_id owns order?
    ├─ Data validation: services exist, property exists?
    ├─ Create Order record
    ├─ For each service:
    │  ├─ Create OrderService record
    │  └─ Create Slot placeholder (vendor_id=null)
    ├─ Return 201: Order + Slots
    │
    ▼
Frontend Response Handler:
    │
    ├─ if (response.status === 201)
    │  ├─ setOrderContext(response.data)
    │  ├─ toast.success("Order created")
    │  ├─ redirect("/dashboard/orders/[id]")
    │  └─ Trigger: GET /notifications (poll)
    │
    ├─ else if (response.status === 401)
    │  ├─ Interceptor catches
    │  ├─ Clear localStorage
    │  └─ Redirect to /login
    │
    └─ else
       ├─ toast.error("Failed to create order")
       └─ Show error details

Notification Sent:
    │
    ├─ Admin receives: "New Order 123 created by Agent John"
    └─ Visible in dashboard/notifications
```

---

## Component Hierarchy

### Dashboard Layout

```
layout.tsx (Root)
    │
    ├─ AppContext.Provider
    ├─ UserContext.Provider
    ├─ OrderContext.Provider
    ├─ GlobalFileUploadProvider
    ├─ GlobalDownloadProvider
    ├─ UploadQueueProvider
    │
    ├─ Header (top navbar)
    │   ├─ Logo
    │   ├─ Search bar
    │   ├─ Notifications icon
    │   └─ User dropdown
    │
    ├─ Sidebar (navigation)
    │   ├─ Nav links
    │   ├─ Role-based visibility
    │   └─ Collapse toggle
    │
    ├─ GlobalUploadProgressOverlay
    ├─ GlobalDownloadProgressOverlay
    ├─ UploadProgressToast
    │
    └─ {children}
        │
        ├─ Orders Page
        │   │
        │   ├─ DataTable
        │   │   ├─ TanStack React Table
        │   │   ├─ Columns (id, customer, services, status, actions)
        │   │   ├─ Pagination
        │   │   └─ Sort/Filter
        │   │
        │   ├─ Row Actions
        │   │   ├─ View (→ OrderDetailView modal)
        │   │   ├─ Edit (→ EditOrder modal)
        │   │   └─ Delete (→ ConfirmationDialog)
        │   │
        │   └─ Create Button
        │       └─ Opens CreateOrderDialog
        │
        ├─ Order Detail Page
        │   │
        │   ├─ OrderDetailView
        │   │   ├─ Customer info
        │   │   ├─ Services list
        │   │   ├─ Slots (with vendor assignments)
        │   │   ├─ Total amount + tax
        │   │   └─ Action buttons
        │   │
        │   └─ Tabs
        │       ├─ Appointment
        │       ├─ History (audit log)
        │       └─ Notifications (related)
        │
        ├─ Calendar Page
        │   │
        │   ├─ BigCalendar (FullCalendar wrapper)
        │   │   ├─ Month/Week/Day views
        │   │   ├─ Events = Slots
        │   │   ├─ Vendor work hours overlay
        │   │   ├─ Drag to reschedule
        │   │   └─ Click for details
        │   │
        │   ├─ Schedule (day sidebar)
        │   │   └─ List of slots for selected day
        │   │
        │   └─ OrderQuickViewCard
        │       ├─ Shows slot details
        │       ├─ Quick edit button
        │       └─ Close button
        │
        ├─ Vendors Page
        │   │
        │   ├─ DataTable (vendor list)
        │   │   ├─ Vendor name, email, services
        │   │   ├─ Status indicator
        │   │   └─ Row actions
        │   │
        │   ├─ Row Click → Vendor Detail
        │   │   ├─ Profile section
        │   │   ├─ Addresses section
        │   │   ├─ Work hours (calendar)
        │   │   ├─ Services offered
        │   │   ├─ Service area (map)
        │   │   └─ Settings
        │   │
        │   └─ Create Button
        │       └─ Opens CreateVendorDialog
        │
        └─ ... (Other pages follow similar patterns)
```

---

## Last Updated

Generated: 2026-06-02
Review: When adding new flows or changing interaction patterns
