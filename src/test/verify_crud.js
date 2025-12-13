const baseUrl = 'http://localhost:3000/users';

async function verifyCrud() {
    console.log('--- Starting CRUD Verification ---');

    // 1. Create User
    console.log('\n1. Creating User...');
    const createUserRes = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'John Doe', email: 'john@example.com' })
    });
    const createdUser = await createUserRes.json();
    console.log('Created:', createdUser);
    if (!createdUser.data.id) throw new Error('Failed to create user');

    const userId = createdUser.data.id;

    // 2. Get All Users
    console.log('\n2. Getting All Users...');
    const getAllRes = await fetch(baseUrl);
    const allUsers = await getAllRes.json();
    console.log('All Users Count:', allUsers.data.length);
    const foundUser = allUsers.data.find((u) => u.id === userId);
    console.log('Found created user in list:', !!foundUser);

    // 3. Get User By ID
    console.log(`\n3. Getting User By ID (${userId})...`);
    const getByIdRes = await fetch(`${baseUrl}/${userId}`);
    const userById = await getByIdRes.json();
    console.log('User By ID:', userById);
    if (userById.data.name !== 'John Doe')
        throw new Error('User data mismatch');

    // 4. Update User
    console.log(`\n4. Updating User (${userId})...`);
    const updateRes = await fetch(`${baseUrl}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Jane Doe', email: 'jane@example.com' })
    });
    const updatedUser = await updateRes.json();
    console.log('Updated:', updatedUser);

    // Verify update
    const verifyUpdateRes = await fetch(`${baseUrl}/${userId}`);
    const verifiedUser = await verifyUpdateRes.json();
    if (verifiedUser.data.name !== 'Jane Doe') throw new Error('Update failed');

    // 5. Delete User
    console.log(`\n5. Deleting User (${userId})...`);
    const deleteRes = await fetch(`${baseUrl}/${userId}`, {
        method: 'DELETE'
    });
    const deleteResult = await deleteRes.json();
    console.log('Delete Result:', deleteResult);

    // Verify delete
    const verifyDeleteRes = await fetch(`${baseUrl}/${userId}`);
    if (verifyDeleteRes.status !== 404)
        throw new Error('Delete failed (user still exists)');
    console.log('User successfully verified as deleted.');

    console.log('\n--- CRUD Verification Successful ---');
}

verifyCrud().catch((err) => {
    console.error('Verification Failed:', err);
    process.exit(1);
});
