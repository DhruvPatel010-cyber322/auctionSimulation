import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TournamentUser from '../models/TournamentUser.js';
import connectDB from '../config/db.js';

dotenv.config({ path: 'server/.env' });

const clearTournamentUsers = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to DB');

        const result = await TournamentUser.deleteMany({});
        console.log(`🗑️  Deleted ${result.deletedCount} TournamentUser mappings.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

clearTournamentUsers();
