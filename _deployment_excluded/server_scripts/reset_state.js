
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AuctionState from './models/AuctionState.js';

dotenv.config({ path: 'server/.env' });

const resetState = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        await AuctionState.deleteMany({});
        await AuctionState.create({
            status: 'WAITING',
            currentPlayer: null,
            currentBid: 0,
            highestBidder: null,
            timerEndsAt: null,
            bidHistory: [],
            bidDuration: 30 // Restore default
        });

        console.log('✅ Auction State Reset to WAITING');
        console.log('⚠️  OPERATIONAL IMPACT: Any active auction loop will abort on next tick due to missing timer.');

        console.log('✅ Auction State Reset to WAITING');
        process.exit(0);
    } catch (error) {
        console.error('Reset Failed:', error);
        process.exit(1);
    }
};

resetState();
