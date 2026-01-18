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

const seedMI = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);

        console.log(`Connected to: ${mongoose.connection.name}`);

        // 1. Find MI Team
        const teamCode = 'MI';
        const mi = await Team.findOne({ code: teamCode });
        if (!mi) {
            console.error('❌ Team MI not found!');
            process.exit(1);
        }

        console.log('Found MI. Current Squad:', mi.squadSize);

        // 2. Find 25 Random Available Players
        const playersToBuy = await Player.aggregate([
            { $match: { status: 'AVAILABLE' } },
            { $sample: { size: 25 } }
        ]);

        if (playersToBuy.length < 25) {
            console.warn(`⚠️ Only found ${playersToBuy.length} available players.`);
        }

        console.log(`Assigning ${playersToBuy.length} players to MI...`);

        let totalCost = 0;
        const playerIds = playersToBuy.map(p => p._id);

        // 3. Update Players
        // We need to loop or use bulkWrite to handle individual basePrice logging if needed,
        // but updateMany is fine if we just want to set soldPrice = basePrice (which varies).
        // Actually, updateMany can't set field to another field's value easily without pipeline.
        // Let's loop for safety and precision.

        for (const p of playersToBuy) {
            await Player.updateOne(
                { _id: p._id },
                {
                    $set: {
                        status: 'SOLD',
                        soldToTeam: teamCode,
                        soldPrice: p.basePrice
                    }
                }
            );
            totalCost += p.basePrice;
        }

        // 4. Update Team
        const overseasCount = playersToBuy.filter(p => p.isOverseas).length;

        mi.playersBought.push(...playerIds);
        mi.squadSize += playersToBuy.length;
        mi.totalSpent += totalCost;
        mi.remainingPurse -= totalCost;
        mi.overseasCount += overseasCount;

        await mi.save();

        console.log(`✅ Success! Added ${playersToBuy.length} players to MI.`);
        console.log(`New Squad Size: ${mi.squadSize}`);
        console.log(`Remaining Purse: ${mi.remainingPurse} Cr`);

        process.exit(0);

    } catch (err) {
        console.error('❌ Seeding failed:', err);
        process.exit(1);
    }
};

seedMI();
