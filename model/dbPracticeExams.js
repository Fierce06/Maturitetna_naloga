const client = require('./db');

module.exports.getAllPracticeExams = async function (user_id) {
    const query = `
        SELECT
            practice_exams.id,
            practice_exams.title,
            practice_exams.created_at,
            COUNT(practice_exam_notes.note_id) AS note_count,

            GROUP_CONCAT(
                DISTINCT notes.title
                ORDER BY notes.title
                SEPARATOR '||'
            ) AS note_titles,

            GROUP_CONCAT(
                DISTINCT subjects.name
                ORDER BY subjects.name
                SEPARATOR '||'
            ) AS subject_names

        FROM practice_exams

        LEFT JOIN practice_exam_notes
            ON practice_exam_notes.practice_exam_id =
               practice_exams.id

        LEFT JOIN notes
            ON notes.id = practice_exam_notes.note_id

        LEFT JOIN subjects
            ON subjects.id = notes.subject_id

        WHERE practice_exams.user_id = ?

        GROUP BY
            practice_exams.id,
            practice_exams.title,
            practice_exams.created_at

        ORDER BY practice_exams.created_at DESC
    `;

    const [rows] = await client.query(query, [user_id]);
    return rows;
};

module.exports.createPracticeExam = async function (
    user_id,
    title,
    note_ids
) {
    const uniqueNoteIds = [
        ...new Set(
            note_ids
                .map(Number)
                .filter(Number.isInteger)
        )
    ];

    const connection = await client.getConnection();

    try {
        await connection.beginTransaction();

        const placeholders =
            uniqueNoteIds.map(() => '?').join(', ');

        const verificationQuery = `
            SELECT notes.id
            FROM notes
            INNER JOIN subjects
                ON subjects.id = notes.subject_id
            WHERE subjects.user_id = ?
              AND notes.id IN (${placeholders})
        `;

        const [ownedNotes] = await connection.query(
            verificationQuery,
            [user_id, ...uniqueNoteIds]
        );

        if (ownedNotes.length !== uniqueNoteIds.length) {
            const error = new Error(
                'One or more notes are invalid'
            );

            error.code = 'INVALID_NOTES';
            throw error;
        }

        const [examResult] = await connection.query(
            `INSERT INTO practice_exams (user_id, title)
             VALUES (?, ?)`,
            [user_id, title]
        );

        const practiceExamId = examResult.insertId;

        const valuesSql = uniqueNoteIds
            .map(() => '(?, ?)')
            .join(', ');

        const values = uniqueNoteIds.flatMap(noteId => [
            practiceExamId,
            noteId
        ]);

        await connection.query(
            `INSERT INTO practice_exam_notes
                (practice_exam_id, note_id)
             VALUES ${valuesSql}`,
            values
        );

        await connection.commit();

        return {
            id: practiceExamId,
            title,
            note_ids: uniqueNoteIds
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};