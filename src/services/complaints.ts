import { api } from './api';

export interface ComplaintPayload {
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  category?: string;
}

export const complaintService = {
  getAll: async () => {
    const res = await api.get('/complaints/all');
    return res.data;
  },

  create: async (payload: ComplaintPayload, imageUri?: string) => {
    const form = new FormData();
    form.append('title', payload.title);
    form.append('description', payload.description);
    form.append('latitude', String(payload.latitude));
    form.append('longitude', String(payload.longitude));
    if (payload.category) form.append('category', payload.category);
    if (imageUri) {
      const filename = imageUri.split('/').pop() || 'complaint.jpg';
      form.append('image', { uri: imageUri, name: filename, type: 'image/jpeg' } as any);
    }
    const res = await api.post('/complaints/create', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  updateStatus: async (id: string, data: { status?: string; officer_name?: string; priority?: string }) => {
    const cleanId = id.replace('CIV-', '');
    const form = new FormData();
    if (data.status) form.append('status', data.status);
    if (data.officer_name) form.append('officer_name', data.officer_name);
    if (data.priority) form.append('priority', data.priority);
    const res = await api.put(`/complaints/update/${cleanId}`, form);
    return res.data;
  },
};
