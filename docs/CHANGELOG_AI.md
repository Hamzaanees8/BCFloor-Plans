# BC Floor - CHANGELOG_AI

Version history and meaningful code changes. Read AI_INDEX.md first.

---

## Version 0.1.0 (Initial Release)

### Release Date: 2026-06-02

### Features

#### 1. Multi-Portal Routing (Admin/Agent/Vendor)
- **What**: Domain-based portal detection and routing
- **Why**: Support three distinct user experiences from single codebase
- **Files**:
  - `middleware.ts`: Domain detection, route rewriting
  - `app/layout.tsx`: Context providers setup
  - `app/context/AppContext.tsx`: Global app state
- **Notes**: Uses Next.js middleware for non-blocking detection

#### 2. Authentication System
- **What**: JWT-based multi-role authentication
- **Why**: Secure access control for three user types
- **Files**:
  - `app/(auth)/login/page.tsx`: Login form
  - `app/(auth)/forget-password/page.tsx`: Password reset
  - `lib/api.ts`: Axios interceptor with auth header
  - `lib/permissions.ts`: Permission checking helpers
- **APIs**:
  - POST /auth/login
  - POST /auth/logout
  - POST /auth/forgot-password
- **Notes**: JWT stored in localStorage, expires on 401

#### 3. Dashboard & Calendar
- **What**: Visual appointment scheduling with BigCalendar
- **Why**: Intuitive order/slot management
- **Files**:
  - `app/dashboard/calendar/page.tsx`: Calendar page
  - `app/dashboard/calendar/components/BigCalendar.tsx`: FullCalendar wrapper
  - `app/dashboard/calendar/components/Schedule.tsx`: Day view
  - `app/dashboard/calendar/components/OrderDetailView.tsx`: Order form
  - `app/dashboard/calendar/components/OrderQuickViewCard.tsx`: Quick preview
- **Features**:
  - Month/week/day views
  - Drag to reschedule
  - Double-click to edit
  - Vendor work hours overlay
  - Travel time visualization
- **Dependencies**: @fullcalendar/react, react-big-calendar

#### 4. Order Management
- **What**: Create, view, edit, delete orders
- **Why**: Core booking system
- **Files**:
  - `app/dashboard/orders/page.tsx`: Orders list (DataTable)
  - `app/dashboard/orders/[id]/page.tsx`: Order detail
  - `app/dashboard/orders/context/OrderContext.tsx`: Order form state
  - `components/DataTable.tsx`: Universal table component
- **APIs**:
  - GET /orders (list)
  - GET /orders/{id} (detail)
  - POST /orders (create)
  - PUT /orders/{id} (update)
  - DELETE /orders/{id} (cancel)
  - POST /orders/{id}/assign-vendor (assign)
- **Features**:
  - Multi-service orders
  - Vendor assignment
  - Auto travel calculation
  - Status tracking (pending → scheduled → completed → invoiced)
  - Co-agent split support

#### 5. Vendor Management
- **What**: Create, view, edit vendor profiles
- **Why**: Track service providers and their availability
- **Files**:
  - `app/dashboard/vendors/page.tsx`: Vendors list
  - `app/dashboard/vendors/[id]/page.tsx`: Vendor detail
  - `app/dashboard/vendors/create/page.tsx`: Vendor creation
  - `components/WorkHours.tsx`: Work hours editor
  - `components/MapsPolygonEditor.tsx`: Service area editor
- **APIs**:
  - GET /vendors (list)
  - GET /vendors/{id} (detail)
  - POST /vendors (create)
  - PUT /vendors/{id} (update)
  - POST /vendors/{id}/addresses (add address)
  - PUT /vendors/{id}/work-hours (set availability)
  - PUT /vendors/{id}/settings (update settings)
- **Features**:
  - Multiple addresses
  - Work hours with breaks
  - Service area polygons (Google Maps)
  - Service assignment with rates
  - Commute time configuration
  - Settings (payment_per_km, service area enforcement)

#### 6. Services Management
- **What**: Define services and assign to vendors
- **Why**: Build service catalog for orders
- **Files**:
  - `app/dashboard/services/page.tsx`: Services list
  - `app/dashboard/services/[id]/page.tsx`: Service detail
  - `app/dashboard/service-category/page.tsx`: Category management
  - `components/ServiceItem.tsx`: Service display
- **APIs**:
  - GET /services (list)
  - GET /services/{id} (detail)
  - POST /services (create)
  - PUT /services/{id} (update)
  - POST /vendor-services (assign)
  - PUT /vendor-services/{id} (update rate)
- **Features**:
  - Service categories
  - Pricing by vendor (hourly rate)
  - Time estimates
  - Service thumbnails
  - Custom colors

#### 7. Agent Management
- **What**: Create agents and manage co-agents
- **Why**: Support team structures with payment splits
- **Files**:
  - `app/dashboard/agents/page.tsx`: Agents list
  - `app/dashboard/agents/[id]/page.tsx`: Agent detail
  - `app/dashboard/sub-accounts/page.tsx`: Co-agent management
  - `components/AddCoAgentDialog.tsx`: Add team member
- **APIs**:
  - GET /agents (list)
  - GET /agents/{id} (detail)
  - POST /agents (create)
  - PUT /agents/{id} (update)
  - POST /agents/{id}/co-agents (add)
  - PUT /agents/{id}/co-agents/{id} (update split)
- **Features**:
  - Multi-agent teams
  - Payment split percentages
  - Team member removal
  - Earnings tracking

#### 8. Billing & Invoicing
- **What**: Generate invoices with auto tax calculation
- **Why**: Vendor payment management
- **Files**:
  - `app/dashboard/billing/page.tsx`: Invoices list (admin)
  - `app/dashboard/vendor-billing/page.tsx`: Invoices list (vendor)
  - `app/dashboard/invoice/create/page.tsx`: Invoice creation
  - `app/dashboard/invoice/[uuid]/page.tsx`: Invoice detail + PDF
  - `app/dashboard/invoice/components/InvoicePdfDocument.tsx`: PDF generation
  - `lib/taxCalculator.ts`: Tax calculation by location
- **APIs**:
  - GET /invoices (list)
  - GET /invoices/{id} (detail)
  - POST /invoices (generate)
  - PUT /invoices/{id} (update)
  - POST /invoices/{id}/send (email)
  - POST /invoices/{id}/mark-paid (confirm payment)
- **Features**:
  - Auto tax calculation (Canada: GST/HST/QST, USA: State tax)
  - Travel cost inclusion
  - Multi-vendor splitting
  - Co-agent payment split
  - PDF export
  - Email delivery
  - Status tracking (draft → sent → paid)

#### 9. File Management (S3 Uploads)
- **What**: Upload files to S3 with progress tracking
- **Why**: Store property photos, documents
- **Files**:
  - `app/dashboard/file-manager/page.tsx`: File browser
  - `lib/upload/s3-service.ts`: 3-step upload process
  - `context/GlobalFileUploadContext.tsx`: Upload queue
  - `context/UploadQueueContext.tsx`: Progress tracking
  - `components/upload/GlobalUploadProgressOverlay.tsx`: UI
  - `components/upload/UploadProgressToast.tsx`: Toast feedback
- **APIs**:
  - POST /uploads/presigned-urls (get URLs)
  - POST /uploads/confirm (confirm upload)
  - GET /files (list)
  - DELETE /files/{id} (delete)
  - POST /downloads (get download URL)
- **Features**:
  - Presigned URL flow (direct to S3)
  - Parallel uploads (3 concurrent)
  - Progress tracking (per-file)
  - Batch operations
  - File organization

#### 10. Notifications
- **What**: Real-time notifications for order/payment events
- **Why**: Keep users informed
- **Files**:
  - `app/dashboard/notifications/page.tsx`: Notification center
  - `context/UserContext.tsx`: Notification subscription
  - `components/Header.tsx`: Notification bell icon
- **APIs**:
  - GET /notifications (list with pagination)
  - PUT /notifications/{id}/read (mark read)
  - DELETE /notifications/{id} (delete)
- **Features**:
  - Order lifecycle notifications
  - Payment confirmations
  - Vendor assignments
  - Appointment changes
  - Mark read
  - Clear all
  - Notification history

#### 11. Tax Calculation Engine
- **What**: Automatic tax rate lookup by location
- **Why**: Vendor invoicing accuracy
- **Files**:
  - `lib/taxCalculator.ts`: Tax rates by province/state
- **Features**:
  - Canada: GST (5%), HST (13-15%), QST (14.975%)
  - USA: State-by-state rates (0-7.25%)
  - Automatic rate selection based on vendor address
- **Notes**: Tax applied at invoice generation time

#### 12. Batch Travel Calculation
- **What**: Google Maps batch distance matrix (vs N sequential calls)
- **Why**: Optimize API usage for multi-stop orders
- **Files**:
  - `lib/batchTravelCalculator.ts`: Batch API caller
- **Features**:
  - Deduplication of addresses
  - Single API call for all legs
  - Handles partial failures
  - Returns total distance + per-leg costs
- **Impact**: 75% reduction in API calls for multi-stop orders

#### 13. White-Label Support
- **What**: Multi-organization support with custom theming
- **Why**: Support franchise/partnership models
- **Files**:
  - `app/whitelabel/[org_slug]/page.tsx`: White-label portal
  - `app/context/OrganizationContext.tsx`: Org state
  - `app/context/Whitelabel.tsx`: Theme management
  - `components/WhiteLabelSettings.tsx`: Brand settings
  - `components/WhitelabelLogo.tsx`: Logo display
- **Features**:
  - Organization-specific branding
  - Custom logo/colors
  - Subdomain support
  - Organization isolation

#### 14. Virtual Tours
- **What**: MatterPort/photo gallery integration
- **Why**: Property visualization
- **Files**:
  - `app/agent/tours/page.tsx`: Tours management
  - `app/tour/PublicTour.tsx`: Public tour view
  - `components/DYnamicMap.tsx`: Location visualization
- **Features**:
  - Tour creation
  - Photo galleries
  - MatterPort embedding (if available)
  - Public sharing

#### 15. Admin Panel
- **What**: User management, permissions, settings
- **Why**: System administration
- **Files**:
  - `app/dashboard/admin/page.tsx`: Admin panel
  - `app/dashboard/global-settings/page.tsx`: System settings
  - `components/AdminForm.tsx`: Admin CRUD
  - `components/GlobalSettings.tsx`: Settings form
- **Features**:
  - Create/edit admins
  - Permission assignment
  - Role management
  - Email template configuration
  - Notification settings

### Business Logic

#### Order Status Workflow
```
pending (created)
    ↓
scheduled (vendors assigned)
    ↓
completed (service finished)
    ↓
invoiced (invoice generated)
    ↓
paid (payment received)

Alternative: cancelled (any point)
```

#### Tax Calculation
- Base location: Vendor's primary address province/state
- Tax rate: Pre-configured per province (Canada) or state (USA)
- Applied at: Invoice generation time
- Can be: GST, HST, QST, Sales Tax

#### Travel Cost Calculation
- Distance API: Google Maps Distance Matrix (batched)
- Rate: Vendor's payment_per_km from settings
- Applied to: Each leg of vendor's route
- Included in: Invoice subtotal

#### Payment Split (Co-Agents)
- Base amount: Invoice total (including tax)
- Main agent: 100% - Σ(co-agent %)
- Co-agent X: amount * (co_agent_split% / 100)
- Each gets: Separate payment record

### Dependencies

**Major**:
- next@15.1.8
- react@19
- @radix-ui/* (form components)
- @tanstack/react-table (data tables)
- @fullcalendar/react (scheduling)
- axios (API calls)
- tailwindcss@3.4.1

**Utilities**:
- date-fns@4.1.0 (date handling)
- luxon@3.6.1 (timezone)
- lucide-react@0.511.0 (icons)
- sonner@2.0.5 (toasts)
- clsx@2.1.1 (class names)

**File Upload**:
- aws-sdk (implicit via S3 URLs)
- html2canvas@1.4.1 (screenshot)

**Email/Export**:
- jspdf@3.0.1 (PDF generation)
- nodemailer@7.0.3 (email, backend only)

### Fixes & Improvements

#### None in initial release (first version)

---

## Known Issues

### Critical
- None reported

### High
- None reported

### Medium
- None reported

### Low
- None reported

---

## Breaking Changes

### None in initial release

---

## Performance Metrics

| Metric | Value | Status |
|--------|-------|--------|
| Google Maps API calls (multi-stop) | 1 (batched) | ✅ Optimized |
| Upload concurrency | 3 files | ✅ Configurable |
| Table page size | 20 rows | ✅ Configurable |
| Auth token check | On 401 | ✅ Automatic |

---

## Database Changes

### Initial Schema
All tables created on backend:
- users, organizations, roles, permissions
- agents, co_agents, vendors, services
- orders, order_services, order_slots
- invoices, payments
- notifications, audit_logs
- uploads, files

### Migrations
- None in this version

---

## API Changes

### New Endpoints
All endpoints listed in PROJECT_CONTEXT.md

### Deprecated
- None

### Changed
- None

---

## Environment Variables

### Added
- NEXT_PUBLIC_API_URL (backend base URL)
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY (Google Maps)

### Removed
- None

---

## Documentation

### Added
- docs/AI_INDEX.md (entry point)
- docs/PROJECT_CONTEXT.md (technical reference)
- docs/PROJECT_SCOPE.md (business spec)
- docs/FLOW_TREE.md (system flows)
- docs/DECISIONS.md (architecture decisions)
- docs/CHANGELOG_AI.md (this file)
- docs/modules/*.md (feature documentation)

---

## Testing

### Unit Tests
- None in initial release

### Integration Tests
- None in initial release

### E2E Tests
- None in initial release

### Manual Testing Checklist
- [ ] Login (all portals)
- [ ] Create order
- [ ] Assign vendor
- [ ] Reschedule appointment
- [ ] Generate invoice
- [ ] Upload file
- [ ] View notifications

---

## Deployment Notes

### Database
- Run backend migrations first
- Ensure all tables created

### Environment
- Set NEXT_PUBLIC_API_URL to backend
- Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY for Maps
- Configure S3 bucket CORS
- Set up DNS for three subdomains

### Build
```bash
npm run build  # Compiles TypeScript, bundles assets
npm run start  # Starts production server
```

### Monitoring
- Monitor API response times
- Track S3 upload success rate
- Log 401 auth failures

---

## Roadmap (Future)

### Phase 2
- [ ] Auto-scheduling (suggest best vendor)
- [ ] Recurring bookings
- [ ] Route optimization
- [ ] Mobile app (vendor)
- [ ] SMS notifications

### Phase 3
- [ ] Payment gateway integration (Stripe)
- [ ] Calendar sync (Google, Outlook)
- [ ] Advanced reporting
- [ ] Customer portal
- [ ] AI pricing recommendations

---

## Last Updated

Generated: 2026-06-02
Next Review: 2026-07-02
