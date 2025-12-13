const baseUrl = 'http://localhost:3000';

async function runTests() {
    try {
        console.log('1. Initial GET /users (should be empty or cached)');
        const res1 = await fetch(`${baseUrl}/users`);
        const data1 = await res1.json();
        console.log('Result:', data1);

        console.log('\n2. Create User via POST /users');
        const res2 = await fetch(`${baseUrl}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Redis User',
                email: `redis${Date.now()}@example.com`
            })
        });
        const data2 = await res2.json();
        console.log('Result:', data2);
        const userId = data2.data.id;

        console.log('\n3. GET /users (should show new user and update cache)');
        const res3 = await fetch(`${baseUrl}/users`);
        const data3 = await res3.json();
        console.log('Result Count:', data3.data.length);

        console.log(`\n4. GET /users/${userId} (should cache individual user)`);
        const res4 = await fetch(`${baseUrl}/users/${userId}`);
        const data4 = await res4.json();
        console.log('Result:', data4);

        console.log(`\n5. GET /users/${userId} again (should hit cache)`);
        const start = performance.now();
        const res5 = await fetch(`${baseUrl}/users/${userId}`);
        const data5 = await res5.json();
        console.log('Result:', data5);
        console.log('Time taken:', performance.now() - start, 'ms');

        console.log(`\n6. DELETE /users/${userId} (should clean cache)`);
        await fetch(`${baseUrl}/users/${userId}`, { method: 'DELETE' });
        console.log('Deleted');

        console.log('\n7. GET /users (should be empty again)');
        const res7 = await fetch(`${baseUrl}/users`);
        const data7 = await res7.json();
        console.log('Result Count:', data7.data.length);
    } catch (error) {
        console.error('Test failed:', error);
    }
}

runTests();
