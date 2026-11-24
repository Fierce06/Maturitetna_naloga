const express = require('express');
const router = express.Router();
const dbQuizzes = require('../model/dbQuizzes');
const requireAuth = require('../middleware/requireAuth');

/**
 * Get all incoming battle requests for the authenticated user.
 * @returns { success: boolean, incomingBattles: Array } - List of incoming battle requests.
 */
router.get('/incoming', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    try {
        const incomingBattles = await dbQuizzes.getPendingBattleRequests(userId);
        res.json({ success: true, incomingBattles });
    } catch (error) {
        console.error('Error fetching incoming battles:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get the quiz questions for the challenger in a battle.
 * @param { number } battleId - The ID of the battle.
 * @returns { success: boolean, quizQuestions: Array } - List of quiz questions for the challenger.
 */
router.get('/challanger-quiz/:battleId', requireAuth, async (req, res) => {
    const battleId = req.params.battleId;

    try {
        const quizQuestions = await dbQuizzes.getChallengerQuizQuestions(battleId);
        res.json({ success: true, quizQuestions });
    } catch (error) {
        console.error('Error fetching challenger quiz questions:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get all outgoing battle requests for the authenticated user.
 * @returns { success: boolean, outgoingBattles: Array } - List of outgoing battle requests.
 */
router.post('/request', requireAuth, async (req, res) => {
    const { receiver_id, quiz_id } = req.body;
    const sender_id = req.session.userId;

    if (!receiver_id || !quiz_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await dbQuizzes.createNewBattleRequest(sender_id, receiver_id, quiz_id);
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error creating battle request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Accept a battle request for the authenticated user.
 * @param { number } id - The ID of the battle request to accept.
 * @returns { success: boolean, result: Object } - Result of the operation.
 */
router.post('/:id/accept', requireAuth, async (req, res) => {

    const battleId = req.params.id;
    const userId = req.session.userId;

    try {
        const result = await dbQuizzes.updateBattleRequestStatus(battleId, 'accepted');
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error accepting battle request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }

});

/**
 * Decline a battle request for the authenticated user.
 * @param { number } id - The ID of the battle request to decline.
 * @returns { success: boolean, result: Object } - Result of the operation.
 */
router.post('/:id/decline', requireAuth, async (req, res) => {
    const battleId = req.params.id;
    const userId = req.session.userId;

    try {
        const result = await dbQuizzes.updateBattleRequestStatus(battleId, 'declined');
        res.json({ success: true, result });
    } catch (error) {
        console.error('Error declining battle request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;