const express = require('express');
const router = express.Router();
const dbUsers = require('../model/dbUsers');
const bcrypt = require('bcrypt');
const requireAuth = require('../middleware/requireAuth');

const DUMMY_BCRYPT_HASH = bcrypt.hashSync((process.env.APP_SECRET || '') + 'dummy', 10);

function hashPassword(password) {
    return bcrypt.hash((process.env.APP_SECRET || '') + password, 10);
}

router.post('/register', async (req, res) => {
    const { username, password, passwordConfirm } = req.body;

    if (!username || !password || !passwordConfirm) {
        return res.status(400).json({ success: false, error: 'Manjkajo obvezna polja!' });
    }

    if (password !== passwordConfirm) {
        return res.status(400).json({ success: false, error: 'Gesli se ne ujemata!' });
    }

    if (password.length < 10) {
        return res.status(400).json({ success: false, error: 'Geslo mora biti dolgo vsaj 10 znakov!' });
    }

    try {
        const checkAdmins = await dbUsers.numberOfAdmins();
        if (checkAdmins > 0) {
            return res.status(403).json({ success: false, error: 'Admin že obstaja!' });
        }
        const passwordHash = await hashPassword(password);
        await dbUsers.createAdmin(username, passwordHash);
        res.json({ success: true });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
            return res.status(409).json({ success: false, error: 'Admin s tem uporabniškim imenom že obstaja!' });
        }

        console.error(err);
        res.status(500).json({ success: false, error: 'Napaka pri vnosu!' });
    }
});

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Manjkajo obvezna polja!' });
    }

    try {
        const user = await dbUsers.getAdminByUsername(username);

        if (!user) {
            await bcrypt.compare((process.env.APP_SECRET || '') + password, DUMMY_BCRYPT_HASH);
            return res.status(400).json({ success: false, error: 'Napačno geslo ali uporabniško ime!' });
        }

        const consecutiveFailedAttempts = parseInt(user.consecutive_failed_attempts, 10) + 1;
        const consecutiveFailedAttemptsNotChanged = parseInt(user.consecutive_failed_attempts, 10);
        let failedAttempts = parseInt(user.failed_attempts, 10);

        if (user.locked_until && user.locked_until > new Date()) {
            const hours = String(user.locked_until.getHours()).padStart(2, '0');
            const minutes = String(user.locked_until.getMinutes()).padStart(2, '0');
            return res.status(423).json({
                success: false,
                error: 'Račun je začasno zaklenjen, poskusi ponovno ob ' + hours + ':' + minutes
            });
        }

        if (user.locked_until && user.locked_until < new Date()) {
            const userUpdated = await dbUsers.updateFailedAttempts(0, null, consecutiveFailedAttemptsNotChanged, username);
            failedAttempts = parseInt(userUpdated.failed_attempts, 10);
        }

        const ok = await bcrypt.compare((process.env.APP_SECRET || '') + password, user.password_hash);

        if (ok === false) {
            failedAttempts += 1;

            if (failedAttempts > 4) {
                const lockedUntil = new Date();
                lockedUntil.setMinutes(lockedUntil.getMinutes() + (5 * consecutiveFailedAttempts));

                await dbUsers.updateFailedAttempts(failedAttempts, lockedUntil, consecutiveFailedAttempts, username);
                return res.status(423).json({ success: false, error: 'Prveč neuspešnih poskusov!' });
            }

            await dbUsers.updateFailedAttempts(failedAttempts, null, consecutiveFailedAttemptsNotChanged, username);
            return res.status(400).json({ success: false, error: 'Napačno geslo ali uporabniško ime!' });
        }

        await dbUsers.updateFailedAttempts(0, null, 0, username);

        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.id_employee = null;

        return res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Napaka pri vnosu!' });
    }
});

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

router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error(err);
            return res.status(500).json({ success: false, error: 'Napaka pri odjavi!' });
        }

        res.clearCookie('connect.sid');
        return res.json({ success: true });
    });
});

module.exports = router;