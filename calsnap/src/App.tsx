import { useState } from 'react';
import { UploadZone } from './components/UploadZone';
import { ProcessingState } from './components/ProcessingState';
import { analyzeScheduleImage } from './lib/llm';
import { storage } from './lib/storage';
import type { CalendarEvent } from './types';

function App() {
  const [appState, setAppState] = useState<'upload' | 'processing' | 'results'>('upload');
  const [processingStatus, setProcessingStatus] = useState<'uploading' | 'analyzing' | 'extracting'>('analyzing');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Initialize state from storage on mount
  useState(() => {
    const savedEvents = storage.getEvents();
    if (savedEvents.length > 0) {
      setEvents(savedEvents);
      setAppState('results');
    }
  });

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

      // Convert to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Save image to session storage
      storage.saveImage(base64);

      setProcessingStatus('analyzing');
      console.log('Starting analysis...');

      const extractedEvents = await analyzeScheduleImage(base64, apiKey);
      console.log('Events extracted:', extractedEvents);

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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto">
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
            <UploadZone onFileSelect={handleFileSelect} />
          )}

          {appState === 'processing' && (
            <ProcessingState status={processingStatus} />
          )}

          {appState === 'results' && (
            <div className="text-center w-full">
              <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-lg inline-block">
                ✨ Found {events.length} events!
              </div>

              <div className="bg-gray-50 rounded-lg p-4 text-left max-h-96 overflow-y-auto mb-6 border border-gray-200">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                  {JSON.stringify(events, null, 2)}
                </pre>
              </div>

              <p className="text-gray-500 mb-6">Full results interface coming in Phase 2.</p>

              <button
                onClick={handleStartOver}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
              >
                Process Another
              </button>
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
