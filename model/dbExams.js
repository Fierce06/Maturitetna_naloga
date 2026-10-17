const client = require('./db');

module.exports.getAllExams = async function(user_id) {
    const query = 'SELECT * FROM exams WHERE user_id = ?';
    const [rows] = await client.query(query, [user_id]);
    return rows;
};

module.exports.insertNewExam = async function(user_id, subject_id, title, date) {
    const insertQuery = `INSERT INTO exams (user_id, subject_id, title, date) VALUES (?, ?, ?, ?)`;
    const [result] = await client.query(insertQuery, [parseInt(user_id), parseInt(subject_id), title, date]);
    const selectQuery = 'SELECT * FROM exams WHERE id = ? LIMIT 1';
    const [rows] = await client.query(selectQuery, [result.insertId]);
    return rows[0];
}