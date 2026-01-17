
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import AuctionState from '../models/AuctionState.js';
import { TEAMS } from '../data/teams.js';
import { PLAYERS } from '../data/players.js';

dotenv.config();

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seeding...');

        // 1. Clear existing data
        await Team.deleteMany({});
        await Player.deleteMany({});
        await AuctionState.deleteMany({});
        console.log('🧹 Cleared existing Teams, Players, and AuctionState.');

        // 2. Seed Teams
        const teamsToInsert = TEAMS.map(team => ({
            code: team.id.toUpperCase(),
            name: team.name,
            totalPurse: 1200000000, // 120 Cr
            remainingPurse: 1200000000,
            password: team.password,
            budget: 1200000000,
            squadSize: 0,
            overseasCount: 0,
            totalSpent: 0,
            isActive: false,
            isLoggedIn: false,
            email: `${team.id}@auction.com`
        }));
        await Team.insertMany(teamsToInsert);
        console.log(`✅ Seeded ${teamsToInsert.length} teams.`);

        // 3. Seed Players
        // Ensure srNo is set (using id from data or index + 1)
        const playersToInsert = PLAYERS.map((p, index) => ({
            srNo: p.id || index + 1,
            name: p.name,
            country: p.country,
            role: p.role,
            basePrice: p.basePrice * 10000000, // Convert Cr to actual value (2.0 Cr -> 20000000)
            status: 'AVAILABLE', // Reset status
            soldPrice: null,
            soldToTeam: null,
            isOverseas: p.country !== 'India'
        }));
        await Player.insertMany(playersToInsert);
        console.log(`✅ Seeded ${playersToInsert.length} players.`);

        // 4. Initialize Auction State
        await AuctionState.create({
            status: 'WAITING',
            currentPlayer: null,
            currentBid: 0,
            highestBidder: null,
            timerEndsAt: null,
            bidHistory: [],
            teams: []
        });
        console.log('✅ initialized AuctionState to WAITING.');

        console.log('✨ Database Reset & Seed Complete. ✨');
        process.exit();
    } catch (err) {
        console.error('❌ Seeding Failed:', err);
        process.exit(1);
    }
};

seedDB();
