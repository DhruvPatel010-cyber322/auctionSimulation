
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from './models/Player.js';
import connectDB from './config/db.js';

dotenv.config();

const checkTrades = async () => {
    await connectDB();
    const players = await Player.find({ 
        name: { $in: [/Priyansh Arya/i, /Romario Shepherd/i] } 
    }, { name: 1, soldToTeam: 1 });
    
    console.log('--- Trade Verification ---');
    players.forEach(p => {
        console.log(`Player: ${p.name} | Current Team: ${p.soldToTeam}`);
    });
    process.exit(0);
};

checkTrades();
