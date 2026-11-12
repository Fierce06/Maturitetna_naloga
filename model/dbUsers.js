const client = require('./db');

/**
 * Get the total number of users in the database.
 * @returns 
 */
module.exports.numberOfUsers = async function() {
    const query = 'SELECT COUNT(*) AS count FROM users';
    const [rows] = await client.query(query);
    return rows[0].count;
};

/**
 * Get an admin by their username.
 * @param {string} username 
 * @returns 
 */
module.exports.getAdminByUsername = async function(username) {
    const query = 'SELECT * FROM users WHERE username = ? LIMIT 1';
    const [rows] = await client.query(query, [username]);
    return rows[0];
};

/**
 * Get an admin by their ID.
 * @param {number} id 
 * @returns 
 */
module.exports.getAdminById = async function(id) {
    const query = 'SELECT * FROM users WHERE id = ? LIMIT 1';
    const [rows] = await client.query(query, [id]);
    return rows[0];
};

/**
 * Create a new user.
 * @param {string} username 
 * @param {string} email 
 * @param {string} passwordHash 
 * @returns 
 */
module.exports.createUser = async function(username, email, passwordHash) {
    console.log('Creating user:', username, email);
    const insertQuery = `INSERT INTO users (username, email, password_hash)
            VALUES (?, ?, ?)`;
    const [result] = await client.query(insertQuery, [username, email, passwordHash]);
    const selectQuery = 'SELECT id, username, password_hash, failed_attempts, locked_until, created_at, consecutive_failed_attempts FROM users WHERE id = ? LIMIT 1';
    const [rows] = await client.query(selectQuery, [result.insertId]);
    return rows[0];
};


/**
 * Update the failed attempts for a user.
 * @param {number} failed_attempts 
 * @param {string} locked_until 
 * @param {number} consecutive_failed_attempts 
 * @param {string} username 
 * @returns 
 */
module.exports.updateFailedAttempts = async function(failed_attempts, locked_until, consecutive_failed_attempts, username) {
    const query = `UPDATE users 
                       SET failed_attempts=?, locked_until=?, consecutive_failed_attempts=?
                       WHERE username=?`;
    await client.query(query, [failed_attempts, locked_until, consecutive_failed_attempts, username]);
    const [rows] = await client.query('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
    return rows[0];
};

/**
 * Update the password for an admin.
 * @param {string} passwordHash 
 * @param {number} id 
 * @returns 
 */
module.exports.updateAdminPassword = async function(passwordHash, id) {
    const query = 'UPDATE users SET password_hash = ? WHERE id = ?';
    await client.query(query, [passwordHash, id]);
    const [rows] = await client.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0];
};