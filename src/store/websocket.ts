import { BACKEND_URL } from '../env';
import type { Complaint } from './types';

type Listener = (event: 'new_complaint' | 'complaint_status_update' | 'chat_reply', data: any) => void;

class WebSocketManager {
  private ws: WebSocket | null = null;
  private listeners: Set<Listener> = new Set();
  private url: string = '';

  connect(userEmail: string) {
    if (this.ws) this.disconnect();

    try {
      const wsBase = BACKEND_URL.replace(/^http/, 'ws');
      this.url = `${wsBase}/ws`;
      this.ws = new WebSocket(this.url);

      this.ws.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        this.listeners.forEach((fn) => fn(payload.event, payload.data));
      };

      this.ws.onclose = () => {
        this.ws = null;
      };
    } catch (e) {
      console.log('WebSocket init failure', e);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(data: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  get isConnected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsManager = new WebSocketManager();

export function mapComplaintFromPayload(fresh: any, id?: string): Complaint {
  return {
    id: id || `CIV-${fresh.id}`,
    title: fresh.title,
    imageUri: fresh.image_url || null,
    description: fresh.description || fresh.title,
    category: fresh.category,
    location: `${fresh.latitude?.toFixed(4) || '0'}, ${fresh.longitude?.toFixed(4) || '0'}`,
    latitude: fresh.latitude || 0,
    longitude: fresh.longitude || 0,
    status: fresh.status || 'pending',
    department: fresh.department || fresh.assigned_department || 'Pending Routing',
    priority: (fresh.priority || 'medium').toLowerCase() as Complaint['priority'],
    confidence: fresh.ai_confidence || fresh.confidence || 95.0,
    language: fresh.language || 'English',
    municipalNote: fresh.municipalNote || fresh.ai_note || 'AI validation draft is being completed.',
    createdAt: fresh.createdAt || fresh.created_at || new Date().toISOString(),
    officerName: fresh.officerName || fresh.officer_name,
  };
}
