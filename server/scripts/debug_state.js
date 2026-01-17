import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import AuctionState from '../models/AuctionState.js';

dotenv.config({ path: 'server/.env' });

const checkState = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const state = await AuctionState.findOne();
        console.log('--- Auction State ---');
        console.log(JSON.stringify(state, null, 2));

        if (state && state.currentPlayer) {
            const currP = await Player.findById(state.currentPlayer);
            console.log('--- Current Player in State ---');
            console.log(currP ? `${currP.name} (Status: ${currP.status}, srNo: ${currP.srNo})` : 'Player Not Found in DB');
        }

        console.log('--- Top 5 Available Players ---');
        const available = await Player.find({ status: 'AVAILABLE' }).sort({ srNo: 1 }).limit(5);
        available.forEach(p => console.log(`${p.srNo}: ${p.name} (Base: ${p.basePrice})`));

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
};

checkState();
