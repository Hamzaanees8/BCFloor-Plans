# BC Floor - PROJECT_SCOPE

Business and product specification. Read AI_INDEX.md first.

---

## Core Features

### 1. Authentication & Access Control

**Feature**: Multi-role authentication system

**Purpose**: Secure login for Admins, Agents, Vendors, Co-Agents

**User Roles**:
- **Admin**: Full system access
- **Agent**: Create bookings, manage team, view team orders
- **Co-Agent**: Assist agent, view assigned orders, receive payment split
- **Vendor**: View assigned work, manage availability

**APIs Involved**:
- POST /auth/login
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/reset-password
- GET /auth/me (current user)

**Pages**:
- (auth)/login
- (auth)/forget-password
- (auth)/new-password
- agent/login
- vendor/login

**DB Tables**:
- users
- roles
- permissions
- user_organization_roles

---

### 2. Booking System

**Feature**: Create and manage service bookings

**Purpose**: Allow agents to book flooring services for customers

**User Workflow**:
1. Agent creates order (property, services, date range)
2. System auto-generates slots (one per service)
3. Admin/Agent assigns vendors to slots
4. System calculates travel time + cost
5. Order marked as scheduled
6. Vendor completes work
7. Order marked as completed
8. Invoice generated + sent to vendor

**APIs Involved**:
- POST /orders (create)
- GET /orders (list)
- GET /orders/{id} (detail)
- PUT /orders/{id} (update)
- PUT /orders/{id}/cancel (cancel)
- POST /orders/{id}/assign-vendor (assign)
- POST /orders/{id}/update-slot (reschedule)

**Pages**:
- dashboard/orders
- dashboard/orders/[id]
- dashboard/calendar (visual scheduling)

**DB Tables**:
- orders
- order_services
- order_slots
- properties (customer property info)

**Constraints**:
- Order requires at least one service
- Order requires valid property address
- Slots cannot be in the past
- Vendor availability must be checked before assignment

---

### 3. Services Management

**Feature**: Define and categorize services

**Purpose**: Create service catalog for vendors and agents to use

**Admin Workflow**:
1. Admin creates service (name, description, category)
2. Admin assigns service to vendors (sets hourly rate, time needed)
3. Vendors can accept/decline services
4. Agents use services when creating orders

**APIs Involved**:
- GET /services (list)
- GET /services/{id} (detail)
- POST /services (create)
- PUT /services/{id} (update)
- DELETE /services/{id} (archive)
- POST /vendor-services (assign service to vendor)
- PUT /vendor-services/{id} (update rate/time)

**Pages**:
- dashboard/services
- dashboard/service-category

**DB Tables**:
- services
- service_categories
- vendor_services

**Constraints**:
- Service name must be unique per organization
- Hourly rate must be >= 0
- Time needed must be positive integer
- Service cannot be deleted if used in active orders

---

### 4. Vendor Management

**Feature**: Manage service provider profiles and availability

**Purpose**: Track vendor information, skills, availability, earnings

**Admin/Vendor Workflow**:
1. Admin creates vendor profile (name, company, contact)
2. Vendor adds work addresses
3. Vendor sets work hours (days, times, timezone)
4. Vendor sets service area (optional)
5. Vendor enables/disables services
6. System uses info for scheduling + invoicing

**APIs Involved**:
- GET /vendors (list)
- GET /vendors/{id} (detail)
- POST /vendors (create)
- PUT /vendors/{id} (update profile)
- POST /vendors/{id}/addresses (add address)
- PUT /vendors/{id}/work-hours (set availability)
- PUT /vendors/{id}/settings (update settings)

**Pages**:
- dashboard/vendors
- dashboard/vendors/create
- dashboard/vendors/[id]/profile
- dashboard/vendors/[id]/availability

**DB Tables**:
- vendors
- vendor_addresses
- vendor_work_hours
- vendor_settings
- vendor_services

**Constraints**:
- Vendor must have at least one address
- Work hours must have valid times (end > start)
- Service area coordinates must be valid polygons
- Payment per km must be positive

---

### 5. Agents Management

**Feature**: Manage agents and co-agents

**Purpose**: Track agent teams, payment splits, permissions

**Admin/Agent Workflow**:
1. Admin creates agent (name, company, contact)
2. Agent creates team (adds co-agents)
3. Co-agents get percentage split of orders they help with
4. Agent creates orders, co-agents assist

**APIs Involved**:
- GET /agents (list)
- GET /agents/{id} (detail)
- POST /agents (create)
- PUT /agents/{id} (update)
- POST /agents/{id}/co-agents (add)
- PUT /agents/{id}/co-agents/{coAgentId} (update split)
- DELETE /agents/{id}/co-agents/{coAgentId} (remove)

**Pages**:
- dashboard/agents
- dashboard/agents/create
- dashboard/agents/[id]/team
- dashboard/sub-accounts (co-agent management)

**DB Tables**:
- agents
- co_agents
- agent_teams

**Constraints**:
- Co-agent split must be 0-100%
- Total co-agent splits must not exceed 100%
- Agent must have valid contact info

---

### 6. Scheduling & Calendar

**Feature**: Visual scheduling of appointments

**Purpose**: Agents and vendors view/manage appointments

**User Workflow**:
1. View calendar (day/week/month)
2. See vendor availability (work hours)
3. See assigned orders
4. Drag to reschedule
5. Double-click to edit details

**APIs Involved**:
- GET /orders (filtered by date range)
- GET /vendors/{id}/work-hours
- PUT /orders/{id}/slots/{slotId} (reschedule)

**Pages**:
- dashboard/calendar
- dashboard/calendar/components/BigCalendar.tsx

**Components**:
- BigCalendar (FullCalendar wrapper)
- OrderQuickViewCard (slot details)
- OrderDetailView (full form)
- Schedule (day view)

**Constraints**:
- Cannot reschedule to past dates
- Cannot overlap vendor slots
- Must respect vendor work hours

---

### 7. Payments & Billing

**Feature**: Invoice generation, payment processing, tax calculation

**Purpose**: Track payments, generate vendor invoices, handle multi-agent splits

**Admin/Agent/Vendor Workflow**:
1. Order completed
2. Admin generates invoice from completed order
3. System calculates:
   - Service amounts (sum)
   - Travel costs (distance * km_price)
   - Subtotal = services + travel
   - Tax = subtotal * tax_rate (by vendor location)
   - Total = subtotal + tax
4. If multi-agent: split invoice by co-agent %
5. Send invoice to vendor
6. Vendor receives payment

**APIs Involved**:
- GET /invoices (list)
- GET /invoices/{id} (detail)
- POST /invoices (generate)
- PUT /invoices/{id} (update)
- POST /invoices/{id}/send (send via email)
- POST /invoices/{id}/mark-paid (confirm payment)
- POST /invoices/{id}/download (PDF export)

**Pages**:
- dashboard/billing (admin view)
- dashboard/vendor-billing (vendor view)
- dashboard/invoice/create
- dashboard/invoice/[uuid] (detail + PDF)

**DB Tables**:
- invoices
- payments
- invoice_line_items

**Business Rules**:
1. **Tax Calculation**: Based on vendor's primary address location
   - Canada: GST/HST/QST (5-15.975%)
   - USA: State sales tax (0-7.25%)

2. **Payment Split** (if co-agents):
   - Main agent: 100% - sum(co-agent %)
   - Co-agent 1: split_percentage%
   - Co-agent 2: split_percentage%
   - Example: Main 70%, Co-1 20%, Co-2 10%

3. **Invoice Status**: draft → sent → paid → archived

---

### 8. Notifications

**Feature**: Real-time notifications for system events

**Purpose**: Alert users to important events (orders, payments, assignments)

**Notification Types**:
- `order_created`: New order created
- `order_assigned`: Vendor assigned to order
- `order_completed`: Order marked complete
- `slot_rescheduled`: Appointment date/time changed
- `vendor_assigned`: Vendor assigned to task
- `payment_received`: Payment completed
- `invoice_sent`: Invoice emailed to vendor
- `order_cancelled`: Order cancelled

**APIs Involved**:
- GET /notifications (list)
- GET /notifications (with filters: type, is_read)
- PUT /notifications/{id}/read (mark as read)
- DELETE /notifications/{id} (delete)

**Pages**:
- dashboard/notifications (notification center)

**DB Tables**:
- notifications
- notification_preferences (user's notification settings)

**Constraints**:
- Notifications retained for 30 days
- Users can opt-out of notification types

---

### 9. File Management

**Feature**: Upload, organize, and download files

**Purpose**: Manage property photos, PDFs, contracts, etc.

**User Workflow**:
1. User clicks upload
2. Selects multiple files
3. Files uploaded to S3 in parallel
4. Progress shown in overlay
5. Files appear in file manager
6. User can download or delete

**Upload Process**:
1. Request presigned URLs from backend
2. Upload to S3 directly (client-side)
3. Confirm upload with backend
4. File appears in storage

**APIs Involved**:
- POST /uploads/presigned-urls (get URLs)
- POST /uploads/confirm (confirm upload)
- GET /files (list)
- DELETE /files/{id} (delete)
- POST /downloads (get download URL)

**Pages**:
- dashboard/file-manager

**Components**:
- GlobalUploadProgressOverlay
- GlobalDownloadProgressOverlay
- UploadProgressToast

**DB Tables**:
- uploads
- files

**Constraints**:
- Max 5 concurrent uploads
- Max file size: 100MB
- Allowed types: images, PDFs, docs

---

### 10. White-Label Support

**Feature**: Organization-specific theming and branding

**Purpose**: Support multiple organizations with custom branding

**Organization Settings**:
- Logo, colors, domain
- Email templates
- Notification preferences
- User roles per org

**APIs Involved**:
- GET /organizations (list user's orgs)
- GET /organizations/{id} (details)
- PUT /organizations/{id} (update settings)
- GET /organizations/{id}/theme (branding)

**Pages**:
- dashboard/global-settings (org settings)
- whitelabel/[org_slug] (white-label portal)

**DB Tables**:
- organizations
- organization_settings
- organization_themes

---

## User Roles & Permissions

### Admin Role

**Responsibilities**:
- Manage all users (admins, agents, vendors)
- Configure services and categories
- Monitor all orders across organization
- Access financial reports
- Manage system settings
- Create organizations (multi-tenant)

**Permissions**:
- VIEW_ALL_ORDERS, CREATE_ORDERS, EDIT_ORDERS
- CREATE_VENDOR, UPDATE_VENDOR, VIEW_VENDOR
- CREATE_AGENT, VIEW_AGENT
- CREATE_ADMIN, VIEW_ADMIN
- CREATE_SERVICES, VIEW_SERVICES
- ACCESS_BILLING, ACCESS_VENDOR_BILLING
- SET_DISCOUNTS, PRINT_REQUESTS
- CREATE_TOUR_SETTINGS
- CREATE_LISTING, VIEW_LISTING

**Restrictions**:
- None (full access)

---

### Agent Role

**Responsibilities**:
- Create bookings for customers
- Manage team (co-agents)
- View team orders only
- Manage customer properties
- Generate invoices for team work
- Track earnings

**Permissions**:
- CREATE_ORDERS, EDIT_ORDERS
- VIEW_ORDERS (team scope)
- VIEW_VENDORS (list for assignment)
- BOOK_APPOINTMENTS
- ACCESS_BILLING
- CREATE_SUB_ACCOUNTS (add co-agents)
- CREATE_LISTING, VIEW_LISTING
- CREATE_TOUR_SETTINGS

**Restrictions**:
- Cannot view other agents' orders
- Cannot create/edit vendors
- Cannot access system settings
- Cannot view admin panel

---

### Co-Agent Role

**Responsibilities**:
- Assist agent with bookings
- View assigned orders only
- Receive payment split for work
- Track personal earnings

**Permissions**:
- VIEW_ORDERS (personal scope)
- VIEW_ONLY_ORDERS_FOR_CO_AGENT
- BOOK_APPOINTMENTS
- CREATE_LISTING, VIEW_LISTING

**Restrictions**:
- Cannot create orders
- Cannot view other team members' orders
- Cannot manage vendors
- Read-only access to most features

---

### Vendor Role

**Responsibilities**:
- View assigned work
- Manage availability (work hours)
- Manage service area
- Confirm job completion
- Track earnings and payments

**Permissions**:
- VIEW_APPOINTMENTS (assigned scope)
- VIEW_ONLY_APPOINTMENTS_FOR_CO_AGENT (personal)
- ACCESS_VENDOR_BILLING (view invoices)
- VIEW_SERVICES (offered by vendor)

**Restrictions**:
- Cannot create orders
- Cannot view other vendors' work
- Cannot manage vendors
- Cannot access admin functions

---

## Functional Requirements

### Order Management

1. **Create Order**:
   - Agent inputs: property address, customer contact, services (date/time preferred)
   - System validates: address not empty, services selected
   - System creates: Order (status=pending) + Slot placeholders
   - Save to DB

2. **Assign Vendors**:
   - Admin/Agent selects vendor for each slot
   - System validates: vendor available, vendor offers service, no time conflicts
   - System calculates: travel distance, travel cost
   - System updates: Slot with vendor_id + travel info
   - Status: pending → scheduled

3. **Reschedule Slot**:
   - Admin/Agent selects new date/time
   - System validates: no conflicts, after current time
   - System recalculates: travel (if vendor location changed)
   - System updates: Slot with new date/time
   - Notification sent to vendor

4. **Complete Order**:
   - Vendor marks order complete
   - Status: scheduled → completed
   - Notification sent to agent
   - Order ready for invoicing

5. **Cancel Order**:
   - Any role can cancel (with permission)
   - Status: any → cancelled
   - Notification sent to all parties
   - No invoice generated

### Service Management

1. **Create Service**:
   - Admin creates service (name, category, description)
   - System validates: name unique, category exists
   - Save to DB

2. **Assign to Vendor**:
   - Admin links service to vendor (sets rate + time)
   - System validates: rate > 0, time > 0
   - Vendor can accept/decline
   - Save to vendor_services

3. **Edit Service**:
   - Admin/Vendor can update (rate, availability)
   - System validates: rate > 0
   - System prevents: changes to active orders

### Vendor Management

1. **Create Vendor**:
   - Admin creates vendor profile
   - System auto-creates user account
   - System sends invite email
   - Vendor completes profile

2. **Update Availability**:
   - Vendor sets work hours (days, times, timezone)
   - Vendor sets break times
   - Vendor sets service area (optional)
   - System saves: work_hours + settings

3. **Add Service Area**:
   - Vendor defines service area polygon (coordinates)
   - System validates: valid polygon
   - System saves: service_area geometry
   - Optional: force_service_area flag

### Agent Management

1. **Create Agent**:
   - Admin creates agent profile
   - System auto-creates user
   - System sends invite
   - Agent onboards

2. **Add Co-Agent**:
   - Agent adds team member
   - Sets split percentage
   - System validates: split 0-100%, total ≤ 100%
   - Co-agent gets notifications

### Billing & Invoicing

1. **Generate Invoice**:
   - Admin initiates invoice creation for completed order
   - System calculates:
     - Subtotal = Σ service amounts + Σ travel costs
     - Tax = subtotal * tax_rate (by vendor location)
     - Total = subtotal + tax
   - If multi-vendor: create separate invoices per vendor
   - If co-agents: split total by percentage
   - Save to DB, status=draft

2. **Send Invoice**:
   - Admin sends invoice to vendor (via email)
   - System uses email template
   - Status: draft → sent

3. **Mark Paid**:
   - Admin confirms payment received
   - Status: sent → paid
   - Notification sent to all parties

4. **Download Invoice**:
   - User requests PDF export
   - System generates PDF (invoice details)
   - User downloads file

---

## Business Constraints

1. **Order Requirements**:
   - Must have at least 1 service
   - Must have valid property address
   - Date must be in future
   - Cannot have overlapping slots for same vendor

2. **Vendor Requirements**:
   - Must have valid company name + contact
   - Must have at least 1 address
   - Must have work hours defined
   - Must have at least 1 service assigned

3. **Agent Requirements**:
   - Must have company name
   - Must have valid contact info
   - Co-agent splits must sum ≤ 100%

4. **Payment Requirements**:
   - Cannot invoice pending/scheduled orders
   - Cannot reinvoice completed orders
   - Tax rate determined by vendor location only
   - Cannot modify invoice after paid

5. **Financial Constraints**:
   - Amounts stored as strings (not float) to avoid precision loss
   - Tax calculated at invoice time only
   - Travel costs recalculated if vendor changes

---

## Edge Cases

1. **Multi-Vendor Order**:
   - One order, multiple services, multiple vendors
   - Each vendor gets separate slot + travel calculation
   - One invoice or multiple? (spec: multiple, one per vendor)

2. **Co-Agent Payment Split**:
   - Agent 70%, Co-Agent1 20%, Co-Agent2 10%
   - Order amount $1000, tax 5% = $1050 total
   - Agent: $735, Co-Agent1: $210, Co-Agent2: $105

3. **Service Area Conflict**:
   - Vendor has service area restriction
   - Customer location outside area
   - System prevents assignment OR shows warning?
   - (Spec: Show warning, allow override)

4. **Travel Time Exceeds Work Hours**:
   - Vendor work ends at 5pm
   - Slot ends at 4:30pm, travel back takes 45 min
   - System calculates vendor available until 5:00pm
   - Should be flagged? (Spec: Yes, show warning)

5. **No Vendor Available**:
   - All vendors have conflicts for requested slot
   - System shows "No available vendors"
   - Admin can force assign anyway
   - (Spec: Allow with confirmation)

6. **Duplicate Order**:
   - Same customer, same service, same date
   - Should prevent or warn? (Spec: Warn only)

---

## Future Expansion Areas

1. **API Integrations**:
   - Slack notifications
   - Calendar sync (Google, Outlook)
   - Payment gateway integration (Stripe, Square)
   - SMS notifications

2. **Advanced Scheduling**:
   - Route optimization (vendor multi-stop routes)
   - Auto-scheduling (system assigns best vendor)
   - Recurring bookings
   - Waiting lists + auto-reschedule

3. **Mobile App**:
   - Vendor mobile app (view jobs, confirm completion, photos)
   - Customer app (track service, rate, pay)
   - Agent app (create orders on-site)

4. **Reporting & Analytics**:
   - Vendor earnings reports
   - Customer satisfaction surveys
   - Travel cost analysis
   - Service utilization metrics

5. **AI Features**:
   - Auto-scheduling (best vendor match)
   - Pricing recommendations
   - Demand forecasting
   - Churn prediction

---

## Last Updated

Generated: 2026-06-02
Review: When adding new features or changing business rules
