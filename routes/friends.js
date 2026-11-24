const express = require('express');
const router = express.Router();
const dbFriends = require('../model/dbFriends');
const requireAuth = require('../middleware/requireAuth');

const onlineUsers = global.onlineUsers;

/**
 * Get all friends for the authenticated user.
 * @returns { success: boolean, friends: Array } - List of friends for the user.
 */
router.get('/all-friends', requireAuth, async (req, res) => {
    const user_id = req.session.userId; 
    try {
        const friends = await dbFriends.getAllFriends(user_id);
        res.json({ success: true, friends });
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Search for users by username.
 * @param { string } username - The username to search for.
 * @returns { success: boolean, users: Array } - List of users matching the search criteria.
 */
router.get('/search', requireAuth, async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ error: 'Missing username query parameter' });
    }

    try {
        const users = await dbFriends.searchByUsername(username);   
        res.json({ success: true, users });
    } catch (error) {
        console.error('Error searching users:', error); 
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * Get the presence status of all users.
 * @returns { success: boolean, onlineIds: Array } - List of user IDs that are currently online.
 */
router.get('/presence', requireAuth, (req, res) => {
    res.json({
        success: true,
        onlineIds: Array.from(onlineUsers, userId => Number(userId))
    });
});

/**
 * Add the authenticated user to the online users Set.
 * This route is useful after reconnecting or refreshing the page.
 */
router.post('/presence/heartbeat', requireAuth, (req, res) => {
    onlineUsers.add(String(req.session.userId));
    res.json({ success: true });
});

/**
 * Remove the authenticated user from the online users Set.
 * This route is called when the user leaves the page.
 */
router.post('/presence/leave', requireAuth, (req, res) => {
    onlineUsers.delete(String(req.session.userId));
    res.json({ success: true });
});

/**
 * Add a friend for the authenticated user.
 * @param { number } friend_id - The ID of the friend to add.
 * @returns { success: boolean, friend: Object } - The newly added friend object.
 */
router.post('/add-friend/:friend_id', requireAuth, async (req, res) => {
    const user_id = req.session.userId; 
    const friend_id = req.params.friend_id; 

    if (!user_id || !friend_id) {
        return res.status(400).json({ error: 'Missing required fields' });  
    }

    try {
        const friend = await dbFriends.addFriend(user_id, friend_id);
        res.json({ success: true, friend });
    } catch (error) {
        console.error('Error adding friend:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.delete('/remove-friend/:friend_id', requireAuth, async (req, res) => {
    const user_id = req.session.userId; 
    const friend_id = req.params.friend_id;

    if (!user_id || !friend_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        await dbFriends.removeFriend(user_id, friend_id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error removing friend:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;