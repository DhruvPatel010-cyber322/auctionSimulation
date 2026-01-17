
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from '../models/Player.js';
import connectDB from '../config/db.js';

dotenv.config();

const CSV_PATH = path.resolve('../players_export_new.csv');

const updatePlayers = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        if (!fs.existsSync(CSV_PATH)) {
            console.error('CSV file not found at:', CSV_PATH);
            process.exit(1);
        }

        const data = fs.readFileSync(CSV_PATH, 'utf-8');
        const lines = data.split('\n'); // Split by new line

        // Skip Header
        const header = lines[0];
        console.log('Header:', header);

        let updatedCount = 0;
        let errorCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = line.split(',');
            // CSV Structure based on inspection:
            // 0: SrNo, 1: Name, 2: Role, 3: Country, 4: Base Price (Cr), ..., 10: set

            const srNo = parseInt(cols[0]);
            const basePrice = parseFloat(cols[4]);
            const set = parseInt(cols[10]);

            if (isNaN(srNo)) {
                console.warn(`Skipping invalid line ${i + 1}: ${line}`);
                continue;
            }

            // Prepare Update
            // Only update set and basePrice as requested
            const update = {};
            if (!isNaN(basePrice)) update.basePrice = basePrice;
            if (!isNaN(set)) update.set = set;

            if (Object.keys(update).length > 0) {
                const result = await Player.updateOne({ srNo: srNo }, { $set: update });
                if (result.matchedCount > 0) {
                    updatedCount++;
                    // console.log(`Updated Player SrNo ${srNo}: Set=${set}, BP=${basePrice}`);
                } else {
                    console.warn(`Player SrNo ${srNo} not found in DB`);
                    errorCount++;
                }
            }
        }

        console.log(`\nUpdate Complete.`);
        console.log(`Total Processed: ${lines.length - 1}`);
        console.log(`Updated: ${updatedCount}`);
        console.log(`Errors/Not Found: ${errorCount}`);

    } catch (error) {
        console.error('Script Error:', error);
    } finally {
        mongoose.disconnect();
        console.log('Disconnected');
    }
};

updatePlayers();
