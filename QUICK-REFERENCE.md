# CalSnap - AI Coding Agent Quick Reference

*For use with Antigravity, Cursor, or similar agentic coding IDEs*

---

## 🎯 Core Implementation Instructions

### Project Setup
```bash
# Initialize Vite project
npm create vite@latest calsnap -- --template vanilla
cd calsnap

# Install dependencies
npm install lucide date-fns ical-generator

# Install Tailwind
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Environment Variables
Create `.env`:
```
VITE_OPENAI_API_KEY=sk-...
VITE_MAX_FILE_SIZE=10485760
```

---

## 📐 Design Tokens

### Colors (Tailwind)
```javascript
// Primary: blue-500 (#3B82F6)
// Accent: emerald-500 (#10B981)
// Background: gray-50 (#F9FAFB)
// Text: gray-900 (#111827)
```

### Typography
```javascript
// Font: 'Inter', system-ui, sans-serif
// Body: 16px / 1rem
// H1: 36px / 2.25rem (font-bold)
// H2: 24px / 1.5rem (font-semibold)
```

### Spacing
```javascript
// Touch targets (mobile): min 44x44px
// Padding: p-4 (1rem), p-6 (1.5rem)
// Gap: gap-2 (0.5rem), gap-4 (1rem)
```

---

## 🧩 Component Checklist

### 1. UploadZone
**File:** `src/components/UploadZone.js`

**Must have:**
- [ ] Dashed border, rounded corners
- [ ] Drag-over state (blue bg)
- [ ] File input (hidden)
- [ ] Validation (PNG/JPG/JPEG, max 10MB)
- [ ] Error display
- [ ] Instructional text with i18n

**Acceptance:**
- Click opens file picker
- Drag & drop works
- Invalid files show error
- Valid files trigger `onUpload` callback

---

### 2. ProcessingState
**File:** `src/components/ProcessingState.js`

**Must have:**
- [ ] Spinner/loading animation
- [ ] "Analyzing..." text
- [ ] Image preview
- [ ] Progress message
- [ ] Timeout handling (60s)

**Acceptance:**
- Shows immediately after upload
- Image preview visible
- Updates to results on success
- Shows error on failure

---

### 3. ResultsTable
**File:** `src/components/ResultsTable.js`

**Must have:**
- [ ] Desktop: 3-column table
- [ ] Mobile: Stacked cards
- [ ] Inline edit (activity)
- [ ] Date/time picker
- [ ] Action buttons (recurring, delete, export)
- [ ] Empty state

**Acceptance:**
- Renders all extracted events
- Edits save on blur
- Delete removes row
- Export opens modal

---

### 4. ExportModal
**File:** `src/components/ExportModal.js`

**Must have:**
- [ ] Overlay backdrop
- [ ] Two options: Google Cal, iCal
- [ ] Close button
- [ ] Click option opens calendar/downloads

**Acceptance:**
- Google Cal opens in new tab
- iCal triggers download
- Modal closes on success

---

### 5. ActivityLog
**File:** `src/components/ActivityLog.js`

**Must have:**
- [ ] Collapsible section
- [ ] Timestamped entries
- [ ] Monospace font
- [ ] Max 50 entries
- [ ] Color-coded (info/success/error)

**Acceptance:**
- Logs all major events
- Auto-scrolls to latest
- No sensitive data logged

---

### 6. LanguageToggle
**File:** `src/components/LanguageToggle.js`

**Must have:**
- [ ] Globe icon + dropdown
- [ ] EN / ID options
- [ ] Updates all i18n text
- [ ] Saves to localStorage

**Acceptance:**
- Toggle switches language instantly
- Preference persists on reload

---

## 🔌 Core Functions

### LLM API Call
```javascript
// src/lib/llm.js
export async function analyzeScheduleImage(base64Image) {
  const prompt = `Extract calendar events from this image.
Return JSON: [{ "activity": "", "date": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM" }]`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4-vision-preview',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: base64Image } }
          ]
        }
      ],
      max_tokens: 1000
    })
  });

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content.match(/\[[\s\S]*\]/)[0]);
}
```

---

### Google Calendar Export
```javascript
// src/lib/calendar.js
export function generateGoogleCalendarLink(event) {
  const start = new Date(`${event.date}T${event.startTime}`);
  const end = event.endTime 
    ? new Date(`${event.date}T${event.endTime}`)
    : new Date(start.getTime() + 3600000); // +1hr

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.activity,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`
  });

  return `https://calendar.google.com/calendar/render?${params}`;
}

function formatGoogleDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}
```

---

### iCal Export
```javascript
import ical from 'ical-generator';

export function generateICalFile(events) {
  const calendar = ical({ name: 'CalSnap Export' });
  
  events.forEach(event => {
    calendar.createEvent({
      start: new Date(`${event.date}T${event.startTime}`),
      end: new Date(`${event.date}T${event.endTime || event.startTime}`),
      summary: event.activity
    });
  });

  return calendar.toString();
}
```

---

### SessionStorage Management
```javascript
// src/lib/storage.js
export const storage = {
  saveImage(base64) {
    sessionStorage.setItem('calsnap_image', base64);
  },
  
  getImage() {
    return sessionStorage.getItem('calsnap_image');
  },
  
  saveEvents(events) {
    sessionStorage.setItem('calsnap_events', JSON.stringify(events));
  },
  
  getEvents() {
    const data = sessionStorage.getItem('calsnap_events');
    return data ? JSON.parse(data) : [];
  },
  
  clear() {
    sessionStorage.clear();
  }
};

window.addEventListener('beforeunload', () => storage.clear());
```

---

## 🌐 i18n Structure

```javascript
// src/lib/i18n.js
const translations = {
  en: {
    'upload.title': 'Drag & drop your schedule',
    'upload.tip': '💡 Tip: Calendar format works best',
    'privacy.banner': '🔒 Images processed locally, never stored',
    'table.activity': 'Activity',
    'export.title': 'Export to Calendar',
    'export.google': 'Google Calendar',
    'export.apple': 'Apple Calendar'
  },
  id: {
    'upload.title': 'Seret & lepas jadwal Anda',
    'upload.tip': '💡 Tips: Format kalender paling baik',
    'privacy.banner': '🔒 Gambar diproses lokal, tidak disimpan',
    'table.activity': 'Aktivitas',
    'export.title': 'Ekspor ke Kalender',
    'export.google': 'Google Calendar',
    'export.apple': 'Apple Calendar'
  }
};

export const i18n = {
  locale: localStorage.getItem('calsnap_locale') || 'en',
  t(key) {
    return translations[this.locale][key] || key;
  },
  setLocale(locale) {
    this.locale = locale;
    localStorage.setItem('calsnap_locale', locale);
  }
};
```

---

## ✅ Pre-Flight Checklist

Before considering Phase X complete:

### Phase 1: Upload & Processing
- [ ] Upload zone renders
- [ ] Can upload PNG/JPG
- [ ] LLM API call works
- [ ] Events extracted and returned
- [ ] Activity log shows steps

### Phase 2: Results & Export
- [ ] Table displays events
- [ ] Can edit activity/date/time
- [ ] Can delete events
- [ ] Google Cal export works
- [ ] iCal export works

### Phase 3: Polish
- [ ] Language toggle works
- [ ] All text translated
- [ ] Privacy banner shows
- [ ] Activity log collapsible
- [ ] Responsive on mobile

### Phase 4: Testing & Deploy
- [ ] Tested on Chrome, Safari, Firefox
- [ ] Tested on iOS Safari, Android Chrome
- [ ] Keyboard navigation works
- [ ] Deployed to Vercel
- [ ] Environment variables set

---

## 🚨 Common Pitfalls

### 1. SessionStorage Quota
**Problem:** Image too large for sessionStorage  
**Solution:** Compress with canvas before storing
```javascript
const compressed = await compressImage(base64, 0.8);
storage.saveImage(compressed);
```

### 2. LLM Returns Invalid JSON
**Problem:** Response has markdown or extra text  
**Solution:** Regex extract JSON array
```javascript
const jsonMatch = content.match(/\[[\s\S]*\]/);
const events = JSON.parse(jsonMatch[0]);
```

### 3. iCal Download Not Working on iOS
**Problem:** Safari blocks programmatic download  
**Solution:** Use `a` tag with `download` attribute
```javascript
const a = document.createElement('a');
a.href = URL.createObjectURL(blob);
a.download = 'events.ics';
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
```

### 4. Date/Time Ambiguity
**Problem:** "03/04/26" unclear (Mar 4 vs Apr 3)  
**Solution:** Instruct LLM to output ISO 8601
```
"Return dates in YYYY-MM-DD format"
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile: < 768px */
.results { grid-template-columns: 1fr; }

/* Tablet: 768-1023px */
.results { grid-template-columns: 1fr 1fr; }

/* Desktop: ≥ 1024px */
.results { grid-template-columns: 2fr 1fr 1fr; }
```

---

## 🎨 CSS Utility Classes (Tailwind)

```html
<!-- Upload Zone -->
<div class="border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-500 transition cursor-pointer">

<!-- Primary Button -->
<button class="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">

<!-- Secondary Button -->
<button class="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50">

<!-- Icon Button -->
<button class="w-10 h-10 flex items-center justify-center rounded-md hover:bg-gray-100">

<!-- Input -->
<input class="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500">

<!-- Table -->
<table class="min-w-full divide-y divide-gray-200">
<thead class="bg-gray-50">
<tbody class="bg-white divide-y divide-gray-200">
```

---

## 🔧 Debug Commands

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check bundle size
npm run build && ls -lh dist/assets/
```

---

## ✨ Final Tips

1. **Start with Phase 1** — Get upload + LLM working first
2. **Test early on mobile** — Don't wait until end
3. **Use activity log liberally** — Helps debug LLM issues
4. **Compress images** — Prevents sessionStorage errors
5. **Handle errors gracefully** — Every API call can fail
6. **Test with real schedules** — Not just perfect examples
7. **Check accessibility** — Run Lighthouse audit

---

**Now go build CalSnap! 🚀**

*Refer back to full documents for detailed specs.*
