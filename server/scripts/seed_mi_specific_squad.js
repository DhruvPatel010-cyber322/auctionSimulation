import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Player from '../models/Player.js';
import Team from '../models/Team.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/auction_db';

const seedSpecificSquad = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log(`Connected to: ${mongoose.connection.name}`);

        const teamCode = 'MI';
        const mi = await Team.findOne({ code: teamCode });
        if (!mi) {
            console.error('❌ Team MI not found!');
            process.exit(1);
        }

        // Ensure MI is empty first or we might overfill
        if (mi.playersBought.length > 0) {
            console.warn("⚠️ MI has players. Clearing them first to ensure clean state...");
            await Player.updateMany(
                { soldToTeam: teamCode },
                { $set: { status: 'AVAILABLE', soldToTeam: null, soldPrice: null } }
            );
            mi.playersBought = [];
            mi.squadSize = 0;
            mi.playing11 = [];
        }

        // Requirements
        // 4 Openers (Group 1)
        // 3 WK (Role 'Wicket Keeper')
        // 5 Middle Order (Group 2)
        // 7 Allrounder (Role 'All-Rounder')
        // 6 Bowlers (Role 'Bowler')

        let selectedIds = new Set();
        let playersToAssign = [];

        const fetchAndAdd = async (query, limit, label) => {
            const pool = await Player.find({
                status: 'AVAILABLE',
                _id: { $nin: Array.from(selectedIds) },
                ...query
            }).limit(limit);

            console.log(`Found ${pool.length} ${label}`);
            pool.forEach(p => {
                selectedIds.add(p._id);
                playersToAssign.push(p);
            });
            return pool.length;
        };

        // 1. Openers (Group 1)
        await fetchAndAdd({ battingPositionGroup: 1 }, 4, "Openers");

        // 2. Middle Order (Group 2)
        await fetchAndAdd({ battingPositionGroup: 2 }, 5, "Middle Order");

        // 3. Wicket Keepers
        await fetchAndAdd({ role: 'Wicket Keeper' }, 3, "Wicket Keepers");

        // 4. All Rounders
        await fetchAndAdd({ role: 'All-Rounder' }, 7, "All Rounders");

        // 5. Bowlers
        await fetchAndAdd({ role: 'Bowler' }, 6, "Bowlers");

        console.log(`Total Players Selected: ${playersToAssign.length}`);

        // Assign
        let totalCost = 0;
        let overseasCount = 0;

        for (const p of playersToAssign) {
            await Player.updateOne(
                { _id: p._id },
                {
                    $set: {
                        status: 'SOLD',
                        soldToTeam: teamCode,
                        soldPrice: p.basePrice || 0.2 // Default price if null
                    }
                }
            );
            totalCost += (p.basePrice || 0.2);
            if (p.isOverseas) overseasCount++;
        }

        mi.playersBought = Array.from(selectedIds);
        mi.squadSize = playersToAssign.length;
        mi.totalSpent = totalCost;
        mi.remainingPurse = (mi.totalPurse || 120) - totalCost;
        mi.overseasCount = overseasCount;

        await mi.save();

        console.log(`✅ Squad Created for MI!`);
        console.log(`Size: ${mi.squadSize}`);
        console.log(`Overseas: ${mi.overseasCount}`);

        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedSpecificSquad();
