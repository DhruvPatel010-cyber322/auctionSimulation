
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://auction-arena-server.onrender.com';
console.log('[API] Connecting to:', API_BASE_URL);

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to attach token
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

// Add a response interceptor to handle forced logout
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Check if server sent forceLogout flag (session invalid)
        if (error.response?.data?.forceLogout) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            alert('Your session has been invalidated. You have been logged out from another location.');
            window.location.href = '/email-login';
        }
        return Promise.reject(error);
    }
);

export const login = async (teamCode, password, firebaseToken) => {
    // Explicitly send teamCode to match strict backend requirement
    const response = await api.post('/api/auth/login', { teamCode, password, firebaseToken });
    return response.data;
};

export const logout = async (teamId) => {
    const response = await api.post('/api/logout', { teamId });
    return response.data;
};

export const getTeams = async () => {
    try {
        const response = await api.get('/api/teams');
        return response.data;
    } catch (error) {
        console.error("Error fetching teams:", error);
        throw error;
    }
};

export const getPlayers = async (filters = {}) => {
    try {
        // Construct query string
        const params = new URLSearchParams(filters);
        const response = await api.get(`/api/players?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching players:", error);
        throw error;
    }
};



export const startAuction = async () => {
    const response = await api.post('/api/auction/start');
    return response.data;
};

export const nextPlayer = async () => {
    const response = await api.post('/api/auction/next');
    return response.data;
};

export const placeBid = async (amount) => {
    // Rely on Authorization header for team identification
    const response = await api.post('/api/auction/bid', { amount });
    return response.data;
};


export const endTurn = async (winner = null, amount = 0) => {
    const response = await api.post('/api/auction/end', { winner, amount });
    return response.data;
};

export const controlTimer = async (action) => {
    // action: 'pause', 'resume', 'reset'
    const response = await api.post(`/api/auction/timer?action=${action}`);
    return response.data;
};

export default api;

export const requeuePlayer = async (playerId) => {
    try {
        const response = await api.post('/api/auction/requeue', { playerId });
        return response.data;
    } catch (error) {
        console.error("Error requeueing player:", error);
        throw error;
    }
};

export const getAuctionStatus = async () => {
    const response = await api.get('/api/auction/status');
    return response.data;
};
