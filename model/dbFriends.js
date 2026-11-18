const client = require('./db');

/**
 * Add a friend for a user.
 * @param {*} user_id 
 * @param {*} friend_id 
 * @returns 
 */
module.exports.addFriend = async function(user_id, friend_id) {
    const query = 'INSERT INTO friends (user_id, friend_id) VALUES (?, ?)';
    const [rows] = await client.query(query, [user_id, friend_id]);
    return rows;
};

/**
 * Get all friends for a user.
 * @param {*} user_id 
 * @returns
 */
module.exports.getAllFriends = async function(user_id) {
    const query = 'SELECT u.id, u.username FROM users u JOIN friends f ON u.id = f.friend_id WHERE f.user_id = ?';
    const [rows] = await client.query(query, [user_id]);
    return rows;
};

/**
 * Search for users by username.
 * @param {*} username 
 * @returns
 */
module.exports.searchByUsername = async function(username) {
    const query = 'SELECT id, username FROM users WHERE username LIKE ?';
    const [rows] = await client.query(query, [`%${username}%`]);    
    return rows;
};