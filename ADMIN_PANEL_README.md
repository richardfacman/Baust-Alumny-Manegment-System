# BAUST Alumni Management Admin Panel

## Overview
The Admin Panel is a modern, professional dashboard for managing alumni records, events, news, and system settings. Built with a clean, intuitive interface, it provides comprehensive tools for administrators.

## Getting Started

### Admin Credentials
- **Username:** `admin`
- **Password:** `1234`

### Accessing the Admin Panel
1. Visit: `http://localhost:5000/site/index3.html` (or navigate to the Admin Login page)
2. Enter your credentials
3. You'll be redirected to the admin dashboard

## Dashboard

The dashboard provides a complete overview of your alumni association:

### Key Metrics
- **Alumni:** Total number of registered alumni records
- **Active:** Number of approved/active alumni members
- **Pending:** Alumni records awaiting approval
- **Events:** Total events created
- **News:** Total news/announcements published
- **Participation:** Total event registrations

### Charts & Analytics
- **Alumni Registration Growth:** Alumni by graduation year
- **Active vs Inactive:** Distribution of alumni statuses
- **Alumni by Department:** Breakdown by academic department
- **Event Participation:** Registration counts for events
- **Recent Registrations:** Latest 6 alumni profiles
- **Recent Activities:** Latest administrative actions

## Alumni Management

### View Alumni List
1. Click "Alumni" in the sidebar
2. See all alumni with pagination
3. Use filters and search to find specific records

### Search & Filter
- **Search Box:** Search by name, email, student ID, or department
- **Status Filter:** Filter by pending, active, inactive, or rejected
- **Pagination:** Navigate through pages (default: 10 records per page)

### Add Alumni
1. Click "Add Alumni" button
2. Fill in personal information:
   - First Name* (required)
   - Last Name* (required)
   - Email* (required)
   - Phone
3. Add academic information:
   - Student ID
   - Department
   - Program
   - Graduation Year
   - Batch
4. Add professional information:
   - Current Job Title
   - Company
   - Current Location
   - LinkedIn Profile
5. Set account status (pending/active/inactive/rejected)
6. Add optional profile summary
7. Click "Create Alumni"

### Edit Alumni
1. Click "Edit" button on an alumni record
2. Update any field
3. Click "Save Changes"

### View Alumni Profile
1. Click "View" button on an alumni record
2. See complete profile with all details
3. Options:
   - "Edit Profile" - Modify the record
   - "Contact" - Future messaging feature
   - "Delete" - Remove the record (requires confirmation)

### Delete Alumni
1. Click "Delete" button
2. Confirm in the dialog
3. Record is permanently removed

### Bulk Actions
- **Select Multiple:** Check boxes to select alumni
- **Bulk Activate:** Activate all selected alumni
- **Bulk Delete:** Delete multiple records at once (requires confirmation)
- **Select All:** Checkbox in table header to select all visible records

### Export Alumni Data
1. Click "Export CSV" button
2. Download CSV file with all alumni records
3. File includes: Name, Email, Phone, Student ID, Department, Program, Graduation Year, Batch, Job, Company, Location, Status, Registration Date

## Events Management

### View Events
1. Click "Events" in the sidebar
2. See all events with date, venue, and status
3. Shows event description preview

### Add Event
1. Click "Add Event" button
2. Fill in event details:
   - Event Title* (required)
   - Date* (required)
   - Time* (required)
   - Venue
   - Capacity (number)
   - Status (draft/published/unpublished/completed)
   - Event Image URL
   - Event Description
3. Click "Save Event"

### Edit Event
1. Click "Edit" button
2. Update event details
3. Click "Save Event"

### Delete Event
1. Click "Delete" button
2. Confirm deletion (cannot be undone)

### Event Status
- **Draft:** Event not ready for publication
- **Published:** Event visible to alumni
- **Unpublished:** Event was published, now hidden
- **Completed:** Event has occurred

## News/Announcements

### View News
1. Click "News" in the sidebar
2. See all news articles with category and author
3. Shows content preview

### Add News
1. Click "Add News" button
2. Fill in article details:
   - News Title* (required)
   - Category
   - Author
   - Publish Date
   - Status (draft/published/unpublished/scheduled)
   - Featured Image URL
   - Content* (required)
3. Click "Save News"

### Edit News
1. Click "Edit" button
2. Update article content
3. Click "Save News"

### Delete News
1. Click "Delete" button
2. Confirm deletion

### News Status
- **Draft:** Article not ready
- **Published:** Visible to alumni
- **Unpublished:** Was published, now hidden
- **Scheduled:** Ready for future publication

## Reports & Analytics

The Reports section provides detailed analytics:

### Available Reports
1. **Alumni by Graduation Year:** Distribution across graduation years
2. **Alumni by Location:** Geographic distribution
3. **Alumni by Department:** Academic department breakdown
4. **Event Participation:** Registrations per event

All charts are generated from real database data and update automatically as records change.

## Notifications

### System Notifications
The admin panel generates notifications for:
- New alumni registrations
- Pending alumni approvals
- Important system events

### Notification Features
1. **Badge:** Red badge shows unread count
2. **Dropdown:** Click bell icon to view notifications
3. **Mark as Read:** Individual notifications auto-marked
4. **Mark All Read:** Button to clear all at once
5. **Notification Details:** Shows timestamp and notification type

## Settings

### General Settings
- **Association Name:** Your alumni association name
- **Contact Email:** Primary contact email
- **Phone Number:** Association phone
- **Physical Address:** Headquarters/office address
- **Website URL:** Association website

### Admin Profile
- **Admin Name:** Your display name
- **Admin Email:** Your email address

### System Information
- **Version:** Current system version
- **Storage:** Information about data storage backend

All settings are saved immediately when you click "Save Settings."

## Global Search

### Instant Search
1. Use the search box in the top header
2. Start typing to search across:
   - Alumni profiles (name, email, department)
   - Events (title, venue)
   - News (title, category)
3. Click a result to navigate to that item

### Search Tips
- Searches are case-insensitive
- Partial matches work (search "john" to find "johnny")
- Returns up to 5 results per category

## Features & Best Practices

### User Experience
- **Keyboard Shortcuts:** Tab through forms, Enter to submit
- **Auto-focus:** First field is focused when opening a form
- **Real-time Validation:** Form errors show as you correct them
- **Responsive Design:** Works on desktop, tablet, and mobile
- **Toast Notifications:** Success/error messages appear at bottom right

### Data Management
- **Validation:** All required fields are marked with *
- **Duplicate Prevention:** Email and Student ID must be unique
- **Date Formats:** Use YYYY-MM-DD for dates
- **Confirmation Dialogs:** Destructive actions require confirmation
- **Activity Tracking:** Recent activities logged in dashboard

### Mobile Usage
1. Tap menu icon (☰) to open/close sidebar
2. Tables scroll horizontally on small screens
3. Forms stack vertically for easier input
4. All buttons sized for touch

## Troubleshooting

### Login Issues
- Double-check username and password (case-sensitive)
- Username is "admin" not your email
- Clear browser cache if having persistent issues

### Form Not Submitting
- Check all required fields (marked with *)
- Ensure email format is valid
- Verify year is 4 digits
- Look for error messages in red text

### Data Not Saving
- Check internet connection
- Look for error toast notification
- Try again or reload page
- Contact system administrator if issue persists

### Filters Not Working
- Ensure page hasn't been manually navigated away from
- Try refreshing the page
- Check browser console for errors

## Data Fields Reference

### Alumni Record
- **Full Name:** First + Last Name (required)
- **Email:** Valid email address (required, unique)
- **Phone:** Optional contact number
- **Student ID:** Unique identifier (optional, but must be unique if provided)
- **Department:** Academic department (e.g., CSE, EEE)
- **Program:** Degree program (e.g., B.Sc, B.Tech)
- **Graduation Year:** YYYY format (e.g., 2022)
- **Batch:** Cohort number (e.g., 14, 15, 16)
- **Current Job:** Job title
- **Company:** Employer name
- **Location:** Current city/location
- **LinkedIn:** Profile URL
- **Status:** pending, active, inactive, rejected
- **Bio:** Free-form profile summary

### Event Record
- **Title:** Event name (required)
- **Date:** Event date (YYYY-MM-DD format)
- **Time:** Event time (HH:MM format)
- **Venue:** Location details
- **Capacity:** Maximum attendees
- **Status:** Event visibility/state
- **Image URL:** Event poster/photo URL
- **Description:** Event details

### News Record
- **Title:** Article headline (required)
- **Category:** News category/topic
- **Author:** Author name
- **Publish Date:** Publication date
- **Status:** Publication state
- **Image URL:** Featured image
- **Content:** Full article text

## Security Notes

✅ **Protected Routes:** All admin pages require authentication
✅ **Token-Based Auth:** Secure authentication tokens
✅ **Authorization Check:** Backend validates admin access
✅ **Secure Headers:** CORS and security headers configured
✅ **Input Validation:** Server-side validation prevents bad data

### Logout
1. Click on the admin profile button (top right)
2. Click "Logout"
3. You'll be redirected to login page
4. Session token is cleared from browser

## Support & Maintenance

### Regular Tasks
- Review pending alumni approvals weekly
- Archive completed events
- Update association information if it changes
- Monitor notification activity

### Database Management
- All data stored in JSON files (local storage)
- Backup location: `/BAUST/BAUST/data/`
- Files: alumni.json, events.json, news.json, settings.json

### Performance Tips
- Use pagination for large alumni lists
- Archive old news and completed events
- Use filters to reduce displayed data
- Export alumni for external analysis

## Version Information
- **System Version:** 1.0.0
- **Last Updated:** 2026-08-15
- **Platform:** Express.js (Node.js) Backend, Vanilla JavaScript Frontend
- **Storage:** Local JSON File Storage

## Future Enhancements
- Contact feature for direct messaging
- Email notifications to alumni
- Advanced reporting and CSV export
- Bulk import of alumni data
- Email digest of activities
- Two-factor authentication (2FA)
- Alumni groups and communities
- Job posting system
- Event ticketing system

---

For technical support or issues, contact your system administrator.
