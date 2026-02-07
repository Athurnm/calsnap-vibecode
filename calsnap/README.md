# CalSnap 📸📅

Turn your schedule screenshots into a digital calendar instantly using AI.

## Features

- **AI-Powered Extraction** - Upload a screenshot of your schedule and let AI extract all events
- **Multiple AI Models** - Choose between Google Gemini 2.0 Flash or Qwen 3 VL for analysis
- **Inline Editing** - Edit all event details directly in the results table
- **All-Day Events** - Support for both timed and all-day events
- **Export Options**
  - Direct Google Calendar links for each event
  - Download .ics file for Outlook, Apple Calendar, or Google Calendar
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Session Persistence** - Your events are saved in the browser session

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: OpenRouter API (Google Gemini / Qwen models)
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

1. **Select AI Model** - Choose between Google or Qwen on the landing page
2. **Upload Image** - Drag and drop or click to upload a schedule screenshot
3. **Review & Edit** - The AI extracts events which you can edit inline
4. **Export** - Use Google Calendar links or download .ics file

## Project Structure

```
calsnap/
├── src/
│   ├── components/
│   │   ├── UploadZone.tsx      # File upload interface
│   │   ├── ProcessingState.tsx # Loading states
│   │   └── ResultsTable.tsx    # Event table with editing
│   ├── lib/
│   │   ├── llm.ts              # AI integration with retry logic
│   │   ├── export.ts           # Calendar export utilities
│   │   └── storage.ts          # Session storage management
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── App.tsx                 # Main application
│   └── main.tsx                # Entry point
├── .env                        # Environment variables (not in git)
└── package.json
```

## Features in Detail

### AI Model Selection

- **Google Gemini 2.0 Flash**: Fast and accurate for most schedules
- **Qwen 3 VL**: Alternative model with different strengths

### Event Editing

- Click on date/time to open popover editor
- Toggle between timed and all-day events
- Edit activity names, notes, and times inline
- Duplicate or delete events with one click

### Export Options

- **Google Calendar**: Direct link opens GCal with pre-filled event
- **ICS Download**: Universal format for all calendar apps
- Supports both timed and all-day events

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
