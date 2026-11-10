const express = require('express');
const router = express.Router();
const dbQuizzes = require('../model/dbQuizzes');
const requireAuth = require('../middleware/requireAuth');
const openRouter = require('../ai/openrouter');

router.get('/', requireAuth, async (req, res) => {
    const user_id = req.session.userId; 
    try {
        const quizzes = await dbQuizzes.getQuizzesByUserId(user_id);
        res.json({ success: true, quizzes });
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/questions/:id', requireAuth, async (req, res) => {
    const quiz_id = req.params.id;
    try {
        const questions = await dbQuizzes.getQuizAndQuestionsById(quiz_id);
        console.log(questions);
        res.json({ success: true, questions });
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// router.get('/subjectIds', requireAuth, async (req, res) => {
//     const user_id = req.session.userId; 
//     try {
//         const subjectIds = await dbQuizzes.getAllSubjectIds(user_id);
//         res.json({ success: true, subjectIds });
//     } catch (error) {
//         console.error('Error fetching subjects:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

router.post('/', requireAuth, async (req, res) => {
    const { subject_id, note_id, title, topic, difficulty, number_of_questions } = req.body;
    const user_id = req.session.userId; 

    if (!title || !subject_id || !note_id || !user_id || !topic || !difficulty || !number_of_questions) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Generate quiz using OpenRouter
        const newQuestions = await openRouter.generateQuiz({ topic, difficulty, questionCount: number_of_questions });

        // Save the generated quiz to the database
        const newQuiz = await dbQuizzes.createQuiz(user_id, subject_id, note_id, title);

        // Save each question of the quiz to the database
        for (const question of newQuestions.questions) {
            await dbQuizzes.createQuizQuestions(newQuiz.insertId, question.question, question.options[0], question.options[1], question.options[2], question.options[3], question.correctAnswer, question.explanation, newQuestions.questions.indexOf(question) + 1);
        }
        res.json({ success: true, newQuiz });
    } catch (error) {
        console.error('Error creating quiz:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;