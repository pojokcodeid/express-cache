import db from '../config/db.js';
import client from '../config/redis.js';

export const getAllUsers = async (req, res) => {
    console.log('Headers:', req.headers);
    try {
        const cacheKey = 'users:all';
        const cachedUsers = await client.get(cacheKey);

        if (cachedUsers) {
            console.log('Serving from cache');
            return res.json({
                data: JSON.parse(cachedUsers),
                message: 'cache'
            });
        }

        const [rows] = await db.query('SELECT * FROM users ORDER BY id DESC');
        await client.set(cacheKey, JSON.stringify(rows), { EX: 3600 }); // 1 hour cache

        res.json({ data: rows, message: 'no cache' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getUserById = async (req, res) => {
    try {
        const cacheKey = `users:${req.params.id}`;
        const cachedUser = await client.get(cacheKey);

        if (cachedUser) {
            console.log('Serving from cache');
            return res.json({ data: JSON.parse(cachedUser), message: 'cache' });
        }

        const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [
            req.params.id
        ]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await client.set(cacheKey, JSON.stringify(rows[0]), { EX: 3600 });
        res.json({ data: rows[0], message: 'no cache' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createUser = async (req, res) => {
    const { name, email } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO users (name, email) VALUES (?, ?)',
            [name, email]
        );

        await client.del('users:all');

        res.status(201).json({
            data: { id: result.insertId, name, email },
            message: 'no cache'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateUser = async (req, res) => {
    const { name, email } = req.body;
    try {
        const [result] = await db.query(
            'UPDATE users SET name = ?, email = ? WHERE id = ?',
            [name, email, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await client.del('users:all');
        await client.del(`users:${req.params.id}`);

        res.json({
            data: { id: req.params.id, name, email },
            message: 'no cache'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM users WHERE id = ?', [
            req.params.id
        ]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await client.del('users:all');
        await client.del(`users:${req.params.id}`);

        res.json({
            data: { id: req.params.id },
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
