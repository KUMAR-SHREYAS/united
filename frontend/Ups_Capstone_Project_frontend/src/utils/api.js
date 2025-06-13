import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
    baseURL: API_BASE_URL, // Your FastAPI backend URL
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add the JWT token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors globally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;
        // If the error is 401 Unauthorized and not a retry attempt yet
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Mark as retry attempt
            // Optionally, try to refresh token here if you implement refresh tokens
            // For now, redirect to login
            localStorage.removeItem('access_token');
            window.location.href = '/login'; // Redirect to login page
            return Promise.reject(error); // Reject the promise to stop further processing
        }
        // For 403 Forbidden, typically you'd show a message or redirect to a forbidden page
        if (error.response && error.response.status === 403) {
            // You can also redirect to a specific forbidden page or show a toast message
            console.error("Access Forbidden:", error.response.data.detail);
            // Optionally, navigate to a general dashboard or show an alert
            // window.location.href = '/dashboard';
        }
        return Promise.reject(error);
    }
);

export default api; 