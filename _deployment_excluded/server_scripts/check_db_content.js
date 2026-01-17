
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from './models/Team.js';
import Player from './models/Player.js';
import connectDB from './config/db.js';

dotenv.config();

const checkDB = async () => {
    await connectDB();
    console.log('Checking Database...');
    try {
        const teamCount = await Team.countDocuments();
        const playerCount = await Player.countDocuments();
        const teams = await Team.find({}).select('code name');

        console.log(`Teams Count: ${teamCount}`);
        console.log(`Players Count: ${playerCount}`);
        console.log('Teams:', teams);
    } catch (error) {
        console.error('Error querying DB:', error);
    } finally {
        mongoose.disconnect();
    }
};

checkDB();
