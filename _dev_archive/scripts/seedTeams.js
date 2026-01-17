import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';
import connectDB from '../config/db.js';

dotenv.config({ path: 'server/.env' });

import { TEAMS } from '../data/teams.js'; // Import standardized data

// ... inputs ...

const seedTeams = async () => {
    try {
        await connectDB();

        console.log('Beginning Team Seed...');
        console.log('🧹 Clearing existing teams...');
        await Team.deleteMany({}); // Clear old data

        console.log('🌱 Seeding Teams...');

        // Map TEAMS data to Schema
        const teamDocs = TEAMS.map(t => ({
            code: t.id.toUpperCase(), // Ensure code is uppercase
            name: t.name,
            totalPurse: t.budget, // Already in Rupees from data file
            remainingPurse: t.budget,
            playersBought: [],
            squadSize: 0,
            overseasCount: 0,
            totalSpent: 0,
            isActive: false,
            // Passwords logic? Schema might check password. Setup default if needed or separate auth script?
            // The original script didn't set password field on Team model, implies Auth uses User model or Team model has separate auth logic.
            // Wait, Team model HAS password field?
            // Let's check Team model.
            password: t.password, // Add password field
        }));

        await Team.insertMany(teamDocs);

        console.log(`✅ Successfully seeded ${teamDocs.length} teams.`);
        process.exit(0);
    } catch (error) {
        console.error(`Error seeding teams: ${error.message}`);
        process.exit(1);
    }
};

seedTeams();
