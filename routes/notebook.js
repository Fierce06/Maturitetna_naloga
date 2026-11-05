const express = require('express');
const router = express.Router();
const dbNotebook = require('../model/dbNotebook');
const requireAuth = require('../middleware/requireAuth');

router.get('/', requireAuth, async (req, res) => {
    const user_id = req.session.userId; 
    try {
        const notebooks = await dbNotebook.getAllNotesFromUser(user_id);
        res.json({ success: true, data: notebooks });
    } catch (error) {
        console.error('Error fetching notes from user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/:note_id', requireAuth, async (req, res) => {
    const note_id = req.params.note_id; 
    try {
        const note = await dbNotebook.getNoteById(note_id);
        res.json({ success: true, data: note });
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', requireAuth, async (req, res) => {
    const { subject_id, title, content } = req.body;
    const user_id = req.session.userId; 

    if (!subject_id || !title || !content || !user_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const newNote = await dbNotebook.insertNewNote(user_id, subject_id, title, content);
        res.json({ success: true, data: newNote });
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/:note_id', requireAuth, async (req, res) => {
    const { title, content, subject_id } = req.body;
    const note_id = req.params.note_id;

    if (!title || !content || !note_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    if (!subject_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const note = await dbNotebook.updateNote(note_id, title, content, subject_id);
        res.json({ success: true, data: note });
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;