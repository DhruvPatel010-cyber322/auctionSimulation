// manualPointsSync.js

import mongoose from 'mongoose';
import Player from '../models/Player.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI;

const EXTERNAL_API_BASE = 'https://a-bhavy-bot-bbheroku-5f1b58e25c41.herokuapp.com';

/** Normalize API name */
function normalizeApiName(raw) {
    if (!raw) return '';
    return raw
        .replace(/\s*\((c|wk|ip|rp|impact\s*player)\)\s*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Fuzzy match */
function fuzzyMatch(dbName, apiName) {
    const db = dbName.toLowerCase().trim();
    const api = apiName.toLowerCase().trim();

    return db === api || db.includes(api) || api.includes(db);
}

async function syncPoints(matchId) {
    console.log(`[ManualSync] 🔥 Starting for match ${matchId}`);

    try {
        // 1. Fetch API
        const res = await fetch(`${EXTERNAL_API_BASE}/points?match_id=${matchId}`);

        if (!res.ok) {
            console.error(`[ManualSync] API Error: ${res.status}`);
            return;
        }

        const json = await res.json();
        const apiPlayers = json?.data;

        if (!Array.isArray(apiPlayers) || apiPlayers.length === 0) {
            console.warn('[ManualSync] No data found');
            return;
        }

        // 2. Load DB players
        const dbPlayers = await Player.find({}).lean();

        let updated = 0, skipped = 0, notFound = 0;

        for (const apiPlayer of apiPlayers) {
            const name = normalizeApiName(apiPlayer.player);

            const dbPlayer = dbPlayers.find(p => fuzzyMatch(p.name, name));

            if (!dbPlayer) {
                console.log(`❌ Player Not Found in DB: ${name}`);
                notFound++;
                continue;
            }

            let base = Number(apiPlayer.total) || 0;
            let bat = Number(apiPlayer.bat) || 0;
            let bowl = Number(apiPlayer.bowl) || 0;
            let field = Number(apiPlayer.field) || 0;

            const updateData = {};

            // Save playerId
            if (!dbPlayer.playerId && apiPlayer.player_id) {
                updateData.playerId = apiPlayer.player_id;
            }

            // Skip bench
            if (!dbPlayer.isInPlaying11) {
                if (Object.keys(updateData).length > 0) {
                    await Player.findByIdAndUpdate(dbPlayer._id, { $set: updateData });
                }
                skipped++;
                continue;
            }

            // Apply multipliers
            if (dbPlayer.isCaptain) {
                base *= 2; bat *= 2; bowl *= 2; field *= 2;
            } else if (dbPlayer.isViceCaptain) {
                base *= 1.5; bat *= 1.5; bowl *= 1.5; field *= 1.5;
            }

            updateData.points = {
                total: Number(base.toFixed(2)),
                batting: Number(bat.toFixed(2)),
                bowling: Number(bowl.toFixed(2)),
                fielding: Number(field.toFixed(2)),
                announcement: 0
            };

            const matchIdNum = Number(matchId);
            let updatedPerMatchPoints = [...(dbPlayer.perMatchPoints || [])];
            const matchIdx = updatedPerMatchPoints.findIndex(m => m.matchId === matchIdNum);

            const matchPointsEntry = {
                matchId: matchIdNum,
                total: updateData.points.total,
                batting: updateData.points.batting,
                bowling: updateData.points.bowling,
                fielding: updateData.points.fielding,
                announcement: 0
            };

            if (matchIdx !== -1) {
                updatedPerMatchPoints[matchIdx] = matchPointsEntry;
            } else {
                updatedPerMatchPoints.push(matchPointsEntry);
            }
            updateData.perMatchPoints = updatedPerMatchPoints;

            await Player.findByIdAndUpdate(dbPlayer._id, { $set: updateData });

            updated++;
        }

        console.log(`✅ Updated: ${updated}`);
        console.log(`⏭ Skipped: ${skipped}`);
        console.log(`❌ Not Found: ${notFound}`);

    } catch (err) {
        console.error('[ManualSync] Error:', err.message);
    }
}

// 🔥 MAIN EXECUTION
(async () => {
    const matchId = process.argv[2];

    if (!matchId) {
        console.error('❌ Please provide matchId');
        console.log('👉 Usage: node manualPointsSync.js <matchId>');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGO_URI);
        console.log('🟢 DB Connected');

        await syncPoints(matchId);

        await mongoose.disconnect();
        console.log('🔴 DB Disconnected');
        process.exit(0);

    } catch (err) {
        console.error('❌ Fatal Error:', err.message);
        process.exit(1);
    }
})();