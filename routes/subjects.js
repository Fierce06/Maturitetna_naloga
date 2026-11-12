const express = require('express');
const router = express.Router();
const dbSubjects = require('../model/dbSubjects');
const requireAuth = require('../middleware/requireAuth');

/**
 * Get all subjects for the authenticated user.
 * @returns { success: boolean, subjects: Array } - List of subjects for the user.
 */
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

/**
 * Get all subject IDs for the authenticated user.
 * @returns { success: boolean, subjectIds: Array } - List of subject IDs for the user.
 */
router.get('/subjectIds', requireAuth, async (req, res) => {
    const user_id = req.session.userId; 
    try {
        const subjectIds = await dbSubjects.getAllSubjectIds(user_id);
        res.json({ success: true, subjectIds });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Create a new subject for the authenticated user.
 * @param { string } name - The name of the subject.
 * @param { string } description - The description of the subject.
 * @param { string } color - The color associated with the subject.
 * @returns { success: boolean, newSubject: Object } - A success flag and the newly created subject object.
 * @param { string } icon - The icon associated with the subject.
 */
router.post('/', requireAuth, async (req, res) => {
    const { name, description, color, icon } = req.body;
    const user_id = req.session.userId; 

    if (!name || !color || !user_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!icon) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const newSubject = await dbSubjects.insertNewSubject(user_id, name, description, color, icon);
        res.json({ success: true, newSubject });
    } catch (error) {
        console.error('Error creating subject:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.patch('/:id', requireAuth, async (req, res) => {
    const { name, description, color, icon } = req.body;
    const user_id = req.session.userId; 
    const subjectId = req.params.id;

    if (!name || !color || !user_id || !subjectId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!icon) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const newSubject = await dbSubjects.editSubject(user_id, subjectId, name, description, color, icon);
        res.json({ success: true, newSubject });
    } catch (error) {
        console.error('Error creating subject:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;