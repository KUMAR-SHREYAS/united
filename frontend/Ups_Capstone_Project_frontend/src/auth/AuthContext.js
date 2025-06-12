import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                // Check token expiry
                if (decodedToken.exp * 1000 > Date.now()) {
                    setIsAuthenticated(true);
                    setUser({ 
                        username: decodedToken.sub,
                        email: decodedToken.email,
                        role: decodedToken.role,
                        status: decodedToken.status
                    });
                } else {
                    // Token expired
                    localStorage.removeItem('access_token');
                    setIsAuthenticated(false);
                    setUser(null);
                }
            } catch (error) {
                console.error("Failed to decode token:", error);
                localStorage.removeItem('access_token');
                setIsAuthenticated(false);
                setUser(null);
            }
        }
    }, []);

    const login = (token) => {
        localStorage.setItem('access_token', token);
        const decodedToken = jwtDecode(token);
        setIsAuthenticated(true);
        setUser({
            username: decodedToken.sub,
            email: decodedToken.email,
            role: decodedToken.role,
            status: decodedToken.status
        });
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        setIsAuthenticated(false);
        setUser(null);
    };

    const isAdmin = user && user.role === 'admin';
    const isApproved = user && user.status === 'approved';

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isAdmin, isApproved }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext); 