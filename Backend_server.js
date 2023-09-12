const express = require('express'); 
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require("path");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const app = express();

const db = new sqlite3.Database('E:/学习资料/软件/Mysql/新建文件夹/database.db');
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 60 * 60 * 1000 // 1 hour
    }
}));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, './Public/HomePage.html'));
});

app.post('/create-reservation', ensureAuthenticated, (req, res) => {
    const { name, email, phone, date, time, 'party-size': partySize, restaurant } = req.body;

    if (!name || !email || !phone || !date || !time || !partySize || !restaurant) {
        return res.status(400).send('All fields are required.');
    }

    const userId = req.session.user.id;

    db.run('INSERT INTO reservation (user_id, restaurant_id, day, time, name, party_size, phone) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, restaurant, date, time, name, partySize, phone],
        (error) => {
            if (error) {
                console.error("Database error:", error.message);
                return res.status(500).send('Internal server error');
            }
            res.redirect('/reservation-confirmed');
        });
});

app.get('/reservation-confirmed', (req, res) => {
    res.send('Your reservation has been confirmed!');
});

app.get('/login', function(req, res) {
    res.sendFile(path.join(__dirname, './Public/login.html'));
});

function ensureAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

app.get('/restaurants', ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, './Public/reservation.html'));
});

app.post('/signup', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }

    // 加密密码
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
            console.error("Hashing error:", err.message);
            return res.status(500).send('Internal server error');
        }

        // 保存用户到数据库
        db.run('INSERT INTO user (email, password) VALUES (?, ?)', [email, hash], function(error) {
            if (error) {
                console.error("Database error:", error.message);
                return res.status(500).send('Internal server error');
            }
            res.send('Registration successful');
        });
    });
});

app.post('/login', (req, res) => {
    // ... (The login code is almost unchanged.)
    const email = req.body.email;
    const password = req.body.password;

    db.get('SELECT id, password FROM user WHERE email = ?', [email], (error, row) => {
        if (error || !row) {
            return res.send('Invalid email or password');
        }
        
        const hash = row.password;
        
        bcrypt.compare(password, hash, (err, isMatch) => {
            if (err) {
                console.error("Hash comparison error:", err.message);
                return res.status(500).send('Internal server error');
            }
            
            if (isMatch) {
                req.session.user = {
                    email: email,
                    id: row.id
                };
                res.redirect('/restaurants');
            } else {
                res.send('Invalid email or password');
            }
        });
    });
});  // <-- Add this closing curly brace

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/login');
    });
});
