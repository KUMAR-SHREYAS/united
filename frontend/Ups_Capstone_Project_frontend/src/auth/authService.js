import { API_BASE_URL } from '../config';

// FIXED: The base URL is set directly to API_BASE_URL (which should already be ".../api")
const API_URL = API_BASE_URL; 

const login = async (username, password) => {
    const details = new URLSearchParams();
    details.append('username', username);
    details.append('password', password);

    // Request path is now correctly: /api/token
    const response = await fetch(`${API_URL}/auth/token/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: details.toString(),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Login failed');
    }

    return response.json();
};

const register = async (username, email, password) => {
    // Request path is now correctly: /api/register
    const response = await fetch(`${API_URL}/register`, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Registration failed');
    }

    return response.json();
};

const authService = {
    login,
    register,
};

export default authService;