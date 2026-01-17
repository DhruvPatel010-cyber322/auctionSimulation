
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tournament from './models/Tournament.js';

dotenv.config();

const verifyTournaments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB via verification script");

        const allTournaments = await Tournament.find({});
        console.log(`Total Tournaments: ${allTournaments.length}`);

        if (allTournaments.length > 0) {
            allTournaments.forEach(t => {
                console.log(`- [${t.status}] ${t.name} (Code: ${t.accessCode})`);
            });
        } else {
            console.log("No tournaments found in the database!");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error verifying tournaments:", error);
        process.exit(1);
    }
};

verifyTournaments();
