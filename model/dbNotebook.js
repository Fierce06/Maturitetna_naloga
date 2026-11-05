const client = require('./db');

module.exports.getAllNotesFromUser = async function(user_id) {
    const query = 'SELECT * FROM notes WHERE user_id = ?';
    const [rows] = await client.query(query, [user_id]);
    return rows;
};

module.exports.getNoteById = async function(note_id) {
    const query = 'SELECT * FROM notes WHERE id = ?';
    const [rows] = await client.query(query, [note_id]);
    return rows;
};

module.exports.insertNewNote = async function(user_id, subject_id, title, content) {
    const insertQuery = `INSERT INTO notes (user_id, subject_id, title, content, subject_id) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await client.query(insertQuery, [parseInt(user_id), parseInt(subject_id), title, content, parseInt(subject_id)]);
    const selectQuery = 'SELECT * FROM notes WHERE id = ? LIMIT 1';
    const [rows] = await client.query(selectQuery, [result.insertId]);
    return rows[0];
}

module.exports.updateNote = async function(note_id, title, content, subject_id) {
    const updateQuery = `UPDATE notes SET title = ?, content = ?, subject_id = ? WHERE id = ?`;
    await client.query(updateQuery, [title, content, parseInt(subject_id), parseInt(note_id)]);
    const selectQuery = 'SELECT * FROM notes WHERE id = ? LIMIT 1';
    const [rows] = await client.query(selectQuery, [note_id]);
    return rows[0];
}