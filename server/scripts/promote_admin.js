import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load Env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGO_URI = process.env.MONGO_URI;

const TARGET_EMAIL = 'dp0895653@gmail.com';

async function promote() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: TARGET_EMAIL });

        if (!user) {
            console.log(`❌ User not found: ${TARGET_EMAIL}`);
            console.log('⚠️  Please login with this email first, then run this script again.');
        } else {
            user.role = 'admin';
            await user.save();
            console.log(`✅ User promoted to Admin: ${user.username || user.email}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

promote();
