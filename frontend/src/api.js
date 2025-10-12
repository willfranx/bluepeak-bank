import axios from 'axios';

const API_BASE_URL = '/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (username, password) => 
    api.post('/auth/register', { username, password }),
  
  login: (username, password) => 
    api.post('/auth/login', { username, password })
};

// Banking API
export const bankingAPI = {
  getBalance: () => 
    api.get('/banking/balance'),
  
  transfer: (toUsername, amount) => 
    api.post('/banking/transfer', { toUsername, amount }),
  
  getTransactions: () => 
    api.get('/banking/transactions')
};

export default api;
