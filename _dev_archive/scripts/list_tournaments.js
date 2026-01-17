import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tournament from '../models/Tournament.js';
import connectDB from '../config/db.js';

dotenv.config({ path: 'server/.env' }); // Adjusted for CWD = project root

const listTournaments = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        const tournaments = await Tournament.find({}, 'name accessCode status');

        if (tournaments.length === 0) {
            console.log('No tournaments found in DB.');
        } else {
            console.log('\n--- Active Tournaments ---');
            tournaments.forEach(t => {
                console.log(`Name: ${t.name}`);
                console.log(`Code: ${t.accessCode}`);
                console.log(`Status: ${t.status}`);
                console.log('--------------------------');
            });
        }
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

listTournaments();
