import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from '../models/Player.js';
import connectDB from '../config/db.js';

dotenv.config({ path: 'server/.env' });

const setAllAvailable = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to DB');

        const result = await Player.updateMany({}, {
            $set: {
                status: 'AVAILABLE',
                soldPrice: null,
                soldToTeam: null
            }
        });

        console.log(`✅ Successfully updated ${result.modifiedCount} players to AVAILABLE status.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

setAllAvailable();
