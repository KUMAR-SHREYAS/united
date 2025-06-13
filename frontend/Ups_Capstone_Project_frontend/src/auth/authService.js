import { API_BASE_URL } from '../config';

const API_URL = `${API_BASE_URL}/auth`; // Base URL for your FastAPI authentication endpoints

const login = async (username, password) => {
    const details = new URLSearchParams();
    details.append('username', username);
    details.append('password', password);

    const response = await fetch(`${API_URL}/token`, {
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