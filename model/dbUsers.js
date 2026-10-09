const client = require('./db');

module.exports.numberOfUsers = async function() {
    const query = 'SELECT COUNT(*) AS count FROM users';
    const [rows] = await client.query(query);
    return rows[0].count;
};

// Pridobi admina preko uporabniškega imena
module.exports.getAdminByUsername = async function(username) {
    const query = 'SELECT * FROM users WHERE username = ? LIMIT 1';
    const [rows] = await client.query(query, [username]);
    return rows[0];
};

// Pridobi admina preko ID-ja
module.exports.getAdminById = async function(id) {
    const query = 'SELECT * FROM users WHERE id = ? LIMIT 1';
    const [rows] = await client.query(query, [id]);
    return rows[0];
};

// Registracija
module.exports.createAdmin = async function(username, passwordHash) {
    const insertQuery = `INSERT INTO users (username, password_hash)
            VALUES (?, ?)`;
    const [result] = await client.query(insertQuery, [username, passwordHash]);
    const selectQuery = 'SELECT id, username, password_hash, failed_attempts, locked_until, created_at, consecutive_failed_attempts FROM users WHERE id = ? LIMIT 1';
    const [rows] = await client.query(selectQuery, [result.insertId]);
    return rows[0];
};

// Posodabjanje neuspelih poiskusov
module.exports.updateFailedAttempts = async function(failed_attempts, locked_until, consecutive_failed_attempts, username) {
    const query = `UPDATE users 
                       SET failed_attempts=?, locked_until=?, consecutive_failed_attempts=?
                       WHERE username=?`;
    await client.query(query, [failed_attempts, locked_until, consecutive_failed_attempts, username]);
    const [rows] = await client.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    return rows[0];
};

// Posodabljanje gesla
module.exports.updateAdminPassword = async function(passwordHash, id) {
    const query = 'UPDATE users SET password_hash = ? WHERE id = ?';
    await client.query(query, [passwordHash, id]);
    const [rows] = await client.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0];
};