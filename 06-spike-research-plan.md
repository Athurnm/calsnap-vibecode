# CalSnap - Spike & Research Plan

## Research Areas Requiring Investigation

These are technical unknowns that need exploration before/during implementation.

---

## Spike 1: LLM Vision Model Selection & Accuracy

### Goal

Determine which LLM Vision API provides best accuracy for schedule OCR at lowest cost.

### Questions

1. **OpenAI GPT-4 Vision vs Google Gemini Vision vs Anthropic Claude 3 Vision**
   - Which is most accurate for table/calendar extraction?
   - Which handles ambiguous dates/times best?
   - Cost comparison per image?

2. **Prompt Engineering**
   - What prompt structure yields most consistent JSON output?
   - How to handle different schedule formats (table vs calendar grid)?
   - Should we use few-shot examples?

3. **Error Handling**
   - How often do models fail to detect any events?
   - What edge cases cause problems? (handwriting, low contrast, rotated images)

### Hypothesis

- **GPT-4 Vision** will have highest accuracy but highest cost
- **Gemini Vision** will be good balance of accuracy/cost
- Prompt with structured JSON schema + examples will improve consistency

### Experiment Plan

**Test Dataset:**

- 20 sample schedule images:
  - 5 calendar grids (month view)
  - 5 weekly tables
  - 5 class schedules
  - 5 meeting agendas

**Metrics:**

- **Accuracy:** % of correctly extracted events (date, time, activity)
- **Precision:** % of extracted events that are real (no hallucinations)
- **Recall:** % of real events that were detected
- **Cost:** Total API cost for 20 images
- **Speed:** Average processing time

**Test Code:**

```javascript
const testModels = [
  { name: 'GPT-4 Vision', endpoint: 'openai', model: 'gpt-4-vision-preview' },
  { name: 'Gemini Vision', endpoint: 'google', model: 'gemini-pro-vision' },
  { name: 'Claude 3', endpoint: 'anthropic', model: 'claude-3-opus' }
];

const prompts = [
  'basic', // Simple instruction
  'structured', // With JSON schema
  'few-shot' // With 2 examples
];

for (const model of testModels) {
  for (const prompt of prompts) {
    const results = await testScheduleExtraction(model, prompt, testDataset);
    console.log({ model, prompt, ...results });
  }
}
```

**Deliverable:**

- Google Sheet with results: Model | Prompt | Accuracy | Cost | Speed
- Recommendation: Which model + prompt to use

**Estimated Time:** 2 days

---

## Spike 2: SessionStorage Limits & Image Compression

### Goal

Understand browser sessionStorage limits and optimal image compression strategy.

### Questions

1. **Storage Limits**
   - What is actual sessionStorage limit per browser? (5MB? 10MB?)
   - How does base64 encoding affect size? (~33% overhead)
   - Can we store 10MB images reliably?

2. **Compression Strategy**
   - Should we compress images client-side before storage?
   - What quality/size trade-off preserves OCR accuracy?
   - Use canvas API for resizing? Or library like `browser-image-compression`?

3. **Fallback**
   - If storage fails, should we skip caching and re-upload to LLM on retry?
   - Or use IndexedDB as fallback?

### Hypothesis

- SessionStorage limit varies by browser (5-10MB)
- Compressing to 1-2MB maintains OCR accuracy
- Canvas API compression is sufficient (no library needed)

### Experiment Plan

**Test browsers:**

- Chrome
- Safari (iOS + macOS)
- Firefox
- Edge

**Test cases:**

```javascript
const testCases = [
  { size: '1MB', base64: true },
  { size: '5MB', base64: true },
  { size: '10MB', base64: true },
  { size: '5MB', compressed: 'canvas', quality: 0.8 },
  { size: '10MB', compressed: 'canvas', quality: 0.7 }
];

for (const test of testCases) {
  try {
    sessionStorage.setItem('test', generateTestImage(test));
    console.log('✅ Success:', test);
  } catch (e) {
    console.log('❌ Failed:', test, e.name);
  }
}
```

**OCR Accuracy Test:**

- Take 1 high-res schedule image (5MB)
- Compress to: 2MB, 1MB, 500KB
- Send all versions to LLM Vision
- Compare extracted events

**Deliverable:**

- Browser compatibility table
- Recommended compression: quality level + max dimensions
- Code snippet for compression function

**Estimated Time:** 1 day

---

## Spike 3: Calendar Export URL Schemes & iCal Generation

### Goal

Validate that Google Calendar and Apple Calendar URL schemes work reliably across platforms.

### Questions

1. **Google Calendar URL**
   - Does `calendar.google.com/render` work on mobile?
   - How to handle recurring events? (RRULE format)
   - Timezone handling?

2. **iCal (.ics) File**
   - Does `ical-generator` library work well?
   - Can we trigger download on iOS Safari?
   - Does iOS Calendar auto-import .ics files?

3. **Cross-platform**
   - What if user is on Android but wants Apple Calendar?
   - Should we detect OS and show relevant options only?

### Hypothesis

- Google Calendar URL works universally
- iCal download works on desktop, might need special handling on iOS
- OS detection improves UX (only show relevant options)

### Experiment Plan

**Test Matrix:**

```text
| Device        | Browser | Export Type | Expected Result       |
|---------------|---------|-------------|-----------------------|
| iPhone        | Safari  | Google Cal  | Opens in Safari → GCal|
| iPhone        | Safari  | iCal        | Downloads → Cal opens |
| Android       | Chrome  | Google Cal  | Opens in Chrome → GCal|
| Android       | Chrome  | iCal        | Downloads, manual open|
| macOS         | Chrome  | Google Cal  | Opens in new tab      |
| macOS         | Safari  | iCal        | Downloads → Cal opens |
| Windows       | Chrome  | iCal        | Downloads, manual open|
```

**Test Event:**

```javascript
const testEvent = {
  title: 'Test Meeting',
  date: '2026-03-20',
  startTime: '14:00',
  endTime: '15:00',
  recurring: 'weekly'
};
```

**Code to test:**

```javascript
// Google Calendar
const googleUrl = generateGoogleCalendarLink(testEvent);
window.open(googleUrl, '_blank');

// iCal
const icsContent = generateICalFile([testEvent]);
const blob = new Blob([icsContent], { type: 'text/calendar' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'event.ics';
a.click();
```

**Deliverable:**

- Working export functions for both formats
- Device/browser specific handling (if needed)
- Fallback UX for unsupported cases

**Estimated Time:** 1 day

---

## Spike 4: Multilingual Date/Time Parsing

### Goal

Ensure date/time extraction works for both English and Bahasa Indonesia schedules.

### Questions

1. **LLM Language Support**
   - Can GPT-4 Vision extract dates from Indonesian text?
   - Example: "Senin, 20 Maret 2026, Pukul 14:00"
   - Should we specify language in prompt?

2. **Date Parsing**
   - Use `date-fns` with locale support?
   - Or rely on LLM to always output ISO 8601 format?

3. **Ambiguity**
   - How to handle "03/04/26" (March 4 or April 3? US vs EU format)
   - Should we ask user for date format preference?

### Hypothesis

- LLM can handle Indonesian text if prompted correctly
- Instructing LLM to output ISO 8601 avoids parsing issues
- User locale (browser language) can hint at date format

### Experiment Plan

**Test Images:**

- 5 English schedules
- 5 Indonesian schedules ("Senin, Selasa, Rabu..." day names)

**Prompt Variants:**

```text
A) "Extract events and return dates in YYYY-MM-DD format"
B) "Extract events. The image may be in English or Indonesian. Return dates in ISO 8601 format"
C) "Language: [auto-detect]. Extract events with ISO 8601 dates"
```

**Accuracy Metric:**

- % of correctly parsed dates
- % of correctly parsed times

**Deliverable:**

- Optimal prompt for multilingual support
- Decision: Use LLM output directly or add client-side parsing?

**Estimated Time:** 1 day

---

## Spike 5: Mobile Performance & Battery Impact

### Goal

Ensure app is performant on low-end mobile devices without draining battery.

### Questions

1. **Image Compression on Mobile**
   - Does canvas compression slow down old phones?
   - Should we reduce max upload size on mobile?

2. **API Call Duration**
   - LLM API call can take 30-60s. Does this drain battery?
   - Can we show battery-friendly "put phone down" message?

3. **Memory Usage**
   - Does storing 5MB base64 image in sessionStorage cause issues?
   - Monitor memory usage during processing

### Hypothesis

- Compression is fast enough (<2s on low-end devices)
- Long API call doesn't significantly drain battery (network idle)
- Memory usage is fine if we clear sessionStorage immediately after use

### Experiment Plan

**Test Devices:**

- iPhone SE (2020) - low-end iOS
- Samsung Galaxy A12 - low-end Android
- iPhone 13 Pro - high-end iOS
- Pixel 6 - high-end Android

**Metrics:**

- **Compression Time:** How long to resize 10MB → 2MB?
- **Memory Usage:** Before/after image storage
- **Battery Drain:** % battery lost during 5-minute session
- **UI Responsiveness:** Any jank during processing?

**Test Code:**

```javascript
performance.mark('compression-start');
const compressed = await compressImage(largeImage);
performance.mark('compression-end');
const duration = performance.measure('compression', 'compression-start', 'compression-end');
console.log('Compression took:', duration.duration, 'ms');
```

**Deliverable:**

- Performance baseline for each device tier
- Recommendations for max image size (mobile vs desktop)
- UX improvements (show "Processing..." with estimate)

**Estimated Time:** 2 days

---

## Spike 6: Error Rate & Cost Monitoring

### Goal

Build observability to track LLM API usage and errors in production.

### Questions

1. **Logging Strategy**
   - What events should we log?
   - Where to store logs? (Client-side activity log only? Or send to server?)

2. **Cost Tracking**
   - How to estimate LLM API cost per session?
   - Should we warn users if usage is high?

3. **Error Patterns**
   - What % of images fail to process?
   - Common error types? (timeout, invalid format, no events)

### Hypothesis

- Client-side activity log is sufficient for MVP
- Cost tracking can be done by counting API calls (no server needed)
- Error rate will be < 10% with good prompts

### Experiment Plan

**Log Events:**

```javascript
const LOG_EVENTS = [
  'image_uploaded',
  'llm_api_started',
  'llm_api_success',
  'llm_api_error',
  'events_detected',
  'event_edited',
  'event_deleted',
  'event_exported'
];
```

**Mock 100 Sessions:**

- Simulate variety of images (good, bad, edge cases)
- Track success/error rates
- Calculate cost

**Deliverable:**

- Activity log implementation (already in implementation plan)
- Optional: Simple analytics (local storage counters)
- Cost estimate dashboard (optional)

**Estimated Time:** 1 day

---

## Prioritized Spike Order

1. **Spike 1 (LLM Selection)** — CRITICAL, do first
2. **Spike 3 (Calendar Export)** — CRITICAL, do first
3. **Spike 2 (Storage/Compression)** — HIGH, needed for MVP
4. **Spike 4 (Multilingual)** — MEDIUM, can test during dev
5. **Spike 5 (Mobile Performance)** — MEDIUM, test on real devices
6. **Spike 6 (Monitoring)** — LOW, implement as we go

**Total Spike Time:** 8 days (can parallelize some)

---

## Risk Mitigation

### Risk 1: LLM API is too expensive

**Mitigation:**

- Set daily rate limit (e.g., 100 images/day)
- Show "API limit reached" message
- Consider caching common schedule formats

### Risk 2: OCR accuracy is poor

**Mitigation:**

- Provide manual edit tools (already planned)
- Allow users to report bad extractions
- Iterate on prompt engineering

### Risk 3: Calendar export doesn't work on some devices

**Mitigation:**

- Fallback: Copy event details as text
- Provide manual entry instructions

### Risk 4: Privacy concerns from users

**Mitigation:**

- Clear messaging (no storage)
- Open source code (transparency)
- Privacy policy page

---

*Spike & Research Plan v1.0 — CalSnap*
