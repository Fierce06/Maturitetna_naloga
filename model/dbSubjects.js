const client = require('./db');

module.exports.getAllSubjects = async function(user_id) {
    const query = 'SELECT * FROM subjects WHERE user_id = ?';
    const [rows] = await client.query(query, [user_id]);
    return rows;
};

module.exports.insertNewSubject = async function(user_id, subjectName, subjectDescription, subjectColor) {
    const insertQuery = `INSERT INTO subjects (user_id, name, description, color) VALUES (?, ?, ?, ?)`;
    const [result] = await client.query(insertQuery, [parseInt(user_id), subjectName, subjectDescription, subjectColor]);
    const selectQuery = 'SELECT * FROM subjects WHERE id = ? LIMIT 1';
    const [rows] = await client.query(selectQuery, [result.insertId]);
    return rows[0];
}

module.exports.getAllSubjectIds = async function(user_id) {
    const query = 'SELECT id, name FROM subjects WHERE user_id = ?';
    const [rows] = await client.query(query, [user_id]);
    return rows.map(row => row);
}