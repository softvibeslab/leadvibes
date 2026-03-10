# Feature 4: Round Robin Calendar Assignments - Test Plan

## Overview
This document outlines the comprehensive testing strategy for the Round Robin assignment system in the calendar module. This feature ensures fair distribution of calendar events among brokers with automatic load balancing.

## Test Objectives
- Verify fair distribution of events among brokers
- Test activation/deactivation of brokers in rotation
- Validate manual assignment override functionality
- Ensure Round Robin algorithm works correctly with tie-breaking
- Test reset functionality for assignment counters

---

## 1. Backend API Endpoint Tests

### 1.1 GET /api/calendar/round-robin/config
**Test Cases:**
- [ ] Returns default configuration when none exists for tenant
- [ ] Returns existing configuration for tenant
- [ ] Requires valid authentication
- [ ] Returns 404 for non-existent tenant (optional)
- [ ] Response includes: enabled, reset_frequency, brokers array

### 1.2 PUT /api/calendar/round-robin/config
**Test Cases:**
- [ ] Updates configuration successfully
- [ ] Enables/disables Round Robin
- [ ] Changes reset_frequency (daily, weekly, monthly)
- [ ] Adds new broker to rotation
- [ ] Activates/deactivates existing broker
- [ ] Updates broker priority/order
- [ ] Validates broker exists in user system
- [ ] Returns 400 for invalid reset_frequency
- [ ] Returns 403 for unauthorized tenant access

### 1.3 GET /api/calendar/round-robin/next-broker
**Test Cases:**
- [ ] Returns broker with fewest assignments
- [ ] Handles tie-breaking by broker order
- [ ] Returns null when no brokers active
- [ ] Returns null when Round Robin disabled
- [ ] Correctly filters inactive brokers
- [ ] Handles zero assignment counts for all brokers

### 1.4 POST /api/calendar/assign
**Test Cases:**
- [ ] Assigns to Round Robin selected broker by default
- [ ] Respects manually specified broker_id
- [ ] Validates broker exists
- [ ] Validates broker is active
- [ ] Increments assignment counter for selected broker
- [ ] Creates CalendarAssignment record
- [ ] Links assignment to calendar event
- [ ] Returns assignment details
- [ ] Returns 400 for invalid broker_id
- [ ] Returns 400 for inactive broker assignment attempt

### 1.5 GET /api/calendar/events/{event_id}/assignment
**Test Cases:**
- [ ] Returns assignment details for event
- [ ] Returns 404 for unassigned event
- [ ] Returns 404 for non-existent event
- [ ] Includes broker details in response
- [ ] Shows assignment timestamp

---

## 2. Frontend Component Tests

### 2.1 RoundRobinConfig Component
**Test Cases:**
- [ ] Modal opens and closes correctly
- [ ] Displays current configuration
- [ ] Shows all brokers with their assignment counts
- [ ] Toggle switch enables/disables Round Robin
- [ ] Broker activation toggles work
- [ ] Reset frequency dropdown shows all options
- [ ] "Restablecer contadores" button works
- [ ] Confirms before resetting counters
- [ ] Shows loading state during save
- [ ] Displays success/error toasts
- [ ] Fetches latest config after changes
- [ ] Closes modal on successful save

### 2.2 AssignmentSelector Component
**Test Cases:**
- [ ] Shows "Automático (Round Robin)" as default
- [ ] Lists all active brokers
- [ ] Selecting broker changes assignment mode
- [ ] Shows broker avatars and names
- [ ] Displays assignment counts per broker
- [ ] Required field validation works

### 2.3 CalendarPage Integration
**Test Cases:**
- [ ] "Asignaciones" button visible in header
- [ ] Clicking button opens RoundRobinConfig modal
- [ ] NewEventModal includes AssignmentSelector
- [ ] Assignment section visible in event form
- [ ] Event created with correct assignment
- [ ] Event detail view shows assigned broker
- [ ] Can change assignment after creation

---

## 3. Round Robin Algorithm Tests

### 3.1 Basic Rotation
**Test Cases:**
- [ ] 2 brokers: alternates evenly (A-B-A-B)
- [ ] 3 brokers: cycles through all (A-B-C-A-B-C)
- [ ] 4+ brokers: distributes evenly
- [ ] Single broker: all events to same broker

### 3.2 Load Balancing
**Test Cases:**
- [ ] Assigns to broker with 0 assignments when others have more
- [ ] Tracks cumulative counts correctly
- [ ] Handles simultaneous requests (race conditions)
- [ ] Recalculates after broker deactivation
- [ ] Distributes evenly starting from uneven state

### 3.3 Tie-Breaking
**Test Cases:**
- [ ] When counts equal, uses broker order
- [ ] First broker in list gets assignment when all counts equal
- [ ] Order changes update tie-breaking behavior
- [ ] Removed brokers don't affect tie-breaking

### 3.4 Broker Availability
**Test Cases:**
- [ ] Inactive brokers excluded from rotation
- [ ] Deactivating broker removes from future assignments
- [ ] Activating broker includes in next rotation
- [ ] All brokers inactive = no auto-assignment
- [ ] Last active broker gets all assignments if others deactivated

### 3.5 Counter Reset
**Test Cases:**
- [ ] Daily reset: counters clear at midnight
- [ ] Weekly reset: counters clear on Monday
- [ ] Monthly reset: counters clear on 1st of month
- [ ] Manual reset via "Restablecer contadores" works
- [ ] Reset affects all brokers equally
- [ ] Assignment works correctly after reset

---

## 4. Integration Tests

### 4.1 Calendar Integration
**Test Cases:**
- [ ] New event auto-assigns on creation
- [ ] Event creation with manual assignment works
- [ ] Event detail shows assigned broker
- [ ] Assignment persists on event reload
- [ ] Calendar view displays broker assignments
- [ ] Filtering by broker works

### 4.2 User System Integration
**Test Cases:**
- [ ] Only users with BROKER role available for assignment
- [ ] Broker profile data loads correctly
- [ ] New brokers automatically available in Round Robin
- [ ] Deleted brokers removed from rotation
- [ ] Broker deactivation affects both Round Robin and manual selection

### 4.3 Multi-Tenant Tests
**Test Cases:**
- [ ] Configuration isolated per tenant
- [ ] Assignment counters isolated per tenant
- [ ] Broker assignment affects only tenant's events
- [ ] Different tenants can have different configurations

---

## 5. End-to-End Test Scenarios

### Scenario 1: First Time Setup
1. Navigate to Calendar page
2. Click "Asignaciones" button
3. Enable Round Robin toggle
4. Select reset frequency
5. Activate desired brokers
6. Save configuration
7. Create new event
8. Verify auto-assignment to first broker

### Scenario 2: Daily Operations
1. Create 5 events with auto-assignment
2. Verify distribution among 3 active brokers (2-2-1 or similar)
3. Create event with specific broker assignment
4. Verify manual assignment works
5. View event details to see assigned broker
6. Deactivate one broker
7. Create new event
8. Verify assignment excludes deactivated broker

### Scenario 3: Counter Reset
1. Check current assignment counts
2. Click "Restablecer contadores"
3. Confirm reset
4. Verify all counts at zero
5. Create new event
6. Verify assignment starts fresh

### Scenario 4: Manual Override
1. Create event with auto-assignment
2. Change assignment to specific broker
3. Verify broker's counter incremented
4. Create another event with auto-assignment
5. Verify distribution accounts for manual assignment

---

## 6. Error Handling Tests

### 6.1 Network Errors
**Test Cases:**
- [ ] Shows error message on config save failure
- [ ] Shows error message on assignment failure
- [ ] Retries failed requests appropriately
- [ ] Gracefully handles timeout errors

### 6.2 Validation Errors
**Test Cases:**
- [ ] Shows validation for invalid broker ID
- [ ] Prevents assignment to inactive broker
- [ ] Validates broker exists in system
- [ ] Shows appropriate error messages

### 6.3 Edge Cases
**Test Cases:**
- [ ] Handles no available brokers gracefully
- [ ] Shows helpful message when Round Robin disabled
- [ ] Handles event creation without assignment
- [ ] Recovers from partial state (e.g., assignment created but event not)

---

## 7. UI/UX Tests

### 7.1 Visual Design
**Test Cases:**
- [ ] RoundRobinConfig modal styling consistent with app
- [ ] Broker cards display avatars correctly
- [ ] Assignment counts clearly visible
- [ ] Active/inactive states visually distinct
- [ ] Loading states show appropriate indicators
- [ ] Responsive design works on mobile

### 7.2 User Feedback
**Test Cases:**
- [ ] Toast notifications for successful saves
- [ ] Error messages are clear and actionable
- [ ] Confirmation dialog for reset action
- [ ] Progress indication during operations

### 7.3 Accessibility
**Test Cases:**
- [ ] Toggle switches have proper labels
- [ ] Keyboard navigation works in modal
- [ ] Screen reader announces changes
- [ ] Focus management correct

---

## 8. Performance Tests

### 8.1 Load Testing
**Test Cases:**
- [ ] Handles 100+ concurrent assignments
- [ ] Config retrieval remains fast under load
- [ ] Assignment counts update correctly with rapid requests
- [ ] No duplicate assignments for same event

### 8.2 Database Performance
**Test Cases:**
- [ ] Indexes on tenant_id for efficient queries
- [ ] Counter updates don't cause lock contention
- [ ] CalendarAssignment queries optimized

---

## 9. Security Tests

**Test Cases:**
- [ ] Unauthorized users cannot access Round Robin config
- [ ] Cannot modify other tenants' configurations
- [ ] Cannot assign events to brokers from other tenants
- [ ] API properly validates JWT tokens

---

## 10. Acceptance Criteria

### Must Have (P0)
- [x] Round Robin assigns to broker with fewest assignments
- [x] Brokers can be activated/deactivated in rotation
- [x] Manual assignment override available
- [x] Assignment counters visible and accurate
- [x] Reset functionality works

### Should Have (P1)
- [x] Configurable reset frequency
- [x] Visual display of current distribution
- [x] Integration with existing calendar
- [x] Multi-tenant isolation

### Could Have (P2)
- [ ] Assignment history by broker
- [ ] Advanced scheduling rules (e.g., skill-based)
- [ ] Broker unavailability periods
- [ ] Performance metrics on distribution fairness

---

## Test Data

### Sample Broker Data
```javascript
const brokers = [
  { id: "1", name: "María García", active: true, assignments: 5 },
  { id: "2", name: "Juan Rodríguez", active: true, assignments: 3 },
  { id: "3", name: "Ana Martínez", active: false, assignments: 7 },
  { id: "4", name: "Carlos López", active: true, assignments: 5 }
];
```

### Sample Configuration
```javascript
const config = {
  enabled: true,
  reset_frequency: "weekly",
  brokers: [
    { broker_id: "1", order: 0, active: true },
    { broker_id: "2", order: 1, active: true },
    { broker_id: "3", order: 2, active: false },
    { broker_id: "4", order: 3, active: true }
  ]
};
```

---

## Notes
- All tests should be run for each tenant in multi-tenant environment
- Performance tests should use realistic data volumes
- Consider edge cases around timezone changes for reset frequency
- Test with browsers: Chrome, Firefox, Safari, Edge
- Mobile responsive testing on iOS and Android
