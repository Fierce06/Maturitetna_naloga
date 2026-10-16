const express = require('express');
const router = express.Router();
const dbSubjects = require('../model/dbSubjects');
const requireAuth = require('../middleware/requireAuth');

router.get('/', requireAuth, async (req, res) => {
    const user_id = req.session.userId; 
    try {
        const subjects = await dbSubjects.getAllSubjects(user_id);
        res.json({ success: true, subjects });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/', requireAuth, async (req, res) => {
    const { name, description, color } = req.body;
    const user_id = req.session.userId; 

    if (!name || !description || !color || !user_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const newSubject = await dbSubjects.insertNewSubject(user_id, name, description, color);
        res.json({ success: true, newSubject });
    } catch (error) {
        console.error('Error creating subject:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;