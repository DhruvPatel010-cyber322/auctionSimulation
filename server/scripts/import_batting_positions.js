import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Player from '../models/Player.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/auction_db';
const CSV_PATH = path.join(__dirname, '../../players_export_v2-updatedposition.csv');

const getGroupFromPosition = (pos) => {
    const p = parseInt(pos);
    if (isNaN(p)) return null;
    if (p >= 1 && p <= 2) return 1;
    if (p >= 3 && p <= 4) return 2;
    if (p >= 5 && p <= 7) return 3;
    if (p >= 8 && p <= 11) return 4;
    return null;
};

const importPositions = async () => {
    try {
        if (!fs.existsSync(CSV_PATH)) {
            console.error(`❌ CSV file not found at: ${CSV_PATH}`);
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log(`Connected to: ${mongoose.connection.name}`);

        console.log('Reading CSV...');
        const content = fs.readFileSync(CSV_PATH, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());

        // Assume Header is line 0
        const headers = lines[0].split(',');
        const posIndex = headers.findIndex(h => h.trim().toLowerCase() === 'position');
        const idIndex = headers.findIndex(h => h.trim().toLowerCase() === 'srno'); // Use SrNo to identify

        if (posIndex === -1) {
            // Fallback for user saying "last column" if header missing/renamed
            console.log("⚠️ 'Position' header not found. Checking if it's the last column...");
            // logic inside loop
        }

        let updatedCount = 0;
        let skippedCount = 0;

        // Start from line 1
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const cols = line.split(',');

            // Handle potentially quoted names which split incorrectly? 
            // The previous export wrapped names in quotes. Simple split might break if name has comma.
            // But standard export format was `...,"Name",...`.
            // Let's assume standard SrNo is first and Position is last for safety if parsing fails.

            const srNo = cols[0];
            const positionRaw = cols[cols.length - 1]; // User said "last columns"

            if (!srNo || !positionRaw) {
                skippedCount++;
                continue;
            }

            const group = getGroupFromPosition(positionRaw.trim());

            if (group !== null) {
                const res = await Player.updateOne(
                    { srNo: parseInt(srNo) },
                    { $set: { battingPositionGroup: group } }
                );
                if (res.modifiedCount > 0) updatedCount++;
            } else {
                // If position is valid 1-11 but group is null, it means logic error? 
                // getGroupFromPosition handles 1-11. 
                // If position is empty or 0, we skip update or set to null?
                // Requirements: "Updated CSV". If empty, maybe ignore?
                skippedCount++;
            }

            if (i % 50 === 0) process.stdout.write('.');
        }

        console.log('\n');
        console.log(`✅ Import Complete.`);
        console.log(`Updated: ${updatedCount} players`);
        console.log(`Skipped/No Change: ${skippedCount} items`);

        process.exit(0);

    } catch (err) {
        console.error('❌ Import failed:', err);
        process.exit(1);
    }
};

importPositions();
