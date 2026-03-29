import api from './api';

const EXTERNAL_API = 'https://a-bhavy-bot-bbheroku-5f1b58e25c41.herokuapp.com';

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

export const getAllMyFantasyTeams = async () => {
    const response = await api.get('/api/fantasy/my-teams');
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

// ── Live Points (direct to external API — no auth needed) ─────────────────────

/** Fetch today's match info from external fantasy API */
export const fetchLiveMatch = async () => {
    const res = await fetch(`${EXTERNAL_API}/match`);
    if (!res.ok) throw new Error(`/match responded ${res.status}`);
    return res.json();
};

/** Fetch the live points leaderboard for a specific match_id */
export const fetchLivePoints = async (matchId) => {
    const res = await fetch(`${EXTERNAL_API}/points?match_id=${matchId}`);
    if (!res.ok) throw new Error(`/points responded ${res.status}`);
    return res.json();
};

/** Ask our own backend if a live sync is running right now */
export const getLiveStatus = async () => {
    const response = await api.get('/api/fantasy/live-status');
    return response.data;
};
