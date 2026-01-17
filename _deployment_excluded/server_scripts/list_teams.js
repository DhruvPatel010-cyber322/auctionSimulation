
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from './models/Team.js';

dotenv.config({ path: 'server/.env' });

const listTeams = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const teams = await Team.find({});
        console.log('--- TEAMS IN DB ---');
        teams.forEach(t => {
            console.log(`Name: ${t.name}, Code: '${t.code}', ID: ${t._id}, LoggedIn: ${t.isLoggedIn}`);
        });
        console.log('-------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

listTeams();
