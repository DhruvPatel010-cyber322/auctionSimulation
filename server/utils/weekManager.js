import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Team from '../models/Team.js';
import Tournament from '../models/Tournament.js';
import Player from '../models/Player.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schedulePath = path.join(__dirname, '..', '..', 'ipl_schedule_export.json');

/**
 * Helper to parse IST date strings from schedule JSON
 */
function parseISTDate(dateStr, timeStr) {
    const [day, monthStr, year] = dateStr.split(' ');
    const months = {
        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const month = months[monthStr];
    const [hours, minutes] = timeStr.split(':');
    const isoMonth = (month + 1).toString().padStart(2, '0');
    const isoDay = day.padStart(2, '0');
    const isoString = `${year}-${isoMonth}-${isoDay}T${hours}:${minutes}:00+05:30`;
    return new Date(isoString);
}

/**
 * Calculates raw points for a team based on a snapshot and a time window.
 */
export const calculatePointsForWindow = async (team, startTime, endTime, snapshot) => {
    // Safety check: if snapshot is missing (e.g. for Week 1 transition)
    if (!snapshot) {
        console.warn(`[PointsCalc] Missing snapshot for team ${team.code}. Window: ${startTime} - ${endTime}`);
        return 0;
    }
    if (!startTime) return 0;
    
    // Load schedule to find match timings
    const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));
    
    // Find MatchIDs that started within the window
    const windowMatchIds = schedule
        .filter(m => {
            const start = parseISTDate(m.MatchDate, m.MatchTime);
            return start >= new Date(startTime) && (!endTime || start <= new Date(endTime));
        })
        .map(m => Number(m.MatchID));

    if (windowMatchIds.length === 0) return 0;

    // Load all players in the snapshot to get their perMatchPoints
    const playerIds = snapshot.players.map(id => id.toString());
    const players = await Player.find({ _id: { $in: playerIds } }).lean();

    let totalWeekPoints = 0;

    for (const player of players) {
        // Sum points for matches in the window
        const relevantPoints = (player.perMatchPoints || [])
            .filter(mp => windowMatchIds.includes(Number(mp.matchId)))
            .reduce((sum, mp) => sum + (mp.total || 0), 0);

        // Apply multipliers from snapshot
        let multiplier = 1;
        if (player._id.toString() === snapshot.captain?.toString()) multiplier = 2;
        else if (player._id.toString() === snapshot.viceCaptain?.toString()) multiplier = 1.5;

        totalWeekPoints += (relevantPoints * multiplier);
    }

    return Number(totalWeekPoints.toFixed(2));
};

/**
 * Starts a new week:
 * 1. Locks current Playing 11 for all teams into their history for the current week.
 * 2. Sets weekStartTime to now in Tournament.
 */
export const startNewWeek = async () => {
    const tournament = await Tournament.findOne().sort({ createdAt: -1 });
    if (!tournament) throw new Error('Tournament not found');

    const teams = await Team.find({});
    const currentWeek = tournament.currentWeek;

    for (const team of teams) {
        // Create snapshot for the new week
        const snapshot = {
            week: currentWeek,
            players: team.playing11,
            captain: team.captain,
            viceCaptain: team.viceCaptain,
            isLocked: true
        };

        // If history for this week already exists (e.g. restart), replace it
        const historyIdx = team.playing11History.findIndex(h => h.week === currentWeek);
        if (historyIdx !== -1) {
            team.playing11History[historyIdx] = snapshot;
        } else {
            team.playing11History.push(snapshot);
        }
        await team.save();
    }

    tournament.weekStartTime = new Date();
    // Ensure weekData entry exists
    const weekIdx = tournament.weekData.findIndex(w => w.week === currentWeek);
    if (weekIdx !== -1) {
        tournament.weekData[weekIdx].startTime = tournament.weekStartTime;
        tournament.weekData[weekIdx].isFinalized = false;
    } else {
        tournament.weekData.push({
            week: currentWeek,
            startTime: tournament.weekStartTime,
            isFinalized: false
        });
    }

    await tournament.save();
    return { week: currentWeek, startTime: tournament.weekStartTime };
};

/**
 * Finalizes the current week:
 * 1. Calculates scores for the window [weekStartTime, now].
 * 2. Updates Team.totalPoints and Team.weeklyPoints.
 * 3. Increments Tournament.currentWeek.
 */
export const finalizeWeek = async () => {
    const tournament = await Tournament.findOne().sort({ createdAt: -1 });
    if (!tournament || !tournament.weekStartTime) {
        throw new Error('Active week not found or not started.');
    }

    const endTime = new Date();
    const currentWeek = tournament.currentWeek;
    const teams = await Team.find({});

    for (const team of teams) {
        const snapshot = team.playing11History.find(h => h.week === currentWeek);
        if (!snapshot) {
            console.warn(`No snapshot found for Team ${team.code} in Week ${currentWeek}. Checking if already in weeklyPoints.`);
            
            // IF week is already in weeklyPoints (like our Week 1 backfill), skip recalculation
            const alreadyFinalized = team.weeklyPoints.some(wp => wp.week === currentWeek);
            if (alreadyFinalized) {
                console.log(`Team ${team.code} Week ${currentWeek} already finalized. Skipping.`);
                continue;
            }
            
            // Otherwise, we have a problem (missing mandatory snapshot for Week 2+)
            console.error(`FATAL: Missing snapshot for Team ${team.code} in mandatory Week ${currentWeek}. Points will be 0.`);
            team.weeklyPoints.push({ week: currentWeek, points: 0 });
            await team.save();
            continue;
        }

        const weekPoints = await calculatePointsForWindow(team, tournament.weekStartTime, endTime, snapshot);
        
        // Persist weekly score
        team.weeklyPoints.push({ week: currentWeek, points: weekPoints });
        team.totalPoints += weekPoints;
        await team.save();
    }

    // Update Tournament history
    const weekIdx = tournament.weekData.findIndex(w => w.week === currentWeek);
    if (weekIdx !== -1) {
        tournament.weekData[weekIdx].endTime = endTime;
        tournament.weekData[weekIdx].isFinalized = true;
    }

    // Move to next week
    tournament.currentWeek += 1;
    tournament.weekStartTime = null; // Clear until next "Start Week"
    await tournament.save();

    return { finalizedWeek: currentWeek, endTime };
};
