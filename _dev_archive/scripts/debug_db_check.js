
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';
import Tournament from '../models/Tournament.js';

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const teamCount = await Team.countDocuments();
        const tournamentCount = await Tournament.countDocuments();

        console.log(`✅ Teams in DB: ${teamCount}`);
        console.log(`✅ Tournaments in DB: ${tournamentCount}`);

        if (teamCount === 0) console.error("❌ ERROR: No teams found! Run seed_db.js");
        if (tournamentCount === 0) console.error("❌ ERROR: No tournaments found! Run seed_tournament.js");

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

check();
