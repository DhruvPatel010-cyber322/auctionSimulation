
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from './models/Player.js';

dotenv.config({ path: 'server/.env' });

const migratePlayers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const players = await Player.find({}).sort({ _id: 1 });
        console.log(`Found ${players.length} players to migrate.`);

        for (let i = 0; i < players.length; i++) {
            const player = players[i];
            // Assign srNo based on current index + 1 if retrieval order is acceptable
            // Or keep existing if already present (for re-runs)
            if (!player.srNo) {
                player.srNo = i + 1;
                await player.save();
                console.log(`Updated: [${i + 1}] ${player.name}`);
            } else {
                console.log(`Skipped: [${player.srNo}] ${player.name} (Already has srNo)`);
            }
        }

        console.log('✅ Migration Complete');
        process.exit(0);
    } catch (error) {
        console.error('Migration Failed:', error);
        process.exit(1);
    }
};

migratePlayers();
