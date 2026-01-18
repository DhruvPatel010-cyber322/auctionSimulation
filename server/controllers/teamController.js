
import Team from '../models/Team.js';

export const getPointsTable = async (req, res) => {
    try {
        // Fetch all teams and populate their playing 11
        // We need 'points' from the player objects
        const teams = await Team.find({}).populate('playing11');

        const pointsTable = teams.map(team => {
            const totalPoints = team.playing11.reduce((sum, player) => {
                return sum + (player.points || 0);
            }, 0);

            return {
                id: team.code, // Use code as ID for frontend consistency
                name: team.name,
                logo: team.logo,
                totalPoints: totalPoints,
                playing11Count: team.playing11.length
            };
        });

        // Sort by Total Points (Descending)
        pointsTable.sort((a, b) => b.totalPoints - a.totalPoints);

        res.json({
            success: true,
            pointsTable
        });

    } catch (error) {
        console.error("Get Points Table Error:", error);
        res.status(500).json({ message: 'Failed to fetch points table' });
    }
};
