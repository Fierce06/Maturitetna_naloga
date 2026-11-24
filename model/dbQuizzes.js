const client = require('./db');

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

/* =====================================================
     QUIZ BATTLES
=====================================================*/

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
    const query = 'SELECT * FROM quiz_battles WHERE opponent_id = ? AND status = ?';
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
 * @param {*} challenger_score 
 * @param {*} opponent_score 
 * @param {*} status 
 * @returns 
 */
module.exports.updateBattleResult = async function(battle_id, challenger_score, opponent_score, status) {
    const query = 'UPDATE quiz_battles SET challenger_score = ?, opponent_score = ?, status = ? WHERE id = ?';
    const [rows] = await client.query(query, [challenger_score, opponent_score, status, battle_id]);
    return rows;
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