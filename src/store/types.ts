export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  department?: string;
}

export interface Complaint {
  id: string;
  title: string;
  imageUri: string | null;
  description: string;
  category: string;
  location: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'verified' | 'assigned' | 'in_progress' | 'inspection' | 'resolved' | 'closed';
  department: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  language: string;
  municipalNote: string;
  createdAt: string;
  officerName?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  read: boolean;
  time: string;
  complaintId?: string;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}
