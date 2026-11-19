const express = require('express');
const router = express.Router();
const dbExams = require('../model/dbExams');
const requireAuth = require('../middleware/requireAuth');

/**
 * Get all exams for the authenticated user.
 * @returns { success: boolean, exams: Array } - List of exams for the user.
 */
router.get('/', requireAuth, async (req, res) => {
    const user_id = req.session.userId; 
    try {
        const exams = await dbExams.getAllExams(user_id);
        res.json({ success: true, exams });
    } catch (error) {
        console.error('Error fetching exams:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Create a new exam for the authenticated user.
 * @param { number } subject_id - The ID of the subject for the exam.
 * @param { string } title - The title of the exam.
 * @param { string } date - The date of the exam in YYYY-MM-DD format.
 * @returns { success: boolean, newExam: Object } - The newly created exam object.
 */
router.post('/', requireAuth, async (req, res) => {
    const { subject_id, title, date } = req.body;
    const user_id = req.session.userId; 

    if (!subject_id || !title || !user_id || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const newExam = await dbExams.insertNewExam(user_id, subject_id, title, date);
        res.json({ success: true, newExam });
    } catch (error) {
        console.error('Error creating exam:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Update an existing exam for the authenticated user.
 * @param { number } id - The ID of the exam to update.
 * @param { string } title - The new title of the exam.
 * @param { string } date - The new date of the exam in YYYY-MM-DD format.
 * @returns { success: boolean, updatedExam: Object } - The updated exam object.
 */
router.put('/:id', requireAuth, async (req, res) => {
    const examId = req.params.id;
    const { title, date } = req.body;

    if (!title || !date) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const updatedExam = await dbExams.updateExam(examId, title, date);
        res.json({ success: true, updatedExam });
    } catch (error) {
        console.error('Error updating exam:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Delete an existing exam for the authenticated user.
 * @param { number } id - The ID of the exam to delete.
 * @returns { success: boolean } - Indicates whether the deletion was successful.
 */
router.delete('/:id', requireAuth, async (req, res) => {
    const examId = req.params.id;
    
    try {
        await dbExams.deleteExam(examId);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting exam:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;