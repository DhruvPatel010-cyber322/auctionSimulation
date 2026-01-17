
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import AuctionState from '../models/AuctionState.js';
import { TEAMS } from '../data/teams.js'; // Ensure this has teams data

dotenv.config({ path: 'server/.env' });

// --- DATA ---
// Input in Crores for readability
const PLAYERS_DATA = [
    // Marquee Set 1
    { srNo: 1, name: "Jos Buttler", country: "England", role: "Wicket Keeper", basePrice: 2.0, isOverseas: true },
    { srNo: 2, name: "Rohit Sharma", country: "India", role: "Batsman", basePrice: 2.0, isOverseas: false },
    { srNo: 3, name: "Steve Smith", country: "Australia", role: "Batsman", basePrice: 2.0, isOverseas: true },
    { srNo: 4, name: "Kane Williamson", country: "New Zealand", role: "Batsman", basePrice: 2.0, isOverseas: true },
    { srNo: 5, name: "David Warner", country: "Australia", role: "Batsman", basePrice: 2.0, isOverseas: true },
    { srNo: 6, name: "Shubman Gill", country: "India", role: "Batsman", basePrice: 2.0, isOverseas: false },
    { srNo: 7, name: "Suryakumar Yadav", country: "India", role: "Batsman", basePrice: 2.0, isOverseas: false },
    { srNo: 8, name: "Travis Head", country: "Australia", role: "Batsman", basePrice: 2.0, isOverseas: true },
    { srNo: 9, name: "Heinrich Klaasen", country: "South Africa", role: "Wicket Keeper", basePrice: 2.0, isOverseas: true },
    { srNo: 10, name: "Nicholas Pooran", country: "West Indies", role: "Wicket Keeper", basePrice: 2.0, isOverseas: true },

    // Marquee Set 2 (Bowlers)
    { srNo: 11, name: "Jasprit Bumrah", country: "India", role: "Bowler", basePrice: 2.0, isOverseas: false },
    { srNo: 12, name: "Pat Cummins", country: "Australia", role: "Bowler", basePrice: 2.0, isOverseas: true },
    { srNo: 13, name: "Mitchell Starc", country: "Australia", role: "Bowler", basePrice: 2.0, isOverseas: true },
    { srNo: 14, name: "Rashid Khan", country: "Afghanistan", role: "Bowler", basePrice: 2.0, isOverseas: true },
    { srNo: 15, name: "Trent Boult", country: "New Zealand", role: "Bowler", basePrice: 2.0, isOverseas: true },
    { srNo: 16, name: "Kagiso Rabada", country: "South Africa", role: "Bowler", basePrice: 2.0, isOverseas: true },
    { srNo: 17, name: "Shaheen Afridi", country: "Pakistan", role: "Bowler", basePrice: 2.0, isOverseas: true }, // Hypothetical
    { srNo: 18, name: "Jofra Archer", country: "England", role: "Bowler", basePrice: 2.0, isOverseas: true },
    { srNo: 19, name: "Mohammed Shami", country: "India", role: "Bowler", basePrice: 2.0, isOverseas: false },
    { srNo: 20, name: "Mohammed Siraj", country: "India", role: "Bowler", basePrice: 2.0, isOverseas: false },

    // Set 3 (All Rounders)
    { srNo: 21, name: "Ben Stokes", country: "England", role: "All-Rounder", basePrice: 2.0, isOverseas: true },
    { srNo: 22, name: "Hardik Pandya", country: "India", role: "All-Rounder", basePrice: 2.0, isOverseas: false },
    { srNo: 23, name: "Ravindra Jadeja", country: "India", role: "All-Rounder", basePrice: 2.0, isOverseas: false },
    { srNo: 24, name: "Glenn Maxwell", country: "Australia", role: "All-Rounder", basePrice: 2.0, isOverseas: true },
    { srNo: 25, name: "Andre Russell", country: "West Indies", role: "All-Rounder", basePrice: 2.0, isOverseas: true },
    { srNo: 26, name: "Rashid Khan", country: "Afghanistan", role: "All-Rounder", basePrice: 2.0, isOverseas: true },
    { srNo: 27, name: "Liam Livingstone", country: "England", role: "All-Rounder", basePrice: 2.0, isOverseas: true },
    { srNo: 28, name: "Axar Patel", country: "India", role: "All-Rounder", basePrice: 2.0, isOverseas: false },

    // More players... filling 1-30 for test
    { srNo: 29, name: "Rishabh Pant", country: "India", role: "Wicket Keeper", basePrice: 2.0, isOverseas: false },
    { srNo: 30, name: "Sanju Samson", country: "India", role: "Wicket Keeper", basePrice: 2.0, isOverseas: false },
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Clear All Collections
        await Team.deleteMany({});
        await Player.deleteMany({});
        await AuctionState.deleteMany({});
        console.log('🧹 Cleared Checkpoints');

        // 2. Seed Teams (120 Cr -> Rupees)
        const teamsToInsert = TEAMS.map(t => ({
            code: t.id,
            name: t.name,
            totalPurse: 1200000000,
            remainingPurse: 1200000000,
            squadSize: 0,
            overseasCount: 0,
            totalSpent: 0,
            playersBought: [],
            isActive: true,
            isLoggedIn: false,
            activeSessionId: null
        }));

        await Team.insertMany(teamsToInsert);
        console.log(`✅ Seeded ${teamsToInsert.length} Teams`);

        // 3. Seed Players (Cr -> Rupees)
        const playersToInsert = PLAYERS_DATA.map(p => ({
            srNo: p.srNo,
            name: p.name,
            country: p.country,
            role: p.role,
            isOverseas: p.isOverseas,
            basePrice: Math.round(p.basePrice * 10000000), // 2.0 -> 20000000
            status: 'AVAILABLE'
        }));

        await Player.insertMany(playersToInsert);
        console.log(`✅ Seeded ${playersToInsert.length} Players`);

        // 4. Init Auction State
        await AuctionState.create({
            status: 'WAITING',
            currentPlayer: null,
            timerEndsAt: null,
            bidHistory: []
        });
        console.log('✅ Initialized Auction State');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedDB();
