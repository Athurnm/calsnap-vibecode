# CalSnap - Product Requirements Document (PRD)

## Product Overview

**Product Name:** CalSnap  
**Version:** 1.0  
**Target Users:** Anyone who receives schedule screenshots/images and needs to add them to their calendar  
**Core Value:** Convert schedule images to calendar events in seconds, not minutes

---

## User Stories & Acceptance Criteria

### Epic 1: Image Upload & Processing

#### US-1.1: Upload Schedule Image
**As a** user  
**I want to** upload a schedule image from my device  
**So that** I can convert it to calendar events

**Acceptance Criteria:**
- ✅ User can click upload zone to browse files
- ✅ User can drag & drop image onto upload zone
- ✅ Supported formats: PNG, JPG, JPEG
- ✅ Max file size: 10MB
- ✅ Upload zone shows visual feedback on hover/drag
- ✅ Error message if unsupported format or too large
- ✅ Mobile: Can use camera to capture image (if supported)
- ✅ Image preview shown after upload
- ✅ Clear instructions visible: "Calendar or table format works best"

**UI Elements:**
- Dashed border upload zone
- Upload icon (📸 or cloud)
- Instructional text (EN/ID)
- Drag-over state (highlighted)
- File input (hidden, triggered by click)

---

#### US-1.2: Process Image with LLM Vision
**As a** user  
**I want the** system to automatically analyze my uploaded image  
**So that** it can extract schedule information

**Acceptance Criteria:**
- ✅ Processing starts automatically after upload
- ✅ Loading spinner displayed during processing
- ✅ Image stored in sessionStorage (client-side only)
- ✅ LLM Vision API called with image
- ✅ OCR extracts: table structure, dates, times, activities
- ✅ Processing timeout: 60 seconds
- ✅ Error handling if API fails
- ✅ User can retry if processing fails
- ✅ Activity log records each step

**Technical Requirements:**
- Use `sessionStorage.setItem('uploadedImage', base64ImageData)`
- LLM prompt: "Analyze this schedule image. Extract events in JSON format: [{activity, date, time, endTime}]"
- Parse LLM response into structured data
- Validate extracted dates/times

---

### Epic 2: Results Display & Editing

#### US-2.1: View Extracted Events in Table
**As a** user  
**I want to** see extracted events in an editable table  
**So that** I can review and correct any mistakes

**Acceptance Criteria:**
- ✅ Table displays: Activity | Date & Time | Actions
- ✅ Mobile: Card layout (stacked rows)
- ✅ Desktop: Traditional table (3 columns)
- ✅ Each row shows one event
- ✅ Empty state if no events detected: "No events found. Try a different image."
- ✅ Activity log shows detection summary: "Detected X events"

**Table Columns:**
1. **Activity** (editable text)
2. **Date & Time** (editable datetime)
3. **Actions** (Recurring, Delete, Export buttons)

---

#### US-2.2: Edit Event Details
**As a** user  
**I want to** edit extracted event details  
**So that** I can correct OCR errors

**Acceptance Criteria:**
- ✅ Click activity name to edit inline
- ✅ Click date/time to open picker
- ✅ Changes saved immediately (no "Save" button needed)
- ✅ Validation: Date cannot be in past (warning, not blocking)
- ✅ Time format: 12-hour (AM/PM) or 24-hour based on locale
- ✅ Activity log records edits: "Event 'Meeting' updated"

**UI Behavior:**
- Inline edit: Click → Text input appears
- Date picker: Native `<input type="datetime-local">`
- Blur or Enter to save
- ESC to cancel edit

---

#### US-2.3: Set Recurring Event
**As a** user  
**I want to** mark an event as recurring  
**So that** it repeats in my calendar

**Acceptance Criteria:**
- ✅ Recurring button (🔁 icon) on each row
- ✅ Click opens dropdown: Daily, Weekly, Monthly, Yearly, None
- ✅ Selection saved per event
- ✅ Visual indicator when recurring is set (blue badge)
- ✅ Tooltip explains: "Set event to repeat"
- ✅ Mobile: Dropdown anchored to button
- ✅ Activity log: "Event 'Meeting' set to Weekly"

**Dropdown Options:**
- None (default)
- Daily
- Weekly
- Monthly
- Yearly

---

#### US-2.4: Delete Event
**As a** user  
**I want to** delete incorrectly detected events  
**So that** I only export relevant ones

**Acceptance Criteria:**
- ✅ Delete button (🗑️ icon) on each row
- ✅ Confirmation dialog: "Delete this event?"
- ✅ Row removed from table immediately
- ✅ Undo option (5 seconds): "Event deleted. [Undo]"
- ✅ Activity log: "Event 'Meeting' deleted"
- ✅ If all events deleted: Show upload new image CTA

---

### Epic 3: Calendar Export

#### US-3.1: Export Single Event to Calendar
**As a** user  
**I want to** export an event to Google Calendar or Apple Calendar  
**So that** it appears in my calendar app

**Acceptance Criteria:**
- ✅ Export button (📤 icon) on each row
- ✅ Click opens modal: "Export to Calendar"
- ✅ Two options: Google Calendar, Apple Calendar (iCal)
- ✅ Click option opens calendar link in new tab
- ✅ Link pre-fills: Title, Date, Time, End Time, Recurrence
- ✅ Success toast: "Event added to calendar"
- ✅ Activity log: "Event 'Meeting' exported to Google Calendar"

**Calendar Link Format:**
- **Google Calendar:**  
  `https://calendar.google.com/calendar/render?action=TEMPLATE&text={title}&dates={startISO}/{endISO}&recur={rrule}`

- **Apple Calendar (iCal):**  
  Generate `.ics` file with VEVENT, trigger download

**Technical:**
- Use `window.open(calendarUrl, '_blank')` for Google Cal
- Use blob + download link for iCal

---

#### US-3.2: Bulk Export All Events
**As a** user  
**I want to** export all events at once  
**So that** I don't have to export one by one

**Acceptance Criteria:**
- ✅ "Export All" button at top of table
- ✅ Disabled if no events in table
- ✅ Click opens modal with same options (Google/iCal)
- ✅ For Google Cal: Open multiple tabs (or single link if API supports batch)
- ✅ For iCal: Single `.ics` file with all events
- ✅ Success message: "X events exported"
- ✅ Activity log: "Exported 5 events to iCal"

---

### Epic 4: Privacy & Security

#### US-4.1: Clear Privacy Messaging
**As a** user  
**I want to** know my data is safe  
**So that** I feel comfortable uploading sensitive schedules

**Acceptance Criteria:**
- ✅ Privacy banner visible on first visit
- ✅ Text: "🔒 Your privacy matters. Images processed locally, never stored on our servers."
- ✅ "Learn More" link opens privacy modal
- ✅ Banner dismissible (persisted in localStorage)
- ✅ Privacy statement in footer
- ✅ No cookies, no tracking, no analytics (or explicit consent)

**Privacy Modal Content:**
- How it works (client-side processing)
- What data is sent to LLM (image only, temporarily)
- What we don't do (store images, track users)
- Data retention: Zero (sessionStorage cleared on close)

---

#### US-4.2: Client-Side Only Image Handling
**As a** system  
**I want to** process images entirely client-side  
**So that** user data never touches our servers (except LLM API)

**Acceptance Criteria:**
- ✅ Image stored in `sessionStorage` (max 5MB)
- ✅ No server upload endpoint for images
- ✅ LLM API call sends image as base64 in request body
- ✅ SessionStorage cleared on page unload
- ✅ "Clear Data" button to manually wipe sessionStorage
- ✅ Activity log never contains image data

**Technical:**
- Use `FileReader.readAsDataURL()` for base64 encoding
- Check `sessionStorage` size before storing
- Clear on `window.onbeforeunload`

---

### Epic 5: Localization & Accessibility

#### US-5.1: Language Toggle (EN/ID)
**As a** user  
**I want to** switch between English and Bahasa Indonesia  
**So that** I can use the app in my preferred language

**Acceptance Criteria:**
- ✅ Language toggle in header (🌐 icon + dropdown)
- ✅ Options: English, Bahasa Indonesia
- ✅ All UI text updates immediately
- ✅ Preference saved in localStorage
- ✅ Default: Browser language (fallback to English)
- ✅ Date/time formats respect locale

**Localized Strings:**
- Upload instructions
- Button labels
- Error messages
- Privacy text
- Tooltips
- Activity log messages

---

#### US-5.2: Responsive Design
**As a** user on mobile  
**I want the** app to work well on my phone  
**So that** I can use it anywhere

**Acceptance Criteria:**
- ✅ Mobile (< 768px): Single column, stacked layout
- ✅ Tablet (768-1023px): Optimized 2-column
- ✅ Desktop (≥ 1024px): Full 3-column table
- ✅ Touch targets ≥ 44x44px on mobile
- ✅ No horizontal scroll
- ✅ Readable text sizes (min 16px body)
- ✅ Tested on: iPhone, Android, iPad, Desktop

---

#### US-5.3: Accessibility Compliance
**As a** user with disabilities  
**I want the** app to be accessible  
**So that** I can use it independently

**Acceptance Criteria:**
- ✅ WCAG 2.1 AA compliant
- ✅ Keyboard navigation works (Tab, Enter, ESC)
- ✅ Screen reader tested (NVDA/VoiceOver)
- ✅ Color contrast ≥ 4.5:1
- ✅ Focus indicators visible
- ✅ Alt text on images
- ✅ ARIA labels on icon buttons
- ✅ Form labels properly associated

---

### Epic 6: Observability & Error Handling

#### US-6.1: Activity Log for Debugging
**As a** developer/user  
**I want to** see what the system is doing  
**So that** I can debug issues

**Acceptance Criteria:**
- ✅ Activity log visible at bottom (collapsible)
- ✅ Timestamped entries (HH:MM:SS)
- ✅ Logs key events:
  - Image uploaded (size)
  - OCR started
  - Events detected (count)
  - API errors
  - User actions (edit, delete, export)
- ✅ Color-coded: Info (gray), Success (green), Error (red)
- ✅ Max 50 entries (oldest removed)
- ✅ "Copy Log" button for support
- ✅ Never logs sensitive data (image content, personal info)

---

#### US-6.2: Error Recovery
**As a** user  
**I want** clear error messages and recovery options  
**So that** I know what to do when something fails

**Acceptance Criteria:**
- ✅ LLM API timeout → "Processing took too long. Try again?"
- ✅ LLM API error → "Could not analyze image. Check format and try again."
- ✅ Invalid image format → "Please upload PNG, JPG, or JPEG"
- ✅ File too large → "Max file size: 10MB"
- ✅ No events detected → "No schedule found. Try a clearer image."
- ✅ Network error → "Connection lost. Check internet and retry."
- ✅ Each error shows "Retry" button
- ✅ Activity log records all errors

---

## Non-Functional Requirements

### Performance
- **Page Load:** < 2 seconds (LCP)
- **Image Upload:** Visual feedback within 200ms
- **LLM Processing:** < 30 seconds (target), 60s max
- **Table Rendering:** < 500ms for 20 events
- **Export Click:** Calendar link opens within 1s

### Security
- **No server-side image storage**
- **HTTPS only** (enforce in production)
- **CSP headers** to prevent XSS
- **No third-party tracking scripts**
- **LLM API key secured** (environment variable, never client-exposed)

### Scalability
- **Client-side processing** → No server load
- **LLM API rate limit:** Handle 429 errors gracefully
- **SessionStorage limit:** 5MB max per image
- **Cost control:** Log LLM usage, warn if high

### Browser Support
- **Chrome:** Latest 2 versions
- **Safari:** Latest 2 versions (iOS + macOS)
- **Firefox:** Latest 2 versions
- **Edge:** Latest 2 versions

---

## Out of Scope (v1)

- ❌ User accounts / authentication
- ❌ Saving/managing multiple schedules
- ❌ Server-side persistence
- ❌ Batch processing (multiple images)
- ❌ OCR training/customization
- ❌ Integration with Outlook Calendar
- ❌ Dark mode (nice-to-have for v2)
- ❌ PDF support (images only)

---

## Success Metrics

### Primary
- **Conversion Rate:** % of uploads that result in export
- **Accuracy Rate:** % of correctly extracted events (user feedback)
- **Time to Export:** Avg time from upload to first export

### Secondary
- **Error Rate:** % of failed LLM API calls
- **Retry Rate:** % of users who retry after error
- **Language Usage:** EN vs ID preference

---

*PRD v1.0 — CalSnap*
