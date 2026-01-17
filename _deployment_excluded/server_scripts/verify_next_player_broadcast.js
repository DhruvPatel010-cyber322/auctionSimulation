
import io from 'socket.io-client';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
    try {
        // 1. Admin Login
        const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode: 'admin', password: 'admin123' })
        });
        const adminData = await adminLogin.json();
        const adminToken = adminData.token;
        console.log('Admin Token:', adminToken ? 'OK' : 'FAIL', adminData.message || '');

        // 2. Team Login (for socket auth)
        // Ensure team exists. CSK/password123 is typical seed.
        const teamLogin = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode: 'CSK', password: 'password123' })
        });
        const teamData = await teamLogin.json();
        const teamToken = teamData.token;
        console.log('Team Token:', teamToken ? 'OK' : 'FAIL');

        // 3. Connect Team Socket
        // IMPORTANT: Use the port where server is running logic (usually 5000)
        // verify_payloads_mock used a mock. Here we need REAL socket against REAL server (index.js).
        // If server is not running, we must start it or use the same MOCK approach if we want to test Logic vs Network.
        // User said "start app" recently, so server should be running on 5000.

        let updateReceived = false;

        const socket = io('http://localhost:5000', {
            auth: { token: teamToken }
        });

        socket.on('connect', () => {
            console.log('socket connected');
        });

        socket.on('auction:state', (data) => {
            console.log('Received auction:state');
            console.log('Current Player:', data.currentPlayer?.name);
            updateReceived = true;
            if (data.currentPlayer) {
                console.log('✅ Update Verified!');
                socket.disconnect();
                process.exit(0);
            }
        });

        // 4. Trigger Next Player via Admin API
        setTimeout(async () => {
            console.log('Triggering Next Player...');
            const nextRes = await fetch(`${BASE_URL}/auction/next`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            const nextData = await nextRes.json();
            console.log('Next Player API:', nextData.message);
        }, 1000);

        // Timeout
        setTimeout(() => {
            if (!updateReceived) {
                console.error('❌ No update received within 5 seconds');
                process.exit(1);
            }
        }, 6000);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

runTest();
