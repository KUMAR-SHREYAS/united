import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../utils/api'; // Import your axios instance

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // New loading state

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        console.log('AuthContext useEffect: Checking token...', { token: token ? 'Exists' : 'No' });
        if (token) {
            api.get('/api/me')
                .then(response => {
                    setIsAuthenticated(true);
                    setUser(response.data); // Assuming /api/me returns user data
                    console.log('AuthContext useEffect: /api/me successful', { isAuthenticated: true, user: response.data });
                })
                .catch((error) => {
                    // Token is invalid or expired or other backend issue
                    console.error('AuthContext useEffect: /api/me failed', error);
                    localStorage.removeItem('access_token');
                    setIsAuthenticated(false);
                    setUser(null);
                })
                .finally(() => {
                    setIsLoading(false); // Set loading to false after check
                });
        } else {
            setIsAuthenticated(false);
            setUser(null);
            setIsLoading(false); // No token, so not loading auth anymore
            console.log('AuthContext useEffect: No token found, not authenticated.');
        }
    }, []);

    const login = (token) => {
        return new Promise((resolve) => {
            localStorage.setItem('access_token', token);
            const decodedToken = jwtDecode(token);
            setIsAuthenticated(true);
            setUser({
                username: decodedToken.sub,
                email: decodedToken.email,
                role: decodedToken.role,
                status: decodedToken.status
            });
            console.log('AuthContext login: Authenticated and user set', { isAuthenticated: true, user: decodedToken.sub });
            setIsLoading(false); // Login means we are no longer loading
            resolve(); // Resolve the promise once state is set
        });
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false); // Logout means we are no longer loading
    };

    const isAdmin = user && user.role === 'admin';
    const isApproved = user && user.status === 'approved';

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isAdmin, isApproved, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext); 