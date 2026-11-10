const express = require('express');
const router = express.Router();

const dbPracticeExams =
    require('../model/dbPracticeExams');

const requireAuth =
    require('../middleware/requireAuth');

router.get('/', requireAuth, async (req, res) => {
    const user_id = req.session.userId;

    try {
        const exams =
            await dbPracticeExams.getAllPracticeExams(user_id);

        res.json({
            success: true,
            exams
        });
    } catch (error) {
        console.error(
            'Error fetching practice exams:',
            error
        );

        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

router.post('/', requireAuth, async (req, res) => {
    const user_id = req.session.userId;
    const { title, note_ids } = req.body;

    if (
        !title?.trim() ||
        !Array.isArray(note_ids) ||
        note_ids.length === 0
    ) {
        return res.status(400).json({
            success: false,
            error: 'Enter a title and select at least one note'
        });
    }

    if (title.trim().length > 255) {
        return res.status(400).json({
            success: false,
            error: 'The title is too long'
        });
    }

    try {
        const exam =
            await dbPracticeExams.createPracticeExam(
                user_id,
                title.trim(),
                note_ids
            );

        res.status(201).json({
            success: true,
            exam
        });
    } catch (error) {
        console.error(
            'Error creating practice exam:',
            error
        );

        if (error.code === 'INVALID_NOTES') {
            return res.status(400).json({
                success: false,
                error: 'One or more selected notes are invalid'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;