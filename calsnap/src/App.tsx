import { useState, useEffect } from 'react';
import { useLanguage } from './context/LanguageContextCore';
import { LanguageToggle } from './components/LanguageToggle';
import { UploadZone } from './components/UploadZone';
import { InputMethodToggle } from './components/InputMethodToggle';
import { TextInputZone } from './components/TextInputZone';
import { ProcessingState } from './components/ProcessingState';
import { ResultsTable } from './components/ResultsTable';
import { ActivityLog } from './components/ActivityLog';
import { logger } from './lib/logger';
import { analyzeScheduleImage, analyzeScheduleText, MODEL_OPTIONS } from './lib/llm';
import type { ModelOption } from './lib/llm';
import { storage } from './lib/storage';
import { generateIcsFile } from './lib/export';
import type { CalendarEvent } from './types';
import { Toaster, toast } from 'sonner';
import { Info, HelpCircle, ChevronDown, ChevronUp, Download } from 'lucide-react';
import posthog from 'posthog-js';
import { PRICING } from './lib/llm';

// Initialize PostHog
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST;

if (POSTHOG_KEY && typeof window !== 'undefined') {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    capture_pageview: false // We verify manually
  });
}

function App() {
  const { t } = useLanguage();
  const [appState, setAppState] = useState<'upload' | 'processing' | 'results'>('upload');
  const [inputMethod, setInputMethod] = useState<'image' | 'text'>('image');
  const [processingStatus, setProcessingStatus] = useState<'uploading' | 'analyzing' | 'extracting'>('analyzing');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelOption>('qwen');
  const [showImportHelp, setShowImportHelp] = useState(false);

  useEffect(() => {
    // Register super properties
    posthog.register({ product: 'calsnap' });

    // Track pageview on mount
    posthog.capture('$pageview');

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

      const { events: extractedEvents, usage } = await analyzeScheduleImage(base64, apiKey, selectedModel);

      // Calculate Cost
      let cost = 0;
      if (usage) {
        const pricing = PRICING[selectedModel];
        const inputCost = (usage.prompt_tokens / 1_000_000) * pricing.input;
        const outputCost = (usage.completion_tokens / 1_000_000) * pricing.output;
        cost = inputCost + outputCost;
      }

      // Track Event
      posthog.capture('process_completed', {
        type: 'image',
        model: selectedModel,
        tokens_input: usage?.prompt_tokens ?? 0,
        tokens_output: usage?.completion_tokens ?? 0,
        total_tokens: usage?.total_tokens ?? 0,
        cost_usd: cost,
        event_count: extractedEvents.length
      });

      storage.saveEvents(extractedEvents);
      setEvents(extractedEvents);
      setAppState('results');
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      setError(errorMessage);
      logger.error(errorMessage);
      setAppState('upload');
    }
  };

  const handleTextAnalyze = async (text: string) => {
    setAppState('processing');
    setProcessingStatus('analyzing');

    try {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) throw new Error('API Configuration Error: No API key found.');

      const { events: extractedEvents, usage } = await analyzeScheduleText(text, apiKey, selectedModel);

      // Calculate Cost
      let cost = 0;
      if (usage) {
        const pricing = PRICING[selectedModel];
        const inputCost = (usage.prompt_tokens / 1_000_000) * pricing.input;
        const outputCost = (usage.completion_tokens / 1_000_000) * pricing.output;
        cost = inputCost + outputCost;
      }

      // Track Event
      posthog.capture('process_completed', {
        type: 'text',
        model: selectedModel,
        tokens_input: usage?.prompt_tokens ?? 0,
        tokens_output: usage?.completion_tokens ?? 0,
        total_tokens: usage?.total_tokens ?? 0,
        cost_usd: cost,
        event_count: extractedEvents.length
      });

      storage.saveEvents(extractedEvents);
      setEvents(extractedEvents);
      setAppState('results');
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze text';
      setError(errorMessage);
      logger.error(errorMessage);
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
    toast.success('Event deleted successfully!');
  };

  const handleDuplicateEvent = (index: number) => {
    const eventToCopy = events[index];
    const newEvents = [...events];
    newEvents.splice(index + 1, 0, { ...eventToCopy });
    setEvents(newEvents);
    storage.saveEvents(newEvents);
    toast.success('Event duplicated successfully!');
  };

  const handleAddEvent = () => {
    const today = new Date().toISOString().split('T')[0];
    const newEvent: CalendarEvent = {
      activity: 'New Event',
      date: today,
      startTime: null, // All-day by default
      endTime: null,
      location: '',
      notes: '',
      recurrence: 'none'
    };
    const newEvents = [...events, newEvent];
    setEvents(newEvents);
    storage.saveEvents(newEvents);

    // Show success toast
    toast.success('Event added successfully!');

    // Trigger scroll to new event
    setTimeout(() => {
      const tableContainer = document.querySelector('[data-table-container]');
      if (tableContainer) {
        tableContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
  };

  const handleDownloadIcs = async () => {
    try {
      await generateIcsFile(events);
      posthog.capture('ics_downloaded', {
        event_count: events.length
      });
    } catch (e) {
      console.error('Failed to generate ICS file:', e);
      setError('Failed to download calendar file.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
      <Toaster position="top-right" richColors />
      <ActivityLog />
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center relative">
          <div className="absolute top-0 right-0">
            <LanguageToggle />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl mb-4">
            {t('app.title').replace('Snap', '')}<span className="text-blue-600">Snap</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('app.subtitle')}
          </p>
        </header>

        <main className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-12 min-h-[400px] flex items-center justify-center relative">
          {error && (
            <div className="absolute top-4 left-4 right-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {appState === 'upload' && (
            <div className="w-full max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Model Selector */}
              <div className="mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    {t('model.title')}
                  </label>
                  <div className="group relative">
                    <Info size={16} className="text-gray-400 hover:text-blue-500 cursor-help" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg cursor-help">
                      <p className="font-semibold mb-1">{t('model.tooltip.title')}</p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><strong>Qwen 2.5 VL</strong>: {t('model.tooltip.qwen').replace('Qwen 2.5 VL: ', '')}</li>
                        <li><strong>Gemini 2.0 Flash</strong>: {t('model.tooltip.gemini').replace('Gemini 2.0 Flash: ', '')}</li>
                      </ul>
                      <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                </div>

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

              <InputMethodToggle
                method={inputMethod}
                onChange={(method) => {
                  setInputMethod(method);
                  if (method === 'text') {
                    setSelectedModel('google');
                  }
                }}
              />

              {inputMethod === 'image' ? (
                <UploadZone
                  onFileSelect={handleFileSelect}
                  isProcessing={false}
                  error={error || undefined}
                />
              ) : (
                <TextInputZone
                  onAnalyze={handleTextAnalyze}
                  isProcessing={false}
                />
              )}
            </div>
          )}

          {appState === 'processing' && (
            <ProcessingState status={processingStatus} />
          )}

          {appState === 'results' && (
            <div className="w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                  <div className="p-3 bg-green-50 text-green-700 rounded-lg inline-flex items-center gap-2 text-sm font-medium w-full sm:w-auto justify-center sm:justify-start">
                    <span>{t('results.foundEvents').replace('{count}', events.length.toString())}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium animate-pulse w-full sm:w-auto justify-center sm:justify-start">
                    <HelpCircle size={14} className="flex-shrink-0" />
                    <span>{t('results.reviewHint')}</span>
                  </div>
                </div>
                <button
                  onClick={handleStartOver}
                  className="text-sm text-gray-500 hover:text-gray-700 underline self-end sm:self-auto"
                >
                  {t('action.startOver')}
                </button>
              </div>

              <ResultsTable
                events={events}
                onUpdate={handleUpdateEvent}
                onDelete={handleDeleteEvent}
                onDuplicate={handleDuplicateEvent}
                onAdd={handleAddEvent}
              />

              <div className="mt-8 pt-8 border-t border-gray-100">
                <div className="flex flex-col items-center text-center max-w-2xl mx-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('results.ready')}</h3>
                  <p className="text-gray-500 mb-6 text-sm">
                    {t('results.download_metrics')}
                  </p>

                  <button
                    onClick={handleDownloadIcs}
                    className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
                  >
                    <Download size={20} className="flex-shrink-0" />
                    <span className="truncate">{t('results.download_btn')}</span>
                  </button>

                  <button
                    onClick={() => setShowImportHelp(!showImportHelp)}
                    className="mt-6 flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    {showImportHelp ? t('results.hide_help') : t('results.import_help')}
                    {showImportHelp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  {showImportHelp && (
                    <div className="mt-4 w-full bg-gray-50 rounded-xl p-6 text-left animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Android</span>
                          </h4>
                          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                            <li>Tap <span className="font-medium">Download</span> above.</li>
                            <li>Open the downloaded file from your notification bar or Downloads folder.</li>
                            <li>Tap "Add all" or select specific events to add to your calendar.</li>
                          </ol>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">iPhone / iOS</span>
                          </h4>
                          <ol className="list-decimal list-inside text-sm text-gray-600 space-y-2">
                            <li>Tap <span className="font-medium">Download</span> above.</li>
                            <li>Tap "Add All" in the standard iOS calendar dialog.</li>
                            <li>Choose which calendar to add the events to.</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="mt-12 text-center text-sm text-gray-400 pb-8">
          <div className="mb-2 flex flex-col md:flex-row justify-center items-center gap-1 md:gap-0">
            <span>{t('footer.copyright')}</span>
            <span className="hidden md:inline mx-2 opacity-50">|</span>
            <span>Built with ❤️ by <a href="https://github.com/Athurnm" target="_blank" rel="noopener noreferrer" className="hover:text-blue-500 transition-colors">Athurnm</a></span>
          </div>
          <p className="text-xs text-gray-300">No personal data is stored on our servers.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
