import mongoose from 'mongoose';
import getFantasyMatchModel from '../models/FantasyMatch.js';

const TEAM_NAME_TO_CODE = {
    'Royal Challengers Bengaluru': 'RCB',
    'Chennai Super Kings': 'CSK',
    'Mumbai Indians': 'MI',
    'Kolkata Knight Riders': 'KKR',
    'Sunrisers Hyderabad': 'SRH',
    'Delhi Capitals': 'DC',
    'Rajasthan Royals': 'RR',
    'Punjab Kings': 'PBKS',
    'Lucknow Super Giants': 'LSG',
    'Gujarat Titans': 'GT'
};

export const FANTASY_ROLE_ORDER = ['Wicket Keeper', 'Batsman', 'All-Rounder', 'Bowler'];

export const normalizeTeamCode = (team) => {
    if (!team) return '';

    const trimmed = String(team).trim();
    return TEAM_NAME_TO_CODE[trimmed] || trimmed.toUpperCase();
};

export const normalizeFantasyRole = (role) => {
    const normalized = String(role || '').trim().toLowerCase();

    switch (normalized) {
        case 'batter':
        case 'batsman':
            return 'Batsman';
        case 'wicket-keeper':
        case 'wicket keeper':
        case 'wicketkeeper':
            return 'Wicket Keeper';
        case 'all-rounder':
        case 'all rounder':
            return 'All-Rounder';
        case 'bowler':
            return 'Bowler';
        default:
            return String(role || '').trim() || 'Unknown';
    }
};

export const normalizeMatchDateTime = (match) => {
    if (match?.MATCH_COMMENCE_START_DATE) {
        return match.MATCH_COMMENCE_START_DATE;
    }

    if (match?.MatchDate && match?.MatchTime) {
        return `${match.MatchDate}T${match.MatchTime}`;
    }

    return match?.MatchDate || null;
};

export const normalizeFantasyMatch = (match) => ({
    _id: match._id.toString(),
    matchId: match.legacyMatchId || match.MatchID || match._id.toString(),
    matchName: match.matchName || match.MatchName || `${normalizeTeamCode(match.HomeTeamName || match.team1)} vs ${normalizeTeamCode(match.AwayTeamName || match.team2)}`,
    team1: normalizeTeamCode(match.HomeTeamName || match.team1),
    team2: normalizeTeamCode(match.AwayTeamName || match.team2),
    date: match.date || normalizeMatchDateTime(match),
    time: match.time || match.MatchTime || null,
    ground: match.ground || match.GroundName || null,
    city: match.city || match.City || null,
    status: match.status || match.MatchStatus || 'Upcoming'
});

export const findFantasyMatchByIdentifier = async (matchIdentifier) => {
    const FantasyMatch = await getFantasyMatchModel();

    if (!matchIdentifier) return null;

    if (mongoose.Types.ObjectId.isValid(matchIdentifier)) {
        const byId = await FantasyMatch.findById(matchIdentifier);
        if (byId) return byId;
    }

    const byLegacyMatchId = await FantasyMatch.findOne({ legacyMatchId: String(matchIdentifier) });
    if (byLegacyMatchId) {
        return byLegacyMatchId;
    }

    return null;
};

export const getFantasyPlayerValue = (player) => {
    const numericValue = Number(player?.value ?? player?.Value);
    if (Number.isFinite(numericValue) && numericValue > 0) {
        return Number(numericValue.toFixed(1));
    }

    return 7.5;
};

export const serializeFantasyPlayer = (player) => ({
    _id: player._id.toString(),
    name: player.name,
    role: normalizeFantasyRole(player.role),
    orgIPLTeam26: normalizeTeamCode(player.orgIPLTeam26),
    basePrice: Number(player.basePrice || 0),
    value: getFantasyPlayerValue(player),
    credits: getFantasyPlayerValue(player),
    points: Number(player.points || 0),
    image: player.image || null
});

export const groupFantasyPlayers = (players) => {
    const groupedPlayers = {
        'Wicket Keeper': [],
        Batsman: [],
        'All-Rounder': [],
        Bowler: []
    };

    const allPlayers = players
        .map((player) => serializeFantasyPlayer(player))
        .sort((a, b) => {
            const roleDelta = FANTASY_ROLE_ORDER.indexOf(a.role) - FANTASY_ROLE_ORDER.indexOf(b.role);
            if (roleDelta !== 0) return roleDelta;

            if (b.value !== a.value) return b.value - a.value;
            return a.name.localeCompare(b.name);
        });

    allPlayers.forEach((player) => {
        if (!groupedPlayers[player.role]) {
            groupedPlayers[player.role] = [];
        }
        groupedPlayers[player.role].push(player);
    });

    return { groupedPlayers, allPlayers };
};

export const validateFantasyTeamSelection = ({ players, captain, viceCaptain, team1, team2 }) => {
    const errors = [];
    const playerIds = players.map((player) => player._id.toString());
    const uniquePlayerIds = new Set(playerIds);

    if (players.length !== 11) {
        errors.push('You must select exactly 11 players.');
    }

    if (uniquePlayerIds.size !== players.length) {
        errors.push('Duplicate players are not allowed.');
    }

    const validTeams = new Set([normalizeTeamCode(team1), normalizeTeamCode(team2)]);
    const teamCounts = {};
    const roleCounts = {
        'Wicket Keeper': 0,
        Batsman: 0,
        'All-Rounder': 0,
        Bowler: 0
    };

    let valueUsed = 0;

    for (const player of players) {
        const normalizedRole = normalizeFantasyRole(player.role);
        const normalizedTeam = normalizeTeamCode(player.orgIPLTeam26);

        if (!validTeams.has(normalizedTeam)) {
            errors.push(`${player.name} does not belong to the selected match teams.`);
        }

        teamCounts[normalizedTeam] = (teamCounts[normalizedTeam] || 0) + 1;
        roleCounts[normalizedRole] = (roleCounts[normalizedRole] || 0) + 1;
        valueUsed += getFantasyPlayerValue(player);
    }

    if (valueUsed > 100) {
        errors.push('Selected team exceeds the 100 value limit.');
    }

    if (Object.values(teamCounts).some((count) => count > 7)) {
        errors.push('You can select a maximum of 7 players from one team.');
    }

    if ((roleCounts['Wicket Keeper'] || 0) < 1) {
        errors.push('At least 1 Wicket Keeper is required.');
    }

    if ((roleCounts.Batsman || 0) < 3) {
        errors.push('At least 3 Batsmen are required.');
    }

    if ((roleCounts['All-Rounder'] || 0) < 1) {
        errors.push('At least 1 All-Rounder is required.');
    }

    if ((roleCounts.Bowler || 0) < 3) {
        errors.push('At least 3 Bowlers are required.');
    }

    if (!captain || !uniquePlayerIds.has(captain.toString())) {
        errors.push('Captain must be one of the selected players.');
    }

    if (!viceCaptain || !uniquePlayerIds.has(viceCaptain.toString())) {
        errors.push('Vice-Captain must be one of the selected players.');
    }

    if (captain && viceCaptain && captain.toString() === viceCaptain.toString()) {
        errors.push('Captain and Vice-Captain must be different players.');
    }

    return {
        isValid: errors.length === 0,
        errors,
        summary: {
            creditsUsed: Number(valueUsed.toFixed(1)),
            valueUsed: Number(valueUsed.toFixed(1)),
            playersSelected: players.length,
            teamCounts,
            roleCounts
        }
    };
};

export const calculateFantasyTeamPoints = (fantasyTeam, playerMap) => {
    let totalPoints = 0;
    const captainId = fantasyTeam.captain?.toString();
    const viceCaptainId = fantasyTeam.viceCaptain?.toString();

    fantasyTeam.players.forEach((playerId) => {
        const key = playerId.toString();
        const player = playerMap.get(key);
        const basePoints = Number(player?.points || 0);

        if (key === captainId) {
            totalPoints += basePoints * 2;
            return;
        }

        if (key === viceCaptainId) {
            totalPoints += basePoints * 1.5;
            return;
        }

        totalPoints += basePoints;
    });

    return Number(totalPoints.toFixed(2));
};
