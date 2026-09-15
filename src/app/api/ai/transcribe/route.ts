import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /api/ai/transcribe
 * Real Speech-to-Text handler supporting Indian regional languages (Malayalam, Hindi, Tamil, Telugu, Kannada, English)
 * via OpenAI or Groq Whisper API.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;
    const language = (formData.get('language') as string) || 'en';

    if (!file || !(file instanceof Blob) || file.size === 0) {
      return NextResponse.json(
        { error: 'No audio file provided or recording was empty.' },
        { status: 400 }
      );
    }

    // Limit audio file size to 25MB (Whisper API limit)
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'Audio recording exceeds the 25MB size limit.' },
        { status: 400 }
      );
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!openAiKey && !groqKey) {
      return NextResponse.json(
        {
          error:
            'Speech-to-text API key is not configured. Please add OPENAI_API_KEY or GROQ_API_KEY to your .env.local file.',
          code: 'API_KEY_MISSING',
        },
        { status: 400 }
      );
    }

    // Map language code to standard ISO 639-1 code
    const langMap: Record<string, string> = {
      ml: 'ml', // Malayalam
      hi: 'hi', // Hindi
      ta: 'ta', // Tamil
      te: 'te', // Telugu
      kn: 'kn', // Kannada
      en: 'en', // English
    };
    const targetLang = langMap[language] || 'en';

    // Build standard Whisper API payload
    const whisperFormData = new FormData();
    // Use proper audio filename with extension
    const extension = file.type.includes('wav')
      ? 'wav'
      : file.type.includes('mp4')
      ? 'mp4'
      : file.type.includes('ogg')
      ? 'ogg'
      : 'webm';

    whisperFormData.append('file', file, `recording.${extension}`);
    whisperFormData.append('language', targetLang);

    let apiUrl = 'https://api.openai.com/v1/audio/transcriptions';
    let apiKey = openAiKey;
    let model = 'whisper-1';

    if (!openAiKey && groqKey) {
      apiUrl = 'https://api.groq.com/openai/v1/audio/transcriptions';
      apiKey = groqKey;
      model = 'whisper-large-v3';
    }

    whisperFormData.append('model', model);
    whisperFormData.append('response_format', 'json');

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: whisperFormData,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Whisper STT API error:', res.status, errText);
      return NextResponse.json(
        {
          error: `Speech-to-text service error (${res.status}): ${errText || res.statusText}`,
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    const transcribedText = data.text || '';

    if (!transcribedText.trim()) {
      return NextResponse.json(
        {
          error: 'No discernible speech was detected in the recording. Please speak clearly into the microphone and try again.',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text: transcribedText.trim(),
      language: targetLang,
      provider: openAiKey ? 'openai' : 'groq',
    });
  } catch (error: any) {
    console.error('Transcribe route exception:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error while processing audio recording.' },
      { status: 500 }
    );
  }
}
