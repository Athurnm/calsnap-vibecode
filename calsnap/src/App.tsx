import { useState, useEffect } from 'react';
import { UploadZone } from './components/UploadZone';
import { ProcessingState } from './components/ProcessingState';
import { ResultsTable } from './components/ResultsTable';
import { analyzeScheduleImage, MODEL_OPTIONS } from './lib/llm';
import type { ModelOption } from './lib/llm';
import { storage } from './lib/storage';
import { generateIcsFile } from './lib/export';
import type { CalendarEvent } from './types';

function App() {
  const [appState, setAppState] = useState<'upload' | 'processing' | 'results'>('upload');
  const [processingStatus, setProcessingStatus] = useState<'uploading' | 'analyzing' | 'extracting'>('analyzing');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelOption>('qwen');

  useEffect(() => {
    try {
      const savedEvents = storage.getEvents();
      if (savedEvents && savedEvents.length > 0) {
        setEvents(savedEvents);
        setAppState('results');
      }
    } catch (e) {
      console.error('Failed to load from storage:', e);
    }
  }, []);

  const handleFileSelect = (file: File) => {
    setError(null);
    processFile(file);
  };

  const processFile = async (file: File) => {
    setAppState('processing');
    setProcessingStatus('uploading');

    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) {
        throw new Error('API Configuration Error: No API key found in environment.');
      }

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      storage.saveImage(base64);
      setProcessingStatus('analyzing');

      const extractedEvents = await analyzeScheduleImage(base64, apiKey, selectedModel);
      storage.saveEvents(extractedEvents);
      setEvents(extractedEvents);
      setAppState('results');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to process image');
      setAppState('upload');
    }
  };

  const handleStartOver = () => {
    setAppState('upload');
    setEvents([]);
    storage.clear();
    setError(null);
  };

  const handleUpdateEvent = (index: number, field: keyof CalendarEvent, value: string | null) => {
    const newEvents = [...events];
    newEvents[index] = { ...newEvents[index], [field]: value };
    setEvents(newEvents);
    storage.saveEvents(newEvents);
  };

  const handleDeleteEvent = (index: number) => {
    const newEvents = events.filter((_, i) => i !== index);
    setEvents(newEvents);
    storage.saveEvents(newEvents);
  };

  const handleDuplicateEvent = (index: number) => {
    const eventToCopy = events[index];
    const newEvents = [...events];
    newEvents.splice(index + 1, 0, { ...eventToCopy });
    setEvents(newEvents);
    storage.saveEvents(newEvents);
  };

  const handleAddEvent = () => {
    const today = new Date().toISOString().split('T')[0];
    const newEvent: CalendarEvent = {
      activity: 'New Event',
      date: today,
      startTime: null, // All-day by default
      endTime: null,
      location: '',
      notes: ''
    };
    const newEvents = [...events, newEvent];
    setEvents(newEvents);
    storage.saveEvents(newEvents);
  };

  const handleDownloadIcs = async () => {
    try {
      await generateIcsFile(events);
    } catch (e) {
      console.error('Failed to generate ICS file:', e);
      setError('Failed to download calendar file.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl mb-4">
            Cal<span className="text-blue-600">Snap</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Turn your schedule screenshots into a digital calendar instantly.
          </p>
        </header>

        <main className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-12 min-h-[400px] flex items-center justify-center relative">
          {error && (
            <div className="absolute top-4 left-4 right-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {appState === 'upload' && (
            <div className="w-full max-w-md mx-auto">
              {/* Model Selector */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                  AI Model
                </label>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {(Object.keys(MODEL_OPTIONS) as ModelOption[]).map((key) => (
                    <button
                      key={key}
                      onClick={() => setSelectedModel(key)}
                      className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${selectedModel === key
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                      {MODEL_OPTIONS[key].label}
                    </button>
                  ))}
                </div>
              </div>

              <UploadZone onFileSelect={handleFileSelect} />
            </div>
          )}

          {appState === 'processing' && (
            <ProcessingState status={processingStatus} />
          )}

          {appState === 'results' && (
            <div className="w-full">
              <div className="flex justify-between items-center mb-6">
                <div className="p-3 bg-green-50 text-green-700 rounded-lg inline-block text-sm font-medium">
                  ✨ Found {events.length} events
                </div>
                <button
                  onClick={handleStartOver}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Start Over
                </button>
              </div>

              <ResultsTable
                events={events}
                onUpdate={handleUpdateEvent}
                onDelete={handleDeleteEvent}
                onDuplicate={handleDuplicateEvent}
                onAdd={handleAddEvent}
              />

              <div className="mt-8 flex flex-col items-center pt-6 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-500 mb-4">
                  Download your schedule as an .ics file to import into Outlook, Apple Calendar, or Google Calendar.
                </p>
                <button
                  onClick={handleDownloadIcs}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                >
                  Download Calendar (.ics)
                </button>
              </div>
            </div>
          )}
        </main>

        <footer className="mt-12 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} CalSnap. All processing happens locally.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
