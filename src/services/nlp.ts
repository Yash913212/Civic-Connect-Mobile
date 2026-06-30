export type DetectedLanguage = 'en' | 'te' | 'hi' | 'unknown';

const TELUGU_RANGE = /[\u0C00-\u0C7F]/;
const HINDI_RANGE = /[\u0900-\u097F]/;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Pothole: ['pothole', 'road', 'crack', 'deteriorated', 'bump', 'potholes', 'గుంత', 'రోడ్', 'గడ్డ', 'गड्ढा', 'सड़क'],
  Garbage: ['garbage', 'trash', 'waste', 'litter', 'dump', 'rubbish', 'cleaning', 'చెత్త', 'వ్యర్థ', 'कचरा', 'कूड़ा'],
  Streetlight: ['streetlight', 'light', 'lamp', 'dark', 'lighting', 'bulb', 'వీధి దీపం', 'లైట్', 'चिराग', 'बत्ती', 'रोशनी'],
  'Water Leak': ['water', 'leak', 'pipe', 'tap', 'dripping', 'flow', 'నీరు', 'లీక్', 'కుళాయి', 'पानी', 'लीक', 'नल'],
  Drainage: ['drainage', 'drain', 'sewage', 'blocked', 'clogged', 'stagnant', 'డ్రైనేజ్', 'మురుగు', 'नाली', 'गंदा पानी'],
};

const DEPARTMENT_KEYWORDS: Record<string, string[]> = {
  'Roads Department': ['road', 'pothole', 'bridge', 'footpath', 'street', 'रोड', 'सड़क', 'రోడ్'],
  'Sanitation Department': ['garbage', 'trash', 'waste', 'clean', 'sanitation', 'कचरा', 'सफाई', 'చెత్త', 'పరిశుభ్రత'],
  'Water Works': ['water', 'leak', 'pipe', 'tap', 'drinking', 'पानी', 'जल', 'నీరు'],
  'Electricity Department': ['light', 'streetlight', 'power', 'electric', 'wire', 'बिजली', 'लाइट', 'విద్యుత్', 'లైట్'],
};

const SENTIMENT_POSITIVE = ['good', 'great', 'excellent', 'thanks', 'thank', 'fine', 'చక్కగా', 'బాగుంది', 'ధన్యవాదాలు', 'अच्छा', 'बहुत अच्छा', 'धन्यवाद'];
const SENTIMENT_NEGATIVE = ['bad', 'terrible', 'worst', 'horrible', 'broken', 'useless', 'చెడ్డ', 'పనికిరాని', 'खराब', 'बेकार', 'टूटा'];

export function detectLanguage(text: string): DetectedLanguage {
  if (TELUGU_RANGE.test(text)) return 'te';
  if (HINDI_RANGE.test(text)) return 'hi';
  return 'en';
}

export function extractKeywords(text: string): string[] {
  const words = text.toLowerCase().split(/[\s,]+/);
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'and', 'or', 'this', 'that', 'it', 'from']);
  const keywords = words.filter((w) => w.length > 2 && !stopWords.has(w));
  const unique = [...new Set(keywords)];
  const scored = unique.map((w) => ({
    word: w,
    score: keywords.filter((k) => k === w).length,
  }));
  return scored.sort((a, b) => b.score - a.score).slice(0, 8).map((s) => s.word);
}

export function suggestCategory(text: string): { category: string; confidence: number } {
  const lower = text.toLowerCase();
  let bestCategory = 'Other';
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  if (bestScore === 0) {
    return { category: 'Other', confidence: 0.25 };
  }

  const confidence = Math.min(0.5 + bestScore * 0.15, 0.95);
  return { category: bestCategory, confidence: Math.round(confidence * 100) / 100 };
}

export function suggestDepartment(text: string, category: string): { department: string; confidence: number } {
  const lower = text.toLowerCase();
  let bestDept = 'General Services';
  let bestScore = 0;

  for (const [dept, keywords] of Object.entries(DEPARTMENT_KEYWORDS)) {
    const score = keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
    if (score > bestScore) {
      bestScore = score;
      bestDept = dept;
    }
  }

  if (category === 'Pothole') bestDept = 'Roads Department';
  else if (category === 'Garbage') bestDept = 'Sanitation Department';
  else if (category === 'Water Leak') bestDept = 'Water Works';
  else if (category === 'Streetlight') bestDept = 'Electricity Department';

  const confidence = Math.min(0.6 + bestScore * 0.1, 0.95);
  return { department: bestDept, confidence: Math.round(confidence * 100) / 100 };
}

export function detectSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase();
  const posScore = SENTIMENT_POSITIVE.filter((w) => lower.includes(w)).length;
  const negScore = SENTIMENT_NEGATIVE.filter((w) => lower.includes(w)).length;
  if (posScore > negScore) return 'positive';
  if (negScore > posScore) return 'negative';
  return 'neutral';
}

export function extractEntities(text: string): { locations: string[]; issues: string[] } {
  const words = text.split(/[\s,]+/);
  const locations = words.filter((w) => w.length > 3 && /^[A-Z]/.test(w));
  return { locations, issues: [] };
}

export function generatePriority(text: string): { priority: 'low' | 'medium' | 'high' | 'critical'; confidence: number } {
  const lower = text.toLowerCase();
  const urgentWords = ['urgent', 'emergency', 'dangerous', 'accident', 'immediate', 'critical', 'తక్షణ', 'ప్రమాదం', 'आपात', 'खतरनाक'];
  const highWords = ['serious', 'important', 'major', 'severe', 'big', 'ముఖ్యమైన', 'పెద్ద', 'गंभीर', 'महत्वपूर्ण'];

  const urgentScore = urgentWords.filter((w) => lower.includes(w)).length;
  const highScore = highWords.filter((w) => lower.includes(w)).length;

  if (urgentScore > 0) return { priority: 'critical', confidence: 0.85 };
  if (highScore > 1) return { priority: 'high', confidence: 0.75 };
  if (highScore > 0) return { priority: 'medium', confidence: 0.65 };
  return { priority: 'low', confidence: 0.55 };
}

export function generateBotReply(userMessage: string): string {
  const lower = userMessage.toLowerCase();

  if (lower.includes('status') || lower.includes('where') || lower.includes('track')) {
    const match = lower.match(/civ[- ]?\d+/i);
    if (match) return `Your complaint ${match[0].toUpperCase()} is currently being processed. You can check the latest status in the History section.`;
    return 'You can check the status of all your complaints in the History section. Tap the History tile on the home screen.';
  }

  if (lower.includes('submit') || lower.includes('report') || lower.includes('new') || lower.includes('how')) {
    return 'To submit a new complaint, tap the Report Issue card on the home screen or the camera button in the bottom navigation. Fill in the details, add a photo, and submit!';
  }

  if (lower.includes('department') || lower.includes('who') || lower.includes('handle')) {
    if (lower.includes('pothole') || lower.includes('road')) return 'Pothole and road-related issues are handled by the **Roads Department**.';
    if (lower.includes('garbage') || lower.includes('trash') || lower.includes('waste')) return 'Garbage and waste management issues are handled by the **Sanitation Department**.';
    if (lower.includes('water') || lower.includes('leak') || lower.includes('pipe')) return 'Water-related issues like leaks and pipe bursts are handled by **Water Works**.';
    if (lower.includes('light') || lower.includes('streetlight') || lower.includes('electric')) return 'Streetlight and electricity issues are handled by the **Electricity Department**.';
    return 'Different complaints are routed to the appropriate department based on their category. You can see the assigned department in your complaint details.';
  }

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return 'Hello! How can I help you today? You can ask about complaint status, how to submit a report, or which department handles specific issues.';
  }

  if (lower.includes('thank')) {
    return "You're welcome! If you need any more help, feel free to ask. 😊";
  }

  const lang = detectLanguage(userMessage);
  if (lang === 'te') {
    return 'మీ ప్రశ్న నాకు అర్థమైంది. దయచేసి మరింత సమాచారం అందించండి, నేను మీకు సహాయం చేస్తాను.';
  }
  if (lang === 'hi') {
    return 'मैं आपकी मदद कर सकता हूं। कृपया अधिक जानकारी प्रदान करें।';
  }

  return 'I understand your query. Could you please provide more details so I can assist you better? You can also try asking about complaint status, submission, or department info.';
}

export function analyzeComplaint(text: string, category?: string) {
  const language = detectLanguage(text);
  const keywords = extractKeywords(text);
  const suggestedCat = suggestCategory(text);
  const finalCategory = category || suggestedCat.category;
  const dept = suggestDepartment(text, finalCategory);
  const sentiment = detectSentiment(text);
  const priority = generatePriority(text);
  const entities = extractEntities(text);

  return {
    language,
    keywords,
    category: finalCategory,
    categoryConfidence: category ? 1 : suggestedCat.confidence,
    department: dept.department,
    departmentConfidence: dept.confidence,
    sentiment,
    priority: priority.priority,
    priorityConfidence: priority.confidence,
    entities,
  };
}
