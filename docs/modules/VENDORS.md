# BC Floor - Module Documentation: VENDORS

Service provider management. Read AI_INDEX.md first.

---

## Feature Overview

**Purpose**: Manage vendor profiles, availability, and assignments

**Responsibility**:
- Create/edit vendor profiles
- Manage work hours and availability
- Define service areas
- Track vendor settings
- Monitor vendor earnings

**User Scope**:
- Admin: Create/edit vendors, manage settings
- Vendor: Update own profile, set availability
- Agent: View vendors (for assignment)

---

## Business Logic

### Vendor Profile Management

```
Step 1: ADMIN CREATES VENDOR (Admin)
  Action: POST /vendors
  {
    first_name: "John",
    last_name: "Smith",
    company_name: "John's Floor Services",
    email: "john@company.com",
    primary_phone: "555-1234",
    secondary_phone: "555-5678"
  }
  
  Backend:
  ├─ Create Vendor record
  ├─ Auto-create User account (if needed)
  └─ Send invite email to vendor

Step 2: VENDOR COMPLETES PROFILE (Vendor)
  Vendor logs in, fills profile:
  ├─ Company website
  ├─ Logo
  ├─ Primary address
  └─ Secondary addresses (if multi-location)
  
  Action: PUT /vendors/{id}
  Response: Updated Vendor

Step 3: SET WORK HOURS (Vendor)
  Vendor defines availability
  
  Action: PUT /vendors/{id}/work-hours
  {
    start_time: "08:00",
    end_time: "17:00",
    work_days: ["mon", "tue", "wed", "thu", "fri"],
    break_start: "12:00",
    break_end: "13:00",
    commute_minutes: 30,
    timezone: "America/Vancouver"
  }
  
  Backend:
  ├─ Create VendorWorkHours record
  ├─ Validate: end_time > start_time
  ├─ Validate: timezone is valid
  └─ Store for availability checking

Step 4: SET SERVICE AREA (Optional)
  Vendor defines service area (polygon)
  
  Action: PUT /vendors/{id}/service-area
  {
    coordinates: [
      { lat: 49.2, lng: -123.1 },
      { lat: 49.3, lng: -123.1 },
      { lat: 49.3, lng: -123.2 },
      { lat: 49.2, lng: -123.2 }
    ],
    force_service_area: false
  }
  
  Backend:
  ├─ Validate: valid polygon
  ├─ Store: service_area geometry
  ├─ force_service_area = true: prevent out-of-area jobs
  │ force_service_area = false: warn but allow
  └─ Use for: job assignment validation

Step 5: ENABLE SERVICES (Vendor/Admin)
  Vendor accepts services offered
  
  Admin assigns service to vendor:
  ├─ Sets hourly rate
  ├─ Sets time estimate
  └─ Service enabled
  
  Vendor can accept/decline each service
```

### Vendor Availability Checking

```
When assigning order slot:

1. Get vendor work hours for that day
2. Get all existing slots for vendor
3. Check conflicts:
   ├─ Is day in work_days? (e.g., work_days = ['mon','tue',...,'fri'])
   ├─ Is slot start >= work_start? (accounting for commute)
   ├─ Is slot end <= work_end?
   ├─ No overlap with break time? (12:00-13:00)
   ├─ No overlap with other slots?
   └─ Add commute time before first job + after last job

4. If all checks pass: ✅ AVAILABLE
   If any fail: ⚠️ CONFLICT
   └─ Show warning, allow force assign (if permitted)
```

---

## APIs

### GET /vendors (List)

**Query Parameters**:
```
?status=active|inactive
?search=keyword
?page=1
?per_page=20
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "vnd-123",
      "first_name": "John",
      "last_name": "Smith",
      "company_name": "John's Floor Services",
      "email": "john@company.com",
      "primary_phone": "555-1234",
      "status": true,
      "created_at": "2026-01-01T00:00:00Z",
      "vendor_services": [
        { "service_id": 1, "hourly_rate": "100.00" }
      ]
    }
  ],
  "meta": { "total": 50 }
}
```

---

### GET /vendors/{id} (Detail)

**Response**:
```json
{
  "vendor": {
    "id": 1,
    "uuid": "vnd-123",
    "first_name": "John",
    "last_name": "Smith",
    "company_name": "John's Floor Services",
    "addresses": [
      {
        "id": 1,
        "type": "primary",
        "address_line_1": "123 Main St",
        "city": "Vancouver",
        "province": "BC",
        "country": "Canada"
      }
    ],
    "work_hours": [
      {
        "start_time": "08:00",
        "end_time": "17:00",
        "work_days": "[\"mon\", \"tue\", \"wed\", \"thu\", \"fri\"]",
        "break_start": "12:00",
        "break_end": "13:00",
        "commute_minutes": 30,
        "timezone": "America/Vancouver"
      }
    ],
    "vendor_services": [
      {
        "service_id": 1,
        "hourly_rate": "100.00",
        "time_needed": 2,
        "status": true
      }
    ],
    "settings": {
      "payment_per_km": "5.00",
      "enable_service_area": true,
      "force_service_area": false
    }
  }
}
```

---

### PUT /vendors/{id} (Update)

**Request**: Partial Vendor fields

**Response**: Updated Vendor

---

### PUT /vendors/{id}/work-hours

**Request**:
```json
{
  "start_time": "08:00",
  "end_time": "17:00",
  "work_days": ["mon", "tue", "wed", "thu", "fri"],
  "break_start": "12:00",
  "break_end": "13:00",
  "commute_minutes": 30,
  "timezone": "America/Vancouver"
}
```

**Response**: Created/Updated VendorWorkHours

---

### PUT /vendors/{id}/settings

**Request**:
```json
{
  "payment_per_km": "5.00",
  "enable_service_area": true,
  "force_service_area": false
}
```

**Response**: Updated VendorSettings

---

## Data Models

```typescript
export type Vendor = {
    uuid?: string
    full_name: string
    first_name: string
    last_name: string
    email: string
    created_at: string
    status?: boolean
    company_name: string
    addresses: Address[]
    vendor_services: VendorService[]
    settings: VendorSettings
    organization_id?: number
}

export interface Address {
    id: number
    uuid: string
    vendor_id: number
    type: string                // 'primary', 'secondary'
    address_line_1: string
    address_line_2?: string
    city: string
    province: string
    country: string
    created_at: string
}

export interface WorkHours {
    id: number
    uuid: string
    vendor_id: number
    start_time: string          // "08:00"
    end_time: string            // "17:00"
    work_days: string           // JSON array "[\"mon\",\"tue\"...]"
    break_start?: string        // "12:00"
    break_end?: string          // "13:00"
    commute_minutes: number
    timezone: string            // "America/Vancouver"
    created_at: string
}

export interface VendorSettings {
    id: number
    uuid: string
    vendor_id: number
    payment_per_km: string
    enable_service_area: boolean
    force_service_area: boolean
    created_at: string
}
```

---

## Pages

### Vendors List
**Route**: `/dashboard/vendors`

**Columns**: Name, Company, Services Offered, Status, Earnings, Actions

**Filters**: Status, Services

**Actions**: View profile, Edit, Message, View earnings

---

### Vendor Detail/Edit
**Route**: `/dashboard/vendors/[id]`

**Sections**:
1. **Basic Info**
   - Name, company, contact
   - Avatar
   - Status toggle

2. **Addresses**
   - List addresses
   - Mark as primary
   - Add/remove addresses

3. **Work Hours**
   - Days of work
   - Start/end times
   - Break times
   - Timezone
   - Commute time

4. **Services**
   - Services offered
   - Hourly rates
   - Time estimates
   - Accept/decline buttons

5. **Service Area**
   - Map with polygon
   - Enable/disable area enforcement
   - Edit coordinates

6. **Settings**
   - Payment per km
   - Service area enforcement
   - Availability status

7. **Earnings**
   - Total earnings
   - Pending payments
   - Payment history

---

### Vendor Creation
**Route**: `/dashboard/vendors/create`

**Form**:
- Basic info
- Contact details
- Create button

---

## Components

### WorkHours Component
**File**: `components/WorkHours.tsx`

**Purpose**: Edit work hours, break times, timezone

**Features**:
- Time pickers
- Day selection (checkboxes)
- Break time ranges
- Timezone selector

---

### MapsPolygonEditor
**File**: `components/MapsPolygonEditor.tsx`

**Purpose**: Edit service area on map

**Features**:
- Draw polygon on map
- Edit coordinates
- Save polygon
- Show on order creation

---

## Features

### Vendor Earnings Tracking
- Calculate earnings per order
- Track payments received
- Show pending payments
- Generate earning reports

### Availability Management
- Set work hours per day
- Define break times
- Set commute time (travel between jobs)
- Timezone support (for DST)

### Service Area
- Optional geographic restriction
- Polygon-based (not circle)
- Force or warn if customer outside area

### Multi-Location Support
- Multiple addresses per vendor
- Different work hours per address (optional)
- Primary address used for tax calculation

---

## Edge Cases

### Case 1: Vendor Outside Work Hours
**Scenario**: Job scheduled outside vendor's work hours

**Behavior**:
1. Show warning: "Outside work hours"
2. Allow force assign (if permitted)
3. Mark job as "exception"

---

### Case 2: Vendor in Service Area But Not Closest
**Scenario**: Closest vendor outside service area, farther vendor inside

**Behavior**:
- Respect service area restriction
- Assign farther vendor (if force_service_area = true)
- Show warning (if false)

---

### Case 3: Multi-Address Vendor
**Scenario**: Vendor has office in Vancouver + satellite in Victoria

**Behavior**:
- Use closest address when calculating travel
- Or use address nearest to job location
- Admin can specify preferred address

---

## Testing Checklist

- [ ] Create vendor profile
- [ ] Edit vendor info
- [ ] Add work hours
- [ ] Set service area
- [ ] Assign services
- [ ] Check availability (no conflicts)
- [ ] Check availability (conflicts shown)
- [ ] Vendor earnings tracked
- [ ] Multi-address support

---

## Related Features

- **Orders**: Vendor assignment
- **Booking**: Availability checking
- **Payments**: Tax by vendor location
- **Notifications**: New job assignments

---

## Known Issues

- None reported

---

## Last Updated

Generated: 2026-06-02
Related: BOOKING.md (Vendor Assignment flow)
