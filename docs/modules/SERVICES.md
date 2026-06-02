# BC Floor - Module Documentation: SERVICES

Service catalog management. Read AI_INDEX.md first.

---

## Feature Overview

**Purpose**: Define services offered and assign to vendors

**Responsibility**:
- Create/edit services
- Manage service categories
- Assign services to vendors (with rates)
- Track service-vendor pricing

**User Scope**:
- Admin: Create/edit services, assign to vendors
- Agent: View services (when creating orders)
- Vendor: View offered services, accept/decline

---

## Business Logic

### Service Management

```
Step 1: CREATE SERVICE (Admin)
  Action: POST /services
  {
    name: "Floor Plan",
    category_id: 1,
    description: "Professional floor plan service",
    thumbnail_url: "https://...",
    background_color: "#FF5733",
    border_color: "#333333"
  }
  
  Backend:
  ├─ Validate: name unique per org?
  ├─ Create Service record
  └─ Return Service

Step 2: ASSIGN TO VENDOR (Admin)
  Action: POST /vendor-services
  {
    vendor_id: 5,
    service_id: 1,
    hourly_rate: "100.00",
    time_needed: 2
  }
  
  Backend:
  ├─ Validate: rate > 0, time > 0
  ├─ Check: Service exists, Vendor exists
  ├─ Create VendorService record
  │  ├─ vendor_id = 5
  │  ├─ service_id = 1
  │  ├─ hourly_rate = 100.00
  │  ├─ time_needed = 2 hours
  │  └─ status = true (active)
  │
  └─ Notification: "Service assigned" → Vendor (optional)

Step 3: VENDOR ACCEPTS SERVICE (Vendor)
  Vendor can accept/decline service assignment
  
  Action: PUT /vendor-services/{id}
  { status: true | false }
  
  Backend: Update status
  Notification: "Service accepted" → Admin

Step 4: AGENT USES SERVICE IN ORDER (Agent)
  When creating order, Agent selects services
  
  System uses:
  ├─ service.name (display)
  ├─ vendor_service.hourly_rate (for pricing)
  ├─ vendor_service.time_needed (estimate)
  └─ Creates OrderService record
```

---

## APIs

### GET /services (List)

**Query Parameters**:
```
?category_id=1
&status=active|inactive
&page=1
&per_page=20
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "svc-123",
      "name": "Floor Plan",
      "category_id": 1,
      "description": "Professional floor plan service",
      "thumbnail_url": "https://...",
      "background_color": "#FF5733",
      "border_color": "#333333",
      "status": true,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "meta": { "current_page": 1, "total": 50 }
}
```

---

### POST /services (Create)

**Request**:
```json
{
  "name": "Floor Plan",
  "category_id": 1,
  "description": "Professional floor plan service",
  "thumbnail_url": "https://...",
  "background_color": "#FF5733",
  "border_color": "#333333"
}
```

**Response (201)**:
```json
{
  "service": {
    "id": 1,
    "uuid": "svc-123",
    "name": "Floor Plan",
    "category_id": 1,
    "status": true,
    "created_at": "2026-06-02T10:00:00Z"
  }
}
```

---

### POST /vendor-services (Assign to Vendor)

**Request**:
```json
{
  "vendor_id": 5,
  "service_id": 1,
  "hourly_rate": "100.00",
  "time_needed": 2
}
```

**Response (201)**:
```json
{
  "vendor_service": {
    "id": 1,
    "uuid": "vs-123",
    "vendor_id": 5,
    "service_id": 1,
    "hourly_rate": "100.00",
    "time_needed": 2,
    "status": true,
    "created_at": "2026-06-02T10:00:00Z"
  }
}
```

---

### PUT /vendor-services/{id} (Update)

**Request**:
```json
{
  "hourly_rate": "120.00",
  "time_needed": 2.5,
  "status": true
}
```

**Response (200)**:
```json
{
  "vendor_service": {
    "id": 1,
    "hourly_rate": "120.00",
    "time_needed": 2.5,
    "status": true
  }
}
```

---

## Data Models

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
    updated_at: string
}

export interface ServiceCategory {
    id: number
    uuid: string
    name: string
    description?: string
    created_at: string
}

export interface VendorService {
    id: number
    uuid: string
    vendor_id: number
    service_id: number
    hourly_rate: string
    time_needed: number        // hours
    status: boolean
    created_at: string
    updated_at: string
    
    // Relation
    service: Service
    vendor: Vendor
}
```

---

## Pages

### Services List
**Route**: `/dashboard/services`

**Columns**: ID, Name, Category, Description, Vendors Offering, Status, Actions

**Filters**: Status, Category

**Actions**: View, Edit, Delete

---

### Service Detail
**Route**: `/dashboard/services/[id]`

**Sections**:
1. Service info (name, category, description)
2. Visuals (thumbnail, colors)
3. Vendors offering (table)
   - Vendor name
   - Hourly rate
   - Time estimate
   - Status (active/inactive)
4. Edit/Delete buttons

---

### Service Categories
**Route**: `/dashboard/service-category`

**Features**: CRUD categories

---

### Vendor Services
**Route**: (modal in vendor detail)

**Features**:
- List services assigned to vendor
- Hourly rates per service
- Accept/decline assignment
- Edit rates

---

## Components

### ServiceItem
**File**: `components/ServiceItem.tsx`

**Displays**:
- Service thumbnail
- Service name
- Category
- Description
- Color theme

---

### ServicesSelector
**File**: `components/ServicesSelector.tsx`

**Purpose**: Multi-select services when creating order

**Features**:
- Search services
- Filter by category
- Select quantity
- Show rate preview

---

## Features

### Service Categories
- Organize services logically
- Filter orders by category
- Display in UI with grouping

### Service Pricing
- Different price per vendor
- Hourly or fixed rate
- Time estimate (for scheduling)

### Service Status
- Active (available for orders)
- Inactive (archived, not used in new orders)

---

## Edge Cases

### Case 1: Service Used in Active Order
**Scenario**: Admin tries to delete service used in pending order

**Behavior**:
1. Show warning: "Service in use"
2. Prevent deletion OR archive only
3. Existing orders unaffected

---

### Case 2: Rate Change Mid-Order
**Scenario**: Admin changes vendor rate after order created but before invoice

**Behavior**:
- Use rate at invoice time (not order time)
- Or freeze rate when order created?
- (Depends on business requirement)

---

### Case 3: No Vendors for Service
**Scenario**: Agent selects service no vendor offers

**Behavior**:
1. Show warning: "No vendors available"
2. Allow order creation
3. Admin must assign vendor later

---

## Testing Checklist

- [ ] Create service
- [ ] Edit service
- [ ] Delete service
- [ ] Assign service to vendor
- [ ] Update vendor rate
- [ ] Accept/decline service (vendor)
- [ ] Use service in order
- [ ] Archive inactive service

---

## Related Features

- **Orders**: Use services in order creation
- **Vendors**: Offer services
- **Payments**: Service rates determine invoice amount

---

## Known Issues

- None reported

---

## Last Updated

Generated: 2026-06-02
Related: FLOW_TREE.md (Order Creation flow)
