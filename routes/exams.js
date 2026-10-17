const express = require('express');
const router = express.Router();
const dbExams = require('../model/dbExams');
const requireAuth = require('../middleware/requireAuth');

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

module.exports = router;