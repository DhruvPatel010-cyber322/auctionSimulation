const API_URL = 'http://localhost:5000/api';

async function verifyStatusPolling() {
    try {
        console.log('--- STATUS POLLING VERIFICATION ---');

        // 0. Cleanup (Logout)
        console.log('\n[0] Cleaning up session...');
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId: 'csk' })
        });

        // 1. Team Login
        console.log('\n[1] Team Login...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode: 'csk', password: 'csk' })
        });
        const loginData = await loginRes.json();
        console.log('Login Data:', JSON.stringify(loginData));
        const token = loginData.token;
        console.log('Token obtained:', token);

        // 2. Poll Status Loop (3 times)
        console.log('\n[2] Polling /api/auction/status...');
        for (let i = 1; i <= 3; i++) {
            const start = Date.now();
            const res = await fetch(`${API_URL}/auction/status`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            const duration = Date.now() - start;

            console.log(`Poll #${i}: Status=${res.status}, Duration=${duration}ms`);
            console.log('Full Response:', JSON.stringify(data));
            console.log(`State: Status=${data.status}, Player=${data.currentPlayer?.name}, Bid=${data.currentBid}`);

            if (!data.status && res.status !== 200) throw new Error(data.message || 'Invalid State Response');

            // Wait 1s
            await new Promise(r => setTimeout(r, 1000));
        }

        console.log('\n✅ Polling Verification Passed');

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    }
}

verifyStatusPolling();
