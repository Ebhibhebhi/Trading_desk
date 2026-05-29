import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const fetchEvents = () => api.get('/events').then(r => r.data);
export const fetchEventHistory = (id) => api.get(`/events/${id}/history`).then(r => r.data);
export const fetchConfig = () => api.get('/config').then(r => r.data);
export const updateConfig = (payload) => api.put('/config', payload).then(r => r.data);
export const triggerRefresh = () => api.post('/refresh').then(r => r.data);
