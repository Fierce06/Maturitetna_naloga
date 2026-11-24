require('dotenv').config();

const express = require('express');

const session = require('express-session');
const path = require('path');

const requireAuth = require('./middleware/requireAuth');

const app = express();
const PORT = 3200;

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

// Online users
const onlineUsers = new Set();
global.onlineUsers = onlineUsers;



app.get('/index.html', (req, res) => {
    return res.redirect('/');
});

app.use(express.static(path.join(__dirname, 'public'), { index: false }));

app.get('/', (req, res) => {
    const imeDatoteke = req.session.userId ? 'index.html' : 'landing.html';
    res.sendFile(path.join(__dirname, 'public', imeDatoteke));
});


app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

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

app.get('/settings', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

app.get('/subscription', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'subscription.html'));
});

app.get('/subject-info', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'subject-info.html'));
});

app.get('/friends', requireAuth, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'friends.html'));
});

// API za prijavo in registracijo
app.use('/api/auth', require('./routes/auth'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/notebook', require('./routes/notebook'));
app.use('/api/profile-photo', require('./routes/profilePhoto'));
app.use('/api/quiz', require('./routes/quizzes'));
app.use('/api/friends', require('./routes/friends'));   
app.use('/api/battles', require('./routes/battles'));

app.use("/legal", express.static(
    path.join(__dirname, "documentation")
));

app.listen(PORT, () => {
    console.log(`Strežnik teče na http://localhost:${PORT}`);
});

