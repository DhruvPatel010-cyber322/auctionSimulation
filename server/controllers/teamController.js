import Team from '../models/Team.js';
import Tournament from '../models/Tournament.js';
import { calculatePointsForWindow } from '../utils/weekManager.js';


// --- REUSABLE SCORING LOGIC ---
export const getTeamScoringSummary = async (team, tournament) => {
    // 1. Finalized total from past weeks (already includes Week 1 from migration)
    let totalFinalized = team.totalPoints || 0;
    let currentWeekLivePoints = 0;
    let playerWeekPoints = {};

    // 2. Identify Current Week context
    const currentWeekNum = tournament?.currentWeek || 1;
    const weekStartTime = tournament?.weekStartTime;

    // 3. Add live points only for Week 2+ (or if Week 1 snapshot somehow existed)
    if (weekStartTime) {
        const snapshot = team.playing11History.find(h => h.week === currentWeekNum);
        
        let actualStartTime = weekStartTime;
        const prevWeek = tournament?.weekData?.find(w => w.week === currentWeekNum - 1);
        if (prevWeek && prevWeek.endTime) {
            actualStartTime = prevWeek.endTime;
        }

        if (snapshot) {
            const result = await calculatePointsForWindow(
                team, 
                actualStartTime, 
                new Date(), // Current live window
                snapshot
            );
            currentWeekLivePoints = result.total;
            playerWeekPoints = result.playerPoints;
        }
    }

    // Points breakdown for frontend
    const pastWeeksMap = {};
    (team.weeklyPoints || []).forEach(wp => {
        pastWeeksMap[`week${wp.week}`] = wp.points;
    });

    return {
        id: team.code,
        name: team.name,
        logo: team.logo,
        totalPoints: Number((totalFinalized + currentWeekLivePoints).toFixed(2)),
        finalizedTotal: totalFinalized,
        livePoints: currentWeekLivePoints,
        playerWeekPoints, // Map of { playerId: { total, batting, bowling, fielding } }
        weeklyBreakdown: pastWeeksMap, // e.g. { week1: 846.5 }
        playing11Count: team.playing11.length
    };
};

export const getPointsTable = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const query = tournamentId ? { _id: tournamentId } : {};
        const tournament = await Tournament.findOne(query).sort({ createdAt: -1 });
        const teams = await Team.find({}).populate('playing11');

        const pointsTable = await Promise.all(teams.map(async team => {
            return await getTeamScoringSummary(team, tournament);
        }));

        // Sort by Grand Total (Descending)
        pointsTable.sort((a, b) => b.totalPoints - a.totalPoints);

        res.json({
            success: true,
            currentWeek: tournament?.currentWeek || 1,
            isWeekActive: !!tournament?.weekStartTime,
            pointsTable
        });

    } catch (error) {
        console.error("Get Points Table Error:", error);
        res.status(500).json({ message: 'Failed to fetch points table' });
    }
};
