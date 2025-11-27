import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL

if (!baseURL) console.warn("VITE_APP_URL is not defined")

const api = axios.create({
  baseURL: baseURL + '/api',
  withCredentials: true,
});

export default api;