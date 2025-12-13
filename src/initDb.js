import connection from './config/db.js';

async function initDb() {
    try {
        await connection.query(`CREATE DATABASE IF NOT EXISTS test_db`);
        console.log('Database test_db created or already exists.');

        const db = connection;

        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        await db.query(createTableQuery);
        console.log('Table users created or already exists.');

        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
}

initDb();
