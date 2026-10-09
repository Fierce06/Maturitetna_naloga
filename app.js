require('dotenv').config();
const express = require('express');
const session = require('express-session');
const requireAuth = require('./middleware/requireAuth');
const app = express();
const PORT = 3100;

////////////// Globalni middleware ///////////////////////////
app.use(express.json({ limit: '4mb' })); // omogoči parsiranje JSON v 
app.use(express.static('public'));

/////////////// Coooookieeees ///////////////////////////////////
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax', // CSRF zaščita
        maxAge: 1000*60*60*8 // 8 ur
    }
}));

app.get('/', (req, res) => {res.render('index');});
app.get('/subjects', (req, res) => {res.render('subjects');});
app.get('/notebook', (req, res) => {res.render('notebook');});
app.get('/knowledge', (req, res) => {res.render('knowledge');});
app.get('/study', (req, res) => {res.render('study');});
app.get('/exam', (req, res) => {res.render('exam');});
app.get('/calendar', (req, res) => {res.render('calendar');});

app.use('/api/auth', require('./routes/auth'));

app.listen(PORT, () => {
    console.log(`Strežnik teče na http://localhost:${PORT}`);
});