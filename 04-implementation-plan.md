# CalSnap - Implementation Plan

## Technology Stack

### Frontend Framework

**Vite + Vanilla JavaScript** (or React if preferred)

- Reason: Lightweight, fast, no framework overhead for simple SPA
- Alternative: Next.js if SSR/SEO needed (likely not for tool-first app)

### Styling

**Tailwind CSS**

- Utility-first for rapid development
- Built-in responsive utilities
- Easy dark mode support (future)

### LLM Vision API

**qwen/qwen3-vl-235b-a22b-instruct**

- OCR + table structure understanding
- JSON output capability
- Reliable date/time extraction
- Use open router to run the model

### Storage

**SessionStorage** (client-side only)

- No backend database
- Cleared on browser close
- 5-10MB limit (sufficient for images)

### Calendar Export

- **Google Calendar:** URL scheme (`calendar.google.com/render`)
- **Apple Calendar:** `.ics` file generation (RFC 5545)

### Deployment

- **Vercel** or **Netlify** (static hosting)
- **Cloudflare Pages** (if need edge functions)
- Environment variable for LLM API key

---

## Phase 1: Core Upload & Processing (Week 1)

### 1.1 Project Setup

```bash
npm create vite@latest calsnap -- --template vanilla
cd calsnap
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**Install Dependencies:**

```bash
npm install lucide  # Icons
npm install date-fns # Date formatting
npm install ical-generator # iCal file generation
```

**Project Structure:**

```
calsnap/
├── index.html
├── src/
│   ├── main.js
│   ├── styles.css
│   ├── components/
│   │   ├── UploadZone.js
│   │   ├── ProcessingState.js
│   │   ├── ResultsTable.js
│   │   ├── ExportModal.js
│   │   ├── ActivityLog.js
│   │   └── LanguageToggle.js
│   ├── lib/
│   │   ├── llm.js           # LLM API calls
│   │   ├── calendar.js      # Calendar link generation
│   │   ├── storage.js       # SessionStorage utils
│   │   └── i18n.js          # Localization
│   └── utils/
│       ├── validators.js
│       └── logger.js
├── public/
│   └── favicon.ico
└── package.json
```

---

### 1.2 Upload Component

**File:** `src/components/UploadZone.js`

**Features:**

- Drag & drop zone
- Click to browse
- File validation (type, size)
- Preview after upload
- Loading state

**Implementation:**

```javascript
export class UploadZone {
  constructor(onUpload) {
    this.onUpload = onUpload;
    this.render();
    this.attachListeners();
  }

  render() {
    return `
      <div id="upload-zone" class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-500 transition cursor-pointer">
        <svg class="mx-auto h-16 w-16 text-gray-400">...</svg>
        <p class="mt-4 text-lg font-medium" data-i18n="upload.title">
          Drag & drop your schedule image
        </p>
        <p class="mt-2 text-sm text-gray-500" data-i18n="upload.subtitle">
          or click to browse
        </p>
        <p class="mt-4 text-xs text-gray-400" data-i18n="upload.tip">
          💡 Tip: Calendar or table format works best
        </p>
        <input type="file" accept="image/png,image/jpeg,image/jpg" class="hidden" id="file-input">
      </div>
    `;
  }

  attachListeners() {
    const zone = document.getElementById('upload-zone');
    const input = document.getElementById('file-input');

    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('bg-blue-50', 'border-blue-500');
    });
    zone.addEventListener('dragleave', () => {
      zone.classList.remove('bg-blue-50', 'border-blue-500');
    });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.handleFile(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', (e) => {
      this.handleFile(e.target.files[0]);
    });
  }

  handleFile(file) {
    // Validation
    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      showError('Invalid file type. Use PNG or JPG.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showError('File too large. Max 10MB.');
      return;
    }

    // Read as base64
    const reader = new FileReader();
    reader.onload = (e) => {
      this.onUpload(e.target.result, file.name, file.size);
    };
    reader.readAsDataURL(file);
  }
}
```

---

### 1.3 LLM Integration

**File:** `src/lib/llm.js`

**Function:**

```javascript
export async function analyzeScheduleImage(base64Image) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const prompt = `Analyze this schedule image and extract calendar events.
  
  Instructions:
  1. Identify table structure or calendar layout
  2. Extract each event with: activity name, date, start time, end time (if available)
  3. Return JSON array: [{ "activity": string, "date": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM" }]
  4. If date is ambiguous, use best guess based on context
  5. If time is missing, use null
  
  Return ONLY valid JSON, no markdown or explanations.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
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
      max_tokens: 1000,
      temperature: 0.1
    })
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;

  // Parse JSON from response
  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('No events detected in image');
  }

  return JSON.parse(jsonMatch[0]);
}
```

---

### 1.4 SessionStorage Management

**File:** `src/lib/storage.js`

```javascript
export const storage = {
  saveImage(base64Data) {
    try {
      sessionStorage.setItem('calsnap_image', base64Data);
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        throw new Error('Image too large for browser storage');
      }
      throw e;
    }
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
    sessionStorage.removeItem('calsnap_image');
    sessionStorage.removeItem('calsnap_events');
  }
};

// Clear on page unload
window.addEventListener('beforeunload', () => {
  storage.clear();
});
```

---

## Phase 2: Results Table & Editing (Week 2)

### 2.1 Results Table Component

**File:** `src/components/ResultsTable.js`

**Features:**

- Render events as table (desktop) or cards (mobile)
- Inline editing (activity, date, time)
- Action buttons (recurring, delete, export)

**Structure:**

```javascript
export class ResultsTable {
  constructor(events, onUpdate) {
    this.events = events;
    this.onUpdate = onUpdate;
  }

  render() {
    return `
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Activity
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date & Time
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            ${this.events.map((event, idx) => this.renderRow(event, idx)).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  renderRow(event, idx) {
    return `
      <tr data-event-id="${idx}">
        <td class="px-6 py-4">
          <input 
            type="text" 
            value="${event.activity}" 
            class="border-0 bg-transparent focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            data-field="activity"
          />
        </td>
        <td class="px-6 py-4">
          <input 
            type="datetime-local" 
            value="${this.formatDateTime(event.date, event.startTime)}"
            class="border rounded px-2 py-1"
            data-field="datetime"
          />
        </td>
        <td class="px-6 py-4 flex gap-2">
          <button class="btn-icon" data-action="recurring" title="Set recurring">
            🔁
          </button>
          <button class="btn-icon" data-action="delete" title="Delete">
            🗑️
          </button>
          <button class="btn-icon" data-action="export" title="Export">
            📤
          </button>
        </td>
      </tr>
    `;
  }

  formatDateTime(date, time) {
    return `${date}T${time || '12:00'}`;
  }
}
```

---

### 2.2 Calendar Export

**File:** `src/lib/calendar.js`

```javascript
import ical from 'ical-generator';

export function generateGoogleCalendarLink(event) {
  const { activity, date, startTime, endTime, recurring } = event;

  const start = new Date(`${date}T${startTime}`);
  const end = endTime ? new Date(`${date}T${endTime}`) : new Date(start.getTime() + 60 * 60 * 1000); // +1 hour default

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: activity,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
  });

  if (recurring) {
    params.append('recur', getRecurrenceRule(recurring));
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function generateICalFile(events) {
  const calendar = ical({ name: 'CalSnap Export' });

  events.forEach(event => {
    const start = new Date(`${event.date}T${event.startTime}`);
    const end = event.endTime 
      ? new Date(`${event.date}T${event.endTime}`)
      : new Date(start.getTime() + 60 * 60 * 1000);

    calendar.createEvent({
      start,
      end,
      summary: event.activity,
      repeating: event.recurring ? { freq: event.recurring.toUpperCase() } : null
    });
  });

  return calendar.toString();
}

function formatGoogleDate(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function getRecurrenceRule(type) {
  const rules = {
    daily: 'RRULE:FREQ=DAILY',
    weekly: 'RRULE:FREQ=WEEKLY',
    monthly: 'RRULE:FREQ=MONTHLY',
    yearly: 'RRULE:FREQ=YEARLY'
  };
  return rules[type.toLowerCase()] || '';
}
```

---

## Phase 3: Localization & Polish (Week 3)

### 3.1 i18n Setup

**File:** `src/lib/i18n.js`

```javascript
const translations = {
  en: {
    'upload.title': 'Drag & drop your schedule image',
    'upload.subtitle': 'or click to browse',
    'upload.tip': '💡 Tip: Calendar or table format works best',
    'privacy.banner': '🔒 Your privacy matters. Images processed locally, never stored.',
    'table.activity': 'Activity',
    'table.dateTime': 'Date & Time',
    'table.actions': 'Actions',
    'export.title': 'Export to Calendar',
    'export.google': 'Google Calendar',
    'export.apple': 'Apple Calendar (iCal)',
    // ... more strings
  },
  id: {
    'upload.title': 'Seret & lepas gambar jadwal Anda',
    'upload.subtitle': 'atau klik untuk memilih',
    'upload.tip': '💡 Tips: Format kalender atau tabel paling baik',
    'privacy.banner': '🔒 Privasi Anda penting. Gambar diproses lokal, tidak disimpan.',
    'table.activity': 'Aktivitas',
    'table.dateTime': 'Tanggal & Waktu',
    'table.actions': 'Aksi',
    'export.title': 'Ekspor ke Kalender',
    'export.google': 'Google Calendar',
    'export.apple': 'Apple Calendar (iCal)',
    // ... more strings
  }
};

export class I18n {
  constructor() {
    this.locale = localStorage.getItem('calsnap_locale') || navigator.language.startsWith('id') ? 'id' : 'en';
  }

  t(key) {
    return translations[this.locale][key] || key;
  }

  setLocale(locale) {
    this.locale = locale;
    localStorage.setItem('calsnap_locale', locale);
    this.updateDOM();
  }

  updateDOM() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
  }
}
```

---

### 3.2 Activity Log

**File:** `src/components/ActivityLog.js`

```javascript
export class ActivityLog {
  constructor() {
    this.logs = [];
    this.maxLogs = 50;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('en-GB');
    const entry = { timestamp, message, type };
    
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    this.render();
  }

  render() {
    const container = document.getElementById('activity-log');
    if (!container) return;

    container.innerHTML = `
      <div class="border-t border-gray-200 bg-gray-50 p-4">
        <div class="flex justify-between items-center mb-2">
          <h3 class="text-sm font-semibold text-gray-700">📊 Activity Log</h3>
          <button id="toggle-log" class="text-xs text-gray-500 hover:text-gray-700">
            Hide
          </button>
        </div>
        <div class="bg-white rounded border border-gray-200 p-3 max-h-48 overflow-y-auto font-mono text-xs">
          ${this.logs.map(log => `
            <div class="${this.getLogColor(log.type)}">
              <span class="text-gray-500">[${log.timestamp}]</span>
              ${log.message}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  getLogColor(type) {
    const colors = {
      info: 'text-gray-700',
      success: 'text-green-600',
      error: 'text-red-600',
      warning: 'text-yellow-600'
    };
    return colors[type] || colors.info;
  }
}

// Singleton instance
export const logger = new ActivityLog();
```

---

## Phase 4: Testing & Deployment (Week 4)

### 4.1 Testing Checklist

**Manual Testing:**

- [ ] Upload PNG/JPG/JPEG
- [ ] Reject unsupported formats
- [ ] Reject files > 10MB
- [ ] Drag & drop works
- [ ] Mobile camera capture (if supported)
- [ ] LLM processes image correctly
- [ ] Events extracted accurately (test 5+ different schedule formats)
- [ ] Table renders on desktop
- [ ] Cards render on mobile
- [ ] Inline editing works
- [ ] Date/time picker works
- [ ] Recurring dropdown works
- [ ] Delete with confirmation works
- [ ] Export to Google Calendar works
- [ ] Export to iCal works (.ics file downloads)
- [ ] Bulk export works
- [ ] Language toggle works
- [ ] Privacy banner dismisses
- [ ] Activity log records events
- [ ] SessionStorage cleared on close
- [ ] Works on Chrome, Safari, Firefox, Edge
- [ ] Works on iOS Safari, Android Chrome
- [ ] Keyboard navigation works
- [ ] Screen reader announces changes

**Accessibility Audit:**

- [ ] Run Lighthouse accessibility scan (score ≥ 90)
- [ ] Test with NVDA/VoiceOver
- [ ] Check color contrast (use WebAIM checker)
- [ ] Verify focus indicators
- [ ] Test keyboard-only usage

---

### 4.2 Environment Setup

**`.env` file:**

```
VITE_OPENAI_API_KEY=sk-...
VITE_APP_NAME=CalSnap
VITE_MAX_FILE_SIZE=10485760
```

**`.gitignore`:**

```
node_modules/
dist/
.env
.DS_Store
```

---

### 4.3 Deployment (Vercel)

**Install Vercel CLI:**

```bash
npm install -g vercel
```

**Deploy:**

```bash
vercel --prod
```

**Environment Variables (Vercel Dashboard):**

- `VITE_OPENAI_API_KEY`

**Domain:**

- Custom domain or `calsnap.vercel.app`

---

## Estimated Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1** | 1 week | Upload + LLM processing working |
| **Phase 2** | 1 week | Table editing + export working |
| **Phase 3** | 1 week | Localization + activity log done |
| **Phase 4** | 1 week | Testing + deployed to production |

**Total:** 4 weeks (1 developer, full-time)

---

## Cost Estimate

### LLM API (OpenAI GPT-4 Vision)

- **Cost per image:** ~$0.01 - $0.05 (depending on size)
- **Expected usage:** 100 images/day = $1-5/day = $30-150/month
- **Mitigation:** Rate limiting, caching common schedules

### Hosting (Vercel Free Tier)

- **Cost:** $0/month (adequate for MVP)
- **Upgrade:** $20/month if traffic > 100GB bandwidth

**Total Monthly Cost (MVP):** $30-150

---

*Implementation Plan v1.0 — CalSnap*
