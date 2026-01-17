const API_URL = 'http://localhost:5000/api';

async function reproduceBiddingError() {
    try {
        console.log('--- BIDDING ERROR REPRODUCTION ---');

        // 1. Admin Login & Start Auction
        console.log('\n[1] Admin Login & Start...');
        const adminRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode: 'admin', password: 'admin123' })
        });
        const adminData = await adminRes.json();
        const adminToken = adminData.token;

        // Ensure auction is active
        const statusRes = await fetch(`${API_URL}/auction/status`, {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        const status = await statusRes.json();

        if (status.status !== 'ACTIVE') {
            await fetch(`${API_URL}/auction/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminToken}`
                }
            });
            console.log('Auction Started');
        } else {
            console.log('Auction already ACTIVE');
        }

        // 2. Team Login (CSK)
        console.log('\n[2] CSK Login...');
        // Logout first to clear session
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId: 'csk' })
        });

        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode: 'csk', password: 'csk' })
        });
        const loginData = await loginRes.json();

        if (!loginData.success) {
            console.error('Login Failed:', loginData);
            return;
        }

        console.log('Logged in as:', loginData.team.code);
        console.log('Token:', loginData.token);

        // 3. Try to Bid
        console.log('\n[3] Attempting Bid...');
        const bidRes = await fetch(`${API_URL}/auction/bid`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.token}`
            },
            body: JSON.stringify({ amount: 0.2 })
        });
        const bidData = await bidRes.json();

        console.log('Bid Response:', bidData);

        if (bidRes.status === 404 && bidData.message === 'Team not found') {
            console.log('❌ REPRODUCED: Team not found error confirmed.');
        } else if (bidRes.status === 200) {
            console.log('✅ Bid Successful - Could not reproduce.');
        } else {
            console.log('⚠️ Other Error:', bidRes.status, bidData.message);
        }

    } catch (error) {
        console.error('❌ Script Error:', error);
    }
}

reproduceBiddingError();
