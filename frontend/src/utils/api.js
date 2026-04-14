import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err.response?.data || { message: 'Network error' })
);

export const ratesApi = {
  compare: (params) => api.post('/rates/compare', params),
  zones: () => api.get('/rates/zones'),
  pincodeInfo: (pin) => api.get(`/rates/pincode-info/${pin}`),
};

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const shipmentsApi = {
  list: () => api.get('/shipments'),
  book: (data) => api.post('/shipments/book', data),
};

export const analyticsApi = {
  dashboard: () => api.get('/analytics/dashboard'),
};

export const couriersApi = {
  list: () => api.get('/couriers'),
};

export default api;
