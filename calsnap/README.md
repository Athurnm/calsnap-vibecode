# CalSnap 📸📅

Turn your schedule screenshots into a digital calendar instantly using AI. Processed securely via OpenRouter with no personal data stored on our servers.

## Features

- **AI-Powered Extraction** - Upload a screenshot of your schedule and let AI extract all events
- **Smart Date Parsing** - Detects date ranges (e.g., "Dec 1-3") automatically
- **Recurring Events** - Set events to repeat Daily, Weekly, or Monthly
- **Multiple AI Models** - Choose between **Qwen 2.5 VL** (High Accuracy) or **Gemini 2.0 Flash** (Fast Speed)
- **Inline Editing** - Edit dates, times, activity names, and recurrence rules directly in the browser
- **Export Options**
  - Direct Google Calendar links with pre-filled details (including recurrence)
  - Download .ics file compatible with Outlook, Apple Calendar, and Google Calendar
- **User-Friendly Interface**
  - Toast notifications for actions
  - Auto-scroll to newly added events
  - Helpful tooltips and import guides for Android/iOS
- **Privacy Focused** - No backend database; your schedule data lives only in your browser session

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React, Sonner (Toasts)
- **AI**: OpenRouter API (Access to top-tier Vision Models)
- **Calendar**: ical-generator for .ics file creation

## Getting Started

### Prerequisites

- Node.js (LTS version)
- OpenRouter API key ([Get one here](https://openrouter.ai/))

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd calsnap
```

1. Install dependencies

```bash
npm install
```

1. Create a `.env` file in the root directory

```env
VITE_OPENROUTER_API_KEY=your_api_key_here
```

1. Start the development server

```bash
npm run dev
```

1. Build for production

```bash
npm run build
```

## Usage

1. **Select AI Model** - Use the tooltip to guide your choice (Qwen for complex layouts, Gemini for speed).
2. **Upload Image** - Drag and drop or click to upload a schedule screenshot.
3. **Review & Edit** - The AI extracts events. You can:
    - Click dates to set **Date Ranges** or **Recurrence** (Daily/Weekly/Monthly).
    - Edit activity names and times inline.
    - Duplicate or delete events.
4. **Export** -
    - Click the Google Calendar icon for individual events.
    - Click **Download Calendar (.ics)** for the full schedule.
    - Use the "How do I use this file?" guide for iPhone/Android specific instructions.

## Project Structure

```text
calsnap/
├── src/
│   ├── components/
│   │   ├── UploadZone.tsx      # File upload interface
│   │   ├── ProcessingState.tsx # Loading states with tips
│   │   └── ResultsTable.tsx    # Event table with inline editing & recurrence
│   ├── lib/
│   │   ├── llm.ts              # AI integration with retry logic
│   │   ├── export.ts           # Calendar export utilities (GCal/ICS)
│   │   └── storage.ts          # Session storage management
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── App.tsx                 # Main application logic
│   └── main.tsx                # Entry point
├── .env                        # Environment variables (not in git)
└── package.json
```

## Privacy & Security

- **Data Handling**: Images are processed via OpenRouter's API for extraction only.
- **No Storage**: We do not store your images or schedule data on any backend server.
- **Local Session**: Your extracted events persist in your browser's local storage for convenience until you close the tab or click "Start Over".

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
