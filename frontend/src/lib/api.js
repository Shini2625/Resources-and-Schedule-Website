const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const apiUrl = API_URL;

export const getAuthHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});
