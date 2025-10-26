import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Payment API calls
export const paymentAPI = {
  createPaymentIntent: async ({ bookingId }) => {
    const response = await api.post('/payment/create-payment-intent', { bookingId });
    return response.data;
  },
  confirmPayment: async (paymentIntentId) => {
    const response = await api.post('/payment/confirm', { paymentIntentId });
    return response.data;
  },
  getPaymentStatus: async (bookingId) => {
    const response = await api.get(`/payment/status/${bookingId}`);
    return response.data;
  }
};

// Auth API calls
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },
};

// Services API calls
export const servicesAPI = {
  getAll: async () => {
    const response = await api.get('/services');
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },
};

// Bookings API calls
export const bookingsAPI = {
  checkAvailability: async (serviceId, date) => {
    const response = await api.get(`/bookings/availability/${serviceId}/${date}`);
    return response.data;
  },
  create: async (bookingData) => {
    const response = await api.post('/bookings', bookingData);
    return response.data;
  },
  getMyBookings: async () => {
    const response = await api.get('/bookings/my-bookings');
    return response.data;
  },
  confirmOffline: async (bookingId, paymentMode = 'cash') => {
    const response = await api.post('/bookings/confirm-offline', { bookingId, paymentMode });
    return response.data;
  }
};

// Payment API calls
