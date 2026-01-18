
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Player from '../models/Player.js';

// Config
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') }); // Adjust path if needed

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/auction_db';

const migrate = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        console.log('Updating all players...');
        const res = await Player.updateMany(
            {},
            { $set: { battingPositionGroup: null } }
        );

        console.log(`Migration complete. Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`);
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
};

migrate();
