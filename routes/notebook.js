const express = require('express');
const router = express.Router();
const dbNotebook = require('../model/dbNotebook');
const requireAuth = require('../middleware/requireAuth');
const openrouter = require('../ai/openrouter');

/**
 * Get all notes for the authenticated user.
 * @returns { success: boolean, data: Array } - List of notes for the user.
 */
router.get('/', requireAuth, async (req, res) => {
    const user_id = req.session.userId;

    try {
        const notebooks = await dbNotebook.getAllNotesFromUser(user_id);

        res.json({ success: true, data: notebooks }); 
    } catch (error) {
        console.error('Error fetching notes:', error);

        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

router.get('/connections', requireAuth, async (req, res) => {
    const user_id = req.session.userId;

    try {
        const noteConnections = await dbNotebook.getNoteConnections(user_id);

        res.json({ success: true, data: noteConnections });
    } catch (error) {
        console.error('Error fetching note connections:', error);

        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Get a specific note by its ID for the authenticated user.
 * @param { number } note_id - The ID of the note to retrieve.
 * @returns { success: boolean, data: Object } - The requested note object.
 */
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
        const note = await dbNotebook.getNoteById( note_id, user_id );

        if (!note) {
            return res.status(404).json({
                success: false,
                error: 'Note not found'
            });
        }

        res.json({  success: true, data: note  });
    } catch (error) {
        console.error('Error fetching note:', error);

        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Create a new note for the authenticated user.
 * @param { number } subject_id - The ID of the subject for the note.
 * @param { string } title - The title of the note.
 * @param { string } content - The content of the note (optional).
 * @returns { success: boolean, data: Object } - The newly created note object.
 */
router.post('/', requireAuth, async (req, res) => {
    const user_id = req.session.userId;

    const { subject_id, title,  content = '' } = req.body;

    if (!subject_id || !title?.trim() || !user_id) {
        return res.status(400).json({
            success: false,
            error: 'Missing required fields'
        });
    }

    try {
        const newNote = await dbNotebook.insertNewNote(  user_id, Number(subject_id), title.trim(), content );

        res.status(201).json({ success: true, data: newNote });
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

/**
 * Generate note connections for the authenticated user based on the provided note content.
 * @param { string } noteContent - The content of the note for which to generate connections.
 * @returns { success: boolean, data: Array } - List of generated note connections.
 */
router.post('/generate-connections', requireAuth, async (req, res) => {
    const user_id = req.session.userId;

    const { noteContent, title, id } = req.body;

    try {
        const sourceId = Number(id);
        if (!Number.isInteger(sourceId) || sourceId <= 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid source note ID"
            });
        }

        const userNotes = await dbNotebook.getAllNotesFromUser(user_id);
        const noteIds = userNotes
            .map(note => Number(note.id))
            .filter(noteId => Number.isInteger(noteId) && noteId !== sourceId);

        const noteDescriptions = userNotes
            .filter(note => Number(note.id) !== sourceId)
            .map(note => ({
                id: Number(note.id),
                title: String(note.title || "Untitled note"),
                description: String(note.short_description || note.content || note.title || "")
                    .replace(/<[^>]*>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim()
                    .slice(0, 500)
            }));

        const connections = await openrouter.generateNoteConnections({
            noteContent,
            userId: user_id,
            noteDescriptions
        });

        const targetIds = (Array.isArray(connections.ids)
            ? connections.ids
            : String(connections.ids || "")
                .split(",")
                .map(value => value.trim())
                .filter(Boolean))
            .map(Number)
            .filter(targetId =>
                Number.isInteger(targetId) &&
                targetId > 0 &&
                targetId !== sourceId &&
                noteIds.includes(targetId)
            );

        const uniqueTargetIds = [...new Set(targetIds)];
        const targetIdString = uniqueTargetIds.join(",");

        await dbNotebook.insertNoteConnection(
            user_id,
            title || "Note connection",
            connections.short_description || "",
            sourceId,
            targetIdString
        );

        res.json({
            success: true,
            data: {
                ids: uniqueTargetIds.join(","),
                short_description: connections.short_description || ""
            }
        });
    } catch (error) {
        console.error('Error generating note connections:', error);

        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * Update an existing note for the authenticated user.
 * @param { number } note_id - The ID of the note to update.
 * @param { number } subject_id - The ID of the subject for the note.
 * @param { string } title - The title of the note.
 * @param { string } content - The content of the note (optional).
 * @returns { success: boolean, data: Object } - The updated note object.
 */
router.patch('/:note_id', requireAuth, async (req, res) => {
    const user_id = req.session.userId;
    const note_id = Number(req.params.note_id);

    const {  title,  content = '', subject_id } = req.body;

    if (!Number.isInteger(note_id) || !subject_id || !title?.trim()) {
        return res.status(400).json({
            success: false,
            error: 'Missing or invalid fields'
        });
    }

    try {
        const note = await dbNotebook.updateNote( note_id, user_id, title.trim(), content, Number(subject_id) );

        if (!note) {
            return res.status(404).json({
                success: false,
                error: 'Note or subject not found'
            });
        }

        res.json({ success: true, data: note  });
    } catch (error) {
        console.error('Error updating note:', error);

        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

module.exports = router;