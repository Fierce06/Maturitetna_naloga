const express = require('express');
const router = express.Router();
const dbUsers = require('../model/dbUsers');
const bcrypt = require('bcrypt');
const requireAuth = require('../middleware/requireAuth');

const DUMMY_BCRYPT_HASH = bcrypt.hashSync((process.env.APP_SECRET || '') + 'dummy', 10);

function hashPassword(password) {
    return bcrypt.hash((process.env.APP_SECRET || '') + password, 10);
}

/**
 * Register a new user.
 * @route POST /register
 * @param {string} username - The username of the new user.
 */
router.post('/register', async (req, res) => {
    const { username, email, password, passwordConfirm } = req.body;
    console.log('Creating user:', username, email); 

    if (!username || !email || !password || !passwordConfirm) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Check if the password and password confirmation match
    if (password !== passwordConfirm) {
        return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }

    // Check if the password meets the minimum length requirement
    if (password.length < 10) {
        return res.status(400).json({ success: false, error: 'Password must be at least 10 characters long!' });
    }

    try {
        // Hash the password before storing it
        const passwordHash = await hashPassword(password);

        await dbUsers.createUser(username, email, passwordHash);
        res.json({ success: true });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
            return res.status(409).json({ success: false, error: 'User with this username already exists!' });
        }

        console.error(err);
        res.status(500).json({ success: false, error: 'Error creating user' });
    }
});

/**
 * Login a user.
 * @route POST /login
 * @param {string} username - The username of the user.
 * @param {string} password - The password of the user.
 * @returns {object} - JSON object indicating success or failure.
 */
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    try {
        const user = await dbUsers.getAdminByUsername(username);

        // If the user does not exist, perform a dummy bcrypt comparison to mitigate timing attacks
        if (!user) {
            await bcrypt.compare((process.env.APP_SECRET || '') + password, DUMMY_BCRYPT_HASH);
            return res.status(400).json({ success: false, error: 'Invalid username or password' });
        }

        // If the user exists, check for failed attempts and lockout
        const consecutiveFailedAttempts = parseInt(user.consecutive_failed_attempts, 10) + 1;
        // Store the original consecutive failed attempts before any updates
        const consecutiveFailedAttemptsNotChanged = parseInt(user.consecutive_failed_attempts, 10);
        // Store the original failed attempts before any updates
        let failedAttempts = parseInt(user.failed_attempts, 10);

        // Check if the account is locked
        if (user.locked_until && user.locked_until > new Date()) {
            const hours = String(user.locked_until.getHours()).padStart(2, '0');
            const minutes = String(user.locked_until.getMinutes()).padStart(2, '0');
            // Return a 423 Locked status code with a message indicating when the account will be unlocked
            return res.status(423).json({
                success: false,
                error: 'Račun je začasno zaklenjen, poskusi ponovno ob ' + hours + ':' + minutes
            });
        }

        // If the account was previously locked but the lockout period has expired, reset failed attempts
        if (user.locked_until && user.locked_until < new Date()) {
            const userUpdated = await dbUsers.updateFailedAttempts(0, null, consecutiveFailedAttemptsNotChanged, username);
            failedAttempts = parseInt(userUpdated.failed_attempts, 10);
        }

        // Compare the provided password with the stored password hash
        const ok = await bcrypt.compare((process.env.APP_SECRET || '') + password, user.password_hash);

        // If the password is incorrect, increment failed attempts and check for lockout
        if (ok === false) {
            failedAttempts += 1;

            // If the failed attempts exceed 4, lock the account for 5 minutes multiplied by the number of consecutive failed attempts
            if (failedAttempts > 4) {
                const lockedUntil = new Date();
                lockedUntil.setMinutes(lockedUntil.getMinutes() + (5 * consecutiveFailedAttempts));

                // Update the failed attempts and lockout time in the database
                await dbUsers.updateFailedAttempts(failedAttempts, lockedUntil, consecutiveFailedAttempts, username);
                return res.status(423).json({ success: false, error: 'Account is temporarily locked. Please try again later.' });
            }

            // Update the failed attempts in the database without changing the consecutive failed attempts
            await dbUsers.updateFailedAttempts(failedAttempts, null, consecutiveFailedAttemptsNotChanged, username);
            return res.status(400).json({ success: false, error: 'Invalid username or password' });
        }

        // If the password is correct, reset failed attempts and lockout time
        await dbUsers.updateFailedAttempts(0, null, 0, username);

        // Set session variables for the logged-in user
        req.session.userId = user.id;
        req.session.username = user.username;

        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, error: 'Error creating user' });
    }
});

/**
 * Get the currently logged-in user's information.
 * @route GET /me
 * @returns {object} - JSON object containing the username and ID of the logged-in user.
 */
router.get('/me', requireAuth, (req, res) => {
    res.json({ username: req.session.username, id: req.session.userId });
});

/**
 * Change the password for the currently logged-in user.
 * @route POST /changePassword
 * @param {string} currentPassword - The current password of the user.
 */
router.post('/changePassword', requireAuth, async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const id = req.session.userId;

    if (!currentPassword || !newPassword || !confirmPassword || !id) {
        return res.status(400).json({ success: false, error: 'Manjkajo obvezna polja!' });
    }

    try {
        const user = await dbUsers.getAdminById(id);

        if (!user) {
            return res.status(404).json({ success: false, error: 'Uporabnik ni najden!' });
        }

        const ok = await bcrypt.compare((process.env.APP_SECRET || '') + currentPassword, user.password_hash);

        if (ok === false) {
            return res.status(400).json({ success: false, error: 'Geslo ni pravilno!' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, error: 'Gesli se ne ujemata!' });
        }

        if (newPassword.length < 10) {
            return res.status(400).json({ success: false, error: 'Geslo mora biti dolgo vsaj 10 znakov!' });
        }

        const passwordHash = await hashPassword(newPassword);
        await dbUsers.updateAdminPassword(passwordHash, id);

        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Napaka pri vnosu!' });
    }
});

/**
 * Logout the currently logged-in user.
 * @route POST /logout
 * @returns {object} - JSON object indicating success or failure.
 */
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: 'Error during logout' });
        }

        res.clearCookie('connect.sid');
        return res.json({ success: true });
    });
});

module.exports = router;