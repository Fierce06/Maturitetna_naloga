const client = require('./db');

/**
 * Get all subjects for a user.
 * @param {number} user_id 
 * @returns 
 */
module.exports.getAllSubjects = async function(user_id) {
    const query = 'SELECT * FROM subjects WHERE user_id = ?';
    const [rows] = await client.query(query, [user_id]);
    return rows;
};

/**
 * Insert a new subject.
 * @param {number} user_id 
 * @param {string} subjectName 
 * @param {string} subjectDescription 
 * @param {string} subjectColor 
 * @param {string} subjectIcon
 * @returns 
 */
module.exports.insertNewSubject = async function(user_id, subjectName, subjectDescription, subjectColor, subjectIcon) {
    const insertQuery = `INSERT INTO subjects (user_id, name, description, color, icon) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await client.query(insertQuery, [parseInt(user_id), subjectName, subjectDescription, subjectColor, subjectIcon]);
    const selectQuery = 'SELECT * FROM subjects WHERE id = ? LIMIT 1';
    const [rows] = await client.query(selectQuery, [result.insertId]);
    return rows[0];
}

/**
 * Insert a new subject.
 * @param {number} user_id 
 * @param {number} subjectId
 * @param {string} subjectName 
 * @param {string} subjectDescription 
 * @param {string} subjectColor 
 * @param {string} subjectIcon
 * @returns 
 */
module.exports.editSubject = async function(user_id, subjectId, subjectName, subjectDescription, subjectColor, subjectIcon) {
    const insertQuery = `UPDATE subjects SET name = ?, description = ?, color = ?, icon = ? WHERE user_id = ? AND id = ?`;
    const [result] = await client.query(insertQuery, [subjectName, subjectDescription, subjectColor, subjectIcon, parseInt(user_id), parseInt(subjectId)]);
    const selectQuery = 'SELECT * FROM subjects WHERE id = ? LIMIT 1';
    const [rows] = await client.query(selectQuery, [result.insertId]);
    return rows[0];
}

/**
 * Get all subject IDs for a user.
 * @param {number} user_id 
 * @returns 
 */
module.exports.getAllSubjectIds = async function(user_id) {
    const query = 'SELECT id, name FROM subjects WHERE user_id = ?';
    const [rows] = await client.query(query, [user_id]);
    return rows.map(row => row);
}