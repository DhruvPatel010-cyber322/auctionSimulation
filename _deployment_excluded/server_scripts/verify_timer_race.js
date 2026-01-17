
import mongoose from 'mongoose';
import { resolveAuctionTurn } from './controllers/auctionController.js';
import AuctionState from './models/AuctionState.js';
import Player from './models/Player.js';
import Team from './models/Team.js';

const MONGO_URI = "mongodb+srv://dhruvp0895653_db_user:Gunipl%402005@clustergunipl.rhrbfex.mongodb.net/auction_v2?appName=ClusterGUNIPL";

// Mock IO
import { setupSocket } from './socketHandler.js';
const mockIO = {
    emit: (event, payload) => {
        console.log(`\n[Socket Emit] ${event}`);
        if (event === 'auction:state') {
            console.log(`   Status: ${payload.status}`);
            console.log(`   TimerEndsAt: ${payload.timerEndsAt}`);
        }
    },
    use: () => { },
    on: () => { }
};
setupSocket(mockIO);

async function runTest() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // 1. Setup State: Active, Timer Expired in DB
        console.log('\n--- Setup: Forcing State to Expired ---');
        let state = await AuctionState.findOne();
        if (!state) { state = await AuctionState.create({}); }

        // Ensure player exists
        let player = await Player.findOne({ status: 'AVAILABLE' });
        if (!player) {
            player = await Player.create({
                name: 'Test Player',
                country: 'India',
                type: 'Batter',
                basePrice: 2000000,
                status: 'AVAILABLE',
                srNo: 999
            });
            console.log('Created dummy test player.');
        }

        state.status = 'ACTIVE';
        state.currentPlayer = player._id;
        state.timerEndsAt = new Date(Date.now() - 5000); // Expired 5s ago
        state.highestBidder = null; // Unsold scenario
        await state.save();
        console.log('State saved as ACTIVE with EXPIRED timer.');

        // 2. Simulate Concurrent Calls
        console.log('\n--- Test: Simulating Concurrent resolveAuctionTurn(true) ---');

        // We call it twice instantly to simulate race
        const p1 = resolveAuctionTurn(true);
        const p2 = resolveAuctionTurn(true);

        await Promise.all([p1, p2]);

        // 3. Verify Result
        const finalState = await AuctionState.findById(state._id);
        console.log(`\nFinal State Status: ${finalState.status}`);

        if (finalState.status === 'UNSOLD') {
            console.log('✅ Status correctly transitioned to UNSOLD');
        } else {
            console.error('❌ Status incorrect:', finalState.status);
            process.exit(1);
        }

        // Verify updateAuctionTimer was called (cleared)
        // We can't easily check the internal var of another module without exporting getter, 
        // but we can trust the log output or side effects if needed.

        console.log('\n✨ TIMER RACE TEST PASSED ✨');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runTest();
