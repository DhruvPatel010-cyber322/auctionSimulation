
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Tournament from './models/Tournament.js';

dotenv.config();

const verifyVisibility = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB");

        const tournament = await Tournament.findOne({});
        if (!tournament) {
            console.error("No tournament found!");
            process.exit(1);
        }

        const originalStatus = tournament.status;
        console.log(`Original Status: ${originalStatus}`);

        const testStatuses = ['ACTIVE', 'RUNNING', 'OPEN'];
        const hiddenStatuses = ['CLOSED', 'ARCHIVED'];

        // Test Visible Statuses
        for (const status of testStatuses) {
            tournament.status = status;
            await tournament.save();

            const found = await Tournament.find({ status: { $in: ['OPEN', 'ACTIVE', 'RUNNING'] } });
            const isVisible = found.some(t => t._id.toString() === tournament._id.toString());

            console.log(`Status '${status}': ${isVisible ? 'VISIBLE (PASS)' : 'HIDDEN (FAIL)'}`);
            if (!isVisible) throw new Error(`Tournament with status ${status} should be visible`);
        }

        // Test Hidden Statuses
        for (const status of hiddenStatuses) {
            tournament.status = status;
            await tournament.save();

            const found = await Tournament.find({ status: { $in: ['OPEN', 'ACTIVE', 'RUNNING'] } });
            const isVisible = found.some(t => t._id.toString() === tournament._id.toString());

            console.log(`Status '${status}': ${!isVisible ? 'HIDDEN (PASS)' : 'VISIBLE (FAIL)'}`);
            if (isVisible) throw new Error(`Tournament with status ${status} should be hidden`);
        }

        // Restore Original
        tournament.status = 'OPEN'; // Defaulting to OPEN as a safe state
        await tournament.save();
        console.log("Restored status to 'OPEN'");

        process.exit(0);
    } catch (error) {
        console.error("Verification Failed:", error);
        process.exit(1);
    }
};

verifyVisibility();
