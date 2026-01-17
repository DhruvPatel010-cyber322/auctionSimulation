


const BASE_URL = 'http://localhost:5000/api';

async function testBackend() {
    console.log('Starting Backend Verification...');
    let success = true;

    try {
        // 1. Get Teams
        console.log('1. Fetching Teams...');
        const teamsRes = await fetch(`${BASE_URL}/teams`);
        const teams = await teamsRes.json();

        if (teams.length === 10) {
            console.log('   ✅ Teams fetched successfully (10 teams)');
        } else {
            console.error(`   ❌ Update failed: Expected 10 teams, got ${teams.length}`);
            success = false;
        }

        // 2. Login Logic
        console.log('\n2. Testing Login (RCB) via /api/auth/login...');
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode: 'rcb', password: 'rcb' })
        });
        const loginData = await loginRes.json();

        if (loginRes.ok && loginData.success) {
            console.log('   ✅ Login successful');
        } else {
            console.error('   ❌ Login failed:', loginData);
            success = false;
        }

        // 3. Duplicate Login Logic
        console.log('\n3. Testing Duplicate Login (RCB)...');
        const dupRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode: 'rcb', password: 'rcb' })
        });
        const dupData = await dupRes.json();

        if (dupRes.status === 409) {
            console.log('   ✅ Duplicate login prevented correctly (409 Conflict)');
        } else {
            console.error('   ❌ Duplicate login check failed:', dupRes.status, dupData);
            success = false;
        }

        // 4. Logout Logic
        console.log('\n4. Testing Logout (RCB)...');
        const logoutRes = await fetch(`${BASE_URL}/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamId: 'rcb' })
        });

        if (logoutRes.ok) {
            console.log('   ✅ Logout successful');
        } else {
            console.error('   ❌ Logout failed');
            success = false;
        }

        // 5. Relogin after logout & Case Insensitive Check (RCB vs rcb)
        console.log('\n5. Testing Re-login (Case Insensitive: RCB)...');
        const reLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode: 'RCB', password: 'rcb' })
        });

        if (reLoginRes.ok) {
            console.log('   ✅ Re-login successful with uppercase ID');
        } else {
            console.error('   ❌ Re-login failed with uppercase ID');
            // Log response for debugging
            const d = await reLoginRes.json();
            console.error(d);
            success = false;
        }

    } catch (error) {
        console.error('   ❌ Test Exception:', error.message);
        success = false;
    }

    if (success) {
        console.log('\n✨ ALL BACKEND TESTS PASSED ✨');
        process.exit(0);
    } else {
        console.error('\n💀 SOME TESTS FAILED 💀');
        process.exit(1);
    }
}

testBackend();
