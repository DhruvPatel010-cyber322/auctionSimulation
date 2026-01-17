
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tournament from './models/Tournament.js';

dotenv.config();

const fixTournaments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for fix");

        // Find the tournament (there is only one apparently)
        const tournament = await Tournament.findOne({});

        if (tournament) {
            console.log(`Found tournament: ${tournament.name} with status ${tournament.status}`);

            // Update to OPEN and set access code
            tournament.status = 'OPEN';
            tournament.accessCode = '1234';

            await tournament.save();
            console.log("Updated tournament to status 'OPEN' and access code '1234'");
        } else {
            console.log("No tournament found to fix. Creating one...");
            await Tournament.create({
                name: "IPL 2025 Mega Auction",
                status: "OPEN",
                accessCode: "1234"
            });
            console.log("Created new tournament.");
        }

        process.exit(0);
    } catch (error) {
        console.error("Error fixing tournaments:", error);
        process.exit(1);
    }
};

fixTournaments();
