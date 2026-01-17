import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config({ path: 'server/.env' });

const promoteUser = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to DB');

        const email = 'dp0895653@gmail.com';
        const user = await User.findOneAndUpdate(
            { email: email },
            { role: 'admin' },
            { new: true }
        );

        if (user) {
            console.log(`✅ Successfully promoted ${user.email} out of ${user.name} to ADMIN.`);
        } else {
            console.log(`❌ User ${email} not found.`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

promoteUser();
