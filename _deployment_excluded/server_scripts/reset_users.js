
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import TournamentUser from './models/TournamentUser.js';

dotenv.config();

const resetUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for User Reset");

        // 1. Delete All Users
        const deleteUsersResult = await User.deleteMany({});
        console.log(`Deleted ${deleteUsersResult.deletedCount} users.`);

        // 2. Delete All Tournament Assignments (Clean up references)
        const deleteAssignmentsResult = await TournamentUser.deleteMany({});
        console.log(`Deleted ${deleteAssignmentsResult.deletedCount} tournament assignments.`);

        console.log("Database cleaned. New users will be created with the latest schema.");
        process.exit(0);
    } catch (error) {
        console.error("Error resetting users:", error);
        process.exit(1);
    }
};

resetUsers();
