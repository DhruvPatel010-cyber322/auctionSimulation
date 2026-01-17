
const API_URL = 'http://localhost:5000/api';

async function login(teamCode, password) {
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teamCode, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        return data.token;
    } catch (e) {
        console.error(`Login failed for ${teamCode}:`, e.message);
        throw e;
    }
}

async function placeBid(token, amount, user) {
    try {
        const res = await fetch(`${API_URL}/auction/bid`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ amount })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        console.log(`[${user}] Bid success: ₹${data.bid} Cr`);
    } catch (e) {
        // console.error(`[${user}] Bid Failed:`, e.message);
        console.log(`[${user}] Bid Result: ${e.message}`);
    }
}

async function runTest() {
    console.log("--> Logging in MI...");
    const tokenMI = await login('mi', 'mi');

    console.log("--> Logging in CSK...");
    const tokenCSK = await login('csk', 'csk');

    // Simulate interactions
    console.log("\n--> MI placing bid...");
    await placeBid(tokenMI, 0.2, 'MI');

    // Wait a bit
    await new Promise(r => setTimeout(r, 1000));

    // CSK should succeed now that they are authenticated
    console.log("\n--> CSK placing bid (should succeed)...");
    await placeBid(tokenCSK, 0.5, 'CSK');

    console.log("\nDone.");
}

runTest();
