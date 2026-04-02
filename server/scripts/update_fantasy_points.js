
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Player from '../models/Player.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/auction_db';
const CSV_PATH = "D:\\Projects\\Auction\\fantasy_points.csv";

/**
 * Normalizes player names for accurate matching between CSV and Database.
 * Removes common suffixes like (c), (wk), (IP), (RP) and non-alphanumeric characters.
 */
const normalizeName = (n) => {
    if (!n) return '';
    return n.toLowerCase()
        .replace(/\s*\([^)]*\)/g, '') // Remove (c), (wk), etc.
        .replace(/[^a-z0-9\s]/g, '')    // Remove non-alphanumeric (punctuations)
        .replace(/\s+/g, ' ')           // Compact spaces
        .trim();
};

const updatePoints = async () => {
    try {
        console.log('--- FANTASY POINTS UPDATE SCRIPT ---');
        console.log('Connecting to database...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        if (!fs.existsSync(CSV_PATH)) {
            console.error(`❌ CSV File not found at: ${CSV_PATH}`);
            process.exit(1);
        }

        const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim() !== '');
        
        // Skip header
        const rows = lines.slice(1);
        console.log(`Read ${rows.length} rows from CSV.`);

        // Fetch all players from DB where isInPlaying11 is true
        const dbPlayers = await Player.find({ isInPlaying11: true });
        console.log(`Found ${dbPlayers.length} players with isInPlaying11: true in database.`);

        // Create player map for quick lookup
        const playerMap = {};
        dbPlayers.forEach(p => {
            const norm = normalizeName(p.name);
            playerMap[norm] = p;
        });

        const updates = [];
        let matchedCount = 0;
        let missedCount = 0;

        for (const row of rows) {
            // Split by comma handling potential quoted values (though the sample looks fine)
            // A simple split should work for this specific csv based on the snapshot.
            const cols = row.split(',');
            if (cols.length < 8) continue;

            const [
                playerIdCsv,
                playerNameCsv,
                teamCsv,
                batPointsCsv,
                bowlPointsCsv,
                fieldPointsCsv,
                playingPointsCsv,
                totalPointsCsv
            ] = cols;

            const normNameCsv = normalizeName(playerNameCsv);
            const player = playerMap[normNameCsv];

            if (player) {
                // Multiplier Logic: C=2x, VC=1.5x, Other=1x
                let multiplier = 1;
                if (player.isCaptain) multiplier = 2;
                else if (player.isViceCaptain) multiplier = 1.5;

                // Points update (rounding to 1 decimal place or integer depending on your preference)
                // We'll keep them as numbers to match the schema Types.
                const newBatPoints = Number(batPointsCsv) * multiplier;
                const newBowlPoints = Number(bowlPointsCsv) * multiplier;
                // Fielding points includes base fielding + playing 11 appearance points
                const newFieldPoints = (Number(fieldPointsCsv) + Number(playingPointsCsv)) * multiplier;
                const newTotalPoints = Number(totalPointsCsv) * multiplier;

                // Sync data
                player.playerId = playerIdCsv;
                player.points = {
                    total: newTotalPoints,
                    batting: newBatPoints,
                    bowling: newBowlPoints,
                    fielding: newFieldPoints,
                    announcement: 0
                };

                updates.push(player.save());
                matchedCount++;
                console.log(`✅ MATCH: ${player.name} (${multiplier}x) -> ${newTotalPoints} total pts.`);
            } else {
                missedCount++;
                // console.log(`❌ NO MATCH: ${playerNameCsv} (Normalized: ${normNameCsv})`);
            }
        }

        if (updates.length > 0) {
            console.log(`Saving ${updates.length} updates...`);
            await Promise.all(updates);
            console.log('✅ Update successful!');
        } else {
            console.log('⚠️ No matching players updated.');
        }

        console.log('--- SUMMARY ---');
        console.log(`Matches found & updated: ${matchedCount}`);
        console.log(`CSV rows skipped (no match in Playing XI): ${missedCount}`);
        console.log('--- DONE ---');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error executing update script:', err);
        process.exit(1);
    }
};

updatePoints();
