import express from 'express';
import { fantasyAuth } from '../middleware/fantasyAuth.js';
import {
    getFantasyLeaderboard,
    getFantasyMatches,
    getFantasyPlayersForMatch,
    getMyFantasyTeams,
    getAllUserFantasyTeams,
    recalculateFantasyPoints,
    saveFantasyTeam
} from '../controllers/fantasyController.js';

const router = express.Router();

const adminOnly = (req, res, next) => {
    if (req.user?.role === 'admin') {
        return next();
    }

    return res.status(403).json({ message: 'Admin access required.' });
};

router.get('/matches', fantasyAuth, getFantasyMatches);
router.get('/players/:matchId', fantasyAuth, getFantasyPlayersForMatch);
router.post('/team', fantasyAuth, saveFantasyTeam);
router.get('/my-teams', fantasyAuth, getAllUserFantasyTeams);
router.get('/my-teams/:matchId', fantasyAuth, getMyFantasyTeams);
router.get('/leaderboard/:matchId', fantasyAuth, getFantasyLeaderboard);
router.post('/admin/recalculate/:matchId', fantasyAuth, adminOnly, recalculateFantasyPoints);

export default router;
