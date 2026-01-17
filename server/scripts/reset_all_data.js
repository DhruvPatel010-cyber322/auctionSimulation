import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import Tournament from '../models/Tournament.js';
import TournamentUser from '../models/TournamentUser.js';
import AuctionState from '../models/AuctionState.js';
import { TEAMS as BASE_TEAMS } from '../data/teams.js';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INIT_DATA_DIR = path.join(__dirname, '../init_data');

dotenv.config();

const resetAllData = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined');
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Load Data Files
        console.log('📂 Loading Data Files...');

        // Load IPL Teams JSON for Logos
        const teamsJsonPath = path.join(INIT_DATA_DIR, 'teams.json');
        const teamsJson = JSON.parse(fs.readFileSync(teamsJsonPath, 'utf-8'));
        const teamLogoMap = new Map(teamsJson.map(t => [t.team_name, t.logo_url]));

        // Load Players CSV
        const playersCsvPath = path.join(INIT_DATA_DIR, 'players.csv');
        const playersCsv = fs.readFileSync(playersCsvPath, 'utf-8');
        const playerLines = playersCsv.split('\n').slice(1); // Skip Header

        // 2. Clear All Collections
        console.log('🧹 Clearing Collections...');
        await Promise.all([
            Team.deleteMany({}),
            Player.deleteMany({}),
            Tournament.deleteMany({}),
            TournamentUser.deleteMany({}),
            AuctionState.deleteMany({})
        ]);
        console.log('✅ Collections Cleared');

        // 3. Prepare & Seed Teams
        console.log('🌱 Seeding Teams...');
        const teamsToInsert = BASE_TEAMS.map(t => {
            const logo = teamLogoMap.get(t.name) || null;
            return {
                code: t.id.toUpperCase(),
                name: t.name,
                totalPurse: 120, // 120 Cr
                remainingPurse: 120, // 120 Cr
                squadSize: 0,
                overseasCount: 0,
                totalSpent: 0,
                playersBought: [],
                isActive: false,
                isLoggedIn: false,
                activeSessionId: null,
                logo: logo
            };
        });
        await Team.insertMany(teamsToInsert);
        console.log(`✅ Seeded ${teamsToInsert.length} Teams`);

        // 4. Prepare & Seed Players
        console.log('🌱 Seeding Players...');
        const playersToInsert = [];

        for (const line of playerLines) {
            if (!line.trim()) continue;
            // Simple split by comma (assuming no commas in fields for now, or robust CSV parsing needed if names contain commas)
            // Given the file content, names look safe.
            const cols = line.split(',');
            if (cols.length < 5) continue;

            const srNo = parseInt(cols[0]);
            const name = cols[1];
            const role = cols[2];
            const country = cols[3];
            const basePriceCr = parseFloat(cols[4]);
            const image = cols[8];
            const isOverseasStr = cols[9];
            const setVal = cols[10];

            // BasePrice 2 -> 2 (Crores)
            const basePrice = basePriceCr;

            playersToInsert.push({
                srNo: srNo,
                name: name,
                country: country,
                role: role,
                isOverseas: isOverseasStr === 'Yes',
                basePrice: basePrice,
                status: 'AVAILABLE',
                soldPrice: null,
                soldToTeam: null,
                image: image || null,
                set: setVal ? parseInt(setVal) : 1
            });
        }

        await Player.insertMany(playersToInsert);
        console.log(`✅ Seeded ${playersToInsert.length} Players`);

        // 5. Init Auction State
        console.log('🌱 Initializing Auction State...');
        await AuctionState.create({
            status: 'WAITING',
            currentPlayer: null,
            timerEndsAt: null,
            bidHistory: []
        });
        console.log('✅ Auction State Initialized');

        console.log('🎉 FULL DATA RESET COMPLETE 🎉');
        process.exit(0);

    } catch (err) {
        console.error('❌ Reset Failed:', err);
        process.exit(1);
    }
};

resetAllData();
