import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from './models/Team.js';
import connectDB from './config/db.js';

dotenv.config();

const resetSessions = async () => {
    try {
        await connectDB();
        console.log('🔌 Connected to DB');

        const result = await Team.updateMany(
            {},
            { $set: { isLoggedIn: false, activeSessionId: null } }
        );

        console.log(`✅ Sessions Cleared. Modified ${result.modifiedCount} teams.`);
        console.log('⚠️  OPERATIONAL IMPACT: Active sockets remain connected but will be rejected on next Auth verify/reconnect.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting sessions:', error);
        process.exit(1);
    }
};

resetSessions();
