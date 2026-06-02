# BC Floor - Module Documentation: PAYMENTS

Billing, invoicing, and tax calculation. Read AI_INDEX.md first.

---

## Feature Overview

**Purpose**: Generate invoices, calculate taxes, process payments

**Responsibility**:
- Create invoices from completed orders
- Calculate tax based on location
- Calculate travel costs
- Support multi-vendor invoicing
- Support co-agent splits
- Track payment status

**User Scope**:
- Admin: Create/send invoices, mark paid
- Agent: View team invoices
- Vendor: View invoices, confirm payment

---

## Business Logic

### Invoice Generation

```
Step 1: INITIATE INVOICE
  Admin clicks "Generate Invoice" on completed order
  Action: POST /invoices { order_id: 123 }

Step 2: CALCULATE AMOUNTS
  Backend retrieves Order + Slots:
  
  Order Service Amounts:
  ├─ Service 1: 2 hours @ $100/hr = $200
  ├─ Service 2: 3 hours @ $150/hr = $450
  └─ Service subtotal = $650
  
  Travel Costs:
  ├─ Leg 1: 15km @ $5/km = $75
  ├─ Leg 2: 8km @ $5/km = $40
  └─ Travel subtotal = $115
  
  Grand subtotal = $650 + $115 = $765

Step 3: CALCULATE TAX
  Vendor location: BC (Canada)
  Tax rate: getTaxRateByLocation("BC", "Canada")
  → Returns: { rate: 5.0, taxType: "GST (5%)" }
  
  Tax amount = $765 * (5.0 / 100) = $38.25
  
  Invoice total = $765 + $38.25 = $803.25

Step 4: HANDLE PAYMENT SPLIT (if co-agents)
  Order co-agents:
  ├─ Main agent: 70% (default = 100% - co-agent splits)
  ├─ Co-Agent A: 20%
  └─ Co-Agent B: 10%
  
  Split calculation:
  ├─ Main agent: $803.25 * 70% = $562.28
  ├─ Co-Agent A: $803.25 * 20% = $160.65
  └─ Co-Agent B: $803.25 * 10% = $80.33
  
  Total split: $562.28 + $160.65 + $80.33 = $803.26 ✓

Step 5: CREATE INVOICE RECORDS
  For single vendor (no split):
  ├─ Create Invoice record
  │  ├─ order_id: 123
  │  ├─ vendor_id: 5
  │  ├─ amount: 765.00 (subtotal)
  │  ├─ tax_amount: 38.25
  │  ├─ tax_rate: 5.0
  │  ├─ tax_type: "GST (5%)"
  │  ├─ total: 803.25
  │  ├─ status: 'draft'
  │  └─ due_date: 2026-06-16 (14 days)
  │
  └─ Order status → 'invoiced'
  
  For multi-vendor (if applicable):
  ├─ Create separate Invoice per vendor
  └─ Invoice.amount = portion of total for that vendor

Step 6: SEND INVOICE
  Action: POST /invoices/{id}/send
  
  Backend:
  ├─ Render email template
  │  ├─ Include: Invoice details, amount, due date
  │  ├─ Include: Payment link (if enabled)
  │  └─ Attach: Invoice PDF
  │
  ├─ Send email to vendor.email
  ├─ Update Invoice status → 'sent'
  └─ Notification: "Invoice sent" → Vendor

Step 7: MARK PAID
  Admin receives payment, marks invoice paid
  
  Action: PUT /invoices/{id}
  {
    status: 'paid',
    payment_method: 'bank_transfer' | 'check' | 'credit_card',
    transaction_id: 'TRX-12345',
    paid_at: timestamp
  }
  
  Backend:
  ├─ Create Payment record
  ├─ Invoice status → 'paid'
  ├─ Order status → 'paid'
  └─ Notifications: "Payment confirmed" → All parties
```

### Tax Calculation Reference

**Canada** (by province):
- AB, BC, MB, SK, YT, NT, NU: 5% (GST only)
- ON: 13% (HST)
- NB, NL, NS, PE: 15% (HST)
- QC: 14.975% (GST 5% + QST 9.975%)

**USA** (by state):
- AK, DE: 0% (no sales tax)
- AL, GA, HI: 4%
- AZ: 5.6%
- AR, IL, MO: 6.5%
- CA, IN, NY: 7.25%
- TX, WA: varies by county
... (full list in taxCalculator.ts)

---

## APIs

### POST /invoices (Generate)

**Request**:
```json
{
  "order_id": 123,
  "vendor_id": 5
}
```

**Response (201)**:
```json
{
  "invoice": {
    "id": 456,
    "uuid": "inv-abc123",
    "order_id": 123,
    "vendor_id": 5,
    "amount": "765.00",
    "tax_amount": "38.25",
    "tax_rate": 5.0,
    "tax_type": "GST (5%)",
    "total": "803.25",
    "status": "draft",
    "due_date": "2026-06-16",
    "created_at": "2026-06-02T10:00:00Z"
  }
}
```

---

### POST /invoices/{id}/send

**Purpose**: Send invoice via email

**Request**:
```json
{
  "email": "vendor@company.com",
  "include_payment_link": true
}
```

**Response (200)**:
```json
{
  "message": "Invoice sent",
  "status": "sent",
  "sent_at": "2026-06-02T10:30:00Z"
}
```

---

### PUT /invoices/{id} (Mark Paid)

**Request**:
```json
{
  "status": "paid",
  "payment_method": "bank_transfer",
  "transaction_id": "TRX-12345",
  "paid_at": "2026-06-02T15:00:00Z"
}
```

**Response (200)**:
```json
{
  "invoice": {
    "id": 456,
    "status": "paid",
    "paid_at": "2026-06-02T15:00:00Z",
    "payment_method": "bank_transfer"
  }
}
```

---

### GET /invoices/{id}/download (PDF Export)

**Response**: PDF file download

---

## Data Models

```typescript
export interface Invoice {
    id: number
    uuid: string
    order_id: number
    vendor_id: number
    amount: string              // subtotal (services + travel)
    tax_amount: string
    tax_rate: string            // percentage (5.0, 13.0, etc)
    tax_type: string            // "GST (5%)", "HST (13%)", etc
    status: 'draft' | 'sent' | 'paid' | 'overdue'
    due_date: string
    created_at: string
    updated_at: string
}

export interface Payment {
    id: number
    uuid: string
    invoice_id: number
    amount: string
    payment_method: string      // 'bank_transfer', 'check', 'credit_card'
    transaction_id?: string
    status: 'pending' | 'completed' | 'failed'
    paid_at?: string
    created_at: string
}
```

---

## Components

### Invoice Detail Page
**Route**: `/dashboard/invoice/[uuid]`

**Sections**:
1. Invoice header (number, date, due date)
2. Vendor info
3. Line items (services + travel)
4. Tax calculation
5. Total amount
6. Payment section
7. Action buttons (send, download PDF, mark paid)

**Files**:
- `app/dashboard/invoice/[uuid]/page.tsx`
- `app/dashboard/invoice/components/InvoiceDocument.tsx` (view)
- `app/dashboard/invoice/components/InvoicePdfDocument.tsx` (export)

---

### Billing Dashboard (Admin)
**Route**: `/dashboard/billing`

**Features**:
- List all invoices (with filters)
- Filter by status (draft, sent, paid, overdue)
- Filter by date range
- Generate invoice button
- Bulk actions (send, mark paid)

---

### Vendor Billing Dashboard
**Route**: `/dashboard/vendor-billing`

**Features**:
- List invoices (vendor scope)
- View only invoices for assigned orders
- Filter by status
- Download PDF
- View payment history
- Request payment (if enabled)

---

## Tax Calculation Engine

**File**: `lib/taxCalculator.ts`

**Function**: `getTaxRateByLocation(province, country)`

**Input**:
- province: "BC", "ON", "QC", "AB", etc. (Canada) or US state codes
- country: "Canada" (default) or "USA"

**Output**:
```typescript
{
  rate: number              // 5.0, 13.0, 14.975, etc
  taxType: string           // "GST (5%)", "HST (13%)", "Sales Tax (5%)"
  country: string
}
```

**Usage**:
```typescript
const taxInfo = getTaxRateByLocation("BC", "Canada");
// Returns: { rate: 5.0, taxType: "GST (5%)", country: "Canada" }

const taxAmount = subtotal * (taxInfo.rate / 100);
```

---

## Pages

### Billing List (Admin)
**Route**: `/dashboard/billing`

**Columns**: ID, Vendor, Amount, Tax, Total, Status, Due Date, Actions
**Filters**: Status, Date range, Vendor
**Actions**: View, Send, Download, Mark paid

---

### Invoice Creation
**Route**: `/dashboard/invoice/create`

**Form**:
- Select order (from completed orders)
- Review calculated amounts
- Edit if needed
- Create button

---

### Invoice View
**Route**: `/dashboard/invoice/[uuid]`

**Sections**: (as above)

---

## Edge Cases

### Case 1: Multi-Vendor Order
**Scenario**: Order has 3 services from 2 vendors

**Behavior**:
- Calculate subtotal for each vendor
- Apply tax to each
- Create separate invoices

---

### Case 2: Vendor in Different Province
**Scenario**: Agent in BC, Vendor in ON

**Behavior**:
- Use Vendor's location (ON)
- Apply ON tax (13% HST)
- Not BC tax (5% GST)

---

### Case 3: Co-Agent Payment
**Scenario**: Order split 70% / 20% / 10%

**Behavior**:
- Generate 1 invoice for full amount
- Create 3 payment records (one per party)
- Each gets their percentage

---

## Testing Checklist

- [ ] Generate invoice from completed order
- [ ] Tax calculation correct (Canada)
- [ ] Tax calculation correct (USA)
- [ ] Travel costs included
- [ ] Send invoice via email
- [ ] Mark invoice paid
- [ ] Download PDF
- [ ] Co-agent split correct
- [ ] Multi-vendor invoicing works

---

## Related Features

- **Orders**: Order status → invoiced
- **Vendors**: Location-based tax
- **Notifications**: Payment confirmations

---

## Known Issues

- None reported

---

## Last Updated

Generated: 2026-06-02
Related: FLOW_TREE.md (Invoice Generation flow)
