
import mongoose from 'mongoose';
import { setupSocket } from './socketHandler.js';
import * as auctionController from './controllers/auctionController.js';

const MONGO_URI = "mongodb+srv://dhruvp0895653_db_user:Gunipl%402005@clustergunipl.rhrbfex.mongodb.net/auction_v2?appName=ClusterGUNIPL";

// Mock Objects
let connectionHandler = null;

const mockIO = {
    emit: (event, payload) => {
        console.log(`[MockIO] Emitted '${event}'`);
        console.log(`[MockIO] Emitted '${event}'`);
        if (validatePayload(event, payload)) {
            console.log(`✅ [${event}] Payload VALID`);
        }
    },
    use: (middleware) => { },
    on: (event, handler) => {
        if (event === 'connection') connectionHandler = handler;
    }
};

const mockSocket = {
    id: 'mock-socket-id',
    handshake: { auth: { token: 'mock-token' } },
    user: { teamCode: 'RCB' }, // Simulated auth user
    emit: (event, payload) => {
        console.log(`[MockSocket] Emitted '${event}'`);
        validatePayload(event, payload);
    },
    on: () => { }
};

function validatePayload(event, payload) {
    // Only validate relevant events
    if (event !== 'auction:state' && event !== 'auction:sync' && event !== 'auctionStart') return;

    let isValid = true;

    // 1. Validate Highest Bidder
    if (payload.highestBidder !== undefined && payload.highestBidder !== null) {
        if (typeof payload.highestBidder !== 'object') {
            console.error(`❌ [${event}] highestBidder is NOT an object:`, payload.highestBidder);
            isValid = false;
        } else if (!payload.highestBidder.id || !payload.highestBidder.name) {
            console.error(`❌ [${event}] highestBidder object missing id/name:`, payload.highestBidder);
            isValid = false;
        } else {
            console.log(`   ✅ [${event}] highestBidder is object { id: ${payload.highestBidder.id}, name: ... }`);
        }
    } else {
        console.log(`   ℹ️ [${event}] highestBidder is null/undefined (Acceptable if no bid)`);
    }

    // 2. Validate Teams
    if (payload.teams) {
        if (!Array.isArray(payload.teams)) {
            console.error(`❌ [${event}] teams is not an array`);
            isValid = false;
        } else {
            const badTeam = payload.teams.find(t => !t.id || t.budget === undefined);
            if (badTeam) {
                console.error(`❌ [${event}] Found team missing id or budget:`, badTeam);
                isValid = false;
            } else {
                console.log(`   ✅ [${event}] Teams array has 'id' and 'budget'`);
            }
        }
    } else {
        // auctionStart might not have teams, but auction:state and auction:sync should
        if (event === 'auction:state' || event === 'auction:sync') {
            console.error(`❌ [${event}] Payload missing 'teams' array`);
            isValid = false;
        }
    }

    if (!isValid) {
        console.error('Payload content:', JSON.stringify(payload, null, 2));
        process.exit(1);
    }
    return true;
}

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // Setup Mock IO
        setupSocket(mockIO);

        // Test 1: getAuctionStatus (Controller Logic)
        console.log('\n--- Testing getAuctionStatus (Controller) ---');
        const mockRes = {
            json: (data) => {
                console.log('getAuctionStatus response received');
                // The controller sends the payload directly
                validatePayload('auction:state', data);
            },
            status: (code) => {
                console.log('Status:', code);
                return mockRes;
            }
        };
        await auctionController.getAuctionStatus({}, mockRes);

        // Test 2: Socket Connection (SocketHandler Logic)
        if (connectionHandler) {
            console.log('\n--- Testing Socket Connection (SocketHandler) ---');
            await connectionHandler(mockSocket);
        } else {
            console.error('❌ No connection handler registered!');
            process.exit(1);
        }

        console.log('\n✨ VERIFICATION PASSED ✨');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
