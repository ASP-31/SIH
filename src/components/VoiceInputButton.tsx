'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Globe,
  Loader2,
} from 'lucide-react';

export type SupportedLanguage = 'ml' | 'hi' | 'ta' | 'te' | 'kn' | 'en';

interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeName: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'ml', label: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'en', label: 'English', nativeName: 'English' },
];

interface VoiceInputButtonProps {
  onTranscription: (text: string) => void;
  onProductGenerated?: (productData: any) => void;
  currentValue?: string;
}

export function VoiceInputButton({
  onTranscription,
  onProductGenerated,
  currentValue = '',
}: VoiceInputButtonProps) {
  const [selectedLang, setSelectedLang] = useState<SupportedLanguage>('ml');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingCatalog, setIsGeneratingCatalog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastTranscribedText, setLastTranscribedText] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up timer and media streams on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    // Check browser support
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage('Your browser does not support audio recording. Please use Chrome, Edge, or Safari.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        // Stop all audio stream tracks
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        if (audioBlob.size === 0) {
          setErrorMessage('Empty recording detected. Please try speaking again.');
          return;
        }

        await sendAudioToBackend(audioBlob);
      };

      mediaRecorder.start(250); // Collect data every 250ms
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser settings to use voice input.');
      } else if (err.name === 'NotFoundError') {
        setErrorMessage('No microphone device found. Please connect a microphone.');
      } else {
        setErrorMessage(`Microphone error: ${err.message || 'Could not start audio recording'}`);
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
    setErrorMessage(null);
  };

  const sendAudioToBackend = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('language', selectedLang);

      const res = await fetch('/api/ai/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'API_KEY_MISSING') {
          // Provide clear actionable guidance
          setErrorMessage('Speech-to-text API key (OPENAI_API_KEY or GROQ_API_KEY) is not configured in .env.local.');
        } else {
          setErrorMessage(data.error || 'Failed to transcribe audio.');
        }
        setIsTranscribing(false);
        return;
      }

      const transcribedText = data.text;
      setLastTranscribedText(transcribedText);
      onTranscription(transcribedText);
    } catch (err: any) {
      console.error('Transcription network error:', err);
      setErrorMessage(`Network error during transcription: ${err.message}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleAiAutoFill = async () => {
    const textToUse = currentValue || lastTranscribedText;
    if (!textToUse.trim()) return;

    setIsGeneratingCatalog(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription: textToUse,
          language: selectedLang,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.product) {
        if (onProductGenerated) {
          onProductGenerated(data.product);
        }
      } else {
        setErrorMessage(data.error || 'Could not auto-generate product details.');
      }
    } catch (err: any) {
      console.error('AI Auto-Fill error:', err);
      setErrorMessage(`Failed to auto-generate details: ${err.message}`);
    } finally {
      setIsGeneratingCatalog(false);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Top Bar: Regional Language Selector & Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-amber-800" />
          <span className="font-semibold text-[#71717A] text-[11px]">Speak in:</span>
          <select
            value={selectedLang}
            onChange={(e) => setSelectedLang(e.target.value as SupportedLanguage)}
            disabled={isRecording || isTranscribing}
            className="bg-[#FAFAF8] border border-[#E5E5E0] text-[#18181B] rounded-lg px-2 py-1 text-[11px] font-semibold focus:outline-none focus:border-[#18181B]"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeName} ({l.label})
              </option>
            ))}
          </select>
        </div>

        {/* Action Trigger Buttons */}
        <div className="flex items-center gap-2">
          {!isRecording && !isTranscribing && (
            <button
              type="button"
              onClick={startRecording}
              className="py-1.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
            >
              <Mic className="w-3.5 h-3.5 text-amber-800" />
              <span>{lastTranscribedText ? 'Record Again' : 'Tap to Speak (Voice Input)'}</span>
            </button>
          )}

          {/* Recording State Controls */}
          {isRecording && (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-rose-700 font-bold text-xs bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                Recording... {formatTime(recordingSeconds)}
              </span>

              <button
                type="button"
                onClick={stopRecording}
                className="py-1 px-2.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all"
              >
                <Square className="w-3 h-3 fill-white" />
                <span>Stop</span>
              </button>

              <button
                type="button"
                onClick={cancelRecording}
                className="p-1 rounded-lg text-[#71717A] hover:bg-[#F2F0EB] transition-colors"
                title="Cancel Recording"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Transcribing State */}
          {isTranscribing && (
            <div className="flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 text-xs font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />
              <span>Transcribing vernacular speech...</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Catalog Auto-Fill Trigger Banner (shown once transcription exists) */}
      {(lastTranscribedText || currentValue.length > 15) && !isRecording && !isTranscribing && (
        <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="text-amber-950 font-medium text-[11px]">
              Voice recorded! Auto-generate Title, Category, Material &amp; Price with AI?
            </span>
          </div>

          <button
            type="button"
            onClick={handleAiAutoFill}
            disabled={isGeneratingCatalog}
            className="py-1 px-3 rounded-lg bg-amber-800 hover:bg-amber-900 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-all self-end sm:self-auto whitespace-nowrap active:scale-95 disabled:opacity-50"
          >
            {isGeneratingCatalog ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Analyzing Voice...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3" />
                <span>✨ Auto-Fill Listing Details</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Error Message Display */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-900">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{errorMessage}</p>
            <p className="text-[11px] text-rose-700">
              You can still type your description manually into the box below at any time.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
