import axios from 'axios';
import { API_URL } from '../../env';
import type { Complaint } from '../types';
import { analyzeComplaint } from '../../services/nlp';

export interface ComplaintSlice {
  complaints: Complaint[];
  currentComplaint: Complaint | null;
  fetchComplaints: () => Promise<void>;
  submitComplaint: (title: string, description: string, lat: number, lon: number, imagePath: string | null, category?: string) => Promise<any>;
  updateComplaintStatus: (id: string, status: string, officerName?: string, priority?: string) => Promise<void>;
  setCurrentComplaint: (c: Complaint | null) => void;
  addComplaint: (c: Complaint) => void;
  setComplaints: (complaints: Complaint[]) => void;
}

const MOCK_COMPLAINTS: Complaint[] = [
  {
    id: 'CIV-001',
    title: 'Massive Pothole near Hitech City',
    imageUri: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=500',
    description: 'road lo pedda gunta undi',
    category: 'Pothole',
    location: 'Kukatpally, Hyderabad',
    latitude: 17.4483,
    longitude: 78.3741,
    status: 'in_progress',
    department: 'Roads Department',
    priority: 'high',
    confidence: 96.4,
    language: 'Telugu',
    municipalNote: 'To:\nRoads Department\n\nSubject:\nUrgent Road Repair Request\n\nA major pothole has been detected on a public roadway. Based on image analysis and complaint context, immediate action is recommended.\n\nPriority:\nHigh',
    createdAt: '2026-05-28T10:30:00Z',
    officerName: 'Ramesh Babu',
  },
  {
    id: 'CIV-002',
    title: 'Garbage overflowing on Street 4',
    imageUri: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=500',
    description: 'Garbage not collected for 3 days',
    category: 'Garbage Overflow',
    location: 'Ameerpet, Hyderabad',
    latitude: 17.4435,
    longitude: 78.3820,
    status: 'assigned',
    department: 'Sanitation',
    priority: 'medium',
    confidence: 92.1,
    language: 'English',
    municipalNote: 'Garbage accumulation reported in residential area. Sanitation team assigned. Priority: MEDIUM.',
    createdAt: '2026-05-29T14:00:00Z',
    officerName: 'Madan Gopal',
  },
  {
    id: 'CIV-003',
    title: 'Street light not working since 1 week',
    imageUri: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=500',
    description: 'Street light not working since 1 week',
    category: 'Broken Streetlight',
    location: 'Madhapur, Hyderabad',
    latitude: 17.4365,
    longitude: 78.3910,
    status: 'resolved',
    department: 'Electricity',
    priority: 'low',
    confidence: 94.7,
    language: 'English',
    municipalNote: 'Non-functional streetlight reported. Electrical team dispatched. Issue resolved.',
    createdAt: '2026-05-25T08:00:00Z',
    officerName: 'Nagesh Rao',
  },
];

export const createComplaintSlice = (set: any, get: any, _api: any) => ({
  complaints: MOCK_COMPLAINTS,
  currentComplaint: null as Complaint | null,

  fetchComplaints: async () => {
    const token = get().token;
    if (token) {
      try {
        const res = await axios.get(`${API_URL}/complaints/all`, {
          headers: { Authorization: `Bearer ${get().token}` },
        });
        const mapped: Complaint[] = res.data.map((c: any) => ({
          id: `CIV-${c.id}`,
          title: c.title || c.description,
          imageUri: c.image_url,
          description: c.description || c.title,
          category: c.category,
          location: `${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}`,
          status: c.status,
          department: c.assigned_department || 'Pending Routing',
          priority: c.priority.toLowerCase() as Complaint['priority'],
          confidence: c.ai_confidence,
          language: 'English',
          municipalNote: c.ai_note || 'AI validation draft is being completed.',
          createdAt: c.created_at,
          officerName: c.officer_name,
        }));
        set({ complaints: mapped });
      } catch (e) {
        console.log('Could not retrieve live complaints, serving local repository state.');
      }
    }
  },

  submitComplaint: async (title, description, lat, lon, imagePath, category) => {
    const isLive = false;
    const token = get().token;

    if (isLive && token) {
      try {
        const form = new FormData();
        form.append('title', title);
        form.append('description', description);
        form.append('latitude', String(lat));
        form.append('longitude', String(lon));
        if (imagePath) {
          const filename = imagePath.split('/').pop() || 'complaint.jpg';
          form.append('image', { uri: imagePath, name: filename, type: 'image/jpeg' } as any);
        }
        const res = await axios.post(`${API_URL}/complaints/create`, form, {
          headers: { Authorization: `Bearer ${get().token}`, 'Content-Type': 'multipart/form-data' },
        });
        await get().fetchComplaints();
        return res.data;
      } catch (e) {
        console.log('Failed to submit via API. Running dynamic visual pipeline mock.');
      }
    }

    const mockId = `CIV-${Math.floor(100 + Math.random() * 900)}`;
    const combinedText = `${title} ${description}`;
    const nlp = analyzeComplaint(combinedText, category);

    const newComp: Complaint = {
      id: mockId,
      title,
      imageUri: imagePath || 'https://images.unsplash.com/photo-1599740831119-971f1b21f92e?q=80&w=500',
      description,
      category: nlp.category,
      location: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
      latitude: lat,
      longitude: lon,
      status: 'verified',
      department: nlp.department,
      priority: nlp.priority,
      confidence: Math.round(nlp.categoryConfidence * 100),
      language: nlp.language === 'te' ? 'Telugu' : nlp.language === 'hi' ? 'Hindi' : 'English',
      municipalNote: `OFFICIAL MUNICIPAL WORK ORDER\n\nTO:\n${nlp.department}\n\nSUBJECT:\nUrgent Repair Request: ${nlp.category}\n\nA major local issue has been flagged via citizens. Prompt resolution is required.\n\nDetected Language: ${nlp.language === 'te' ? 'Telugu' : nlp.language === 'hi' ? 'Hindi' : 'English'}\nSentiment: ${nlp.sentiment}\nKeywords: ${nlp.keywords.slice(0, 5).join(', ')}\n\nPriority: ${nlp.priority.toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };

    set((state: any) => ({
      complaints: [newComp, ...state.complaints],
    }));

    return {
      category: nlp.category,
      priority: nlp.priority,
      department: nlp.department,
      confidence: Math.round(nlp.categoryConfidence * 100),
    };
  },

  updateComplaintStatus: async (id, status, officerName, priority) => {
    const isLive = false;
    const token = get().token;
    if (isLive && token) {
      try {
        const form = new FormData();
        if (status) form.append('status', status);
        if (officerName) form.append('officer_name', officerName);
        if (priority) form.append('priority', priority);
        await axios.put(`${API_URL}/complaints/update/${id.replace('CIV-', '')}`, form, {
          headers: { Authorization: `Bearer ${get().token}` },
        });
        await get().fetchComplaints();
        return;
      } catch (e) {
        console.log('Could not update live server state.');
      }
    }

    set((state: any) => {
      const updated = state.complaints.map((c: Complaint) =>
        c.id === id
          ? { ...c, status: (status || c.status) as Complaint['status'], officerName: officerName || c.officerName, priority: (priority ? priority.toLowerCase() : c.priority) as Complaint['priority'] }
          : c
      );
      return { complaints: updated };
    });
  },

  setCurrentComplaint: (c) => set({ currentComplaint: c }),
  addComplaint: (c) => set((state: any) => ({ complaints: [c, ...state.complaints] })),
  setComplaints: (complaints) => set({ complaints }),
} satisfies ComplaintSlice);
