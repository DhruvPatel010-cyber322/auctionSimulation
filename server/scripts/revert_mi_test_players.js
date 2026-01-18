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

const revertMI = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);

        console.log(`Connected to: ${mongoose.connection.name}`);

        const teamCode = 'MI';
        const mi = await Team.findOne({ code: teamCode }).populate('playersBought');
        if (!mi) {
            console.error('❌ Team MI not found!');
            process.exit(1);
        }

        console.log('Found MI. Current Squad:', mi.squadSize);

        // 1. Identify Players to Revert (All sold to MI)
        // Note: This reverts ALL MI players. Be careful if they had legit buys.
        // User said "temporarily add... for testing". Assuming empty or okay to wipe.

        const playersToRevert = await Player.find({ soldToTeam: teamCode });
        console.log(`Found ${playersToRevert.length} players to revert.`);

        if (playersToRevert.length === 0) {
            console.log("No players to revert.");
            process.exit(0);
        }

        // 2. Revert Players to AVAILABLE
        await Player.updateMany(
            { soldToTeam: teamCode },
            {
                $set: {
                    status: 'AVAILABLE',
                    soldToTeam: null,
                    soldPrice: null
                }
            }
        );

        // 3. Reset Team Stats
        // We'll just reset to initial state for simplicity if assuming pure test.
        // Or recalculate?
        // Let's reset purely: empty squad.

        mi.playersBought = [];
        mi.squadSize = 0;
        mi.overseasCount = 0;
        mi.totalSpent = 0;
        mi.remainingPurse = mi.totalPurse || 120; // Default purse
        mi.playing11 = []; // Clear Playing 11 too

        await mi.save();

        console.log(`✅ Revert Complete. MI Squad cleared.`);
        process.exit(0);

    } catch (err) {
        console.error('❌ Revert failed:', err);
        process.exit(1);
    }
};

revertMI();
