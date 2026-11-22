const client = require('./db');

/**
 * Get all notes from a user.
 * @param {number} user_id 
 * @returns 
 */
module.exports.getAllNotesFromUser = async function (user_id) {
    const query = `
        SELECT
            notes.id,
            notes.subject_id,
            notes.title,
            notes.content,
            notes.created_at,
            notes.updated_at,
            subjects.name AS subject_name,
            subjects.color AS subject_color
        FROM notes
        INNER JOIN subjects
            ON subjects.id = notes.subject_id
        WHERE subjects.user_id = ?
        ORDER BY subjects.name, notes.title
    `;

    const [rows] = await client.query(query, [user_id]);
    return rows;
};

/**
 * Get a note by its ID and user ID.
 * @param {number} note_id 
 * @param {number} user_id 
 * @returns 
 */
module.exports.getNoteById = async function (note_id, user_id) {
    const query = `
        SELECT
            notes.*,
            subjects.name AS subject_name,
            subjects.color AS subject_color
        FROM notes
        INNER JOIN subjects
            ON subjects.id = notes.subject_id
        WHERE notes.id = ?
          AND subjects.user_id = ?
        LIMIT 1
    `;

    const [rows] = await client.query(query, [note_id, user_id]);
    return rows[0];
};

/**
 * Insert a new note.
 * @param {number} user_id
 * @param {number} subject_id
 * @param {string} title
 * @param {string} content
 * @returns
 */
module.exports.insertNewNote = async function (user_id, subject_id, title, content) {
    const [subjects] = await client.query(
        `SELECT id
         FROM subjects
         WHERE id = ? AND user_id = ?
         LIMIT 1`,
        [subject_id, user_id]
    );

    if (subjects.length === 0) {
        const error = new Error('Subject not found');
        error.code = 'SUBJECT_NOT_FOUND';
        throw error;
    }

    const insertQuery = `
        INSERT INTO notes (user_id, subject_id, title, content)
        VALUES (?, ?, ?, ?)
    `;

    const [result] = await client.query(insertQuery, [
        user_id,
        subject_id,
        title,
        content
    ]);

    const [rows] = await client.query(
        `SELECT * FROM notes WHERE id = ? LIMIT 1`,
        [result.insertId]
    );

    return rows[0];
};

/**
 * Update a note.
 * @param {number} note_id
 * @param {number} user_id
 * @param {string} title
 * @param {string} content
 * @param {number} subject_id
 * @returns
 */
module.exports.updateNote = async function (note_id,  user_id,  title,  content, subject_id ) {
    const [subjects] = await client.query(
        `SELECT id
         FROM subjects
         WHERE id = ? AND user_id = ?
         LIMIT 1`,
        [subject_id, user_id]
    );

    if (subjects.length === 0) {
        return null;
    }

    const updateQuery = `
        UPDATE notes
        INNER JOIN subjects
            ON subjects.id = notes.subject_id
        SET
            notes.title = ?,
            notes.content = ?,
            notes.subject_id = ?
        WHERE notes.id = ?
          AND subjects.user_id = ?
    `;

    const [result] = await client.query(updateQuery, [
        title,
        content,
        subject_id,
        note_id,
        user_id
    ]);

    if (result.affectedRows === 0) {
        return null;
    }

    const [rows] = await client.query(
        `SELECT * FROM notes WHERE id = ? LIMIT 1`,
        [note_id]
    );

    return rows[0];
};

module.exports.getNoteConnections = async function (user_id) {
    const query = `SELECT * FROM note_connections WHERE user_id = ?`
    const [rows] = await client.query(query, [user_id]);
    return rows;
}

module.exports.getNoteConnectionsForUser = async function (user_id) {
    const query = `
        SELECT nc.*, source_note.title AS source_title
        FROM note_connections nc
        INNER JOIN notes source_note
            ON source_note.id = nc.source_note_id
        WHERE nc.user_id = ?
        ORDER BY nc.id DESC
    `;
    const [rows] = await client.query(query, [user_id]);
    return rows;
}

module.exports.insertNoteConnection = async function (user_id, title, description, source_note_id, target_note_id) {
    await client.query(
        `DELETE FROM note_connections WHERE user_id = ? AND source_note_id = ?`,
        [user_id, source_note_id]
    );

    const query = `INSERT INTO note_connections (user_id, title, short_description, source_note_id, target_note_id) VALUES (?, ?, ?, ?, ?)`;
    const [result] = await client.query(
        query,
        [user_id, title, description, source_note_id, target_note_id]
    );
    return result.insertId;
}