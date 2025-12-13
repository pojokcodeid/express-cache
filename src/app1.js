import express from 'express';
import { createClient } from 'redis';

const app = express();
const port = process.env.PORT || 3000;

// Initialize Redis Client
const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

// Connect to Redis
(async () => {
    try {
        await client.connect();
        console.log('Connected to Redis');
    } catch (err) {
        console.error('Failed to connect to Redis:', err.message);
    }
})();

app.use(express.json());

// Helper function to simulate a slow database call
const getMockData = () => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                id: 1,
                name: 'Product A',
                details:
                    'This is a detailed description fetched from a "slow" database.',
                timestamp: new Date().toISOString()
            });
        }, 2000); // 2 second delay
    });
};

// Route without cache
app.get('/no-cache', async (req, res) => {
    const data = await getMockData();
    res.json({ ...data, source: 'database' });
});

// Route with Redis cache
app.get('/with-cache', async (req, res) => {
    const key = 'mock_data_1';

    try {
        const cachedData = await client.get(key);
        if (cachedData) {
            return res.json({ ...JSON.parse(cachedData), source: 'cache' });
        }

        const data = await getMockData();
        // Set cache with 60 second expiration
        await client.set(key, JSON.stringify(data), {
            EX: 60
        });

        res.json({ ...data, source: 'database' });
    } catch (error) {
        console.error('Cache error:', error);
        // Fallback to database if cache fails
        const data = await getMockData();
        res.json({ ...data, source: 'database' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
