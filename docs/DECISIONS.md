# BC Floor - DECISIONS

Architectural decisions and reasoning. Read AI_INDEX.md first.

---

## Architecture Decisions

### 1. Multi-Portal Routing via Middleware (Admin/Agent/Vendor)

**Decision**: Use Next.js middleware to route requests based on domain

**Rationale**:
- Single codebase reduces duplication
- Three distinct user experiences (Admin, Agent, Vendor)
- Different URLs point to same backend but different frontends
- Example:
  - `admin.bcfloorplans.com` → Admin portal
  - `agents.bcfloorplans.com` → Agent portal
  - `vendors.bcfloorplans.com` → Vendor portal

**Implementation**:
- `middleware.ts`: Detects hostname, determines portal type
- Routes rewritten: `/login` → `/agent/login` or `/vendor/login`
- Shared routes: `/dashboard`, `/tour`, `/whitelabel` (no rewrite)
- Fallback: Domain keywords (if API detection fails)

**Alternative Considered**:
- Separate Next.js projects per portal (rejected: maintenance overhead)
- Role-based UI toggling (rejected: harder to enforce access)

**Impact**:
- ✅ Efficient deployment (one build artifact)
- ✅ Easier permission enforcement
- ⚠️ Slightly more complex middleware logic
- ⚠️ Requires DNS setup for three subdomains

**Modified**: Never (core decision)
**Owner**: Architecture team

---

### 2. React Context Instead of Redux for State Management

**Decision**: Use React Context API for global state (UserContext, AppContext, etc.)

**Rationale**:
- Current app state is relatively simple (user, auth, notifications)
- No complex state transformations or time-travel debugging needed
- Context is built into React, no extra dependencies
- Smaller bundle size (Redux adds ~30KB)
- Easier to understand for new developers

**Implementation**:
- `app/context/UserContext.tsx`: User + permissions state
- `app/context/AppContext.tsx`: App-wide state (theme, nav)
- `app/context/OrderContext.tsx`: Order creation form state
- `context/GlobalFileUploadContext.tsx`: Upload queue
- `context/GlobalDownloadContext.tsx`: Download queue

**Pattern**:
```typescript
// Provider wraps tree
<UserProvider>
  <AppProvider>
    <OrderProvider>
      {children}
    </OrderProvider>
  </AppProvider>
</UserProvider>

// Component consumes
const { user, permissions } = useContext(UserContext);
```

**Alternative Considered**:
- Redux (rejected: overkill for current scope)
- Zustand (rejected: more complex than needed)
- MobX (rejected: less familiar to team)

**Impact**:
- ✅ Smaller bundle
- ✅ Easier debugging
- ✅ Less boilerplate
- ⚠️ Performance warnings if context re-renders too often
- ⚠️ Callback hell if deeply nested

**Modified**: Ongoing (may add Zustand if state grows)
**Owner**: Frontend team

**Optimization Notes**:
- Use useMemo() to prevent unnecessary re-renders
- Split contexts by domain (don't make one mega-context)
- Use custom hooks (useUser(), useOrder()) for cleaner consumption

---

### 3. TanStack React Table for DataTables

**Decision**: Use @tanstack/react-table (headless table library) instead of UI table

**Rationale**:
- Headless = full control over rendering
- Highly customizable columns, sorting, pagination
- Works great with Tailwind CSS
- Powerful filtering and grouping
- Used by every order/vendor/service list

**Implementation**:
- `components/DataTable.tsx`: Wrapper component
- Column definitions per feature (Order columns, Vendor columns)
- TanStack state management (sorting, pagination, filtering)
- Radix UI for dialog/dropdown interactions

**Pattern**:
```typescript
const columns: ColumnDef[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    cell: ({ row }) => row.getValue('id')
  },
  {
    id: 'actions',
    cell: ({ row }) => <DropdownActions row={row} />
  }
];

<DataTable columns={columns} data={orders} />
```

**Alternative Considered**:
- Material-UI Table (rejected: heavy, coupled styling)
- Chakra Table (rejected: learning curve)
- HTML table (rejected: no sorting/pagination features)

**Impact**:
- ✅ Flexible and powerful
- ✅ Great DX
- ⚠️ Requires custom CSS (Tailwind handles this well)
- ⚠️ Learning curve for new devs

**Modified**: Never (solid choice)
**Owner**: Frontend team

---

### 4. Radix UI for Base Components

**Decision**: Use @radix-ui for primitive components (Button, Dialog, Dropdown, etc.)

**Rationale**:
- Accessible by default (ARIA labels, focus management)
- Headless = works with any CSS framework
- Paired with Tailwind CSS for styling
- Used by industry leaders (Vercel, Stripe, GitHub)
- Not opinionated about design

**Implementation**:
- `components/ui/`: Wrapper components (Button, Dialog, Select, etc.)
- Each wraps Radix primitive with Tailwind classes
- Consistent design system across app

**Example**:
```typescript
// components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
```

**Alternative Considered**:
- Material-UI (rejected: opinionated, heavy)
- Chakra (rejected: heavier bundle)
- Headless UI (rejected: less accessible)

**Impact**:
- ✅ Accessible by default
- ✅ Lightweight
- ✅ Professional UI
- ⚠️ Must pair with CSS framework (Tailwind)
- ⚠️ Requires custom styling

**Modified**: Never (excellent choice)
**Owner**: Frontend team

---

### 5. Batch Google Maps API Calls (Instead of Sequential)

**Decision**: Calculate all travel distances in ONE API call instead of N calls

**Rationale**:
- Multi-stop orders would cause 3-4+ API calls (expensive)
- Google Maps DistanceMatrix supports batch mode
- Reduced API quota usage by 75%+ for multi-stop orders
- Better performance (parallel instead of sequential)

**Problem Scenario**:
```
Order has 3 services from same vendor:
  Service 1: 8am, Location A
  Service 2: 10am, Location B
  Service 3: 2pm, Location C

Travel legs:
  1. Vendor office → Location A (15 km)
  2. Location A → Location B (8 km)
  3. Location B → Location C (6 km)
  4. Location C → Vendor office (12 km)

OLD APPROACH: 4 separate Google Maps API calls
NEW APPROACH: 1 batched API call
```

**Implementation**: `lib/batchTravelCalculator.ts`
```typescript
interface TravelLeg {
  from: string;        // origin address
  to: string;          // destination address
  legIndex: number;    // sequence
}

async function batchCalculateTravelCosts(legs: TravelLeg[]): Promise<BatchTravelResult>
```

**Alternative Considered**:
- Sequential calls (rejected: expensive, slow)
- Cache distances (rejected: doesn't solve N+1)
- Approximation formula (rejected: inaccurate)

**Impact**:
- ✅ 75% reduction in API calls
- ✅ Faster calculations
- ✅ Lower costs
- ✅ Better UX (faster response)
- ⚠️ Slightly more complex code
- ⚠️ Requires deduplication logic

**Modified**: Never (excellent optimization)
**Owner**: Backend integration team

**Optimization Notes**:
- Deduplicates addresses before API call
- Handles partial failures gracefully
- Logs warnings if Google Maps unavailable

---

### 6. S3 Presigned URLs for File Uploads

**Decision**: Use presigned URLs to upload directly to S3 (not through backend)

**Rationale**:
- Client uploads directly to S3 (no backend bandwidth)
- Faster uploads (direct to CDN)
- Backend doesn't need to handle multipart
- Easier to track progress (XMLHttpRequest)
- Secure (presigned URL expires in 1 hour)

**3-Step Process**:
```
1. Request presigned URLs: POST /uploads/presigned-urls
2. Upload to S3: PUT presigned_url (client-side, direct)
3. Confirm upload: POST /uploads/confirm (backend marks complete)
```

**Implementation**: `lib/upload/s3-service.ts`
- `getPresignedUrls()`: Request from backend
- `uploadToS3()`: Upload using XMLHttpRequest (progress tracking)
- `confirmUpload()`: Tell backend upload complete

**Concurrency**: Max 3 concurrent uploads (to avoid overwhelming browser)

**Alternative Considered**:
- Upload through backend (rejected: wastes bandwidth, slower)
- Base64 encoding (rejected: 33% larger payload)
- Multipart form data (rejected: complex to manage)

**Impact**:
- ✅ Faster uploads
- ✅ Better UX (progress tracking)
- ✅ Lower backend load
- ✅ Scalable (S3 handles traffic)
- ⚠️ Requires CORS configuration on S3 bucket
- ⚠️ Presigned URL expiration must be handled

**Modified**: Never (excellent choice)
**Owner**: DevOps + Backend team

**Security Notes**:
- Presigned URLs expire after 1 hour
- URL includes file key (prevents guessing)
- S3 bucket only accepts from app domain

---

### 7. JWT in localStorage for Authentication

**Decision**: Store JWT token in localStorage (not httpOnly cookie)

**Rationale**:
- Works with SPA architecture
- Simpler implementation (no cookie handling)
- Can be included in Authorization header easily
- Works across subdomains (all portals)

**Flow**:
```
1. POST /auth/login → returns JWT
2. localStorage.setItem("token", jwt)
3. All requests: GET /orders (headers: Authorization: Bearer jwt)
4. 401 response → clear localStorage, redirect to login
```

**Implementation**: `lib/api.ts`
```typescript
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```

**Alternative Considered**:
- httpOnly cookies (rejected: more complex, CSRF protection needed)
- Session tokens (rejected: stateful server-side)
- API keys (rejected: less secure)

**Impact**:
- ✅ Simpler implementation
- ✅ Works across subdomains
- ✅ SPA-friendly
- ⚠️ Vulnerable to XSS attacks (if site gets XSSed)
- ⚠️ Requires Content-Security-Policy headers

**Modified**: Acceptable (not ideal for financial apps, OK for B2B service app)
**Owner**: Security team

**Mitigation**:
- Content-Security-Policy headers (block inline scripts)
- Input sanitization (prevent XSS)
- Regular security audits
- Token refresh on expire (short expiry times)

---

### 8. TypeScript Strict Mode

**Decision**: Enable strict TypeScript compilation

**Rationale**:
- Catch errors at compile time (not runtime)
- Better IDE autocomplete
- Self-documenting code
- Reduces bugs in production

**Config** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

**Impact**:
- ✅ Fewer runtime errors
- ✅ Better developer experience
- ✅ Self-documenting
- ⚠️ More verbose code
- ⚠️ Longer compilation time

**Modified**: Never (best practice)
**Owner**: Backend team

---

### 9. Middleware-Based Portal Routing

**Decision**: Use Next.js middleware to detect domain and route to correct portal

**Flow**:
```
1. Request comes in to admin.bcfloorplans.com
2. middleware.ts runs
3. Detects hostname → portal_type = "admin"
4. Rewrites to /admin/* routes
5. Admin portal loads

Alternative: /admin/*, /agent/*, /vendor/* path-based
Rejected: Requires user to know their path
```

**Implementation**: `middleware.ts`
```typescript
export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host');
  const portalType = guessPortalTypeFromHostname(hostname);
  
  if (portalType === 'agent') {
    // Rewrite /login → /agent/login
    return NextResponse.rewrite(new URL(`/agent${pathname}`, request.url));
  }
}
```

**Alternative Considered**:
- Path-based routing (rejected: less elegant)
- Subdomain-based routing (implemented this way)
- Environment variables (rejected: not dynamic)

**Impact**:
- ✅ Clean user experience (admin.domain.com = admin portal)
- ✅ No path confusion
- ✅ Can easily add new portals
- ⚠️ Requires DNS setup

**Modified**: Never (excellent UX)
**Owner**: Devops team

---

### 10. Order Status Workflow (Pending → Scheduled → Completed → Invoiced)

**Decision**: Define strict order status progression

**Status Flow**:
```
pending (just created)
    ↓
    (Admin assigns vendors)
    ↓
scheduled (vendors assigned, awaiting execution)
    ↓
    (Service completed by vendor)
    ↓
completed (ready for invoicing)
    ↓
    (Admin generates invoice)
    ↓
invoiced (invoice sent to vendor)
    ↓
    (Payment received)
    ↓
paid (final state)

Alternative paths:
cancelled (at any point)
```

**Rationale**:
- Clear state machine prevents data inconsistencies
- Permissions enforced per status (can only do X in status Y)
- Audit trail shows progression
- Prevents accidental skips (e.g., invoice unpaid order)

**Constraints**:
- Cannot go backwards (cannot un-schedule)
- Cannot modify amounts after invoiced
- Cannot delete if not pending

**Impact**:
- ✅ Data integrity
- ✅ Predictable system
- ⚠️ Less flexible (cannot handle edge cases easily)
- ⚠️ Requires status change migrations

**Modified**: Never (solid design)
**Owner**: Product team

---

### 11. Tax Calculation by Vendor Location (Not Customer)

**Decision**: Tax rate determined by VENDOR's province, not customer's

**Rationale**:
- Vendor performs service (liable for tax)
- Vendor location determines which jurisdiction
- Simplifies multi-province operations
- Matches accounting standards

**Example**:
```
Customer in BC, Vendor in ON
→ Vendor's location (ON) used
→ Tax rate = 13% (ON HST)
```

**Implementation**: `lib/taxCalculator.ts`
```typescript
const vendor = await getVendor(vendor_id);
const taxInfo = getTaxRateByLocation(
  vendor.addresses[0].province,
  vendor.addresses[0].country
);
const tax_amount = subtotal * (taxInfo.rate / 100);
```

**Alternative Considered**:
- Customer location (rejected: wrong jurisdiction)
- Highest rate (rejected: unfair)
- Fixed rate (rejected: not legal)

**Impact**:
- ✅ Legally compliant
- ✅ Accurate tax calculation
- ⚠️ If vendor multi-province, must use primary address

**Modified**: Never (correct implementation)
**Owner**: Finance team

---

## Decisions Pending Resolution

### A. Should we add auto-scheduling?

**Options**:
1. Manual assignment only (current)
2. Suggest vendors based on location/availability
3. Auto-assign best vendor (complex algorithm)

**Considerations**:
- Benefit: Faster order processing
- Cost: Complex optimization logic
- Risk: Wrong vendor assignments

**Decision**: TBD (requires product team input)

---

### B. Should we support recurring bookings?

**Options**:
1. No (current)
2. Simple repeat (weekly/monthly)
3. Complex recurrence (with exceptions)

**Considerations**:
- Benefit: Reduce customer friction
- Cost: Complicates order logic
- Risk: Maintenance overhead

**Decision**: TBD (backlog feature)

---

### C. Should we add route optimization?

**Options**:
1. No (current)
2. Google Maps Directions API (suggest route)
3. TSP solver (optimal route)

**Considerations**:
- Benefit: Reduce travel time
- Cost: Additional API calls
- Risk: Over-engineering

**Decision**: TBD (nice-to-have)

---

## Decision Log

| Date | Decision | Status | Owner |
|------|----------|--------|-------|
| 2026-01-15 | Multi-portal routing via middleware | ✅ Approved | Arch |
| 2026-01-15 | React Context vs Redux | ✅ Approved | Frontend |
| 2026-01-20 | TanStack React Table | ✅ Approved | Frontend |
| 2026-01-20 | Radix UI + Tailwind | ✅ Approved | Design |
| 2026-02-01 | Batch Google Maps API | ✅ Approved | Backend |
| 2026-02-10 | S3 presigned URLs | ✅ Approved | Devops |
| 2026-02-15 | JWT in localStorage | ✅ Approved | Security |
| 2026-02-15 | TypeScript strict | ✅ Approved | Backend |
| 2026-03-01 | Order status workflow | ✅ Approved | Product |
| 2026-03-01 | Tax by vendor location | ✅ Approved | Finance |

---

## Last Updated

Generated: 2026-06-02
Review: When making major architecture changes or adding significant features
