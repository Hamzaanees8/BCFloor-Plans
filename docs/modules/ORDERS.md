# BC Floor - Module Documentation: ORDERS

Order management and administration. Read AI_INDEX.md first.

---

## Feature Overview

**Purpose**: Manage all orders (list, view, edit, cancel, track)

**Responsibility**:
- Display orders in table (with sorting, pagination, filters)
- Show order details and history
- Track status progression
- Support bulk operations
- Provide audit trail

**User Scope**:
- Admin: View all orders organization-wide
- Agent: View team orders only
- Vendor: View assigned orders only

---

## Pages

### Orders List Page
**Route**: `/dashboard/orders`

**UI Components**:
- DataTable (TanStack React Table)
  - Columns: ID, Customer, Services, Status, Amount, Actions
  - Sorting: By any column
  - Pagination: 20 rows per page
  - Filters: Status, Date range, Agent
  
- Row Actions:
  - View details (click row)
  - Edit (pencil icon)
  - Cancel (trash icon)
  - Duplicate (copy icon)

**API Calls**:
- GET /orders (list with filters)

---

### Order Detail Page
**Route**: `/dashboard/orders/[id]`

**Sections**:
1. **Order Summary**
   - ID, Status, Created date
   - Customer name, email, phone
   - Property address
   - Total amount, tax, payment status

2. **Services List**
   - Service name, quantity, rate
   - Subtotal per service

3. **Slots / Appointments**
   - Vendor name
   - Date, time, duration
   - Travel distance, cost
   - Status (pending/scheduled/completed)

4. **Audit Trail / History**
   - Status changes with timestamps
   - Who made changes
   - Previous values

5. **Action Buttons**
   - Edit order
   - Assign vendor (admin only)
   - Reschedule (admin/agent)
   - Mark complete (vendor)
   - Generate invoice (admin)
   - Cancel

**API Calls**:
- GET /orders/{id} (detail)
- PUT /orders/{id} (update)
- POST /orders/{id}/cancel (cancel)

---

## APIs

### GET /orders (List)

**Query Parameters**:
```
?page=1
&per_page=20
&status=pending|scheduled|completed|invoiced|cancelled
&order_by=created_at (or other field)
&order=asc|desc
&search=keyword (customer name, ID)
```

**Response**:
```json
{
  "data": [
    {
      "id": 123,
      "uuid": "ord-abc",
      "full_name": "John Customer",
      "email": "customer@email.com",
      "property_address": "123 Main St",
      "services": [
        { "service_id": 1, "service": { "name": "Floor Plan" }, "amount": "400" }
      ],
      "status": "scheduled",
      "amount": "950.00",
      "paid_amount": "0",
      "payment_status": "pending",
      "created_at": "2026-06-02T10:00:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 150,
    "last_page": 8
  }
}
```

---

### GET /orders/{id} (Detail)

**Response**:
```json
{
  "id": 123,
  "uuid": "ord-abc",
  "full_name": "John Customer",
  "email": "customer@email.com",
  "status": "scheduled",
  "amount": "950.00",
  "property_address": "123 Main St",
  "property_location": { "lat": 49.2, "lng": -123.1 },
  "agent": {
    "uuid": "agt-123",
    "first_name": "Jane",
    "last_name": "Agent",
    "company_name": "Agent Co"
  },
  "services": [
    {
      "id": 1,
      "service_id": 1,
      "quantity": 2,
      "hourly_rate": "100.00",
      "amount": "400.00",
      "service": {
        "name": "Floor Plan"
      }
    }
  ],
  "slots": [
    {
      "id": 1,
      "vendor_id": 5,
      "service_id": 1,
      "date": "2026-06-15",
      "start_time": "09:00",
      "end_time": "11:00",
      "travel_distance": "25.5",
      "travel_cost": "127.50",
      "vendor": {
        "uuid": "vnd-456",
        "full_name": "John Vendor",
        "company_name": "Vendor Services"
      }
    }
  ],
  "logs": [
    {
      "id": 1,
      "action": "created",
      "created_at": "2026-06-02T10:00:00Z",
      "data": {
        "before": {},
        "after": { "id": 123, "status": "pending" }
      }
    }
  ]
}
```

---

### PUT /orders/{id} (Update)

**Request**: Partial Order fields
```json
{
  "amount": "1000.00",
  "notes": "Updated notes"
}
```

**Response**: Updated Order

---

### POST /orders/{id}/cancel (Cancel)

**Purpose**: Cancel order (status → cancelled)

**Response**:
```json
{
  "id": 123,
  "status": "cancelled",
  "cancelled_at": "2026-06-02T11:00:00Z"
}
```

---

## Components

### DataTable
**File**: `components/DataTable.tsx`

**Props**:
```typescript
{
  columns: ColumnDef[]
  data: Order[]
  isLoading?: boolean
  pageCount?: number
  onRowClick?: (row: Row) => void
  renderActions?: (row: Row) => JSX.Element
}
```

---

### OrderQuickViewCard
**File**: `components/QuickViewCard.tsx`

**Purpose**: Quick preview without full modal

**Shows**:
- Order summary
- Customer info
- Quick actions (edit, cancel)

---

## Filters & Sorting

**Available Filters**:
- Status: pending, scheduled, completed, invoiced, cancelled
- Date range: from/to
- Agent: filter by agent
- Amount range: min/max
- Customer name (search)

**Available Sorts**:
- Created date (newest first)
- Amount (highest/lowest)
- Status
- Customer name

---

## Order Status Workflow

```
pending
  ├─ Actions: Edit, Assign vendor, Cancel
  └─ → scheduled (when all vendors assigned)

scheduled
  ├─ Actions: Reschedule, Cancel
  └─ → completed (when all services done)

completed
  ├─ Actions: Generate invoice, Cancel
  └─ → invoiced (when invoice created)

invoiced
  ├─ Actions: Download invoice, Mark paid
  └─ → paid (when payment received)

cancelled (from any state)
  └─ Actions: None (read-only)
```

---

## Audit Trail

**Tracked Changes**:
- Status changes (pending → scheduled → completed)
- Amount changes (if discount applied)
- Vendor assignments
- Slot changes (date, time)
- Order cancellation

**Log Entry**:
```json
{
  "id": 1,
  "action": "updated",
  "model_type": "Order",
  "model_id": "123",
  "user_id": 1,
  "data": {
    "before": { "status": "pending", "amount": "950.00" },
    "after": { "status": "scheduled", "amount": "950.00" },
    "diff": { "status": ["pending", "scheduled"] }
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0...",
  "created_at": "2026-06-02T10:30:00Z"
}
```

---

## Permission Requirements

- **VIEW_ORDERS**: Can see orders
- **CREATE_ORDERS**: Can create orders
- **EDIT_ORDERS**: Can modify orders
- **VIEW_ALL_ORDERS**: Can see all org orders (admin)
- **VIEW_ONLY_ORDERS_FOR_CO_AGENT**: Can see personal orders only

---

## Edge Cases

### Case 1: Order with Mixed Vendors
**Scenario**: 3 services from 2 different vendors

**Behavior**:
- Create 3 slots
- Assign Vendor A to slots 1,2
- Assign Vendor B to slot 3
- Generate separate invoices per vendor

---

### Case 2: Co-Agent Assignment
**Scenario**: Order assigned to Co-Agent

**Behavior**:
- Co-agent gets payment split %
- Can view/edit order (within scope)
- Cannot create new orders

---

### Case 3: Cancel Mid-Execution
**Scenario**: Cancel order while services in progress

**Behavior**:
1. Show warning: "Service in progress"
2. Allow cancel with confirmation
3. Mark slots as cancelled
4. No invoice generated
5. Notify vendors

---

## Testing Checklist

- [ ] List orders with filters
- [ ] Sort by status
- [ ] Pagination works
- [ ] View order detail
- [ ] Edit order
- [ ] Cancel order
- [ ] Status progression correct
- [ ] Audit trail shows changes

---

## Related Features

- **Calendar**: Visual order scheduling
- **Payments**: Invoice generation
- **Notifications**: Order updates
- **Vendors**: Service provider lookup

---

## Known Issues

- None reported

---

## Last Updated

Generated: 2026-06-02
Related: BOOKING.md (Order Creation flow)
