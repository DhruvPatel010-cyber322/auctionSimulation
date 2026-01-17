import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/db.js';

dotenv.config({ path: 'server/.env' });

const listUsers = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to DB');

        const users = await User.find({});
        console.log('--- USERS ---');
        users.forEach(u => {
            console.log(`ID: ${u._id} | Email: ${u.email} | Role: ${u.role} | Name: ${u.name}`);
        });
        console.log('-------------');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

listUsers();
