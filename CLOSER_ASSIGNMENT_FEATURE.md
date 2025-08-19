# Closer Assignment Feature

## Overview
The closer assignment feature allows users to assign closers to customer appointments in the schedule. When a closer is assigned, they will automatically see the appointment on their schedule.

## How It Works

### 1. Assigning Closers
- Navigate to the Schedule tab
- Click on a date with appointments
- For each appointment without an assigned closer, click the "Assign Closer" button
- A modal will open showing all available closers in the same region as the setter
- Select a closer and click "Assign Closer" to complete the assignment

### 2. Closer Visibility
- Closers can see all appointments assigned to them with full details
- Closers can see other appointments with limited details (customer name hidden)
- Managers can see all appointments with full details

### 3. Region-Based Assignment
- Closers are filtered by region to ensure they are in the same region as the setter
- Only active closers in the setter's region will appear in the assignment modal

## Technical Implementation

### Components
- `CloserAssignmentModal.tsx` - Modal component for selecting closers
- Updated `schedule/page.tsx` - Main schedule page with assignment functionality

### Firebase Integration
- `getClosersByRegion()` function in `firebaseUtils.ts` - Fetches closers by region
- User data structure includes `region` and `role` fields for filtering

### Data Flow
1. User clicks "Assign Closer" on an appointment
2. System loads closers from the same region as the setter
3. User selects a closer from the modal
4. Appointment is updated with `closerId` and `closerName`
5. Data is saved to localStorage and Firebase

## User Roles and Permissions

### Setters
- Can assign closers to their own appointments
- Can see their own appointments with full details
- Can see other appointments with limited details

### Closers
- Can see all appointments assigned to them with full details
- Can see other appointments with limited details
- Cannot assign closers to appointments

### Managers
- Can see all appointments with full details
- Can assign closers to any appointment
- Can manage all aspects of the schedule

## Future Enhancements
- Bulk assignment of closers to multiple appointments
- Closer availability tracking
- Automatic assignment based on availability
- Integration with external calendar systems
- Notification system for assigned closers

## Testing
To test the feature:
1. Create test users with 'closer' role in different regions
2. Create test appointments in the schedule
3. Try assigning closers to appointments
4. Verify closers can see their assigned appointments
5. Verify region-based filtering works correctly 