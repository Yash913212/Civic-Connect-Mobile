import { GROQ_API_KEY } from '../env';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPTS: Record<string, string> = {
  translate: 'You are a translator. Translate the given text to the requested language. Respond with ONLY the translated text, no explanation.',
  category: 'You are a civic complaint classifier. Given a complaint description, suggest one category from: Pothole, Garbage, Streetlight, Water Leak, Drainage, Other. Respond with ONLY the category name, nothing else.',
  quickReply: 'You are a helpful municipal assistant. Give a concise, friendly response to the citizen\'s query about their civic complaint. Keep it under 3 sentences.',
  generateComplaint: 'You are a citizen reporting a civic issue. Generate a realistic, detailed complaint description in the specified language about a common municipal problem (pothole, garbage, water leak, streetlight, drainage). Write naturally as a citizen would speak. Keep it 1-3 sentences. Respond with ONLY the complaint text, nothing else.',
  analyzeComplaint: 'Analyze the following civic complaint text. Respond with a JSON object containing: category (one of Pothole, Garbage, Streetlight, Water Leak, Drainage, Other), sentiment (positive/neutral/negative), and urgency (low/medium/high/critical). Format: {"category":"...","sentiment":"...","urgency":"..."}',
};

export async function groqChat(
  messages: { role: string; content: string }[],
  maxTokens = 200,
): Promise<string> {
  if (!GROQ_API_KEY) return '';

  try {
    const res = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages,
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    });

    if (!res.ok) return '';

    const json = await res.json();
    return json?.choices?.[0]?.message?.content?.trim() ?? '';
  } catch {
    return '';
  }
}

export async function translateWithGroq(text: string, targetLang: string): Promise<string> {
  const result = await groqChat([
    { role: 'system', content: SYSTEM_PROMPTS.translate },
    { role: 'user', content: `Translate to ${targetLang}: "${text}"` },
  ], 150);
  return result || text;
}

export async function suggestCategoryWithGroq(description: string): Promise<string | null> {
  const result = await groqChat([
    { role: 'system', content: SYSTEM_PROMPTS.category },
    { role: 'user', content: description },
  ], 50);
  const valid = ['Pothole', 'Garbage', 'Streetlight', 'Water Leak', 'Drainage', 'Other'];
  return valid.includes(result) ? result : null;
}

export async function quickReplyWithGroq(query: string): Promise<string | null> {
  const result = await groqChat([
    { role: 'system', content: SYSTEM_PROMPTS.quickReply },
    { role: 'user', content: query },
  ], 200);
  return result || null;
}

export async function generateComplaintText(
  language: string,
  categoryHint?: string,
): Promise<string> {
  const hint = categoryHint ? ` about ${categoryHint}` : '';
  const result = await groqChat([
    { role: 'system', content: SYSTEM_PROMPTS.generateComplaint },
    { role: 'user', content: `Write a complaint in ${language}${hint}.` },
  ], 200);
  if (result) return result;
  // Fallback to language-appropriate default
  const defaults: Record<string, string> = {
    te: 'ma inti mundu roadd lo pedda gunta undi. prayaanikulaki chala ibbandiga undi. tvaraga charyalu tesukondi.',
    hi: 'hamare ghar ke samne sadak par bada gaddha hai. yatayiyon ko bahut pareshani hoti hai. kripya jald se jald karein.',
  };
  return defaults[language] || 'There is a large pothole in front of our house causing traffic issues. Please fix it urgently.';
}

export async function analyzeComplaintWithGroq(
  text: string,
): Promise<{ category: string; sentiment: string; urgency: string } | null> {
  const result = await groqChat([
    { role: 'system', content: SYSTEM_PROMPTS.analyzeComplaint },
    { role: 'user', content: text },
  ], 150);
  if (!result) return null;
  try {
    return JSON.parse(result);
  } catch {
    return null;
  }
}
