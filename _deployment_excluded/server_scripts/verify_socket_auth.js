
import io from 'socket.io-client';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import Team from './models/Team.js';

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const JWT_SECRET = 'supersecretauctionkey';
const MONGO_URI = "mongodb+srv://dhruvp0895653_db_user:Gunipl%402005@clustergunipl.rhrbfex.mongodb.net/auction_v2?appName=ClusterGUNIPL";

// Helpers
function createToken(payload) {
    return jwt.sign(payload, JWT_SECRET);
}

function connectSocket(token) {
    return new Promise((resolve, reject) => {
        // Need to run server separately or use in-memory socket mock? 
        // Real socket client needs real running server.
        // Assuming SERVER IS RUNNING at localhost:5000 for this test or we mock.
        // Since we can't easily spin up full express+socket in this script without conflicts if main server runs,
        // we might rely on 'verify_socket_logic_mock.js' approach where we import setupSocket.
        // BUT setupSocket needs an http server instance usually.
        // Let's use the Mock Logic approach again for unit testing the middleware.
        resolve('Use Mock Script Logic');
    });
}

// --- MOCK TEST LOGIC ---
import { setupSocket } from './socketHandler.js';

// Simulated Middleware Runner
const mockMiddlewareRunner = (middleware, socket) => {
    return new Promise((resolve) => {
        middleware(socket, (err) => {
            resolve(err); // Resolve with error if exists, or undefined if success
        });
    });
};

async function runTest() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        // 1. Setup Team & Session
        const teamCode = 'TEST_AUTH_TEAM';
        await Team.deleteOne({ code: teamCode });
        const team = await Team.create({
            code: teamCode,
            name: 'Auth Test Team',
            remainingPurse: 100,
            activeSessionId: 'valid-session-123',
            isLoggedIn: true
        });

        // 2. Extract Middleware from socketHandler
        let capturedMiddleware = null;
        const mockIO = {
            use: (fn) => { capturedMiddleware = fn; },
            on: () => { },
            emit: () => { }
        };
        setupSocket(mockIO);

        if (!capturedMiddleware) {
            console.error('❌ Failed to capture socket middleware');
            process.exit(1);
        }

        // 3. Test Cases

        // Case A: Valid Token & Session
        console.log('\n--- Case A: Valid Session ---');
        const tokenValid = createToken({ teamCode, role: 'TEAM', sessionId: 'valid-session-123' });
        const socketValid = { handshake: { auth: { token: tokenValid } } };

        const errA = await mockMiddlewareRunner(capturedMiddleware, socketValid);
        if (!errA) {
            console.log('✅ Connected successfully');
            // Validate context
            if (socketValid.user && socketValid.user.teamCode === teamCode) {
                console.log('   User context populated correctly');
            } else {
                console.error('❌ User context missing');
                process.exit(1);
            }
        } else {
            console.error('❌ Unexpected Error:', errA.message);
            process.exit(1);
        }

        // Case B: Invalid Session (Session Mismatch)
        console.log('\n--- Case B: Invalid Session (Mismatch) ---');
        const tokenInvalid = createToken({ teamCode, role: 'TEAM', sessionId: 'old-session-999' });
        const socketInvalid = { handshake: { auth: { token: tokenInvalid } } };

        const errB = await mockMiddlewareRunner(capturedMiddleware, socketInvalid);
        if (errB && errB.message.includes('Session expired')) {
            console.log('✅ Rejected correctly: Session expired');
        } else {
            console.error('❌ Failed to reject invalid session. Result:', errB ? errB.message : 'Success');
            process.exit(1);
        }

        // Case C: Admin Bypass
        console.log('\n--- Case C: Admin Bypass ---');
        const tokenAdmin = createToken({ role: 'ADMIN' });
        const socketAdmin = { handshake: { auth: { token: tokenAdmin } } };

        const errC = await mockMiddlewareRunner(capturedMiddleware, socketAdmin);
        if (!errA) {
            console.log('✅ Admin Connected successfully');
        } else {
            console.error('❌ Admin failed to connect:', errC.message);
            process.exit(1);
        }

        console.log('\n✨ SOCKET AUTH VERIFICATION PASSED ✨');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runTest();
