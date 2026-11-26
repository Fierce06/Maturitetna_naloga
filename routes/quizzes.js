const express = require('express');
const router = express.Router();
const dbQuizzes = require('../model/dbQuizzes');
const requireAuth = require('../middleware/requireAuth');
const openRouter = require('../ai/openrouter');
const dbNotebook = require('../model/dbNotebook');

/**
 * Remove HTML tags and styles from the given content.
 * @param {string} content 
 * @returns {string}
 */
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

/**
 * Get all quizzes for the authenticated user.
 * @returns { success: boolean, quizzes: Array } - List of quizzes for the user.
 */
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

/**
 * Get the quiz history for the authenticated user.
 * @returns { success: boolean, attempts: Array } - List of quiz attempts for the user.
 */
router.get('/history', requireAuth, async (req, res) => {
    try {
        const attempts = await dbQuizzes.getQuizAttemptsByUserId(req.session.userId);
        res.json({ success: true, attempts });
    } catch (error) {
        console.error('Error fetching quiz history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get all questions for a specific quiz by its ID for the authenticated user.
 * @param { number } quiz_id - The ID of the quiz to retrieve questions for.
 * @returns { success: boolean, questions: Array } - List of questions for the specified quiz.
 */
router.get('/questions/:id', requireAuth, async (req, res) => {
    const quiz_id = req.params.id;
    try {
        const questions = await dbQuizzes.getQuizAndQuestionsById(quiz_id);
        res.json({ success: true, questions });
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fetch an owned quiz and its questions for the quiz editor.
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const quiz = await dbQuizzes.getQuizById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }
        if (String(quiz.user_id) !== String(req.session.userId)) {
            return res.status(403).json({ success: false, error: 'You do not have permission to edit this quiz' });
        }
        const result = await dbQuizzes.getQuizAndQuestionsById(req.params.id);
        res.json({ success: true, quiz, questions: result.questions });
    } catch (error) {
        console.error('Error fetching quiz for editing:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update an owned quiz and replace its editable questions.
router.put('/:id', requireAuth, async (req, res) => {
    const { title, questions } = req.body;
    if (typeof title !== 'string' || !title.trim() || title.trim().length > 255 ||
        !Array.isArray(questions) || questions.length < 1 || questions.length > 100) {
        return res.status(400).json({ success: false, error: 'Provide a title and between 1 and 100 questions' });
    }

    const validQuestions = questions.every(question =>
        question && ['question', 'answer_a', 'answer_b', 'answer_c', 'answer_d'].every(field =>
            typeof question[field] === 'string' && question[field].trim()
        ) && ['A', 'B', 'C', 'D'].includes(question.correct_answer) &&
        (question.explanation === undefined || typeof question.explanation === 'string')
    );
    if (!validQuestions) {
        return res.status(400).json({ success: false, error: 'Each question needs text, four answers, and a valid correct answer' });
    }

    try {
        const quiz = await dbQuizzes.getQuizById(req.params.id);
        if (!quiz) {
            return res.status(404).json({ success: false, error: 'Quiz not found' });
        }
        if (String(quiz.user_id) !== String(req.session.userId)) {
            return res.status(403).json({ success: false, error: 'You do not have permission to edit this quiz' });
        }
        const normalizedQuestions = questions.map(question => ({
            ...question,
            question: question.question.trim(),
            answer_a: question.answer_a.trim(),
            answer_b: question.answer_b.trim(),
            answer_c: question.answer_c.trim(),
            answer_d: question.answer_d.trim(),
            explanation: (question.explanation || '').trim()
        }));
        await dbQuizzes.updateQuizAndQuestions(req.params.id, title.trim(), normalizedQuestions);
        res.json({ success: true });
    } catch (error) {
        console.error('Error updating quiz:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * Create a new quiz for the authenticated user based on a specific note.
 * @param { number } note_id - The ID of the note to generate the quiz from.
 * @param { string } title - The title of the quiz.
 */
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
            questionCount: number_of_questions,
            userId: user_id
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

/**
 * Create a new quiz for the authenticated user based on multiple notes.
 * @param { Array<number> } note_ids - The IDs of the notes to generate the quiz from.
 * @param { string } title - The title of the quiz.
 * @param { string } difficulty - The difficulty level of the quiz.
 * @param { number } number_of_questions - The number of questions to generate for the quiz.
 * @returns { success: boolean, newQuiz: Object } - A success flag and the newly created quiz object.
 */
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
        // Generate quiz using OpenRouter
        const newQuestions = await openRouter.generateQuiz({
            topic,
            difficulty,
            questionCount: number_of_questions,
            userId: user_id
        });

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

// Submit quiz result for the authenticated user
// This endpoint allows the user to submit their quiz results, including the quiz ID, score, and total number of questions. The result is stored in the database for future reference.
router.post('/submit', requireAuth, async (req, res) => {
    const { quiz_id, score, total_questions } = req.body;
    const user_id = req.session.userId;

    try {
        await dbQuizzes.submitQuizResult(quiz_id, user_id, score, total_questions);
        res.json({ success: true });
    } catch (error) {
        console.error('Error submitting quiz result:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a quiz by its ID for the authenticated user
// This endpoint allows the user to delete a quiz they created. It checks if the quiz exists and if the user has permission to delete it before proceeding with the deletion.
router.delete('/:id', requireAuth, async (req, res) => {
    const quiz_id = req.params.id;
    const user_id = req.session.userId;

    try {
        const quiz = await dbQuizzes.getQuizById(quiz_id);
        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }
        if (quiz.user_id !== user_id) {
            return res.status(403).json({ error: 'You do not have permission to delete this quiz' });
        }
        await dbQuizzes.deleteQuiz(quiz_id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting quiz:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;