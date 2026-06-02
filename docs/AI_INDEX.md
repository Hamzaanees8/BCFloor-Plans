# BC Floor Admin Portal - AI_INDEX

**START HERE** — This is the only file AI agents should read first.

---

## Project Summary

| Property | Value |
|----------|-------|
| **Name** | BC Floor Admin Portal |
| **Purpose** | Multi-portal booking & service management platform for flooring services |
| **Tech Stack** | Next.js 15, React 19, TypeScript, Tailwind CSS, Radix UI |
| **Core Objective** | Manage bookings, services, vendors, agents, payments, and notifications across three user roles |

---

## Architecture Snapshot

### Frontend (Next.js 15 App Router)
- **Three Portals**: Admin, Agent, Vendor (routed via middleware based on domain)
- **UI Framework**: Radix UI components + Tailwind CSS
- **State Management**: React Context (AppContext, UserContext, OrderContext)
- **Data Fetching**: Axios interceptors with token-based auth
- **Real-time**: Sonner toasts for notifications

### Backend (REST API)
- **Auth**: Bearer token (JWT) stored in localStorage
- **Endpoints**: `/api/users`, `/api/orders`, `/api/vendors`, `/api/agents`, `/api/services`, `/api/payments`, `/api/notifications`, `/api/uploads`
- **File Storage**: S3 with presigned URLs
- **Tax Calculation**: Province/state-based tax engine

### Database (Backend - Not in this repo)
- Users (Admin, Agent, Vendor, Co-Agent)
- Orders with services and slots
- Vendors and services
- Payments and invoices
- Notifications and audit logs

### External Integrations
- **Google Maps**: Distance Matrix for travel calculations
- **S3 AWS**: File uploads/downloads
- **Email**: Nodemailer for notifications

---

## Major Features List

- ✅ **Authentication**: JWT-based multi-role login
- ✅ **Booking System**: Orders → Services → Time Slots → Vendor Assignment
- ✅ **Services Management**: Categories, pricing, vendor assignments
- ✅ **Vendors**: Profiles, work hours, settings, service areas
- ✅ **Agents**: Team management, co-agents, payment splits
- ✅ **Scheduling**: Calendar view, appointment management, travel time
- ✅ **Payments & Billing**: Invoices, splits, tax calculations
- ✅ **Notifications**: Real-time notifications, history
- ✅ **File Management**: S3 uploads, batching, progress tracking
- ✅ **Reporting**: Vendor earnings, travel costs
- ✅ **White-label Support**: Organization-based theming

---

## Documentation Map

| File | Purpose |
|------|---------|
| **PROJECT_CONTEXT.md** | Full technical architecture, APIs, database models, business logic |
| **PROJECT_SCOPE.md** | Features, user roles, functional requirements, constraints |
| **FLOW_TREE.md** | User flows, data flows, API flows, component hierarchies |
| **DECISIONS.md** | Architecture decisions, rationale, implementation notes |
| **CHANGELOG_AI.md** | Version history, feature additions, bug fixes |
| **modules/AUTH.md** | Authentication, login flows, permissions system |
| **modules/BOOKING.md** | Order creation, slot assignment, vendor matching |
| **modules/ORDERS.md** | Order management, updates, status tracking |
| **modules/PAYMENTS.md** | Invoicing, tax calculation, payment processing |
| **modules/SERVICES.md** | Service management, categories, pricing |
| **modules/VENDORS.md** | Vendor management, profiles, work hours, settings |
| **modules/NOTIFICATIONS.md** | Notification types, triggers, delivery |
| **modules/FILE_MANAGER.md** | S3 uploads, batching, progress tracking |

---

## Critical Business Rules Summary

1. **Tax Calculation**: Automatic based on vendor location (province/state)
2. **Travel Costs**: Batch-calculated using Google Maps Distance Matrix
3. **Order Status Flow**: Pending → Scheduled → Completed → Invoiced
4. **Payment Split**: Multi-agent orders split revenue based on co-agent percentages
5. **Service Availability**: Determined by vendor work hours + service assignments
6. **Notification Triggers**: Order updates, payments, assignments, completions
7. **User Roles**: Admin (all access) > Agent (team scope) > Vendor (self scope)
8. **Organization Isolation**: Multi-tenancy via org_id

---

## Current Known Issues

- None documented yet. See CHANGELOG_AI.md for latest updates.

---

## Recent Changes Summary

Latest updates tracked in CHANGELOG_AI.md. Last updated: [Check CHANGELOG_AI.md]

---

## Quick Navigation by Task

### "I need to understand authentication"
→ Read `modules/AUTH.md`

### "I need to fix booking logic"
→ Read `modules/BOOKING.md` + `FLOW_TREE.md` (Booking flow section)

### "I need to add a new payment feature"
→ Read `modules/PAYMENTS.md` + `PROJECT_CONTEXT.md` (API section)

### "I need to understand the entire system architecture"
→ Read `PROJECT_CONTEXT.md` + `FLOW_TREE.md`

### "I need to find where to make a specific change"
→ Read `PROJECT_SCOPE.md` (Features section) + `FLOW_TREE.md`

---

## Repository Structure

```
bcf-admin/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth pages (login, forgot password)
│   ├── agent/                    # Agent portal routes
│   ├── vendor/                   # Vendor portal routes
│   ├── dashboard/                # Shared dashboard (admin/agent)
│   ├── api/                      # Backend API routes (if any)
│   ├── context/                  # React Context providers
│   ├── Http/Controllers/         # Backend-style controllers (if applicable)
│   └── Services/                 # Backend-style services (if applicable)
├── components/                   # Reusable UI components
│   ├── ui/                       # Base UI components (Button, Dialog, etc.)
│   ├── download/                 # Download-related components
│   ├── upload/                   # Upload-related components
│   └── [Feature-specific]        # Components by feature
├── context/                      # Global React Context
│   ├── UserContext.tsx
│   ├── AppContext.tsx
│   ├── GlobalFileUploadContext.tsx
│   ├── GlobalDownloadContext.tsx
│   └── UploadQueueContext.tsx
├── lib/                          # Utilities and helpers
│   ├── types.ts                  # TypeScript interfaces
│   ├── api.ts                    # Axios instance + interceptors
│   ├── permissions.ts            # Permission-based access control
│   ├── taxCalculator.ts          # Tax rate calculations
│   ├── batchTravelCalculator.ts  # Google Maps batch API
│   ├── email-templates.ts        # Email template definitions
│   ├── upload/                   # S3 upload service
│   ├── api/                      # API utilities
│   └── config/                   # Configuration files
├── hooks/                        # Custom React hooks
├── public/                       # Static assets
├── docs/                         # THIS DOCUMENTATION SYSTEM
└── [Config files]                # next.config.ts, tsconfig.json, etc.
```

---

## Environment Variables

Requires `.env.local`:
- `NEXT_PUBLIC_API_URL` - Backend API base URL
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` - Google Maps API key
- Other secrets in `.env.local` (not in repo)

---

## Getting Started for AI Agents

1. **Read this file first** ✓
2. Read **PROJECT_CONTEXT.md** for architecture
3. Read **FLOW_TREE.md** for specific flow (booking, payment, etc.)
4. Read relevant **module file** (e.g., `modules/BOOKING.md`)
5. Check **DECISIONS.md** for "why" questions
6. Reference **PROJECT_SCOPE.md** for business requirements

---

## Last Updated

Generated: 2026-06-02 | Review: When major features are added or architecture changes significantly
