# Backend API Specification: Order Slot Time Override Endpoint

This specification defines the HTTP API endpoint required to update, trim, extend, or unselect time slots from a previously booked order service.

---

## Endpoint Details

- **Route**: `POST /api/orders/update-slot-time` *(or `/api/orders/unselect-slot`)*
- **Authentication**: Required (`Bearer <Token>`)
- **Access Level**: Admin Only (`role: admin`)
- **Content-Type**: `application/json`

---

## Description & Execution Flow

In the database, each booked order service is stored as a single slot record with a start time (`start_time`), end time (`end_time`), and vendor ID (`vendor_id`).

When an Admin trims, extends, or unselects a boundary slot chunk from a booked appointment on the calendar:
1. The frontend calculates the updated start and end time range (e.g. reducing `14:00:00 - 16:00:00` to `14:00:00 - 15:45:00`, or extending to `14:00:00 - 16:30:00`).
2. The frontend sends a `POST` request to `/api/orders/update-slot-time` with the updated time window and identifiers.
3. The backend updates the slot record's `start_time` and `end_time` in the database.
4. The backend recalculates order service duration and updates vendor calendar availability.
5. Returns a `200 OK` success payload confirming the updated order slot schedule.

---

## Request Payload Schema

```json
{
  "order_uuid": "ord_987654321",
  "order_service_id": "os_123456789",
  "service_uuid": "srv_456789012",
  "slot_uuid": "slt_345678901",
  "vendor_uuid": "ven_567890123",
  "date": "2026-08-26",
  "start_time": "14:00:00",
  "end_time": "15:45:00",
  "reason": "Admin schedule override: trimmed boundary slot"
}
```

### Field Definitions

| Field Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `order_uuid` | `string` | Yes | Unique UUID of the target order |
| `order_service_id` | `string` | Yes | Unique ID / UUID of the order service |
| `service_uuid` | `string` | Yes | Global service UUID (e.g. Photography) |
| `slot_uuid` | `string` | Yes | Unique UUID of the slot record being updated |
| `vendor_uuid` | `string` | Yes | UUID of the assigned vendor |
| `date` | `string` | Yes | Booking date (`YYYY-MM-DD`) |
| `start_time` | `string` | Yes | Updated start time in `HH:mm:ss` format (e.g. `"14:00:00"`) |
| `end_time` | `string` | Yes | Updated end time in `HH:mm:ss` format (e.g. `"15:45:00"`) |
| `reason` | `string` | No | Optional audit log note explaining the Admin override |

---

## Example Scenarios

### Scenario A: Trimming 15 mins off End of Booking
- **Original Booking**: `14:00:00 - 16:00:00` (2 hours)
- **Admin Action**: Clicks Cross (X) icon on `15:45:00 - 16:00:00` slot.
- **Payload Sent**:
  - `start_time`: `"14:00:00"`
  - `end_time`: `"15:45:00"`

### Scenario B: Trimming 15 mins off Start of Booking
- **Original Booking**: `14:00:00 - 16:00:00` (2 hours)
- **Admin Action**: Clicks Cross (X) icon on `14:00:00 - 14:15:00` slot.
- **Payload Sent**:
  - `start_time`: `"14:15:00"`
  - `end_time`: `"16:00:00"`

### Scenario C: Extending Booking by 30 mins
- **Original Booking**: `14:00:00 - 16:00:00` (2 hours)
- **Admin Action**: Extends booking to `16:30:00`.
- **Payload Sent**:
  - `start_time`: `"14:00:00"`
  - `end_time`: `"16:30:00"`

---

## Response Schemas

### 1. Success Response (`200 OK`)

```json
{
  "success": true,
  "message": "Order slot time successfully updated.",
  "data": {
    "order_uuid": "ord_987654321",
    "slot_uuid": "slt_345678901",
    "updated_start_time": "14:00:00",
    "updated_end_time": "15:45:00",
    "updated_duration_mins": 105
  }
}
```

### 2. Error Responses

#### `401 Unauthorized`
```json
{
  "success": false,
  "error": "Unauthenticated access. Bearer token required."
}
```

#### `403 Forbidden`
```json
{
  "success": false,
  "error": "Forbidden. Only Admin users can perform slot overrides."
}
```

#### `404 Not Found`
```json
{
  "success": false,
  "error": "Order slot record not found for the specified UUID."
}
```
