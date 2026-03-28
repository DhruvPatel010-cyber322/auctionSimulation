import getFantasyMatchModel from '../models/FantasyMatch.js';
import getFantasyPlayerModel from '../models/FantasyPlayer.js';
import getFantasyTeamModel from '../models/FantasyTeam.js';
import {
    calculateFantasyTeamPoints,
    findFantasyMatchByIdentifier,
    groupFantasyPlayers,
    normalizeFantasyMatch,
    serializeFantasyPlayer,
    validateFantasyTeamSelection
} from '../utils/fantasyUtils.js';

const getAuthenticatedUserId = (req) => req.user?._id || req.user?.id || null;

const ensureFantasyUser = async (req, res) => {
    const userId = getAuthenticatedUserId(req);
    if (!userId) {
        res.status(401).json({ message: 'Fantasy actions require a signed-in user account.' });
        return null;
    }

    return req.user;
};

const formatFantasyTeam = (team) => {
    const serializedPlayers = (team.players || []).map((player) => serializeFantasyPlayer(player));

    return {
        _id: team._id.toString(),
        matchId: team.matchId.toString(),
        totalPoints: Number(team.totalPoints || 0),
        players: serializedPlayers,
        captain: team.captain ? {
            _id: team.captain._id.toString(),
            name: team.captain.name
        } : null,
        viceCaptain: team.viceCaptain ? {
            _id: team.viceCaptain._id.toString(),
            name: team.viceCaptain.name
        } : null,
        summary: {
            playerCount: serializedPlayers.length,
            creditsUsed: Number(serializedPlayers.reduce((sum, player) => sum + player.value, 0).toFixed(1)),
            valueUsed: Number(serializedPlayers.reduce((sum, player) => sum + player.value, 0).toFixed(1)),
            roleCounts: serializedPlayers.reduce((acc, player) => {
                acc[player.role] = (acc[player.role] || 0) + 1;
                return acc;
            }, {}),
            teamCounts: serializedPlayers.reduce((acc, player) => {
                acc[player.orgIPLTeam26] = (acc[player.orgIPLTeam26] || 0) + 1;
                return acc;
            }, {})
        },
        createdAt: team.createdAt,
        updatedAt: team.updatedAt
    };
};

export const getFantasyMatches = async (req, res) => {
    try {
        const FantasyMatch = await getFantasyMatchModel();
        const matches = await FantasyMatch.find({})
            .sort({ date: 1, legacyMatchId: 1 })
            .lean();

        res.json(matches.map((match) => normalizeFantasyMatch(match)));
    } catch (error) {
        console.error('Fantasy matches fetch failed:', error);
        res.status(500).json({ message: 'Failed to fetch fantasy matches.' });
    }
};

export const getFantasyPlayersForMatch = async (req, res) => {
    try {
        const FantasyPlayer = await getFantasyPlayerModel();
        const match = await findFantasyMatchByIdentifier(req.params.matchId);
        if (!match) {
            return res.status(404).json({ message: 'Match not found.' });
        }

        const normalizedMatch = normalizeFantasyMatch(match);
        const players = await FantasyPlayer.find({
            orgIPLTeam26: { $in: [normalizedMatch.team1, normalizedMatch.team2] }
        }).sort({ value: -1, name: 1 }).lean();

        const { groupedPlayers, allPlayers } = groupFantasyPlayers(players);

        res.json({
            match: normalizedMatch,
            players: groupedPlayers,
            allPlayers
        });
    } catch (error) {
        console.error('Fantasy players fetch failed:', error);
        res.status(500).json({ message: 'Failed to fetch fantasy players.' });
    }
};

export const saveFantasyTeam = async (req, res) => {
    try {
        const user = await ensureFantasyUser(req, res);
        if (!user) return;

        const [FantasyPlayer, FantasyTeam] = await Promise.all([
            getFantasyPlayerModel(),
            getFantasyTeamModel()
        ]);
        const { matchId, players = [], captain, viceCaptain } = req.body;

        const match = await findFantasyMatchByIdentifier(matchId);
        if (!match) {
            return res.status(404).json({ message: 'Match not found.' });
        }
        
        const normalizedMatch = normalizeFantasyMatch(match);
        if (normalizedMatch.status !== 'Upcoming') {
            return res.status(403).json({ message: 'Team editing is locked. This match has already started.' });
        }

        const uniquePlayerIds = [...new Set((players || []).map((playerId) => String(playerId)))];
        const selectedPlayers = await FantasyPlayer.find({ _id: { $in: uniquePlayerIds } });

        if (selectedPlayers.length !== uniquePlayerIds.length) {
            return res.status(400).json({ message: 'One or more selected players are invalid.' });
        }

        const validation = validateFantasyTeamSelection({
            players: selectedPlayers,
            captain,
            viceCaptain,
            team1: normalizedMatch.team1,
            team2: normalizedMatch.team2
        });

        if (!validation.isValid) {
            return res.status(400).json({
                message: validation.errors[0],
                errors: validation.errors,
                summary: validation.summary
            });
        }

        const playerMap = new Map(selectedPlayers.map((player) => [player._id.toString(), player]));
        const totalPoints = calculateFantasyTeamPoints({
            players: uniquePlayerIds,
            captain,
            viceCaptain
        }, playerMap);

        const fantasyTeam = await FantasyTeam.findOneAndUpdate(
            {
                userId: user._id,
                matchId: match._id
            },
            {
                $set: {
                    players: uniquePlayerIds,
                    captain,
                    viceCaptain,
                    totalPoints
                }
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        )
            .populate('players', 'name role orgIPLTeam26 basePrice value points image')
            .populate('captain', 'name')
            .populate('viceCaptain', 'name');

        res.status(200).json({
            success: true,
            message: 'Fantasy team saved successfully.',
            match: normalizedMatch,
            team: formatFantasyTeam(fantasyTeam)
        });
    } catch (error) {
        console.error('Fantasy team save failed:', error);
        res.status(500).json({ message: 'Failed to save fantasy team.' });
    }
};

export const getMyFantasyTeams = async (req, res) => {
    try {
        const user = await ensureFantasyUser(req, res);
        if (!user) return;

        const FantasyTeam = await getFantasyTeamModel();
        const match = await findFantasyMatchByIdentifier(req.params.matchId);
        if (!match) {
            return res.status(404).json({ message: 'Match not found.' });
        }

        const teams = await FantasyTeam.find({
            userId: user._id,
            matchId: match._id
        })
            .populate('players', 'name role orgIPLTeam26 basePrice value points image')
            .populate('captain', 'name')
            .populate('viceCaptain', 'name')
            .sort({ createdAt: -1 });

        res.json({
            match: normalizeFantasyMatch(match),
            teams: teams.map((team) => formatFantasyTeam(team))
        });
    } catch (error) {
        console.error('My fantasy teams fetch failed:', error);
        res.status(500).json({ message: 'Failed to fetch your fantasy teams.' });
    }
};

export const getFantasyLeaderboard = async (req, res) => {
    try {
        const FantasyTeam = await getFantasyTeamModel();
        const match = await findFantasyMatchByIdentifier(req.params.matchId);
        if (!match) {
            return res.status(404).json({ message: 'Match not found.' });
        }

        const teams = await FantasyTeam.find({ matchId: match._id })
            .populate('players', 'name role orgIPLTeam26 basePrice value points image')
            .populate('captain', 'name')
            .populate('viceCaptain', 'name')
            .populate('userId', 'username name email')
            .sort({ totalPoints: -1, updatedAt: 1 });

        const leaderboard = teams.map((team, index) => ({
            rank: index + 1,
            team: formatFantasyTeam(team),
            user: {
                _id: team.userId?._id?.toString() || null,
                username: team.userId?.username || null,
                name: team.userId?.name || null,
                displayName: team.userId?.username || team.userId?.name || team.userId?.email || 'User'
            }
        }));

        res.json({
            match: normalizeFantasyMatch(match),
            leaderboard
        });
    } catch (error) {
        console.error('Fantasy leaderboard fetch failed:', error);
        res.status(500).json({ message: 'Failed to fetch fantasy leaderboard.' });
    }
};

export const recalculateFantasyPoints = async (req, res) => {
    try {
        const [FantasyPlayer, FantasyTeam] = await Promise.all([
            getFantasyPlayerModel(),
            getFantasyTeamModel()
        ]);
        const match = await findFantasyMatchByIdentifier(req.params.matchId);
        if (!match) {
            return res.status(404).json({ message: 'Match not found.' });
        }

        const fantasyTeams = await FantasyTeam.find({ matchId: match._id });
        if (fantasyTeams.length === 0) {
            return res.json({
                success: true,
                message: 'No fantasy teams found for this match.',
                updatedCount: 0
            });
        }

        const playerIds = [...new Set(fantasyTeams.flatMap((team) => team.players.map((playerId) => playerId.toString())))];
        const players = await FantasyPlayer.find({ _id: { $in: playerIds } }).select('points');
        const playerMap = new Map(players.map((player) => [player._id.toString(), player]));

        const bulkUpdates = fantasyTeams.map((team) => ({
            updateOne: {
                filter: { _id: team._id },
                update: {
                    $set: {
                        totalPoints: calculateFantasyTeamPoints(team, playerMap)
                    }
                }
            }
        }));

        if (bulkUpdates.length > 0) {
            await FantasyTeam.bulkWrite(bulkUpdates);
        }

        res.json({
            success: true,
            message: 'Fantasy points recalculated successfully.',
            updatedCount: bulkUpdates.length
        });
    } catch (error) {
        console.error('Fantasy points recalculation failed:', error);
        res.status(500).json({ message: 'Failed to recalculate fantasy points.' });
    }
};
