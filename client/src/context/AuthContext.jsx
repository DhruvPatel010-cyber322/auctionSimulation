import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Loading Auth...');

    useEffect(() => {
        let isMounted = true;

        const validateSession = async () => {
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');

            if (storedToken && storedUser) {
                let retryCount = 0;
                let success = false;

                while (!success && isMounted) {
                    try {
                        if (retryCount > 0) {
                            setLoadingMessage('Waking up server... Connecting to Database');
                        }

                        // Probe a protected route to see if token is still valid (doesn't require a team code)
                        await api.getProfileStatus(); 

                        // If successful, restore user
                        success = true;
                        if (isMounted) {
                            setUser(JSON.parse(storedUser));
                        }
                    } catch (error) {
                        // If 401 or token invalid, clear everything
                        if (error.response?.status === 401 || error.response?.status === 403) {
                            if (isMounted) {
                                localStorage.removeItem('token');
                                localStorage.removeItem('user');
                                setUser(null);
                                setToken(null);
                            }
                            break; // 401 is fatal, stop retrying
                        } else {
                            // For other errors (network, 502, 504), server might be asleep
                            console.error(`Session validation network error. Retrying... (${retryCount + 1})`, error);
                            retryCount++;
                            // Wait 3 seconds before retrying to give server time to wake up
                            await new Promise(res => setTimeout(res, 3000));
                        }
                    }
                }
            }
            if (isMounted) {
                setLoading(false);
            }
        };

        validateSession();

        return () => {
            isMounted = false;
        };
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
        localStorage.removeItem('firebase_token');
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
            {loading ? (
                <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent flex items-center justify-center rounded-full animate-spin mb-4"></div>
                    <div className="text-gray-400 font-medium animate-pulse">{loadingMessage}</div>
                </div>
            ) : children}
        </AuthContext.Provider>
    );
};
