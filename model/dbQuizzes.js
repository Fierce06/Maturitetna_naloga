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