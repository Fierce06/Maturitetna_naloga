require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');

const requireAuth = require('./middleware/requireAuth');

const app = express();
const PORT = 3100;

// Globalni middleware
app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8
    }
}));

// Javne datoteke: CSS, JavaScript, slike ...
app.use(express.static(path.join(__dirname, 'public')));

// Javne strani
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

// Zaščitene strani
app.get('/subjects', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'subjects.html'));
});

app.get('/notebook', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'notebook.html'));
});

app.get('/knowledge', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'knowledge.html'));
});

app.get('/study', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'study.html'));
});

app.get('/exam', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'exam.html'));
});

app.get('/calendar', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'calendar.html'));
});

// API za prijavo in registracijo
app.use('/api/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/exams', require('./routes/exams'));

app.listen(PORT, () => {
    console.log(`Strežnik teče na http://localhost:${PORT}`);
});