import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from '../models/Player.js';
import connectDB from '../config/db.js';
import { PLAYERS } from '../data/players.js';

dotenv.config({ path: 'server/.env' });

const seedPlayers = async () => {
    try {
        await connectDB();
        console.log('✅ Connected to DB');
        console.log('🧹 Clearing existing players...');
        await Player.deleteMany({});

        console.log('🌱 Seeding Players with Rupee Standard...');

        const standardizedPlayers = PLAYERS.map(p => ({
            srNo: p.id, // Map id to srNo
            name: p.name,
            country: p.country,
            role: p.role,
            basePrice: p.basePrice, // Treat as Crores (1 = 1 Cr)
            isOverseas: p.country !== 'India',
            status: 'AVAILABLE', // Reset to AVAILABLE for fresh auction
            soldPrice: null,
            soldToTeam: null,
            image: p.image,
            set: p.set || 1
        }));

        await Player.insertMany(standardizedPlayers);

        console.log(`✅ Successfully seeded ${standardizedPlayers.length} players.`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

seedPlayers();
