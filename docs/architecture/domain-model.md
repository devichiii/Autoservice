# Domain Model

## Roles

- `CLIENT`: manages own cars, creates bookings, tracks own appointments.
- `MANAGER`: processes bookings, confirms/cancels, updates status.
- `ADMIN`: manages users/services/schedule and analytics.
- `SUPER_ADMIN`: full access, role management, system settings.

## Main entities

- `User`
  - id, email, passwordHash, phone, firstName, lastName, isActive, createdAt, updatedAt
- `Role`
  - id, code, title
- `UserRole`
  - userId, roleId, assignedBy, assignedAt
- `Car`
  - id, userId, brand, model, year, vin, plateNumber, notes
- `Service`
  - id, name, durationMinutes, basePrice, isActive
- `BookingSlot`
  - id, startsAt, endsAt, capacity, reservedCount, isBlocked
- `Booking`
  - id, userId, carId, serviceId, slotId, status, comment, createdAt, updatedAt
- `BookingStatusHistory`
  - id, bookingId, fromStatus, toStatus, changedBy, changedAt, reason
- `Notification`
  - id, userId, channel, payload, status, sentAt
- `AuditLog`
  - id, actorUserId, action, resourceType, resourceId, metadataJson, createdAt
- `SystemSetting`
  - key, value, updatedBy, updatedAt

## Booking statuses

- `PENDING`
- `CONFIRMED`
- `IN_PROGRESS`
- `COMPLETED`
- `CANCELLED_BY_CLIENT`
- `CANCELLED_BY_MANAGER`
- `NO_SHOW`

Status transitions must be centralized in booking domain service to avoid inconsistent behavior.
