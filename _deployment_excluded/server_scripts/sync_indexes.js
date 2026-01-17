
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const syncIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB...");

        console.log("Syncing indexes for User model...");
        // This command creates indexes defined in the schema if they don't exist
        // and drops indexes that are defined in the DB but not in the schema (if background is false, usually)
        // syncIndexes() is the mongoose method to align DB with Schema.
        await User.syncIndexes();

        console.log("Indexes Synced Successfully!");
        console.log("User Schema on MongoDB should now enforce unique usernames.");

        process.exit(0);
    } catch (error) {
        console.error("Error syncing indexes:", error);
        process.exit(1);
    }
};

syncIndexes();
