const express = require('express');
const router = express.Router();
const dbNotebook = require('../model/dbNotebook');
const requireAuth = require('../middleware/requireAuth');

router.get('/', requireAuth, async (req, res) => {
    const user_id = req.session.userId;

    try {
        const notebooks =
            await dbNotebook.getAllNotesFromUser(user_id);

        res.json({
            success: true,
            data: notebooks
        });
    } catch (error) {
        console.error('Error fetching notes:', error);

        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

router.get('/:note_id', requireAuth, async (req, res) => {
    const user_id = req.session.userId;
    const note_id = Number(req.params.note_id);

    if (!Number.isInteger(note_id)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid note ID'
        });
    }

    try {
        const note = await dbNotebook.getNoteById(
            note_id,
            user_id
        );

        if (!note) {
            return res.status(404).json({
                success: false,
                error: 'Note not found'
            });
        }

        res.json({
            success: true,
            data: note
        });
    } catch (error) {
        console.error('Error fetching note:', error);

        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

router.post('/', requireAuth, async (req, res) => {
    const user_id = req.session.userId;

    const {
        subject_id,
        title,
        content = ''
    } = req.body;

    if (!subject_id || !title?.trim() || !user_id) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }

    try {
        const newNote = await dbNotebook.insertNewNote(
            user_id,
            Number(subject_id),
            title.trim(),
            content
        );

        res.status(201).json({
            success: true,
            data: newNote
        });
    } catch (error) {
        console.error('Error creating note:', error);

        if (error.code === 'SUBJECT_NOT_FOUND') {
            return res.status(404).json({
                success: false,
                error: 'Subject not found'
            });
        }

        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

router.patch('/:note_id', requireAuth, async (req, res) => {
    const user_id = req.session.userId;
    const note_id = Number(req.params.note_id);

    const {
        title,
        content = '',
        subject_id
    } = req.body;

    if (
        !Number.isInteger(note_id) ||
        !subject_id ||
        !title?.trim()
    ) {
        return res.status(400).json({
            success: false,
            error: 'Missing or invalid fields'
        });
    }

    try {
        const note = await dbNotebook.updateNote(
            note_id,
            user_id,
            title.trim(),
            content,
            Number(subject_id)
        );

        if (!note) {
            return res.status(404).json({
                success: false,
                error: 'Note or subject not found'
            });
        }

        res.json({
            success: true,
            data: note
        });
    } catch (error) {
        console.error('Error updating note:', error);

        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;