
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Player from '../models/Player.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/auction_db';

const resetPoints = async () => {
    try {
        console.log('Connecting to database...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected.');

        console.log('Resetting all player points to 0...');
        const result = await Player.updateMany({}, { 
            $set: { 
                points: {
                    total: 0,
                    batting: 0,
                    bowling: 0,
                    fielding: 0,
                    announcement: 0
                },
                perMatchPoints: []
            } 
        });
        
        console.log(`✅ Success! Reset ${result.modifiedCount} players.`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during reset:', err);
        process.exit(1);
    }
};

resetPoints();
