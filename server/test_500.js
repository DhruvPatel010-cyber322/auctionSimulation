import connectDB from './config/db.js';
import User from './models/User.js';
import TournamentUser from './models/TournamentUser.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function run() {
    await connectDB();
    const tournamentId = '69a26f511714ff3a4d40a313';
    try {
        const allParticipants = await TournamentUser.find({ tournament: tournamentId }).populate('user', 'username');
        console.log(`Found ${allParticipants.length} participants.`);

        let crashed = false;
        allParticipants.forEach(p => {
            try {
                const test = p.user._id;
            } catch (e) {
                console.log('CRASH for participant:', p._id, e.message);
                crashed = true;
            }
        });
        if (!crashed) console.log('No crashes on p.user._id. Error is somewhere else.');
    } catch (e) {
        console.error(e);
    }
    mongoose.disconnect();
}

run();
