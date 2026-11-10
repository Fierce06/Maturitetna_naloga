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
    const query = `SELECT q.*, COUNT(qq.id) AS question_count
                   FROM quizzes q
                   LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
                   WHERE q.user_id = ?
                   GROUP BY q.id`;
    const [rows] = await client.query(query, [user_id]);
    return rows;
}

module.exports.getQuizAndQuestionsById = async function(quiz_id) {
    const questionsQuery = 'SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY position ASC';
    const [questionRows] = await client.query(questionsQuery, [quiz_id]);
    return { questions: questionRows };
}

module.exports.deleteQuiz = async function(quiz_id) {
    const query = 'DELETE FROM quizzes WHERE id = ?';
    const [rows] = await client.query(query, [quiz_id]);
    return rows;
}