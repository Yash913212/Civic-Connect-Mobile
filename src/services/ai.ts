import type { Complaint, User } from '../store/types';
import { detectLanguage, extractKeywords, suggestCategory, suggestDepartment, generatePriority } from './nlp';
import { translateWithGroq, suggestCategoryWithGroq, quickReplyWithGroq, analyzeComplaintWithGroq, groqChat } from './groq';

export async function analyzeComplaintWithAI(
  title: string,
  description: string,
  userCategory?: string
): Promise<{
  category: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  sentiment: 'positive' | 'negative' | 'neutral';
  summary: string;
  municipalNote: string;
  confidence: number;
  language: string;
  keywords: string[];
  suggestedResponse: string;
}> {
  const groqResult = await analyzeComplaintWithGroq(`${title} ${description}`);
  if (groqResult) {
    return {
      category: groqResult.category || 'Other',
      department: suggestDepartment(`${title} ${description}`, groqResult.category || 'Other').department,
      priority: (groqResult.urgency as 'low' | 'medium' | 'high' | 'critical') || 'medium',
      sentiment: (groqResult.sentiment as 'positive' | 'negative' | 'neutral') || 'neutral',
      summary: `${groqResult.category || 'Other'} issue reported: ${title}`,
      municipalNote: `Priority: ${groqResult.urgency?.toUpperCase() || 'MEDIUM'}. Sentiment: ${groqResult.sentiment || 'neutral'}.`,
      confidence: 0.8,
      language: detectLanguage(`${title} ${description}`) === 'te' ? 'Telugu' : detectLanguage(`${title} ${description}`) === 'hi' ? 'Hindi' : 'English',
      keywords: extractKeywords(`${title} ${description}`),
      suggestedResponse: `Thank you for reporting this ${(groqResult.category || 'issue').toLowerCase()}. Our team has been notified.`,
    };
  }
  return analyzeWithNLPFallback(title, description, userCategory);
}

function analyzeWithNLPFallback(
  title: string,
  description: string,
  userCategory?: string
): {
  category: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  sentiment: 'positive' | 'negative' | 'neutral';
  summary: string;
  municipalNote: string;
  confidence: number;
  language: string;
  keywords: string[];
  suggestedResponse: string;
} {
  const text = `${title} ${description}`;
  const lang = detectLanguage(text);
  const keywords = extractKeywords(text);
  const cat = suggestCategory(text);
  const finalCategory = userCategory || cat.category;
  const dept = suggestDepartment(text, finalCategory);
  const priority = generatePriority(text);
  const sentiment = 'neutral';

  return {
    category: finalCategory,
    department: dept.department,
    priority: priority.priority,
    sentiment,
    summary: `${finalCategory} issue reported: ${title}`,
    municipalNote: `OFFICIAL MUNICIPAL WORK ORDER\n\nTO:\n${dept.department}\n\nSUBJECT:\nUrgent Repair Request: ${finalCategory}\n\nDetected Language: ${lang === 'te' ? 'Telugu' : lang === 'hi' ? 'Hindi' : 'English'}\nKeywords: ${keywords.slice(0, 5).join(', ')}\n\nPriority: ${priority.priority.toUpperCase()}`,
    confidence: cat.confidence,
    language: lang === 'te' ? 'Telugu' : lang === 'hi' ? 'Hindi' : 'English',
    keywords,
    suggestedResponse: `Thank you for reporting this ${finalCategory.toLowerCase()} issue. Our ${dept.department} team has been notified and will address it promptly.`,
  };
}

export async function chatWithAI(
  userMessage: string,
  conversationHistory: { sender: string; text: string }[],
  complaints?: Complaint[],
  user?: User | null
): Promise<string> {
  const complaintContext = (complaints || [])
    .slice(0, 5)
    .map((c) => `- #${c.id}: ${c.title} (${c.status}, ${c.priority} priority, department: ${c.department})`)
    .join('\n');

  const systemPrompt = `You are Civic Connect Assistant, an AI municipal helpdesk for Hyderabad, India. You help citizens with:
1. Complaint status tracking
2. Department information (Roads, Sanitation, Electricity, Water Works)
3. How to submit complaints
4. Municipal procedures

You support English, Telugu, and Hindi. Keep responses concise (2-3 sentences). Use markdown for emphasis.

Current user: ${user?.name || 'Citizen'} (Role: ${user?.role || 'Citizen'})
Recent complaints in system:
${complaintContext || 'No complaints yet.'}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.slice(-6).map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
    })),
    { role: 'user', content: userMessage },
  ];

  const reply = await groqChat(messages, 600);
  if (reply) return reply;

  const groqReply = await quickReplyWithGroq(userMessage);
  if (groqReply) return groqReply;

  const { generateBotReply } = await import('./nlp');
  return generateBotReply(userMessage);
}

export async function generateOfficerResponse(
  complaint: Complaint
): Promise<string> {
  const prompt = `Write a professional response from the municipality to a citizen who filed this complaint:
Title: "${complaint.title}"
Description: "${complaint.description}"
Category: ${complaint.category}
Department: ${complaint.department}
Priority: ${complaint.priority}

The response should be 2-3 sentences, acknowledge the issue, mention the department handling it, and provide a timeline estimate.`;

  const reply = await groqChat([
    { role: 'system', content: 'You are a municipal officer drafting professional responses to citizen complaints. Be courteous, clear, and actionable.' },
    { role: 'user', content: prompt },
  ], 400);

  if (reply) return reply;

  const groqReply = await quickReplyWithGroq(
    `Write a professional response to a citizen about their complaint: "${complaint.title}" (${complaint.category}, ${complaint.department})`
  );
  if (groqReply) return groqReply;

  return `Thank you for bringing the "${complaint.title}" to our attention. The ${complaint.department} has been notified and will address this issue. We appreciate your patience.`;
}

export async function findSimilarComplaints(
  description: string,
  allComplaints: Complaint[]
): Promise<Complaint[]> {
  const text = description.toLowerCase();
  const words = text.split(/\s+/).filter((w) => w.length > 3);

  const scored = allComplaints.map((c) => {
    const combined = `${c.title} ${c.description}`.toLowerCase();
    const matchCount = words.filter((w) => combined.includes(w)).length;
    return { complaint: c, score: matchCount / words.length };
  });

  const threshold = 0.15;
  return scored
    .filter((s) => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.complaint);
}

export async function generateInsights(
  complaints: Complaint[]
): Promise<{
  summary: string;
  trends: string;
  recommendations: string[];
}> {
  if (complaints.length === 0) {
    return { summary: 'No complaints data available.', trends: '', recommendations: ['Encourage citizens to report issues.'] };
  }

  const total = complaints.length;
  const resolved = complaints.filter((c) => c.status === 'resolved' || c.status === 'closed').length;
  const highPriority = complaints.filter((c) => c.priority === 'high' || c.priority === 'critical').length;
  const categories = [...new Set(complaints.map((c) => c.category))].join(', ');
  const resolutionRate = Math.round((resolved / total) * 100);

  const prompt = `Analyze these municipal complaints and provide insights:
Total: ${total}, Resolved: ${resolved} (${resolutionRate}%), High Priority: ${highPriority}
Categories: ${categories}

Return a JSON object:
{
  "summary": "2-3 sentence summary",
  "trends": "Key trends observed",
  "recommendations": ["rec1", "rec2", "rec3"]
}`;

  const raw = await groqChat([
    { role: 'system', content: 'You are a municipal data analyst. Return valid JSON only.' },
    { role: 'user', content: prompt },
  ], 500);

  if (raw) {
    try {
      const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        summary: parsed.summary || `${total} complaints logged, ${resolutionRate}% resolved.`,
        trends: parsed.trends || '',
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : [],
      };
    } catch {}
  }

  return {
    summary: `${total} complaints logged. ${resolved} resolved (${resolutionRate}%). ${highPriority} high-priority issues pending.`,
    trends: `${categories} are the main complaint categories.`,
    recommendations: [
      resolutionRate < 50 ? 'Focus on improving resolution rate.' : 'Continue current resolution efforts.',
      highPriority > 3 ? 'Prioritize high-priority complaints.' : 'Monitor for emerging issues.',
      'Consider preventive measures in frequently reported areas.',
    ],
  };
}

export async function translateWithAI(
  text: string,
  targetLanguage: 'Telugu' | 'Hindi' | 'English'
): Promise<string> {
  if (targetLanguage === 'English') {
    const lang = detectLanguage(text);
    if (lang === 'en') return text;
  }

  const groqTranslated = await translateWithGroq(text, targetLanguage);
  if (groqTranslated && groqTranslated !== text) return groqTranslated;

  return text;
}

export async function aiSuggestCategory(
  title: string,
  description: string
): Promise<{ category: string; confidence: number }> {
  const groqCat = await suggestCategoryWithGroq(`${title} ${description}`);
  if (groqCat) return { category: groqCat, confidence: 0.85 };

  return suggestCategory(`${title} ${description}`);
}
