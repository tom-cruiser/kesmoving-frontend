import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT token to every request — read directly from Zustand state
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken) {
        originalRequest._retry = true;
        try {
          const res = await axios.post('/api/auth/refresh', { refreshToken });
          const { token, refreshToken: newRefresh, user } = res.data.data;
          useAuthStore.getState().setAuth(token, newRefresh, user);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      } else {
        // No refresh token — clear state and redirect if on protected page
        const path = window.location.pathname;
        if (path !== '/login' && path !== '/register') {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { firstName: string; lastName: string; email: string; password: string; phone?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data: object) => api.put('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
  getUsers: (params?: object) => api.get('/auth/users', { params }),
  updateUserRole: (id: string, data: { role?: string; isActive?: boolean }) =>
    api.put(`/auth/users/${id}/role`, data),
};

// ─── Users (admin operations) ────────────────────────────────────────────────
// ─── Activity Log ─────────────────────────────────────────────────────────────
export const activityApi = {
  getAll: (params?: object) => api.get('/activity', { params }),
};

export const userApi = {
  getAll: (params?: object) => api.get('/auth/users', { params }),
  updateRole: (id: string, role: string) => api.put(`/auth/users/${id}/role`, { role }),
  setActive: (id: string, isActive: boolean) => api.put(`/auth/users/${id}/role`, { isActive }),
  resetPassword: (id: string, password: string) => api.put(`/auth/users/${id}/password`, { password }),
};

// ─── Bookings ────────────────────────────────────────────────────────────────
export const bookingApi = {
  create: (data: object) => api.post('/bookings', data),
  getAll: (params?: object) => api.get('/bookings', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  update: (id: string, data: object) => api.put(`/bookings/${id}`, data),
  delete: (id: string) => api.delete(`/bookings/${id}`),
  cancel: (id: string, data: { cancellationReason?: string }) =>
    api.put(`/bookings/${id}/cancel`, data),
  updateStatus: (id: string, data: { status: string; note?: string; cancellationReason?: string }) =>
    api.put(`/bookings/${id}/status`, data),
  assignCrew: (id: string, data: { driverId: string; moverIds?: string[]; truckId: string }) =>
    api.put(`/bookings/${id}/assign`, data),
  uploadPhotos: (id: string, formData: FormData) =>
    api.post(`/bookings/${id}/photos`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updatePayment: (id: string, data: { status: string; amount?: number; notes?: string }) =>
    api.put(`/bookings/${id}/payment`, data),
};

// ─── Fleet ───────────────────────────────────────────────────────────────────
export const fleetApi = {
  getAll: (params?: object) => api.get('/fleet', { params }),
  create: (data: object) => api.post('/fleet', data),
  getById: (id: string) => api.get(`/fleet/${id}`),
  update: (id: string, data: object) => api.put(`/fleet/${id}`, data),
  updateLocation: (id: string, data: { lat: number; lng: number; address?: string }) =>
    api.put(`/fleet/${id}/location`, data),
  delete: (id: string) => api.delete(`/fleet/${id}`),
};

// ─── Estimates ───────────────────────────────────────────────────────────────
export const estimateApi = {
  generate: (bookingId: string) => api.post('/estimate', { bookingId }),
  analyzePhotos: (formData: FormData) =>
    api.post('/estimate/analyze', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  analyzePhotoUrls: (data: {
    photoUrls: string[];
    moveSize?: string;
    distance?: number;
    numberOfBedrooms?: number;
    moveDate?: string;
    notes?: string;
    pickup?: { address?: string; province?: string; elevator?: boolean; floor?: number };
    destination?: { address?: string; province?: string; elevator?: boolean; floor?: number };
  }) =>
    api.post('/estimate/analyze', data),
  review: (
    bookingId: string,
    data: {
      estimatedPrice?: number;
      estimatedVolume?: number;
      loadingTime?: number;
      recommendedTruck?: string;
      reviewNotes?: string;
      notes?: string;
      confirm?: boolean;
    },
  ) =>
    api.put(`/estimate/${bookingId}/review`, data),
  approveManual: (
    bookingId: string,
    data: {
      estimatedPrice?: number;
      estimatedVolume?: number;
      loadingTime?: number;
      recommendedTruck?: string;
      notes?: string;
      reviewNotes?: string;
    },
  ) =>
    api.put(`/estimate/${bookingId}/review`, { ...data, confirm: true }),
  getPendingReview: (params?: object) => api.get('/bookings', { params: { needsManualReview: true, ...params } }),
};

// ─── Tracking ────────────────────────────────────────────────────────────────
export const trackingApi = {
  getTruckLocation: (truckId: string) => api.get(`/tracking/truck/${truckId}`),
  getBookingTracking: (bookingId: string) => api.get(`/tracking/booking/${bookingId}`),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewApi = {
  create: (data: object) => api.post('/reviews', data),
  getByBooking: (bookingId: string) => api.get(`/reviews/${bookingId}`),
  getAll: (params?: object) => api.get('/reviews', { params }),
  respond: (id: string, text: string) => api.put(`/reviews/${id}/respond`, { text }),
};

// ─── Chat ────────────────────────────────────────────────────────────────────
export const chatApi = {
  startConversation: (data: { subject?: string; channel?: string; bookingId?: string }) =>
    api.post('/chat/conversations', data),
  sendMessage: (conversationId: string, data: { content: string; clientTempId?: string }) =>
    api.post(`/chat/conversations/${conversationId}/message`, data),
  getMyConversations: (params?: object) => api.get('/chat/conversations', { params }),
  getAllConversations: (params?: object) => api.get('/chat/conversations/all', { params }),
  getMessages: (conversationId: string, params?: object) =>
    api.get(`/chat/conversations/${conversationId}/messages`, { params }),
  getConversation: (id: string) => api.get(`/chat/conversations/${id}`),
  claimConversation: (id: string) => api.put(`/chat/conversations/${id}/assign`, {}),
  assignAgent: (id: string) => api.put(`/chat/conversations/${id}/assign`, {}),
  resolveConversation: (id: string) => api.put(`/chat/conversations/${id}/resolve`, {}),
};

export const supportApi = {
  escalate: (data: { conversationId: string; reason?: string }) =>
    api.post('/support/escalate', data),
  resolve: (data: { conversationId: string }) =>
    api.post('/support/resolve', data),
};

// ─── Analytics ───────────────────────────────────────────────────────────────
export const analyticsApi = {
  getOverview: (params?: object) => api.get('/analytics/overview', { params }),
  getBookingTrend: (params?: object) => api.get('/analytics/bookings/trend', { params }),
  getStaffPerformance: () => api.get('/analytics/staff/performance'),
};

// ─── Notifications ───────────────────────────────────────────────────────────
export const notificationApi = {
  getAll: (params?: object) => api.get('/notifications', { params }),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};
