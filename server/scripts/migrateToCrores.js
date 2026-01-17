import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from '../models/Player.js';
import connectDB from '../config/db.js';

dotenv.config({ path: 'server/.env' });

const migrateToCrores = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to DB');

        const players = await Player.find({});
        console.log(`🔍 Checking ${players.length} players for currency migration...`);

        let updatedCount = 0;

        for (const p of players) {
            // If basePrice is > 100, assume it is in Rupees (e.g. 20,000,000 or 2,000,000)
            // We want to convert to Crores (e.g. 2.0 or 0.2)
            // 1 Crore = 10,000,000.
            if (p.basePrice > 100) {
                p.basePrice = p.basePrice / 10000000;
                await p.save();
                updatedCount++;
            }
        }

        console.log(`✅ Migration Complete. Updated: ${updatedCount} players.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration Error:', error);
        process.exit(1);
    }
};

migrateToCrores();
