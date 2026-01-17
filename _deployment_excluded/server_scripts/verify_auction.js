
const API_URL = 'http://localhost:5000/api';

async function verifyAuctionFlow() {
    try {
        console.log('--- GLOBAL AUCTION VERIFICATION ---');

        // 0. Logout Team (Ensure clean state)
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId: 'csk' })
        });
        console.log('🔄 Cleaned up previous sessions');

        // 1. Admin Login
        console.log('\n[1] Admin Login...');
        const adminRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode: 'admin', password: 'admin123' })
        });
        const adminData = await adminRes.json();
        if (!adminData.success) throw new Error('Admin Login Failed');
        const adminToken = adminData.token;
        console.log('✅ Admin Logged In. Token:', adminToken?.substring(0, 10) + '...');

        // 2. Start Auction
        console.log('\n[2] Starting Auction (Admin)...');
        const startRes = await fetch(`${API_URL}/auction/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            }
        });
        const startData = await startRes.json();
        if (startData.message === 'Auction is already active') {
            console.log('⚠️ Auction already active, proceeding...');
        } else {
            console.log('✅ Auction Started. Player:', startData.state?.currentPlayer?.name);
        }

        // 3. Team Login
        console.log('\n[3] Team Login (CSK)...');
        const teamRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode: 'csk', password: 'csk' })
        });
        const teamData = await teamRes.json();
        console.log('✅ Team Login Response:', JSON.stringify(teamData, null, 2));
        const teamToken = teamData.token;

        // 4. Place Bid
        console.log('\n[4] Placing Bid (CSK)...');
        const bidRes = await fetch(`${API_URL}/auction/bid`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${teamToken}`
            },
            body: JSON.stringify({ amount: 0.2 })
        });
        const bidData = await bidRes.json();
        if (bidData.success) {
            console.log('✅ Bid Placed. New Amount:', bidData.bid);
        } else {
            console.log('❌ Bid Failed:', bidData.message);
        }

        // 5. Next Player
        console.log('\n[5] Calling Next Player (Admin)...');
        const nextRes = await fetch(`${API_URL}/auction/next`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            }
        });
        const nextText = await nextRes.text();
        console.log('⚠️ Next Player Raw Response:', nextText.substring(0, 200));
        let nextData;
        try {
            nextData = JSON.parse(nextText);
        } catch (e) {/* ignore */ }
        console.log('✅ Next Player Response:', nextData.success ? 'Success' : 'Failed');
        if (nextData.state) {
            console.log(`🆕 New Player: [${nextData.state.currentPlayer.srNo}] ${nextData.state.currentPlayer.name}`);
        }


    } catch (error) {
        console.error('❌ Verification Failed:', error);
    }
}

verifyAuctionFlow();
