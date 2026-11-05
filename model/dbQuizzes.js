const client = require('./db');

module.exports.createQuiz = async function(user_id, subject_id, note_id, title) {
    const query = 'INSERT INTO quizzes (user_id, subject_id, note_id, title) VALUES (?, ?, ?, ?)';
    const [rows] = await client.query(query, [user_id, subject_id, note_id, title]);
    return rows;
};

module.exports.createQuizQuestions = async function(quiz_id, question, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation, position) {
    const query = 'INSERT INTO quiz_questions (quiz_id, question, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const [rows] = await client.query(query, [quiz_id, question, answer_a, answer_b, answer_c, answer_d, correct_answer, explanation, position]);
    return rows;
};

module.exports.getQuizzesByUserId = async function(user_id) {
    const query = 'SELECT * FROM quizzes WHERE user_id = ?';
    const [rows] = await client.query(query, [user_id]);
    return rows;
}

module.exports.getQuizAndQuestionsById = async function(quiz_id) {
    const quizQuery = 'SELECT * FROM quizzes WHERE id = ?';
    const questionsQuery = 'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY position ASC';
    const [quizRows] = await client.query(quizQuery, [quiz_id]);
    const [questionRows] = await client.query(questionsQuery, [quiz_id]);
    return { quiz: quizRows[0], questions: questionRows };
}

module.exports.deleteQuiz = async function(quiz_id) {
    const query = 'DELETE FROM quizzes WHERE id = ?';
    const [rows] = await client.query(query, [quiz_id]);
    return rows;
}