const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

// Mapa za profilne fotografije in največja dovoljena velikost shranjene slike.
const mapaFotografij = path.join(__dirname, '..', 'uploads', 'profile-pictures');
const najvecjaVelikost = 1.5 * 1024 * 1024;

// Dostop do fotografij imajo samo prijavljeni uporabniki.
router.use(function (req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            success: false,
            error: 'You must be logged in.'
        });
    }

    next();
});

// Pot do datoteke določimo s pomočjo ID-ja iz seje, ne iz uporabnikovega vnosa.
function potDoFotografije(userId) {
    return path.join(mapaFotografij, `${Number(userId)}.jpg`);
}

// Preverimo, ali ima trenutno prijavljeni uporabnik shranjeno fotografijo.
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

// Vrnjena slika pripada samo uporabniku, ki ima trenutno aktivno sejo.
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

// Shranimo fotografijo, ki jo je brskalnik pred pošiljanjem obrezal na 512 × 512 px.
router.post('/', async function (req, res) {
    const imageData = req.body && req.body.imageData;

    if (typeof imageData !== 'string' || imageData.length > 2800000) {
        return res.status(400).json({
            success: false,
            error: 'Invalid or oversized image.'
        });
    }

    // Preverimo, ali smo prejeli sliko v JPG/base64 obliki.
    const ujemanje = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/.exec(imageData);

    if (!ujemanje) {
        return res.status(400).json({
            success: false,
            error: 'Unsupported image format.'
        });
    }

    const vsebina = Buffer.from(ujemanje[1], 'base64');

    // Dodatno preverimo začetne in končne bajte datoteke JPG.
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
        // Najprej napišemo začasno datoteko in jo nato preimenujemo.
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
        // Ob neuspešnem shranjevanju odstranimo morebitno začasno datoteko.
        if (zacasnaPot) {
            await fs.promises.unlink(zacasnaPot).catch(function () {
                // Datoteka morda ni bila ustvarjena; prvotno napako obravnavamo spodaj.
            });
        }

        console.error('Error saving profile photo:', napaka);

        return res.status(500).json({
            success: false,
            error: 'Could not save profile photo.'
        });
    }
});

// Odstranimo uporabnikovo fotografijo in omogočimo prikaz privzete slike.
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
