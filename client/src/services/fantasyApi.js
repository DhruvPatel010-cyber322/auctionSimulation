import api from './api';

export const getFantasyMatches = async () => {
    const response = await api.get('/api/fantasy/matches');
    return response.data;
};

export const getFantasyPlayers = async (matchId) => {
    const response = await api.get(`/api/fantasy/players/${matchId}`);
    return response.data;
};

export const saveFantasyTeam = async (payload) => {
    const response = await api.post('/api/fantasy/team', payload);
    return response.data;
};

export const getMyFantasyTeams = async (matchId) => {
    const response = await api.get(`/api/fantasy/my-teams/${matchId}`);
    return response.data;
};

export const getFantasyLeaderboard = async (matchId) => {
    const response = await api.get(`/api/fantasy/leaderboard/${matchId}`);
    return response.data;
};

export const recalculateFantasyPoints = async (matchId) => {
    const response = await api.post(`/api/fantasy/admin/recalculate/${matchId}`);
    return response.data;
};
