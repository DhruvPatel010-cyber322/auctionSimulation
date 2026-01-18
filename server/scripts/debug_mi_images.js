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

const checkImages = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log(`Connected to: ${mongoose.connection.name}`);

        const teamCode = 'MI';
        const players = await Player.find({ soldToTeam: teamCode });

        console.log(`Checking ${players.length} players for MI...`);

        let hasImageCount = 0;
        players.forEach(p => {
            if (p.image) {
                hasImageCount++;
                console.log(`[HAS IMAGE] ${p.name}: ${p.image.substring(0, 50)}...`);
            } else {
                console.log(`[NO IMAGE] ${p.name}`);
            }
        });

        console.log(`\nSummary: ${hasImageCount} / ${players.length} have images.`);

        if (hasImageCount === 0) {
            console.log("⚠️ No players have images! This is why they aren't showing.");
            // Optional: Check a random available player
            const sample = await Player.findOne({ image: { $ne: null } });
            if (sample) {
                console.log(`Sample available player WITH image: ${sample.name} (${sample.image})`);
            } else {
                console.log("❌ NO PLAYERS in the entire DB have images.");
            }
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkImages();
