const express = require('express');
const router = express.Router();
const dbQuizzes = require('../model/dbQuizzes');
const requireAuth = require('../middleware/requireAuth');
const openRouter = require('../ai/openrouter');
const dbNotebook = require('../model/dbNotebook');

function removeHtmlAndStyles(content) {
    if (typeof content !== 'string') {
        return '';
    }

    return content
        .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<\/?(?:p|div|br|li|h[1-6]|tr)\b[^>]*>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/\r?\n\s*/g, '\n')
        .trim();
}

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
        const newQuestions = await openRouter.generateQuiz({
            topic: removeHtmlAndStyles(topic),
            difficulty,
            questionCount: number_of_questions
        });

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

router.post('/create', requireAuth, async (req, res) => {
    const { note_ids, title, difficulty, number_of_questions } = req.body;
    const user_id = req.session.userId; 

    if (!title || !note_ids || !user_id || !difficulty || !number_of_questions) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        var topic = '';
        var first_subject_id = null;
        for (const note_id of note_ids) {
            const note = await dbNotebook.getNoteById(note_id, user_id);
            if (!note || note.user_id !== user_id) {
                return res.status(403).json({ error: 'You do not have permission to create a quiz for this note' });
            }
            if (first_subject_id === null) {
                first_subject_id = note.subject_id;
            }
            topic += `${removeHtmlAndStyles(note.content)}\n`;
        }

        console.log('Combined topic:', topic);
        console.log('First subject ID:', first_subject_id); 
        console.log('Note IDs:', note_ids);
        // Generate quiz using OpenRouter
        const newQuestions = await openRouter.generateQuiz({ topic, difficulty, questionCount: number_of_questions });

        console.log('Generated questions:', newQuestions);

        // Save the generated quiz to the database
        const newQuiz = await dbQuizzes.createQuiz(user_id, first_subject_id, note_ids[0], title);

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