const client = require('./db');

module.exports.getQuizById = async function(quiz_id) {
    const query = 'SELECT * FROM quizzes WHERE id = ?';
    const [rows] = await client.query(query, [quiz_id]);
    return rows[0];
}

/**
 * Create a new quiz.
 * @param {number} user_id 
 * @param {number} subject_id 
 * @param {number} note_id 
 * @param {string} title 
 * @returns 
 */
module.exports.createQuiz = async function(user_id, subject_id, note_id, title) {
    const query = 'INSERT INTO quizzes (user_id, subject_id, note_id, title) VALUES (?, ?, ?, ?)';
    const [rows] = await client.query(query, [user_id, subject_id, note_id, title]);
    return rows;
};

/**
 * Create a new quiz question.
 * @param {number} quiz_id 
 * @param {string} question 
 * @param {string} answer_a 
 * @param {string} answer_b 
 * @param {string} answer_c 
 * @param {string} answer_d 
 * @param {string} correct_answer 
 * @param {string} explanation 
 * @param {number} position 
 * @returns 
 */
module.exports.createQuizQuestions = async function(quiz_id, question, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation, position) {
    const query = 'INSERT INTO quiz_questions (quiz_id, question, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [rows] = await client.query(query, [quiz_id, question, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation, position]);
    return rows;
};

/**
 * Get all quizzes for a user.
 * @param {number} user_id 
 * @returns 
 */
module.exports.getQuizzesByUserId = async function(user_id) {
    const query = `SELECT q.*, COUNT(qq.id) AS question_count
                   FROM quizzes q
                   LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
                   WHERE q.user_id = ?
                   GROUP BY q.id`;
    const [rows] = await client.query(query, [user_id]);
    return rows;
}

/**
 * Get a quiz and its questions by ID.
 * @param {number} quiz_id 
 * @returns 
 */
module.exports.getQuizAndQuestionsById = async function(quiz_id) {
    const questionsQuery = 'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY position ASC';
    const [questionRows] = await client.query(questionsQuery, [quiz_id]);
    return { questions: questionRows };
}

module.exports.updateQuizAndQuestions = async function(quiz_id, title, questions) {
    const connection = await client.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE quizzes SET title = ? WHERE id = ?', [title, quiz_id]);
        await connection.query('DELETE FROM quiz_questions WHERE quiz_id = ?', [quiz_id]);
        for (const [index, question] of questions.entries()) {
            await connection.query(
                'INSERT INTO quiz_questions (quiz_id, question, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [quiz_id, question.question, question.answer_a, question.answer_b, question.answer_c, question.answer_d, question.correct_answer, question.explanation, index + 1]
            );
        }
        await connection.commit();
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

/**
 * Delete a quiz.
 * @param {number} quiz_id 
 * @returns 
 */
module.exports.deleteQuiz = async function(quiz_id) {
    const query = 'DELETE FROM quizzes WHERE id = ?';
    const [rows] = await client.query(query, [quiz_id]);
    return rows;
}

module.exports.submitQuizResult = async function(quiz_id, user_id, score, total_questions) {
    const query = 'INSERT INTO quiz_attempts (quiz_id, user_id, score, total_questions) VALUES (?, ?, ?, ?)';
    const [rows] = await client.query(query, [quiz_id, user_id, score, total_questions]);
    return rows;
}

/**
 * Get recent quiz attempts for a user.
 * @param {number} user_id
 * @returns
 */
module.exports.getQuizAttemptsByUserId = async function(user_id) {
    const query = `SELECT qa.id, qa.quiz_id, qa.score, qa.total_questions,
                          qa.completed_at, q.title, q.subject_id,
                          s.name AS subject_name, s.color AS subject_color
                   FROM quiz_attempts qa
                   JOIN quizzes q ON q.id = qa.quiz_id
                   JOIN subjects s ON s.id = q.subject_id
                   WHERE qa.user_id = ?
                   ORDER BY qa.completed_at DESC
                   LIMIT 50`;
    const [rows] = await client.query(query, [user_id]);
    return rows;
}

/**
 * Delete a quiz and its associated questions.
 * @param {number} quiz_id 
 * @returns 
 */
module.exports.deleteQuiz = async function(quiz_id) {
    const deleteQuestionsQuery = `DELETE FROM quiz_questions WHERE quiz_id = ?`;
    await client.query(deleteQuestionsQuery, [quiz_id]);
    const query = `DELETE FROM quizzes WHERE id = ?`;
    const [rows] = await client.query(query, [quiz_id]);
    return rows;
}

/* =====================================================
     QUIZ BATTLES
=====================================================*/

/**
 * Get a quiz battle by its ID.
 * @param {*} battle_id 
 * @returns 
 */
module.exports.getQuizBattleById = async function(battle_id) {
    const query = `SELECT q.*, u.username AS challenger_username, u.id AS challenger_id, u2.username AS opponent_username, u2.id AS opponent_id
                   FROM quiz_battles q
                   JOIN users u ON u.id = q.challenger_id
                   JOIN users u2 ON u2.id = q.opponent_id
                   WHERE q.id = ?`;
    const [rows] = await client.query(query, [battle_id]);
    return rows[0];
}

/**
 * Create a new quiz battle request.
 * @param {*} sender_id 
 * @param {*} receiver_id 
 * @param {*} quiz_id 
 * @returns 
 */
module.exports.createNewBattleRequest = async function(sender_id, receiver_id, quiz_id) {
    const query = 'INSERT INTO quiz_battles (challenger_id, opponent_id, quiz_id, status) VALUES (?, ?, ?, ?)';
    const [rows] = await client.query(query, [sender_id, receiver_id, quiz_id, 'pending']);
    return rows;
}

/**
 * Get pending battle requests for a user.
 * @param {*} user_id 
 * @returns 
 */
module.exports.getPendingBattleRequests = async function(user_id) {
    const query = `SELECT q.*, u.username AS opponent_username, u.id AS opponent_id, qt.title AS quiz_title
                    FROM quiz_battles q JOIN users u ON u.id = q.challenger_id
                    JOIN quizzes qt ON qt.id = q.quiz_id
                     WHERE opponent_id = ? AND status = ?`;
    const [rows] = await client.query(query, [user_id, 'pending']);
    return rows;
}

/**
 * Update the status of a battle request.
 * @param {*} battle_id 
 * @param {*} status 
 * @returns 
 */
module.exports.updateBattleRequestStatus = async function(battle_id, status) {
    const query = 'UPDATE quiz_battles SET status = ? WHERE id = ?';
    const [rows] = await client.query(query, [status, battle_id]);
    return rows;
}

/**
 * Update the result of a battle.
 * @param {*} battle_id 
 * @param {*} score
 * @param {*} user_id
 * @returns 
 */
module.exports.updateBattleResult = async function(battle_id, score, user_id) {
    const getBattleQuery = 'SELECT challenger_id, opponent_id FROM quiz_battles WHERE id = ?';
    const [battleRows] = await client.query(getBattleQuery, [battle_id]);
    const battle = battleRows[0];

    if (!battle) {
        throw new Error('Battle not found');
    }

    if (Number(battle.challenger_id) === Number(user_id)) {
        const updateQuery = 'UPDATE quiz_battles SET challenger_score = ? WHERE id = ?';
        const [rows] = await client.query(updateQuery, [score, battle_id]);
    } else if (Number(battle.opponent_id) === Number(user_id)) {
        const updateQuery = 'UPDATE quiz_battles SET opponent_score = ? WHERE id = ?';
        const [rows] = await client.query(updateQuery, [score, battle_id]);
    } else {
        throw new Error('User is not part of this battle');
    }

    const getUpdatedBattleQuery = 'SELECT * FROM quiz_battles WHERE id = ?';
    const [updatedBattleRows] = await client.query(getUpdatedBattleQuery, [battle_id]);
    
    if (updatedBattleRows[0].challenger_score !== null && updatedBattleRows[0].opponent_score !== null) {
        let query = 'UPDATE quiz_battles SET status = ? WHERE id = ?';
        const [rows] = await client.query(query, ['finished', battle_id]);
        
        const getFinalBattleQuery = `SELECT q.*, u.username AS challenger_username, u.id AS challenger_id, u2.username AS opponent_username, u2.id AS opponent_id
                   FROM quiz_battles q
                   JOIN users u ON u.id = q.challenger_id
                   JOIN users u2 ON u2.id = q.opponent_id
                   WHERE q.id = ?`;
        const [finalBattleRows] = await client.query(getFinalBattleQuery, [battle_id]);
        return finalBattleRows[0];
    }

    return updatedBattleRows[0];
}

/**
 * Get the quiz questions for the challenger in a battle.
 * @param {*} battle_id 
 * @returns 
 */
module.exports.getChallangerQuizQuestions = async function(battle_id) {
    const query = `SELECT qq.*
                   FROM quiz_battles qb
                     JOIN quizzes q ON qb.quiz_id = q.id
                        JOIN quiz_questions qq ON q.id = qq.quiz_id
                     WHERE qb.id = ?`;
    const [rows] = await client.query(query, [battle_id]);
    return rows;
}

module.exports.getUserHistoryOfBattles = async function(user_id) {
    const query = `SELECT qb.*, u.username AS challenger_username, u2.username AS opponent_username, qt.title AS quiz_title
                   FROM quiz_battles qb
                   JOIN users u ON u.id = qb.challenger_id
                    JOIN users u2 ON u2.id = qb.opponent_id
                    JOIN quizzes qt ON qt.id = qb.quiz_id
                    WHERE qb.challenger_id = ? OR qb.opponent_id = ?
                     ORDER BY qb.created_at DESC`;
    const [rows] = await client.query(query, [user_id, user_id]);
    return rows;
}