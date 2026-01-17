
import fetch from 'node-fetch';

async function testPlayersApi() {
    try {
        // 1. Login to get token
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode: 'CSK', password: 'password123' }) // Assuming default seed credentials or similar
        });

        const loginData = await loginRes.json();
        if (!loginData.success) {
            console.error('Login failed:', loginData);
            // Try admin login if team fails
            const adminLogin = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ teamCode: 'admin', password: 'admin' })
            });
            const adminData = await adminLogin.json();
            if (!adminData.success) {
                console.error('Admin Login failed too');
                process.exit(1);
            }
            loginData.token = adminData.token;
        }

        const token = loginData.token;
        console.log('Got Token:', token ? 'Yes' : 'No');

        // 2. Fetch Players
        const playersRes = await fetch('http://localhost:5000/api/players', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!playersRes.ok) {
            console.error('Players API Error:', playersRes.status, playersRes.statusText);
            const errText = await playersRes.text();
            console.error('Body:', errText);
            process.exit(1);
        }

        const players = await playersRes.json();
        console.log('Players API Response Type:', Array.isArray(players) ? 'Array' : typeof players);

        if (Array.isArray(players)) {
            console.log(`✅ Success! Received ${players.length} players.`);
            process.exit(0);
        } else {
            console.error('❌ Error: Expected array, got:', players);
            process.exit(1);
        }

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

testPlayersApi();
