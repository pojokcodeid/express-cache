import request from 'supertest';
import app from '../app.js';
import client from '../config/redis.js';
import db from '../config/db.js';

describe('User CRUD Operations', () => {
    let createdUserId;

    // Connect Redis before tests
    beforeAll(async () => {
        if (!client.isOpen) {
            await client.connect();
        }
    });

    // Close Redis and DB connections after tests
    afterAll(async () => {
        await client.quit();
        await db.end();
    });

    test('POST /users - Create User', async () => {
        const res = await request(app)
            .post('/users')
            .send({
                name: 'Jest User',
                email: `jest${Date.now()}@example.com`
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('data');
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.name).toBe('Jest User');
        expect(res.body.message).toBe('no cache');

        createdUserId = res.body.data.id;
    });

    test('GET /users - Get All Users (Cache Miss)', async () => {
        // Ensure fresh state (optional, but relying on previous tests order)
        // Invalidation happens on Create/Update/Delete.
        // We just created a user in the previous test.

        const res = await request(app).get('/users');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBeTruthy();
        const found = res.body.data.find((u) => u.id === createdUserId);
        expect(found).toBeTruthy();

        // It might be 'no cache' if it was invalidated by create,
        // OR 'cache' if something else ran.
        // But since we just created a user, the cache 'users:all' should have been deleted.
        // So this FIRST fetch after create should be 'no cache'.
        expect(res.body.message).toBe('no cache');
    });

    test('GET /users - Get All Users (Cache Hit)', async () => {
        // Fetch again, should be cached now
        const res = await request(app).get('/users');

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body.data)).toBeTruthy();
        expect(res.body.message).toBe('cache');
    });

    test('GET /users/:id - Get User By ID', async () => {
        const res = await request(app).get(`/users/${createdUserId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.data.id).toBe(createdUserId);
        // First fetch might be database or cache depending on previous tests/state,
        // but let's check structure
        expect(res.body).toHaveProperty('data');
    });

    test('GET /users/:id - Cache Hit', async () => {
        // First ensure it's cached (or re-fetch)
        await request(app).get(`/users/${createdUserId}`);

        // Second fetch should be from cache
        const res = await request(app).get(`/users/${createdUserId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('cache');
        expect(res.body.data.id).toBe(createdUserId);
    });

    test('PUT /users/:id - Update User', async () => {
        const res = await request(app)
            .put(`/users/${createdUserId}`)
            .send({ name: 'Jest Updated', email: 'update@example.com' });

        expect(res.statusCode).toBe(200);
        expect(res.body.data.name).toBe('Jest Updated');
        expect(res.body.message).toBe('no cache');
    });

    test('DELETE /users/:id - Delete User and Invalidate List Cache', async () => {
        const res = await request(app).delete(`/users/${createdUserId}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('User deleted successfully');
    });

    test('GET /users - Verify List Cache Invalidated', async () => {
        const res = await request(app).get('/users');
        expect(res.statusCode).toBe(200);
        // Should be 'no cache' because delete invalidates 'users:all'
        expect(res.body.message).toBe('no cache');

        // User should not be in the list
        const found = res.body.data.find((u) => u.id === createdUserId);
        expect(found).toBeFalsy();
    });

    test('GET /users/:id - Expect 404 after delete', async () => {
        const res = await request(app).get(`/users/${createdUserId}`);

        expect(res.statusCode).toBe(404);
    });
});
