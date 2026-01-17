
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tournament from '../models/Tournament.js';

dotenv.config();

const seedTournament = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Check if exists
        const count = await Tournament.countDocuments();
        if (count === 0) {
            await Tournament.create({
                name: "IPL Mega Auction 2025",
                accessCode: "IPL2025",
                status: "OPEN"
            });
            console.log("✅ Seeded Default Tournament: IPL Mega Auction 2025 (Code: IPL2025)");
        } else {
            console.log("Tournament already exists.");
        }
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedTournament();
