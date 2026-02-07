# CalSnap - Design Guidelines

## Design Principles

### 1. Privacy First
- **Never persist uploaded images** (client-side only)
- Clear privacy messaging upfront
- Transparent about what happens to data

### 2. Progressive Disclosure
- Start simple (upload screen)
- Show complexity only when needed (editing table)
- Guide users step-by-step

### 3. Mobile-First Responsive
- Primary use case: mobile photo → calendar
- Desktop as enhanced experience
- Touch-friendly targets (min 44x44px)

### 4. Feedback at Every Step
- Loading states
- Success confirmations
- Error recovery
- Process visibility (logs)

---

## Layout Structure

### Mobile (< 768px)
```
┌─────────────────┐
│   Header        │
│   [Logo] [Lang] │
├─────────────────┤
│                 │
│  Main Content   │
│  (Full Width)   │
│                 │
├─────────────────┤
│   Footer        │
└─────────────────┘
```

### Desktop (≥ 768px)
```
┌──────────────────────────────────┐
│   Header  [Logo]        [Lang]   │
├──────────────────────────────────┤
│                                  │
│         Main Content             │
│       (Max 1200px center)        │
│                                  │
├──────────────────────────────────┤
│   Footer (Privacy • How it Works)│
└──────────────────────────────────┘
```

---

## Component Design

### 1. Upload Zone

**States:**
- **Idle**: Dashed border, upload icon, instructional text
- **Hover**: Solid border, highlight
- **Drag Over**: Filled background (blue-50)
- **Processing**: Loading spinner, "Analyzing..."
- **Error**: Red border, error message

**Design:**
```
┌─────────────────────────────────┐
│       📸                        │
│   Drag & drop your schedule     │
│         or click to browse      │
│                                 │
│   💡 Tip: Calendar/table format │
│      works best                 │
└─────────────────────────────────┘
```

**Mobile Adaptation:**
- Smaller upload zone
- Larger tap target
- Camera button (if supported)

---

### 2. Privacy Banner

**Position:** Below header, dismissible

**Design:**
```
┌────────────────────────────────────────┐
│ 🔒 Your privacy matters                │
│ Images processed locally, never stored │
│ [Learn More]              [✕ Dismiss]  │
└────────────────────────────────────────┘
```

**Colors:**
- Background: `blue-50`
- Border: `blue-200`
- Icon: `blue-600`

---

### 3. Results Table

**Desktop:**
```
┌────────────────────────────────────────────────────────┐
│ Activity         │ Date & Time    │ Actions           │
├────────────────────────────────────────────────────────┤
│ Team Meeting     │ Mar 15, 10:00  │ [🔁] [🗑️] [📤]  │
│ (editable)       │ (editable)     │                   │
├────────────────────────────────────────────────────────┤
│ Project Review   │ Mar 16, 14:00  │ [🔁] [🗑️] [📤]  │
└────────────────────────────────────────────────────────┘
```

**Mobile:**
```
┌─────────────────────────────┐
│ Team Meeting                │
│ Mar 15, 2026 • 10:00 AM    │
│ [🔁 Recurring] [🗑️] [📤]   │
├─────────────────────────────┤
│ Project Review              │
│ Mar 16, 2026 • 2:00 PM     │
│ [🔁] [🗑️] [📤]              │
└─────────────────────────────┘
```

**Interaction:**
- **Activity**: Inline edit (click to edit)
- **Date/Time**: Date/time picker
- **Recurring**: Dropdown (Daily/Weekly/Monthly/Yearly)
- **Delete**: Confirm dialog
- **Export**: Modal with Google Cal / iCal options

---

### 4. Action Buttons

**Primary (Export)**
```css
background: blue-600
color: white
padding: 12px 24px
border-radius: 8px
font-weight: 600
```

**Secondary (Recurring, Delete)**
```css
background: white
border: 1px gray-300
color: gray-700
padding: 8px 16px
border-radius: 6px
```

**Icon Buttons**
```css
size: 40x40px (mobile)
size: 36x36px (desktop)
border-radius: 6px
hover: background gray-100
```

---

### 5. Tooltips

**Trigger:** Hover (desktop) / Tap (mobile)

**Design:**
```
┌────────────────────┐
│ Set recurring event│
│ (Daily/Weekly...)  │
└─────▼──────────────┘
   [🔁]
```

**Style:**
- Background: `gray-900`
- Text: `white`
- Padding: `8px 12px`
- Border-radius: `6px`
- Arrow: 8px triangle

---

### 6. Modal (Export Options)

**Design:**
```
┌──────────────────────────────┐
│ Export to Calendar      [✕]  │
├──────────────────────────────┤
│                              │
│ Choose calendar app:         │
│                              │
│ ┌──────────────────────────┐ │
│ │  📅 Google Calendar      │ │
│ └──────────────────────────┘ │
│                              │
│ ┌──────────────────────────┐ │
│ │  🍎 Apple Calendar (iCal)│ │
│ └──────────────────────────┘ │
│                              │
│          [Cancel]            │
└──────────────────────────────┘
```

**Behavior:**
- Click option → Opens calendar link
- Auto-close on success
- Overlay: `black/50` backdrop

---

### 7. Activity Log (Observability)

**Position:** Bottom of page, collapsible

**Design:**
```
┌────────────────────────────────────┐
│ 📊 Activity Log          [▼ Hide] │
├────────────────────────────────────┤
│ [10:30:15] Image uploaded (1.2MB) │
│ [10:30:17] OCR started...         │
│ [10:30:20] Detected 5 events      │
│ [10:30:22] Table rendered         │
└────────────────────────────────────┘
```

**Style:**
- Font: Monospace
- Background: `gray-50`
- Text: `gray-700`
- Max height: `200px` (scrollable)
- Timestamps: `gray-500`

---

## Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 767px) {
  - Single column layout
  - Full-width components
  - Larger touch targets
  - Stacked action buttons
}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {
  - 2-column table (Activity | Date+Actions)
  - Side-by-side modals
}

/* Desktop */
@media (min-width: 1024px) {
  - 3-column table
  - Hover states
  - Inline tooltips
  - Max width: 1200px centered
}
```

---

## Micro-interactions

### 1. Upload Success
- ✅ Check icon animation (scale + fade in)
- Green glow effect
- Haptic feedback (mobile)

### 2. Processing
- Pulsing blue dot
- Rotating spinner
- Progress text updates

### 3. Delete Confirmation
- Shake animation on row
- Slide out + fade

### 4. Export Success
- Confetti animation (subtle)
- Success toast (3s auto-dismiss)

---

## Dark Mode (Optional, Future)

Not required for v1, but design with dark mode in mind:
- Use semantic color variables
- Avoid hardcoded hex values
- Test contrast ratios in both modes

---

## Accessibility Checklist

- [ ] All images have `alt` text
- [ ] Form inputs have labels
- [ ] Buttons have descriptive text
- [ ] Focus visible on all interactive elements
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Color not sole indicator
- [ ] ARIA labels where needed

---

*Design guidelines v1.0 — CalSnap*
