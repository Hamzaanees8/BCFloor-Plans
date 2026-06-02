# BC Floor - Module Documentation: NOTIFICATIONS

Real-time notifications and alerts. Read AI_INDEX.md first.

---

## Feature Overview

**Purpose**: Notify users about important system events

**Responsibility**:
- Send notifications on order/payment events
- Display notification center
- Track read/unread status
- Support notification history

**User Scope**:
- Admin: All system notifications
- Agent: Team order notifications
- Vendor: Job assignment notifications
- Co-Agent: Personal order notifications

---

## Business Logic

### Notification Triggers

```
Order Events:
├─ order_created
│  ├─ Trigger: Agent creates order
│  ├─ Recipients: Admin
│  └─ Message: "Order #123 created by Jane Agent"
│
├─ order_assigned
│  ├─ Trigger: Admin assigns vendor to slot
│  ├─ Recipients: Vendor, Agent
│  └─ Message: "John Smith assigned to your order"
│
├─ order_completed
│  ├─ Trigger: Vendor marks order complete
│  ├─ Recipients: Agent, Admin
│  └─ Message: "Order #123 completed - ready for invoicing"
│
└─ order_cancelled
   ├─ Trigger: User cancels order
   ├─ Recipients: All parties (vendor, agent, admin)
   └─ Message: "Order #123 has been cancelled"

Slot Events:
├─ slot_rescheduled
│  ├─ Trigger: Admin changes appointment date/time
│  ├─ Recipients: Vendor
│  └─ Message: "Your appointment moved to June 16 @ 10:00"
│
└─ slot_conflict
   ├─ Trigger: System detects time conflict
   ├─ Recipients: Admin
   └─ Message: "⚠️ Scheduling conflict for John Smith"

Payment Events:
├─ invoice_sent
│  ├─ Trigger: Admin sends invoice
│  ├─ Recipients: Vendor
│  └─ Message: "Invoice #456 sent - due June 16"
│
├─ payment_received
│  ├─ Trigger: Admin marks invoice paid
│  ├─ Recipients: Vendor, Agent, Admin
│  └─ Message: "Payment of $803.25 received for Invoice #456"
│
└─ payment_overdue
   ├─ Trigger: Invoice due date passed + unpaid
   ├─ Recipients: Admin
   └─ Message: "Invoice #456 overdue - action required"

System Events:
├─ vendor_status_changed
│  ├─ Trigger: Vendor enabled/disabled
│  ├─ Recipients: Vendor, Admin
│  └─ Message: "Your account is now active"
│
└─ permission_changed
   ├─ Trigger: Admin changes user permissions
   ├─ Recipients: User
   └─ Message: "Your permissions have been updated"
```

### Notification Lifecycle

```
Step 1: TRIGGER EVENT
  Event occurs (order created, vendor assigned, etc.)
  
Step 2: CREATE NOTIFICATION
  Backend creates Notification record:
  ├─ type: 'order_created'
  ├─ source: 'order'
  ├─ source_id: 123
  ├─ user_id: recipient_id
  ├─ Subject: "Order #123 created"
  ├─ description: "Jane Agent created order for John Customer"
  └─ is_read: false

Step 3: QUEUE FOR DELIVERY
  Backend queues notification:
  ├─ In-app: Mark for UI display
  ├─ Email: (optional) queue email
  ├─ SMS: (optional) queue SMS
  └─ Push: (optional) queue push notification

Step 4: USER SEES NOTIFICATION
  Frontend:
  ├─ Poll GET /notifications (every 30 sec?)
  │  OR use WebSocket (real-time)
  │
  ├─ Display in:
  │  ├─ Notification bell icon (unread count)
  │  ├─ Dropdown preview (last 5)
  │  └─ Notification center page (/dashboard/notifications)
  │
  └─ Show toast for critical events

Step 5: MARK AS READ
  User clicks notification
  
  Action: PUT /notifications/{id}/read
  ├─ Update: is_read = true, read_at = timestamp
  └─ Unread count decreases

Step 6: CLEAR / ARCHIVE
  User can delete notifications
  
  Action: DELETE /notifications/{id}
  └─ Remove from inbox (or soft delete)
```

---

## APIs

### GET /notifications (List)

**Query Parameters**:
```
?page=1
?per_page=20
?is_read=false (filter unread)
?type=order_created|payment_received|... (filter type)
?date_from=2026-06-01 (filter date range)
?date_to=2026-06-30
```

**Response (200)**:
```json
{
  "data": [
    {
      "id": 1,
      "uuid": "ntf-123",
      "type": "order_created",
      "source": "order",
      "source_id": "123",
      "created_by_name": "Jane Agent",
      "Subject": "Order #123 created",
      "description": "New order for John Customer - Floor Plan service",
      "is_read": false,
      "read_at": null,
      "created_at": "2026-06-02T10:00:00Z"
    },
    {
      "id": 2,
      "uuid": "ntf-124",
      "type": "order_assigned",
      "source": "order",
      "source_id": "123",
      "created_by_name": "Admin User",
      "Subject": "You've been assigned to Order #123",
      "description": null,
      "is_read": true,
      "read_at": "2026-06-02T10:15:00Z",
      "created_at": "2026-06-02T10:10:00Z"
    }
  ],
  "meta": {
    "current_page": 1,
    "per_page": 20,
    "total": 150,
    "unread_count": 3
  }
}
```

---

### PUT /notifications/{id}/read

**Purpose**: Mark notification as read

**Response (200)**:
```json
{
  "is_read": true,
  "read_at": "2026-06-02T10:15:00Z"
}
```

---

### DELETE /notifications/{id}

**Purpose**: Delete notification

**Response (200)**:
```json
{
  "message": "Notification deleted"
}
```

---

### PUT /notifications/mark-all-read

**Purpose**: Mark all notifications as read

**Response (200)**:
```json
{
  "message": "All notifications marked as read"
}
```

---

## Data Models

```typescript
export interface NotificationData {
    id?: number
    uuid?: string
    type: string                // 'order_created', 'order_assigned', etc.
    source?: string             // 'order', 'invoice', 'payment', etc.
    source_id?: string          // ID of the source entity
    created_by_name: string     // Who triggered the notification
    Subject: string
    description?: string
    created_at: string
    updated_at?: string
    is_read?: boolean
    read_at?: string
    
    // Optional: additional data for specific notification types
    diff_data?: {
        amount?: { before: string | number, after: string | number }
        payment_details?: { before?: object, after?: object }
        slots?: Record<string, { before: Slot | null, after: Slot | null }>
    }
}
```

---

## Pages

### Notification Center
**Route**: `/dashboard/notifications`

**Features**:
- List all notifications (sorted by date DESC)
- Filter by type, date range
- Search notifications
- Mark as read (individual or all)
- Delete notifications
- Clear all notifications
- Show unread count in header

**Columns**: Type icon, Subject, Time ago, Read status, Actions

**Actions**: View (if clickable), Mark read, Delete

---

## Components

### Notification Bell
**File**: `components/Header.tsx` (part of header)

**Features**:
- Bell icon
- Unread count badge
- Dropdown with last 5 notifications
- "View all" link

---

### Notification Toast
**Purpose**: Temporary popup for important events

**Triggered by**: Critical notifications
- Order assignment
- Payment received
- Error conditions

---

## Notification Types

**Order Management**:
- `order_created`: Order created
- `order_assigned`: Vendor assigned
- `order_completed`: Service finished
- `order_cancelled`: Order cancelled
- `slot_rescheduled`: Appointment changed
- `order_ready_for_invoice`: Ready for invoicing

**Payment Management**:
- `invoice_sent`: Invoice emailed
- `invoice_viewed`: Vendor opened invoice
- `payment_received`: Payment confirmed
- `payment_overdue`: Invoice overdue

**System Events**:
- `vendor_status_changed`: Vendor enabled/disabled
- `service_assigned`: Service offered to vendor
- `permission_changed`: User permissions updated
- `system_maintenance`: Scheduled maintenance

---

## Delivery Methods

**In-App** (current):
- Displayed in notification center
- Bell icon badge
- Toast for critical events

**Email** (optional, backend):
- Send email copy of important notifications
- User preferences can control

**SMS** (optional, backend):
- Text for urgent notifications
- Opt-in/opt-out per user

**Push Notifications** (optional):
- Native mobile push
- Browser push (if PWA)

---

## Real-Time Options

**Current** (Polling):
- Frontend polls GET /notifications every 30 seconds
- Pros: Simple, no server complexity
- Cons: Delay, wasted API calls

**Future** (WebSocket):
- Server pushes notifications in real-time
- Pros: Instant delivery, efficient
- Cons: Server complexity, connection management

**Future** (Server-Sent Events):
- Server streams notifications
- Pros: HTTP-based, easier than WebSocket
- Cons: One-way communication

---

## Testing Checklist

- [ ] Create order → notification sent
- [ ] Assign vendor → notification sent
- [ ] Mark notification as read
- [ ] List notifications with filters
- [ ] Unread count correct
- [ ] Delete notification
- [ ] Mark all as read
- [ ] Toast displays for critical events
- [ ] Bell icon shows unread count

---

## Edge Cases

### Case 1: Notification for Self
**Scenario**: User creates order (gets notification for own action)

**Behavior**:
- Notification may be suppressed
- Or shown as "You created order #123"

---

### Case 2: Duplicate Events
**Scenario**: Backend sends same event twice

**Behavior**:
- Deduplicate in database (unique constraint)
- Or track in frontend (avoid duplicate toasts)

---

### Case 3: Real-Time Sync
**Scenario**: User on two tabs, reads notification on Tab 1

**Behavior**:
- Tab 2 doesn't know about read status
- Next poll on Tab 2 sees is_read=true
- UI updates

---

## Related Features

- **Orders**: Notifications for order events
- **Payments**: Notifications for payment events
- **Vendors**: Assignment notifications

---

## Known Issues

- None reported

---

## Last Updated

Generated: 2026-06-02
Related: FLOW_TREE.md (Notification flow)
