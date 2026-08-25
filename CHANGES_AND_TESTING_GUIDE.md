# Summary of Today's Changes & Testing Guide

This document details all technical updates implemented today in the Order Schedule and Calendar modules, their expected behaviors, step-by-step testing instructions, and potential edge cases/regression areas to monitor.

---

## Table of Contents
1. [Feature 1: Calendar Time Axis Trimming (Removing Non-Operating Slots)](#feature-1-calendar-time-axis-trimming)
2. [Feature 2: 3-Tier Priority Hierarchy for Service Duration Calculation](#feature-2-3-tier-priority-hierarchy-for-service-duration-calculation)
3. [Feature 3: Dynamic Vendor Travel Time Adjustment (6 Business Cases)](#feature-3-dynamic-vendor-travel-time-adjustment)
4. [Feature 4: Partial Slot Display & Toast Error Notification](#feature-4-partial-slot-display--toast-error-notification)
5. [Feature 5: Common Booked Slots, Travel Adjustments & Vendor Breaks Display](#feature-5-common-booked-slots-travel-adjustments--vendor-breaks-display)
6. [Feature 6: Agent vs Admin Role-Based Calendar Bounds & Clickability Rules](#feature-6-agent-vs-admin-role-based-calendar-bounds--clickability-rules)
7. [Modified Files List](#modified-files-list)

---

## Feature 1: Calendar Time Axis Trimming

### Problem Solved
Previously, FullCalendar rendered 15-minute empty grid rows starting from `12:00 AM` to `12:00 AM` (24 hours) regardless of vendor working hours. Users had to scroll past empty 12 AM – 7 AM rows to see active day slots.

---

## Feature 2: 3-Tier Priority Hierarchy for Service Duration Calculation

```mermaid
flowchart TD
    A["Calculate Service Duration"] --> B{"Level 1: Option service_duration defined?"}
    B -- Yes (> 0) --> C{"Is it a Per-SqFt Rate Option?"}
    C -- No (Fixed Tier Option) --> D["Level 1A: Fixed Flat Duration (e.g. 90m)"]
    C -- Yes (Per-SqFt Rate Option) --> E["Level 1B: Option Base + Service SqFt Increments"]
    B -- No / Null --> F{"Level 2: Service base_duration_mins defined?"}
    F -- Yes (> 0) --> G["Level 2: Service Base + Service SqFt Increments"]
    F -- No / Null --> H["Level 3: Default System Calculation (60m base + 30m / 500 sqft)"]
```

---

## Feature 3: Dynamic Vendor Travel Time Adjustment

```mermaid
flowchart TD
    A["User selects slot time for Vendor"] --> B{"Does Service require travel?\n(is_travel_required === false)"}
    B -- No (Case 6) --> C["Travel = 0 mins\nBook exact service duration"]
    B -- Yes --> D{"Is this the vendor's FIRST booking of the day?"}
    D -- Yes (Case 1) --> C
    D -- No --> E{"Is prior booking at the SAME property?"}
    E -- Yes (Case 3) --> C
    E -- No --> F{"Does an existing gap already cover travel?\n(e.g., 12-1 PM gap before next booking)"}
    F -- Yes (Case 5A) --> G["Use existing gap for travel\nDo NOT append extra travel buffer"]
    F -- No --> H{"Is window size >= travelBefore + service + travelAfter?"}
    H -- Insufficient (Case 5B) --> I["REJECT slot start time\nInsufficient time for travel + service"]
    H -- Sufficient (Case 2) --> J["Append 30m travel buffer\n(e.g. 2:00-4:30 PM for 2h service)"]

    C --> K["Validate each vendor independently for multi-vendor orders (Case 4)"]
    G --> K
    J --> K
```

---

## Feature 4: Partial Slot Display & Toast Error Notification

```mermaid
flowchart TD
    A["Calculate Candidate Start Slot (e.g. 12:30 PM)"] --> B["Compute Free Window (e.g. 12:30-2:00 PM = 90m)"]
    B --> C["Deduct Travel Buffer (e.g. 30m) -> Net Service Window = 60m"]
    C --> D{"Is Net Service Window >= 15 mins?"}
    D -- No --> E["Mark Slot Unavailable"]
    D -- Yes --> F["Mark 12:30 PM as Available (Green) Slot in UI Grid"]
    
    F --> G["User clicks 12:30 PM slot"]
    G --> H{"Is Net Window (60m) >= Required Duration (75m)?"}
    H -- Yes --> I["Book Service Slots successfully"]
    H -- No --> J["Show Toast Error:\n'Selected available duration (60 min) is less than the required service duration (75 min). Please select another slot.'"]
```

---

## Feature 5: Common Booked Slots, Travel Adjustments & Vendor Breaks Display

### Complete Calendar Badge Matrix

| Slot Type | Title | Badge Styling | Background Color | Text Color | Admin Clickable? | Agent Clickable? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Available / Recommended** | `"Available"` / `"MO"` | `.slot-available` | Soft Green `#B2FFB2` | Dark Green `#166534` | ✅ YES | ✅ YES |
| **Travel Buffer** | `"Travel Adjustment"` | `.slot-travel-adjustment` | Amber `#FDE68A` | Dark Amber `#92400E` | ℹ️ Inspect | ❌ **NO (Not clickable)** |
| **Booked Appointment** | `"Booked"` | `.slot-booked` | Slate `#CBD5E1` | Dark Slate `#1E293B` | ❌ **NO** | ❌ **NO** |
| **Vendor Break** | `"Vendor Break"` | `.slot-vendor-break` | Soft Indigo `#E0E7FF` | Dark Indigo `#3730A3` | ℹ️ Inspect | ❌ **NO** |
| **Off-Hours / Time-Off** | `"Unavailable"` | `.slot-unavailable` | Light Gray `#EEEEEE` | Gray `#424242` | ❌ **NO** | ❌ **NO** |

---

## Feature 6: Agent vs Admin Role-Based Calendar Bounds & Clickability Rules

### 1. Time Axis Trimming with Travel Adjustments Included
- **Admin (`userType === "admin"`)**: Sees full day operating hours (`dayStartTime` to `dayEndTime`) including leading & trailing booked blocks.
- **Agent / Client (`userType !== "admin"`)**:
  - `activeIndices` includes `slot-available`, `slot-selected`, `slot-recommended`, AND `slot-travel-adjustment`.
  - Leading travel buffers (e.g. `12:00 PM - 12:30 PM` before `12:30 PM` available slot) are included in the agent grid (`slotMinTime` = `12:00 PM`).
  - Travel adjustment slots are clearly labeled as **"Travel Adjustment"** (`#FDE68A` amber badge).
  - Trailing booked/unavailable blocks are trimmed off the time axis.

### 2. Slot Clickability Guards
- **Booked Slots**: Blocked from being clicked by ANY user (Admin or Agent). Hover cursor displays `not-allowed` (🚫).
- **Vendor Break & Travel Adjustment Slots**: Blocked from being clicked by Agents (`userType !== "admin"`). Hover cursor displays `not-allowed` (🚫).

---

## Step-by-Step Testing Guide

1. **Agent Travel Adjustment Visibility Test**:
   - Login as Agent. Schedule has travel adjustment buffer at `12:00 PM - 12:30 PM` before `12:30 PM` available slot.
   - **PASS**: Agent grid starts at `12:00 PM`. `12:00 PM - 12:30 PM` displays label **"Travel Adjustment"** with amber badge styling (`#FDE68A`) and `not-allowed` cursor.
2. **Admin Full Schedule View Test**:
   - Login as Admin.
   - **PASS**: Admin grid shows full operating hours with all booked, break, travel, and available slots.

---

## Modified Files List

| File Path | Description of Changes |
| :--- | :--- |
| [`app/dashboard/orders/utils/serviceTimeUtils.ts`](file:///c:/Users/NVT-HP-18/Desktop/bcf-admin/app/dashboard/orders/utils/serviceTimeUtils.ts) | Implemented 3-tier hierarchy in `getEffectiveServiceDuration` with flexible overload parameters and per-sqft rate handling. |
| [`app/dashboard/orders/components/OneDayCalendar.tsx`](file:///c:/Users/NVT-HP-18/Desktop/bcf-admin/app/dashboard/orders/components/OneDayCalendar.tsx) | Updated Agent time bounds trimming to include `slot-travel-adjustment`, enforced non-clickability for booked/travel/break slots, and added `cursor: not-allowed` CSS rules. |
| [`app/dashboard/calendar/components/OneDayCalendar.tsx`](file:///c:/Users/NVT-HP-18/Desktop/bcf-admin/app/dashboard/calendar/components/OneDayCalendar.tsx) | Integrated travel buffer logic, dynamic `slotMinTime`/`slotMaxTime` props, and updated all `getEffectiveServiceDuration` call sites. |
| [`app/dashboard/orders/components/Schedule.tsx`](file:///c:/Users/NVT-HP-18/Desktop/bcf-admin/app/dashboard/orders/components/Schedule.tsx) | Updated duration calculation calls to pass `productOption`, `currentService`, and `squareFootage`. |
