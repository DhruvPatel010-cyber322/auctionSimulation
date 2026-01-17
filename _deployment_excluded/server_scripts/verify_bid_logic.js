
import mongoose from 'mongoose';
import { placeBid } from './controllers/auctionController.js';
import AuctionState from './models/AuctionState.js';
import Player from './models/Player.js';
import Team from './models/Team.js';

// Setup Mock Environment
import { setupSocket } from './socketHandler.js';
const mockIO = {
    emit: (event, payload) => {
        console.log(`[Socket Emit] ${event}`);
        if (event === 'auction:state') {
            const bidder = payload.highestBidder ? payload.highestBidder.id : 'None';
            console.log(`   Bid: ${payload.currentBid}, HighBidder: ${bidder}`);
        }
    },
    use: () => { },
    on: () => { }
};
setupSocket(mockIO);

const MONGO_URI = "mongodb+srv://dhruvp0895653_db_user:Gunipl%402005@clustergunipl.rhrbfex.mongodb.net/auction_v2?appName=ClusterGUNIPL";

async function runTest() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // 1. Setup Data
        let player = await Player.findOne({ status: 'AVAILABLE' });
        if (!player) {
            player = await Player.create({
                name: 'BidTest Player',
                status: 'AVAILABLE',
                basePrice: 2000000,
                role: 'Batsman',
                country: 'India',
                srNo: 1000
            });
        }

        // Ensure a team exists
        let team = await Team.findOne({ code: 'CSK' });
        if (!team) {
            team = await Team.create({ code: 'CSK', name: 'Chennai Super Kings', remainingPurse: 1000000000 });
        } else {
            // Reset for test
            team.remainingPurse = 1000000000;
            await team.save();
        }

        // Setup Active Auction State
        let state = await AuctionState.findOne();
        if (!state) state = await AuctionState.create({});

        state.status = 'ACTIVE';
        state.currentPlayer = player._id;
        state.currentBid = 2000000; // Base Price
        state.highestBidder = null;
        state.timerEndsAt = new Date(Date.now() + 30000);
        await state.save();
        console.log(`Initial State: Bid=${state.currentBid}`);


        // 2. Simulate placeBid Request
        const mockReq = {
            body: { amount: 500000 }, // Increment +5L
            user: { teamCode: 'CSK' }
        };
        const mockRes = {
            json: (data) => {
                console.log('Response:', JSON.stringify(data));
                if (data.success && data.bid === 2500000) {
                    console.log('✅ Bid Increment Success! Total Bid is 2500000 (20L + 5L)');
                } else {
                    console.error('❌ Bid Increment Failed. Expected 2500000, got:', data.bid);
                    process.exit(1);
                }
            },
            status: (code) => ({ json: (d) => console.error(`Error ${code}:`, d) })
        };

        console.log('\n--- Placing Bid (+500,000) ---');
        await placeBid(mockReq, mockRes);

        // 3. Verify Invalid Increment (e.g. 0 or negative)
        const badReq = {
            body: { amount: -100 },
            user: { teamCode: 'CSK' }
        };
        const badRes = {
            status: (code) => ({
                json: (d) => {
                    if (code === 400) console.log('✅ Invalid bid correctly rejected');
                    else console.error('❌ Expected 400 for bad bid, got', code);
                }
            })
        };
        console.log('\n--- Placing Invalid Bid (-100) ---');
        await placeBid(badReq, badRes);

        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runTest();
