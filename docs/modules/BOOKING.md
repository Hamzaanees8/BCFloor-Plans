# BC Floor - Module Documentation: BOOKING

Order booking system. Read AI_INDEX.md first.

---

## Feature Overview

**Purpose**: Create orders, assign vendors, manage appointment scheduling

**Core Responsibility**:
- Create orders from services
- Generate time slots
- Assign vendors to slots
- Track slot status
- Calculate travel times

**User Scope**:
- Agent: Create orders, request vendor assignment
- Admin: Assign vendors, reschedule slots
- Vendor: View assigned work, mark complete

---

## Business Logic

### Order Creation Flow

```
Step 1: AGENT CREATES ORDER
  Input: Customer info, services, preferred date
  
  Form fields:
  ├─ Property ID (existing or new)
  ├─ Services: Array<{ service_id, quantity }>
  ├─ Preferred date: Optional
  ├─ Notes: Optional
  └─ Co-agents: Optional (if splitting work)
  
  Action: POST /orders
  {
    agent_id: 1
    property_id: 5
    services: [
      { service_id: 1, quantity: 2 },  // 2x service 1
      { service_id: 2, quantity: 1 }   // 1x service 2
    ]
    preferred_date?: "2026-06-15"
    notes?: "Customer prefers morning"
  }
  
  Backend:
  ├─ Validate agent exists
  ├─ Validate property exists
  ├─ Validate services exist
  ├─ Create Order record (status='pending')
  ├─ For each service:
  │  ├─ Create OrderService record (qty, rate from catalog)
  │  └─ Create Slot placeholder (vendor_id=null, date=null)
  │
  ├─ Response: Order {
  │   id: 123,
  │   status: 'pending',
  │   slots: [
  │     { id: 1, service_id: 1, vendor_id: null, date: null },
  │     { id: 2, service_id: 2, vendor_id: null, date: null }
  │   ]
  │ }
  │
  └─ Notification: "Order created" → Admin

Step 2: ADMIN ASSIGNS VENDORS
  For each slot:
  
  Action: POST /orders/{id}/assign-vendor
  {
    vendor_id: 5
    slot_id: 1
    date: "2026-06-15"
    start_time: "09:00"
    end_time: "11:00"
  }
  
  Backend validation:
  ├─ Vendor exists and status=active?
  ├─ Vendor has this service?
  ├─ Vendor available at this time?
  │  ├─ Within work_hours?
  │  ├─ No conflicts with other slots?
  │  └─ After vendor commute time?
  │
  ├─ Date is in future?
  ├─ Time is valid? (end > start)
  │
  └─ If all valid:
     ├─ Calculate travel:
     │  ├─ Get vendor location (primary address)
     │  ├─ Get customer location (property address)
     │  ├─ Call Google Maps DistanceMatrix
     │  ├─ Get distance (km), duration (min)
     │  └─ Calculate cost = distance * vendor.settings.payment_per_km
     │
     ├─ Update Slot:
     │  ├─ vendor_id = 5
     │  ├─ date = "2026-06-15"
     │  ├─ start_time = "09:00"
     │  ├─ end_time = "11:00"
     │  ├─ travel_distance = 25.5 km
     │  ├─ travel_cost = $127.50
     │  └─ status = 'scheduled'
     │
     ├─ Check all slots scheduled?
     │  └─ If yes: Order status → 'scheduled'
     │
     └─ Notification: "Assigned to job" → Vendor

Step 3: VENDOR COMPLETES WORK
  Vendor marks job complete
  
  Action: PUT /orders/{id}/slots/{slotId}
  { status: 'completed' }
  
  Backend:
  ├─ Update Slot status = 'completed'
  ├─ Check: Are all slots complete?
  │  └─ If yes: Order status → 'completed'
  │
  └─ Notification: "Service completed" → Agent

Step 4: INVOICE GENERATION
  Admin generates invoice
  
  Action: POST /invoices { order_id }
  
  Backend calculates:
  ├─ Service subtotal = Σ(OrderService.amount)
  ├─ Travel subtotal = Σ(Slot.travel_cost)
  ├─ Total subtotal = service + travel
  ├─ Tax rate = getTaxRateByLocation(vendor.province)
  ├─ Tax amount = subtotal * (tax_rate / 100)
  ├─ Invoice total = subtotal + tax
  │
  ├─ If co-agents:
  │  ├─ Split amount = total * (co_agent_% / 100)
  │  └─ Create separate payment record per co-agent
  │
  ├─ Create Invoice record
  └─ Order status → 'invoiced'
```

### Slot Assignment Rules

**Vendor Availability Check**:
```
Requested slot:
├─ Date: 2026-06-15
├─ Start: 09:00
├─ End: 11:00
└─ Duration: 2 hours

Vendor work hours for that day:
├─ Start: 08:00
├─ End: 17:00
├─ Break: 12:00-13:00
├─ Commute: 30 minutes
└─ Timezone: America/Vancouver

Availability Check:
├─ Is 2026-06-15 a work day? YES (in work_days array)
├─ Is 09:00 >= 08:00? YES
├─ Is 11:00 <= 17:00? YES
├─ Conflicts with break? 09:00-11:00 vs 12:00-13:00 = NO
├─ Consider commute? Add 30min before first job
├─ Any overlapping slots? Check other assigned slots
└─ Result: ✅ AVAILABLE
```

**If not available**: Show conflict warning, optionally force assign

---

## APIs

### POST /orders (Create)

**Purpose**: Create new order

**Request**:
```json
{
  "agent_id": 1,
  "property_id": 5,
  "services": [
    { "service_id": 1, "quantity": 2 },
    { "service_id": 2, "quantity": 1 }
  ],
  "preferred_date": "2026-06-15",
  "notes": "Customer prefers morning"
}
```

**Response (201)**:
```json
{
  "order": {
    "id": 123,
    "uuid": "ord-abc",
    "agent_id": 1,
    "property_id": 5,
    "status": "pending",
    "amount": "950.00",
    "services": [
      {
        "id": 1,
        "service_id": 1,
        "quantity": 2,
        "hourly_rate": "100.00",
        "amount": "400.00"
      },
      {
        "id": 2,
        "service_id": 2,
        "quantity": 1,
        "hourly_rate": "150.00",
        "amount": "450.00"
      }
    ],
    "slots": [
      {
        "id": 1,
        "order_id": 123,
        "service_id": 1,
        "vendor_id": null,
        "date": null,
        "start_time": null,
        "end_time": null
      },
      {
        "id": 2,
        "order_id": 123,
        "service_id": 2,
        "vendor_id": null,
        "date": null,
        "start_time": null,
        "end_time": null
      }
    ],
    "created_at": "2026-06-02T10:00:00Z"
  }
}
```

---

### POST /orders/{id}/assign-vendor

**Purpose**: Assign vendor to slot

**Request**:
```json
{
  "vendor_id": 5,
  "slot_id": 1,
  "date": "2026-06-15",
  "start_time": "09:00",
  "end_time": "11:00"
}
```

**Response (200)**:
```json
{
  "slot": {
    "id": 1,
    "vendor_id": 5,
    "date": "2026-06-15",
    "start_time": "09:00",
    "end_time": "11:00",
    "travel_distance": 25.5,
    "travel_duration": 45,
    "travel_cost": "127.50",
    "status": "scheduled"
  },
  "order_status": "scheduled"
}
```

---

### PUT /orders/{id}/slots/{slotId} (Update/Reschedule)

**Purpose**: Reschedule appointment

**Request**:
```json
{
  "date": "2026-06-16",
  "start_time": "10:00",
  "end_time": "12:00"
}
```

**Response (200)**:
```json
{
  "slot": {
    "id": 1,
    "date": "2026-06-16",
    "start_time": "10:00",
    "end_time": "12:00",
    "travel_cost": "125.00"
  }
}
```

---

## Data Models

### Order

```typescript
export type Order = {
    id: number
    uuid: string
    agent_id: number
    property_id: number
    status: 'pending' | 'scheduled' | 'completed' | 'invoiced' | 'cancelled'
    payment_status: 'pending' | 'partial' | 'paid'
    amount: string
    paid_amount: string
    tax_amount?: string
    created_at: string
    updated_at: string
    
    // Relations
    agent: Agent
    property: Property
    services: OrderService[]
    slots: Slot[]
    notes: Note[]
    co_agents: CoAgent[]
}

export interface OrderService {
    id: number
    uuid: string
    order_id: number
    service_id: number
    quantity: number
    hourly_rate: string
    amount: string
    service: Service
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
    travel_distance?: string
    travel_duration?: string
    travel_cost?: string
    status: 'pending' | 'scheduled' | 'completed'
    created_at?: string
}
```

---

## Components

### OrderDetailView
**File**: `app/dashboard/calendar/components/OrderDetailView.tsx`

**Purpose**: Display and edit order details

**Features**:
- Customer info
- Services list
- Slots with vendor assignments
- Status display
- Edit button
- Actions (assign vendor, reschedule)

---

### CreateOrderDialog
**File**: `components/dialogs/CreateOrderDialog.tsx` (inferred)

**Purpose**: Form to create new order

**Fields**:
- Property selector
- Services (multi-select)
- Preferred date (optional)
- Notes

---

## Hooks

### useOrderContext()

**Returns**:
```typescript
{
  order: Order | null
  setOrder: (order: Order) => void
  services: OrderService[]
  slots: Slot[]
}
```

---

## Edge Cases

### Case 1: Multi-Stop Order
**Scenario**: Order has 3 services from same vendor

**Behavior**:
1. Batch Google Maps call (all legs at once)
2. Calculate total travel cost
3. Distribute across slots

---

### Case 2: Service Area Restriction
**Scenario**: Vendor has service area, customer outside

**Behavior**:
1. Show warning
2. Allow override (if force_service_area not set)
3. Or prevent assignment (if force_service_area set)

---

### Case 3: No Vendor Available
**Scenario**: All vendors have conflicts

**Behavior**:
1. Show "No vendors available"
2. Allow force assignment
3. Or suggest alternative date/time

---

## Related Features

- **Vendors**: Availability checking
- **Services**: Service-vendor mapping
- **Payments**: Invoice generation
- **Notifications**: Order updates
- **Calendar**: Visual scheduling

---

## Testing Checklist

- [ ] Create order with 1 service
- [ ] Create order with 3 services
- [ ] Assign vendor to slot
- [ ] Reschedule appointment
- [ ] Multi-vendor assignment works
- [ ] Travel calculation correct
- [ ] Order status progression works

---

## Known Issues

- None reported

---

## Last Updated

Generated: 2026-06-02
Related: FLOW_TREE.md (Order Creation flow)
