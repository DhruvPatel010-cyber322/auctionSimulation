import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TEAMS } from '../data/teams.js';
import Player from '../models/Player.js';
import Team from '../models/Team.js';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..', '..'); // d:/Projects/Auction

// Load Env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error('MONGO_URI is missing in .env');
    process.exit(1);
}

const CRORE = 10000000;

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // CLEAR DATA
        await Player.deleteMany({});
        await Team.deleteMany({});
        // Clear checkpoints to avoid stale state
        try {
            await mongoose.connection.collection('checkpoints').deleteMany({});
            console.log('Cleared Checkpoints');
        } catch (e) {
            console.log('No checkpoints to clear or error:', e.message);
        }

        console.log('Cleared old Players and Teams');

        // SEED TEAMS
        const teamsJsonPath = path.join(rootDir, '_dev_archive', 'init_data', 'teams.json');
        const teamsJson = JSON.parse(fs.readFileSync(teamsJsonPath, 'utf8'));

        const mergedTeams = TEAMS.map(team => {
            const logoData = teamsJson.find(t => t.team_name === team.name);
            // Convert Budget from Rupees to Crores
            // Original data has 1200000000 (120 Cr). We want 120.
            const budgetCr = team.budget / CRORE;

            return {
                ...team,
                budget: budgetCr, // Store in CR (e.g., 120)
                code: team.id.toUpperCase(), // Map id to code
                remainingPurse: budgetCr, // Store in CR
                logoUrl: logoData ? logoData.logo_url : null,
                players: [],
                stats: {
                    totalSpent: 0,
                    playersCount: 0,
                    overseasCount: 0
                }
            };
        });

        await Team.insertMany(mergedTeams);
        console.log(`✅ Seeded ${mergedTeams.length} Teams with Logos (Budget in Cr)`);

        // SEED PLAYERS
        const playersCsvPath = path.join(rootDir, '_dev_archive', 'init_data', 'players.csv');
        const csvContent = fs.readFileSync(playersCsvPath, 'utf8');
        const lines = csvContent.split('\n').filter(line => line.trim());

        // Header: SrNo,Name,Role,Country,Base Price (Cr),Status,Sold Price,Sold To,Image,Is Overseas,set,,batter-1

        const players = [];
        // Skip header (line 0)
        for (let i = 1; i < lines.length; i++) {
            const row = parseCsvLine(lines[i]);
            if (row.length < 5) continue; // Skip malformed

            // Value is ALREADY in Crores in CSV. Do NOT multiply.
            // e.g., "2" -> 2
            const basePriceCr = parseFloat(row[4]) || 0;

            const player = {
                srNo: parseInt(row[0]),
                name: row[1],
                role: row[2],
                country: row[3],
                basePrice: basePriceCr, // Store in CR
                status: 'AVAILABLE', // Force reset to AVAILABLE
                soldPrice: null,
                soldToTeam: null,
                image: row[8],
                isOverseas: row[9]?.toLowerCase() === 'yes',
                set: parseInt(row[10]) || 1
            };
            players.push(player);
        }

        await Player.insertMany(players);
        console.log(`✅ Seeded ${players.length} Players from CSV (Prices in Cr)`);

        console.log('Seeding Complete! 🚀');
        process.exit(0);

    } catch (error) {
        console.error('Seeding Failed:', error);
        process.exit(1);
    }
}

function parseCsvLine(line) {
    // Basic split by comma. 
    return line.split(',').map(s => s.trim());
}

seed();
