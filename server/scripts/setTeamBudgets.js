import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';
import connectDB from '../config/db.js';

dotenv.config({ path: 'server/.env' });

const setTeamBudgets = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to DB');

        // Reset all teams
        // local unit: 120 means 120 Cr.
        const result = await Team.updateMany({}, {
            $set: {
                totalPurse: 120,
                remainingPurse: 120,
                totalSpent: 0,
                squadSize: 0,
                overseasCount: 0,
                playersBought: []
            }
        });

        console.log(`✅ Successfully updated ${result.modifiedCount} teams.`);
        console.log('Values set: Purse = 120, Spent = 0, Squad Cleared.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

setTeamBudgets();
