import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const getStats    = ()              => api.get('/stats').then(r => r.data);
export const getContacts = ()              => api.get('/contacts').then(r => r.data);
export const getMessages = (id, params)    => api.get(`/contacts/${id}/messages`, { params }).then(r => r.data);
export const sendMessage = (data)          => api.post('/messages/send', data).then(r => r.data);
export const createContact = (data)        => api.post('/contacts', data).then(r => r.data);
export const startCall     = (data)        => api.post('/calls/start', data).then(r => r.data);
