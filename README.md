# CalSnap 📸📅

Turn your schedule screenshots into a digital calendar instantly using AI. Processed securely via OpenRouter with no personal data stored on our servers.

## Features

- **AI-Powered Extraction** - Upload a screenshot of your schedule and let AI extract all events.
- **Multiple AI Models** - Choose between **Qwen 2.5 VL** (Default, High Accuracy) or **Gemini 2.0 Flash** (Fast Speed).
- **Smart Date Parsing** - Detects date ranges and automatically formats dates (e.g., "Mon, Dec 1").
- **Smart Event Normalization** - Automatically ensures all non-all-day events have a minimum duration of 15 minutes.
- **Recurring Events** - Set events to repeat Daily, Weekly, or Monthly.
- **Inline Editing** - Edit dates, times, activity names, and recurrence rules directly in the browser.
- **Export Options**
  - **Direct Google Calendar**: One-click export with pre-filled details. Visual feedback (green highlight) indicates exported events.
  - **Download .ics**: Compatible with Outlook, Apple Calendar, and Google Calendar.
- **User-Friendly Interface**
  - Toast notifications for actions.
  - Auto-scroll to newly added events.
  - Helpful tooltips and import guides.
- **SEO Optimized** - Includes Open Graph and Twitter Card tags for better sharing.
- **Privacy Focused** - No backend database; your schedule data lives only in your browser session.

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React, Sonner (Toasts)
- **AI**: OpenRouter API (Access to top-tier Vision Models)
- **Calendar**: ical-generator for .ics file creation, date-fns for manipulation

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

## Deployment

### Vercel

This project is optimized for deployment on Vercel.

1. Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2. Import the project into Vercel.
3. Ensure the **Root Directory** in Vercel settings is set to `calsnap` (if the repo structure has the app in a subdirectory).
4. Add your `VITE_OPENROUTER_API_KEY` in the Vercel Project Settings > Environment Variables.
5. Deploy!

## Project Structure

```text
calsnap/
├── src/
│   ├── components/
│   │   ├── UploadZone.tsx      # File upload interface
│   │   ├── ProcessingState.tsx # Loading states with tips
│   │   └── ResultsTable.tsx    # Event table with inline editing & recurrence
│   ├── lib/
│   │   ├── llm.ts              # AI integration (OpenRouter/Qwen/Gemini)
│   │   ├── export.ts           # Calendar export utilities (GCal/ICS)
│   │   └── storage.ts          # Session storage management
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   ├── App.tsx                 # Main application logic
│   └── main.tsx                # Entry point
├── public/                     # Static assets (Favicons, manifest)
├── .env                        # Environment variables (not in git)
└── package.json
```

## Privacy & Security

- **Data Handling**: Images are processed via OpenRouter's API using third-party LLMs (Google Gemini or Qwen) for extraction only.
- **No Storage**: We do not store your images or schedule data on any backend server.
- **Local Session**: Your extracted events persist in your browser's local storage for convenience until you close the tab or click "Start Over".

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
