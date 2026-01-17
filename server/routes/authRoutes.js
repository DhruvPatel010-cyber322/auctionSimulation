import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Tournament from '../models/Tournament.js';
import TournamentUser from '../models/TournamentUser.js';
import Team from '../models/Team.js'; // Singleton Team Model
import { TEAMS } from '../data/teams.js'; // Static configs
import { firebaseAuth } from '../middleware/firebaseAuth.js';

const router = express.Router();

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

        res.json({ success: true, message: 'Tournament deleted successfully' });
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
                const userRole = req.user.role === 'admin' ? 'admin' : 'team';
                const token = jwt.sign({
                    teamCode: dbTeam.code,
                    role: userRole,
                    tournamentId: tournament._id,
                    userId: userId
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

// 4. Get Teams Availability for a Tournament
router.get('/tournaments/:id/teams', firebaseAuth, async (req, res) => {
    console.log(`[API] Fetching teams for tournament: ${req.params.id}`);
    try {
        const tournamentId = req.params.id;
        const tournament = await Tournament.findById(tournamentId);

        // Get all taken teams in this tournament and populate user to get username
        const takenAssignments = await TournamentUser.find({
            tournament: tournamentId,
            teamCode: { $ne: null }
        }).populate('user', 'username');
        const takenTeamMap = new Map(takenAssignments.map(a => [a.teamCode, a.user?.username]));
        const takenTeamCodes = new Set(takenAssignments.map(a => a.teamCode));

        // Fetch all teams from DB to get logos
        // Fetch all teams from DB to get logos and populate purchase details
        const dbTeams = await Team.find({}).populate('playersBought');
        const dbTeamsMap = new Map(dbTeams.map(t => [t.code, t]));

        // Map static teams to include availability and DB logo
        const userAssignment = await TournamentUser.findOne({
            tournament: tournamentId,
            user: req.user._id
        });

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
            joinedUsers = allParticipants.map(p => ({
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

            if (userAssignment) {
                // If user tries to pick a differnt team
                return res.status(400).json({ message: 'You have already selected a team in this tournament.' });
            }

            // C. Create Assignment
            await TournamentUser.create({
                tournament: tournamentId,
                user: userId,
                teamCode: teamCode.toUpperCase()
            });
        }

        // --- STATELESS LOGIN (Multi-Tournament) ---

        // 1. Fetch Singleton Team
        const dbTeam = await Team.findOne({ code: teamCode.toUpperCase() });
        if (!dbTeam) return res.status(500).json({ message: 'System Error: Team config missing.' });

        // 2. Issue Token with Tournament Scope
        // If the user has 'admin' role in DB, preserve it in the JWT
        const userRole = req.user.role === 'admin' ? 'admin' : 'team';

        const token = jwt.sign({
            teamCode: dbTeam.code,
            role: userRole,
            tournamentId: tournament._id, // Scope token to tournament
            userId: userId
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

export default router;
