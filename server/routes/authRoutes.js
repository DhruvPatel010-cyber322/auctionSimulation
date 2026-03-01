import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Tournament from '../models/Tournament.js';
import TournamentUser from '../models/TournamentUser.js';
import Player from '../models/Player.js';
import Team from '../models/Team.js'; // Singleton Team Model
import { TEAMS } from '../data/teams.js'; // Static configs
import { firebaseAuth } from '../middleware/firebaseAuth.js';
import * as teamController from '../controllers/teamController.js';
import AuctionState from '../models/AuctionState.js';

const router = express.Router();

// Local Admin Middleware for routes in this file
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Admin access required' });
    }
};

// 1. Firebase Login / Exchange Token
// Client sends Firebase Token in Header via middleware
// Returns Mongo User details
router.post('/login', firebaseAuth, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});

// 1.5 Set Username
router.post('/set-username', firebaseAuth, async (req, res) => {
    const { username } = req.body;
    if (!username || username.length < 3) {
        return res.status(400).json({ message: 'Username must be at least 3 characters' });
    }

    try {
        // Check uniqueness
        const existing = await User.findOne({ username: username.toLowerCase() });
        if (existing) {
            return res.status(409).json({ message: 'Username already taken' });
        }

        req.user.username = username.toLowerCase();
        await req.user.save();

        res.json({ success: true, username: req.user.username });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Username already taken' });
        }
        res.status(500).json({ message: 'Failed to set username' });
    }
});

// 2. List Tournaments
router.get('/tournaments', firebaseAuth, async (req, res) => {
    try {
        const tournaments = await Tournament.find({ status: { $in: ['OPEN', 'ACTIVE', 'RUNNING'] } });
        res.json(tournaments);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching tournaments' });
    }
});

// 2.2 Delete Tournament
// 2.2 Delete Tournament (AND RESET GAME DATA)
router.delete('/tournaments/:id', firebaseAuth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access Denied: Only admins can delete tournaments.' });
    }

    try {
        const tournamentId = req.params.id;
        const tournament = await Tournament.findById(tournamentId);

        if (!tournament) {
            return res.status(404).json({ message: 'Tournament not found' });
        }

        // 1. Delete the Tournament document
        await Tournament.findByIdAndDelete(tournamentId);

        // 2. Delete associated user assignments (Cascade)
        await TournamentUser.deleteMany({ tournament: tournamentId });

        // 3. HARD RESET: INIT DATABASE AGAIN
        // Reset Players
        await Player.updateMany({}, {
            $set: {
                status: 'AVAILABLE',
                soldPrice: null,
                soldToTeam: null,
                points: 0 // Optional: Reset points too if part of new tournament
            }
        });

        // Reset Teams
        await Team.updateMany({}, {
            $set: {
                remainingPurse: 120, // Default 120 Cr
                totalSpent: 0,
                squadSize: 0,
                overseasCount: 0,
                playersBought: [],
                playing11: [],
                isActive: false, // Reset active status
                isLoggedIn: false,
                activeSessionId: null
            }
        });

        // Reset Global Auction State
        await AuctionState.deleteMany({}); // Clear active auction state

        console.log(`[System] Tournament ${tournamentId} deleted. GLOBAL RESET performed.`);

        res.json({ success: true, message: 'Tournament deleted and System Reset successfully' });
    } catch (err) {
        console.error('Delete Tournament Error:', err);
        res.status(500).json({ message: 'Failed to delete tournament' });
    }
});

// 2.5 Create Tournament
router.post('/create-tournament', firebaseAuth, async (req, res) => {
    const { name, accessCode, selectionMode } = req.body;

    if (!name || !accessCode) {
        return res.status(400).json({ message: 'Name and Access Code are required' });
    }

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access Denied: Only admins can create tournaments.' });
    }

    try {
        const tournament = await Tournament.create({
            name,
            accessCode,
            selectionMode: selectionMode || 'USER_CHOICE',
            createdBy: req.user._id
        });
        res.json({ success: true, tournament });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create tournament' });
    }
});

// 3. Join Tournament (Check Code)
router.post('/tournaments/:id/join', firebaseAuth, async (req, res) => {
    const { accessCode } = req.body;
    try {
        const tournament = await Tournament.findById(req.params.id);
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

        if (tournament.accessCode !== accessCode) {
            return res.status(403).json({ message: 'Invalid Access Code' });
        }

        // Register user in tournament lobby (if not already there)
        const userId = req.user._id;
        try {
            await TournamentUser.create({
                tournament: req.params.id,
                user: userId,
                teamCode: null // Lobby
            });
        } catch (e) {
            // Ignore duplicate key error (already joined)
            if (e.code !== 11000) throw e;
        }

        // Check if user is ALREADY assigned to a team (Auto-Login)
        const existingAssignment = await TournamentUser.findOne({
            tournament: req.params.id,
            user: userId,
            teamCode: { $ne: null }
        });

        if (existingAssignment && existingAssignment.teamCode) {
            // GENERATE TOKEN (Same as select-team logic)
            const teamCode = existingAssignment.teamCode;
            const dbTeam = await Team.findOne({ code: teamCode.toUpperCase() });

            if (dbTeam) {
                // Check if they already have an active session, otherwise we should create one.
                // However, since they are routing to dashboard, we must provide a matching sessionId.
                let sessionId = dbTeam.activeSessionId;
                if (!sessionId) {
                    sessionId = crypto.randomUUID();
                    dbTeam.activeSessionId = sessionId;
                    dbTeam.isLoggedIn = true;
                    dbTeam.lastLoginAt = new Date();
                    await dbTeam.save();
                }

                const userRole = req.user.role === 'admin' ? 'admin' : 'team';
                const token = jwt.sign({
                    teamCode: dbTeam.code,
                    role: userRole,
                    tournamentId: tournament._id,
                    userId: userId,
                    sessionId: sessionId
                }, process.env.JWT_SECRET, { expiresIn: '12h' });

                const teamConfig = TEAMS.find(t => t.id === dbTeam.code.toLowerCase()) || {};

                return res.json({
                    success: true,
                    message: 'Access Granted (Auto-Login)',
                    autoLogin: true,
                    token,
                    team: {
                        ...teamConfig,
                        remainingPurse: dbTeam.remainingPurse,
                        squadSize: dbTeam.squadSize,
                        overseasCount: dbTeam.overseasCount,
                        role: userRole,
                        code: dbTeam.code,
                        logo: dbTeam.logo,
                        username: req.user.username
                    }
                });
            }
        }

        res.json({ success: true, message: 'Access Granted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error joining tournament' });
    }
});

// 3.5 Admin Assign Team
router.post('/tournaments/:id/assign-team', firebaseAuth, async (req, res) => {
    const { userId, teamCode } = req.body;
    const tournamentId = req.params.id;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can assign teams' });
    }

    try {
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

        // Update or Create assignment with specific team
        // We use findOneAndUpdate with upsert to handle both "lobby -> team" and "new -> team"
        await TournamentUser.findOneAndUpdate(
            { tournament: tournamentId, user: userId },
            { teamCode: teamCode.toUpperCase() },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({ success: true, message: 'Team Assigned Successfully' });
    } catch (err) {
        console.error(err);
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Team is already taken' });
        }
        res.status(500).json({ message: 'Failed to assign team' });
    }
});

// 3.8 Admin Create Tournament
router.post('/tournaments/create', firebaseAuth, async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can create tournaments' });
    }

    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Tournament name is required' });

    try {
        const generatedAccessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const newTournament = new Tournament({
            name,
            accessCode: generatedAccessCode,
            createdBy: req.user._id,
            status: 'OPEN'
        });
        await newTournament.save();
        res.status(201).json({ success: true, message: 'Tournament created successfully', tournament: newTournament });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to create tournament' });
    }
});

// 4. Get Teams Availability for a Tournament
router.get('/tournaments/:id/teams', firebaseAuth, async (req, res) => {
    console.log(`[API] Fetching teams for tournament: ${req.params.id}`);
    try {
        const tournamentId = req.params.id;

        // PARALLELIZE 4 Queries to eliminate sequential blocking delay and remove massive population overhead
        const [tournament, takenAssignments, dbTeams, userAssignment] = await Promise.all([
            Tournament.findById(tournamentId).lean(),
            TournamentUser.find({
                tournament: tournamentId,
                teamCode: { $ne: null }
            }).populate('user', 'username').lean(),
            Team.find({}).lean(), // Optimized: Removed heavy .populate('playersBought') as it delays initial page load 
            TournamentUser.findOne({
                tournament: tournamentId,
                user: req.user._id
            }).lean()
        ]);

        const takenTeamMap = new Map(takenAssignments.map(a => [a.teamCode, a.user?.username]));
        const takenTeamCodes = new Set(takenAssignments.map(a => a.teamCode));
        const dbTeamsMap = new Map(dbTeams.map(t => [t.code, t]));

        const teamsWithStatus = TEAMS.map(team => {
            const dbTeam = dbTeamsMap.get(team.id.toUpperCase());
            return {
                ...team,
                isTaken: takenTeamCodes.has(team.id.toUpperCase()),
                ownerUsername: takenTeamMap.get(team.id.toUpperCase()) || null,
                isMyTeam: userAssignment?.teamCode === team.id.toUpperCase(),
                logo: dbTeam?.logo || null
            };
        });

        // If Admin, also return list of all joined users (for management)
        let joinedUsers = [];
        if (req.user.role === 'admin') {
            const allParticipants = await TournamentUser.find({ tournament: tournamentId }).populate('user', 'username');
            joinedUsers = allParticipants
                .filter(p => p.user) // Prevent 500 crash if user was deleted
                .map(p => ({
                    assignmentId: p._id,
                    userId: p.user._id,
                    username: p.user.username,
                    teamCode: p.teamCode
                }));
        }

        res.json({
            teams: teamsWithStatus,
            selectionMode: tournament?.selectionMode || 'USER_CHOICE',
            joinedUsers,
            startDashboard: !!(userAssignment && userAssignment.teamCode), // Only auto-start if team is selected
            myTeamCode: userAssignment?.teamCode,
            isAdmin: req.user.role === 'admin'
        });
    } catch (err) {
        console.error("[API] Error fetching tournament teams:", err);
        res.status(500).json({ message: 'Error fetching tournament teams' });
    }
});

// 5. Select Team (The Core Logic)
router.post('/tournaments/:id/select-team', firebaseAuth, async (req, res) => {
    const { teamCode } = req.body;
    const tournamentId = req.params.id;
    const userId = req.user._id;

    if (!teamCode) return res.status(400).json({ message: 'Team Code Required' });

    try {
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

        // Check Selection Mode
        if (tournament.selectionMode === 'ADMIN_ASSIGN' && req.user.role !== 'admin') {
            // If User Choice is disabled, user can only "login" if already assigned
            const myAssignment = await TournamentUser.findOne({ tournament: tournamentId, user: userId });
            if (!myAssignment || !myAssignment.teamCode) {
                return res.status(403).json({ message: 'Team selection is locked. Please wait for Admin assignment.' });
            }
            if (myAssignment.teamCode !== teamCode.toUpperCase()) {
                return res.status(403).json({ message: 'You are assigned to a different team.' });
            }
            // If matches, allow flow to proceed (it will fall through to logic below which handles re-login)
        }

        // A. Check if Team is Taken in this Tournament
        const existingAssignment = await TournamentUser.findOne({
            tournament: tournamentId,
            teamCode: teamCode.toUpperCase()
        });

        if (existingAssignment) {
            // Check if it's the SAME user (Re-login)
            if (existingAssignment.user.toString() === userId.toString()) {
                // Same user returning to same team -> Allow login
            } else {
                return res.status(409).json({ message: `Team ${teamCode} is already taken by another user.` });
            }
        } else {
            // B. Check if User already has a team in this tournament
            const userAssignment = await TournamentUser.findOne({
                tournament: tournamentId,
                user: userId
            });

            if (userAssignment && userAssignment.teamCode !== null) {
                // If user tries to pick a differnt team
                return res.status(400).json({ message: 'You have already selected a team in this tournament.' });
            }

            // C. Create Assignment
            await TournamentUser.findOneAndUpdate(
                { tournament: tournamentId, user: userId },
                { teamCode: teamCode.toUpperCase() },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        // --- STATELESS LOGIN (Multi-Tournament) ---

        // 1. Fetch Singleton Team
        const dbTeam = await Team.findOne({ code: teamCode.toUpperCase() });
        if (!dbTeam) return res.status(500).json({ message: 'System Error: Team config missing.' });

        // --- NEW SESSION LOGIC ---
        const sessionId = crypto.randomUUID();
        dbTeam.activeSessionId = sessionId;
        dbTeam.isLoggedIn = true;
        dbTeam.lastLoginAt = new Date();
        await dbTeam.save();
        // -------------------------

        // 2. Issue Token with Tournament Scope
        // If the user has 'admin' role in DB, preserve it in the JWT
        const userRole = req.user.role === 'admin' ? 'admin' : 'team';

        const token = jwt.sign({
            teamCode: dbTeam.code,
            role: userRole,
            tournamentId: tournament._id, // Scope token to tournament
            userId: userId,
            sessionId: sessionId // EMBED SESSION ID
        }, process.env.JWT_SECRET, { expiresIn: '12h' });

        // 4. Return Data expected by Frontend
        // We find static config for colors etc.
        const teamConfig = TEAMS.find(t => t.id === dbTeam.code.toLowerCase()) || {};

        // 5. Emit Real-time Event
        if (req.io) {
            req.io.emit('tournament:team_taken', {
                tournamentId,
                teamCode: dbTeam.code,
                ownerUsername: req.user.username,
                userId: userId
            });
        }

        res.json({
            success: true,
            token, // The Critical Piece
            team: {
                ...teamConfig,
                remainingPurse: dbTeam.remainingPurse,
                squadSize: dbTeam.squadSize,
                overseasCount: dbTeam.overseasCount,
                role: userRole,
                code: dbTeam.code,
                logo: dbTeam.logo,
                username: req.user.username
            }
        });

    } catch (err) {
        console.error("Select Team Error:", err);
        res.status(500).json({
            message: 'Failed to select team',
            error: err.message, // expose msg
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// 5.5 Unassign Team (Admin Only)
router.post('/tournaments/:id/unassign-team', firebaseAuth, adminOnly, async (req, res) => {
    const tournamentId = req.params.id;
    const { assignmentId, userId } = req.body;

    if (!userId && !assignmentId) return res.status(400).json({ message: 'User ID or Assignment ID is required' });

    try {
        console.log(`[API] Unassigning team. Tournament: ${tournamentId}, AssignmentId: ${assignmentId}, UserId: ${userId}`);

        const query = assignmentId
            ? { _id: assignmentId }
            : { tournament: tournamentId, user: userId };

        const assignment = await TournamentUser.findOneAndUpdate(
            query,
            { $set: { teamCode: null } },
            { new: true }
        );

        if (!assignment) {
            console.error(`[API] Unassign Failed: Document not found for query`, query);
            return res.status(404).json({ message: 'User assignment not found in this tournament.' });
        }

        // Emit Socket event so active clients drop the user from the team slot
        if (req.io) {
            req.io.emit('tournament:team_freed', {
                tournamentId,
                userId: userId
            });
        }

        res.json({ success: true, message: 'User unassigned successfully' });
    } catch (err) {
        console.error("[API] Error unassigning team:", err);
        res.status(500).json({ message: 'Failed to unassign team' });
    }
});

// 5.5 Watch Auction (Spectator Mode)
router.post('/tournaments/:id/watch', firebaseAuth, async (req, res) => {
    const tournamentId = req.params.id;
    const userId = req.user._id;

    try {
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

        // Issue Spectator Token
        const sessionId = crypto.randomUUID();
        const token = jwt.sign({
            teamCode: 'spectator',
            role: 'spectator',
            tournamentId: tournament._id,
            userId: userId,
            sessionId: sessionId
        }, process.env.JWT_SECRET, { expiresIn: '12h' });

        res.json({
            success: true,
            token,
            team: {
                name: 'Spectator',
                role: 'spectator',
                code: 'spectator',
                remainingPurse: 0,
                squadSize: 0,
                overseasCount: 0,
                username: req.user.username
            }
        });

    } catch (err) {
        console.error("Watch Auction Error:", err);
        res.status(500).json({ message: 'Failed to enter spectator mode' });
    }
});

// 6. Admin Login (Exchange Firebase Token for Admin JWT)
router.post('/admin/login', firebaseAuth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access Denied: Admin role required.' });
        }

        const sessionId = crypto.randomUUID();
        const token = jwt.sign({
            teamCode: 'admin',
            role: 'admin',
            sessionId,
            userId: req.user._id
        }, process.env.JWT_SECRET, { expiresIn: '12h' });

        res.json({
            success: true,
            token,
            user: { ...req.user.toObject(), role: 'admin' }
        });
    } catch (err) {
        console.error("Admin Login Error:", err);
        res.status(500).json({ message: 'Admin login failed' });
    }
});

// 7. Save Playing XI
// Helper: Validate Batting Position
const validateBattingPositionRules = (player, position) => {
    // If group is null, allow (per requirements)
    if (!player.battingPositionGroup) return { valid: true };

    const group = player.battingPositionGroup;
    let requiredGroup = null;

    if (position >= 1 && position <= 2) requiredGroup = 1;      // Openers
    else if (position >= 3 && position <= 4) requiredGroup = 2; // Middle
    else if (position >= 5 && position <= 7) requiredGroup = 3; // Lower Middle
    else if (position >= 8 && position <= 11) requiredGroup = 4;// Lower Order

    if (requiredGroup && group !== requiredGroup) {
        const groupName = group === 1 ? "Opener" : group === 2 ? "Middle Order" : group === 3 ? "Lower Middle" : "Tail";
        const reqName = requiredGroup === 1 ? "Openers" : requiredGroup === 2 ? "Middle Order" : requiredGroup === 3 ? "Lower Middle" : "Lower Order";
        return {
            valid: false,
            message: `Player ${player.name} (${groupName}) cannot bat at position ${position} (${reqName} required)`
        };
    }
    return { valid: true };
};

// 7. Save Playing XI
// 7. Save Playing XI
router.post('/tournaments/:id/playing11', firebaseAuth, async (req, res) => {
    const { playerIds } = req.body; // Legacy payload
    let itemsToProcess = [];

    const tournamentId = req.params.id;
    const userId = req.user._id;

    try {
        // 1. Get User's Team in this Tournament
        const userAssignment = await TournamentUser.findOne({ tournament: tournamentId, user: userId });
        if (!userAssignment || !userAssignment.teamCode) {
            return res.status(403).json({ message: 'You do not have a team in this tournament.' });
        }

        // 2. Fetch Team PRIOR to validation (Needed for Ownership Check)
        const team = await Team.findOne({ code: userAssignment.teamCode });
        if (!team) return res.status(404).json({ message: 'Team not found.' });

        // 3. Normalize Input
        if (Array.isArray(req.body)) {
            // NEW Payload: [ { playerId, battingPosition } ]
            itemsToProcess = req.body;
        } else if (Array.isArray(playerIds)) {
            // LEGACY Payload: [ id1, id2... ] - Infer Position from Index (1-based)
            itemsToProcess = playerIds.map((pid, index) => ({
                playerId: pid,
                battingPosition: index + 1
            }));
        } else {
            return res.status(400).json({ message: 'Invalid payload format.' });
        }

        if (itemsToProcess.length !== 11) {
            return res.status(400).json({ message: 'You must select exactly 11 players.' });
        }

        // 4. Resolve Players and Validate
        const inputIds = itemsToProcess.map(p => p.playerId);

        // Strict Integrity Check: All players must be UNIQUE in the request
        const uniqueParams = new Set(inputIds);
        if (uniqueParams.size !== 11) {
            return res.status(400).json({ message: 'Duplicate players in selection.' });
        }

        const players = await Player.find({ _id: { $in: inputIds } });
        if (players.length !== 11) {
            return res.status(400).json({ message: 'One or more invalid player IDs.' });
        }

        let overseasCount = 0;
        let wkCount = 0;
        let bowlerCount = 0;

        for (const player of players) {
            if (player.country !== 'India' && player.country !== 'IND') overseasCount++;
            if (player.role === 'Wicket Keeper') wkCount++;
            if (player.role === 'Bowler' || player.role === 'All-Rounder') bowlerCount++;
        }

        if (overseasCount > 4 || wkCount < 1 || bowlerCount < 5) {
            return res.status(400).json({ message: 'Playing XI does not meet squad formation rules' });
        }

        const playerMap = new Map(players.map(p => [p._id.toString(), p]));
        const ownedPlayerIds = new Set(team.playersBought.map(id => id.toString()));

        for (const item of itemsToProcess) {
            const player = playerMap.get(item.playerId);

            // A. OWNERSHIP CHECK (CRITICAL FIX)
            if (!ownedPlayerIds.has(item.playerId)) {
                return res.status(403).json({ message: `Security violation: You do not own player ${player.name}` });
            }

            // B. Batting Position Rule Validation
            const result = validateBattingPositionRules(player, item.battingPosition);
            if (!result.valid) {
                return res.status(400).json({ message: result.message });
            }
        }

        // 5. Save if all valid
        team.playing11 = inputIds;
        await team.save();

        res.json({ success: true, message: 'Playing XI saved successfully', playing11: team.playing11 });

    } catch (err) {
        console.error("Save Playing XI Error:", err);
        res.status(500).json({ message: 'Failed to save Playing XI' });
    }
});

// 8. Get Playing XI (or Squad with status)
router.get('/tournaments/:id/my-squad', firebaseAuth, async (req, res) => {
    const tournamentId = req.params.id;
    const userId = req.user._id;

    try {
        const userAssignment = await TournamentUser.findOne({ tournament: tournamentId, user: userId });
        if (!userAssignment || !userAssignment.teamCode) {
            return res.status(403).json({ message: 'No team assigned.' });
        }

        const team = await Team.findOne({ code: userAssignment.teamCode }).populate('playersBought').populate('playing11');
        if (!team) return res.status(404).json({ message: 'Team not found.' });

        res.json({
            success: true,
            players: team.playersBought,
            playing11: team.playing11, // Array of objects
            teamCode: team.code
        });

    } catch (err) {
        console.error("Get My Squad Error:", err);
        res.status(500).json({ message: 'Failed to fetch squad' });
    }
});

// 9. Public Squad View (For "View Other Team")
router.get('/tournaments/:id/teams/:teamCode/squad', firebaseAuth, async (req, res) => {
    const { teamCode } = req.params;

    try {
        const team = await Team.findOne({ code: teamCode.toUpperCase() })
            .populate('playersBought')
            .populate('playing11');

        if (!team) return res.status(404).json({ message: 'Team not found.' });

        res.json({
            success: true,
            players: team.playersBought,
            playing11: team.playing11,
            teamCode: team.code
        });
    } catch (err) {
        console.error("Get Team Squad Error:", err);
        res.status(500).json({ message: 'Failed to fetch team squad' });
    }
});

// 10. Points Table
router.get('/tournaments/:id/points-table', firebaseAuth, teamController.getPointsTable);

export default router;
