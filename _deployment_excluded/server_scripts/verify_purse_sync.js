const API_URL = 'http://localhost:5000/api';

async function verifyPurseSync() {
    try {
        console.log('--- PURSE SYNCHRONIZATION VERIFICATION ---');

        // 1. Admin Login
        console.log('\n[1] Admin Login...');
        const adminRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode: 'admin', password: 'admin123' })
        });
        const adminData = await adminRes.json();
        const adminToken = adminData.token;
        console.log('✅ Admin Logged In');

        // 2. Get initial team purse
        console.log('\n[2] Checking Initial Team Purse...');
        const teamsRes = await fetch(`${API_URL}/teams`);
        const teams = await teamsRes.json();
        const cskTeam = teams.find(t => t.code === 'CSK');
        console.log(`CSK Initial Purse: ₹${(cskTeam.remainingPurse / 10000000).toFixed(2)} Cr`);
        const initialPurse = cskTeam.remainingPurse;

        // 3. Start Auction
        console.log('\n[3] Starting Auction...');
        const startRes = await fetch(`${API_URL}/auction/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            }
        });
        const startData = await startRes.json();
        console.log(`✅ Auction Started: ${startData.state?.currentPlayer?.name}`);

        // 4. Team CSK Login & First Bid
        console.log('\n[4] CSK Login & Bid...');
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId: 'csk' })
        });

        const cskLoginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode: 'csk', password: 'csk' })
        });
        const cskData = await cskLoginRes.json();
        const cskToken = cskData.token;

        const bid1Res = await fetch(`${API_URL}/auction/bid`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cskToken}`
            },
            body: JSON.stringify({ amount: 0.5 })
        });
        const bid1Data = await bid1Res.json();
        console.log(`✅ CSK Bid Placed: ₹${bid1Data.bid} Cr`);

        // 5. Try to bid again (should fail)
        console.log('\n[5] Testing Duplicate Bid Prevention...');
        const bid2Res = await fetch(`${API_URL}/auction/bid`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${cskToken}`
            },
            body: JSON.stringify({ amount: 0.2 })
        });
        const bid2Data = await bid2Res.json();
        if (bid2Data.message === 'You already hold the highest bid') {
            console.log('✅ Duplicate bid correctly blocked!');
        } else {
            console.log('❌ Duplicate bid was allowed (BUG!)');
        }

        // 6. Next Player (resolve auction - sell to CSK)
        console.log('\n[6] Moving to Next Player...');
        const nextRes = await fetch(`${API_URL}/auction/next`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            }
        });
        await nextRes.json();
        console.log('✅ Auction resolved & next player started');

        // 7. Check updated purse
        console.log('\n[7] Verifying Purse Deduction...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for DB update

        const teamsRes2 = await fetch(`${API_URL}/teams`);
        const teams2 = await teamsRes2.json();
        const cskTeamUpdated = teams2.find(t => t.code === 'CSK');
        const finalPurse = cskTeamUpdated.remainingPurse;
        const deducted = (initialPurse - finalPurse) / 10000000;

        console.log(`CSK Final Purse: ₹${(finalPurse / 10000000).toFixed(2)} Cr`);
        console.log(`Amount Deducted: ₹${deducted.toFixed(2)} Cr`);

        if (deducted > 0) {
            console.log('✅ Purse correctly synchronized with database!');
        } else {
            console.log('❌ Purse NOT deducted (BUG!)');
        }

    } catch (error) {
        console.error('❌ Verification Failed:', error);
    }
}

verifyPurseSync();
