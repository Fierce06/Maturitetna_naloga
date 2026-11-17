const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

// Map the profile pictures directory and set the maximum allowed file size for uploads.
const mapaFotografij = path.join(__dirname, '..', 'uploads', 'profile-pictures');
const najvecjaVelikost = 1.5 * 1024 * 1024;

// Access to profile photo routes requires an active session with a valid user ID.
router.use(function (req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            error: 'You must be logged in.'
        });
    }

    next();
});

// Return the file path for a user's profile photo.
function potDoFotografije(userId) {
    return path.join(mapaFotografij, `${Number(userId)}.jpg`);
}

// Check if the authenticated user has a profile photo and return its URL if it exists.
router.get('/status', async function (req, res) {
    try {
        await fs.promises.access(potDoFotografije(req.session.userId));

        return res.json({
            success: true,
            hasPhoto: true,
            photoUrl: '/api/profile-photo/image'
        });
    } catch (napaka) {
        if (napaka.code === 'ENOENT') {
            return res.json({
                success: true,
                hasPhoto: false,
                photoUrl: null
            });
        }

        console.error('Error checking profile photo:', napaka);

        return res.status(500).json({
            success: false,
            error: 'Could not load profile photo.'
        });
    }
});

// Return the authenticated user's profile photo as a JPEG image, or a 404 error if it doesn't exist.
router.get('/image', function (req, res) {
    res.set('Cache-Control', 'private, no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    res.type('jpeg');

    res.sendFile(potDoFotografije(req.session.userId), function (napaka) {
        if (napaka && !res.headersSent) {
            const status = napaka.code === 'ENOENT' ? 404 : 500;
            return res.status(status).end();
        }
    });
});

// Handle profile photo uploads. The uploaded image must be a base64-encoded JPEG and not exceed the maximum allowed size.
router.post('/', async function (req, res) {
    const imageData = req.body && req.body.imageData;

    if (typeof imageData !== 'string' || imageData.length > 2800000) {
        return res.status(400).json({
            success: false,
            error: 'Invalid or oversized image.'
        });
    }

    // Check if the uploaded image is a valid base64-encoded JPEG.
    const ujemanje = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(imageData);

    if (!ujemanje) {
        return res.status(400).json({
            success: false,
            error: 'Unsupported image format.'
        });
    }

    const vsebina = Buffer.from(ujemanje[1], 'base64');

    // Check if the image is a valid JPEG by verifying its magic numbers and size.
    const jeJpg = vsebina.length >= 100 &&
        vsebina[0] === 0xff &&
        vsebina[1] === 0xd8 &&
        vsebina[2] === 0xff &&
        vsebina[vsebina.length - 2] === 0xff &&
        vsebina[vsebina.length - 1] === 0xd9;

    if (!jeJpg || vsebina.length > najvecjaVelikost) {
        return res.status(400).json({
            success: false,
            error: 'Please select a valid image up to 5 MB.'
        });
    }

    let zacasnaPot;

    try {
        // Create the profile pictures directory if it doesn't exist, then write the uploaded image to a temporary file before renaming it to the final destination.
        await fs.promises.mkdir(mapaFotografij, { recursive: true });

        const nakljucnoIme = crypto.randomBytes(8).toString('hex');
        zacasnaPot = path.join(mapaFotografij, `.${req.session.userId}-${nakljucnoIme}.tmp`);

        await fs.promises.writeFile(zacasnaPot, vsebina, {
            flag: 'wx',
            mode: 0o600
        });

        await fs.promises.rename(zacasnaPot, potDoFotografije(req.session.userId));

        return res.json({
            success: true,
            photoUrl: '/api/profile-photo/image'
        });
    } catch (napaka) {
        // If a temporary file was created, attempt to delete it. Log the error and return a 500 response if the upload fails.
        if (zacasnaPot) {
            await fs.promises.unlink(zacasnaPot).catch(function () {
                // Ignore errors when trying to delete the temporary file.
            });
        }

        console.error('Error saving profile photo:', napaka);

        return res.status(500).json({
            success: false,
            error: 'Could not save profile photo.'
        });
    }
});

// Handle profile photo deletion. If the photo doesn't exist, return a success response. Log any errors and return a 500 response if the deletion fails.
router.delete('/', async function (req, res) {
    try {
        await fs.promises.unlink(potDoFotografije(req.session.userId));

        return res.json({ success: true });
    } catch (napaka) {
        if (napaka.code === 'ENOENT') {
            return res.json({ success: true });
        }

        console.error('Error deleting profile photo:', napaka);

        return res.status(500).json({
            success: false,
            error: 'Could not remove profile photo.'
        });
    }
});

module.exports = router;
