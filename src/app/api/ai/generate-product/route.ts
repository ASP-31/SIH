import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * POST /api/ai/generate-product
 * Uses LLM to turn raw artisan voice transcription (in Indian vernaculars or English)
 * into a structured e-commerce product catalog listing.
 */
export async function POST(request: NextRequest) {
  try {
    const { transcription, language } = await request.json();

    if (!transcription || typeof transcription !== 'string' || !transcription.trim()) {
      return NextResponse.json(
        { error: 'Transcription text is required.' },
        { status: 400 }
      );
    }

    const openAiKey = process.env.OPENAI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

    // System prompt enforcing structured JSON extraction
    const systemPrompt = `You are an expert artisan e-commerce catalog assistant for "Tote", an Indian platform empowering handcrafted tote bag weavers and artisans.
Given the artisan's voice description (which may be in Malayalam, Hindi, Tamil, Telugu, Kannada, or English), extract and create structured product catalog details.

Return STRICT JSON with the following schema:
{
  "title": "A captivating, respectful artisan tote bag title in English (e.g. 'Hand-Woven Indigo French Linen Tote')",
  "description": "Rich, poetic yet informative e-commerce description preserving their genuine craft heritage, natural dyeing, and weaving details.",
  "category": "One of: 'Canvas', 'Crochet', 'Everyday', 'Heavy-Duty', 'Work & Laptop', 'Eco Linen'",
  "price": (number in INR, extract if spoken or recommend reasonable artisan fair-trade price between 1200 and 2800),
  "material": "Specific fabric/fiber details (e.g. '16oz Organic Duck Canvas & Brass Rivets')",
  "dimensions": "e.g. '38cm x 40cm x 10cm'",
  "capacity_liters": (number between 12 and 22),
  "strap_drop": "e.g. '28cm'"
}

Do NOT output markdown code fences or conversational text. Output only valid JSON.`;

    let generatedJson: any = null;

    if (openAiKey) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Artisan Speech (Language: ${language || 'Vernacular'}):\n"${transcription}"` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;
        if (rawContent) {
          generatedJson = JSON.parse(rawContent);
        }
      }
    } else if (groqKey) {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Artisan Speech (Language: ${language || 'Vernacular'}):\n"${transcription}"` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;
        if (rawContent) {
          generatedJson = JSON.parse(rawContent);
        }
      }
    } else if (geminiKey) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: `${systemPrompt}\n\nArtisan Speech (Language: ${language || 'Vernacular'}):\n"${transcription}"` },
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          generatedJson = JSON.parse(rawText);
        }
      }
    }

    // If no external AI key is configured or AI call returned null,
    // construct intelligent vernacular-based catalog fields
    if (!generatedJson) {
      const isPriceSpoken = transcription.match(/(?:rs|inr|rupees|₹|രൂപ|रुपये|ரூபாய்)\s*(\d+)/i) ||
                            transcription.match(/(\d+)\s*(?:rs|inr|rupees|₹|രൂപ|रुपये|ரூபாய்)/i);
      const extractedPrice = isPriceSpoken ? parseInt(isPriceSpoken[1], 10) : 1750;

      const isLinen = /linen|ലിനൻ|सन/i.test(transcription);
      const isCrochet = /crochet|knit|തയ്യൽ|क्रोशिए/i.test(transcription);
      const isJute = /jute|ചണം|जूट/i.test(transcription);

      const category = isLinen ? 'Eco Linen' : isCrochet ? 'Crochet' : isJute ? 'Everyday' : 'Canvas';
      const material = isLinen
        ? 'Pure Handloom Flax Linen with French Seams'
        : isCrochet
        ? 'Hand-Crocheted Organic Cotton Yarn'
        : isJute
        ? 'Sun-Dried Natural Jute & Cotton Twill Trim'
        : '16oz Heavy-Duty Duck Canvas & Vegetable Leather';

      generatedJson = {
        title: `Artisan Handcrafted ${category} Tote`,
        description: transcription,
        category,
        price: extractedPrice || 1750,
        material,
        dimensions: '38cm x 40cm x 10cm',
        capacity_liters: 16,
        strap_drop: '28cm',
      };
    }

    return NextResponse.json({
      success: true,
      product: generatedJson,
    });
  } catch (error: any) {
    console.error('Generate product AI error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate product catalog data from voice input.' },
      { status: 500 }
    );
  }
}
