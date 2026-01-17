import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const validateSession = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                try {
                    // Probe a protected route to see if token is still valid
                    // We can use a lightweight protected endpoint, e.g., /api/auction/status
                    await api.getAuctionStatus(); // This uses the interceptor or we can manually check

                    // If successful, restore user
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.error("Session validation failed:", error);
                    // If 401 or token invalid, clear everything
                    if (error.response?.status === 401 || error.response?.status === 403) {
                        // Clear local immediately
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setUser(null);
                        setToken(null);
                    } else {
                        // For other errors (network), we might still want to restore 
                        // but risks are high. Let's act safe and restore, 
                        // assuming Socket will kill it if really bad.
                        setUser(JSON.parse(storedUser));
                    }
                }
            }
            setLoading(false);
        };

        validateSession();
    }, []);

    const login = async (teamCode, password, firebaseToken) => {
        try {
            const data = await api.login(teamCode, password, firebaseToken);
            if (data.success) {
                const userData = data.team;
                setUser(userData);
                setToken(data.token);
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(userData));
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const logout = async () => {
        try {
            // Optional: Call backend to clear session explicitly
            if (user) await api.logout(user.code);
        } catch (e) {
            console.error("Logout error", e);
        }
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // socket disconnect handled by SocketContext reacting to token change or unmounting
    };

    const value = {
        user,
        token,
        login,
        logout,
        loading,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
