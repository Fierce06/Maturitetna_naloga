const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    database: process.env.DB_NAME,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

pool.getConnection()
    .then(connection => {
        connection.release();
        console.log(`Povezan na bazo ${process.env.DB_NAME || 'scroll_app'}`);
    })
    .catch(err => console.error('Napaka pri povezavi na bazo:', err));

module.exports = pool;