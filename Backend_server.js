const express = require('express'); 
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require("path");
const session = require('express-session');
const cookieParser = require('cookie-parser');
const app = express();

const db = new sqlite3.Database('database.db');
const PORT = 3000;

// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
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


function followsRequirements(password) {
    const errors = [];

    if (password.length < 8)
        errors.push("Be 8 or more characters long");

    if (! /\d/.test(password))
        errors.push("Contain numbers");

    if (! /[a-z]/.test(password))
        errors.push("Contain lowercase letters");

    if (! /[A-Z]/.test(password))
        errors.push("Contain uppercase letters");

    if (! /\W/.test(password))
        errors.push("Contain special characters");

    return errors;
}

function ensureAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

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

app.get(['/restaurants', '/restaurants.html'], ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'reservation.html'));
});

app.get(['/', '/HomePage', '/HomePage.html'], function (req, res) {
    res.sendFile(path.join(__dirname, './HomePage.html'));
});

app.get(['/login', '/login.html'], function (req, res) {
    res.sendFile(path.join(__dirname, './login.html'));
});

app.get(['/signup', '/signup.html'], function (req, res) {
    res.sendFile(path.join(__dirname, './signup.html'));
});

app.get(['/contact', '/contact.html'], function (req, res) {
    res.sendFile(path.join(__dirname, './contact.html'));
});

app.get(['/feedback', '/feedback.html'], function (req, res) {
    res.sendFile(path.join(__dirname, './feedback.html'));
});

app.get(['/about', '/about.html'], function (req, res) {
    res.sendFile(path.join(__dirname, './about.html'));
});


app.post(['/signup', '/signup.html'], (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    // Generate salt for password
    const salt = bcrypt.genSaltSync(10);
    // Hash the password using bcrypt
    const password = req.body.password;
    const passwordErrors = followsRequirements(password);
    const confirmPassword = req.body.confirmPassword;

    if (passwordErrors.length) {
        res.status(300).send("Password must:<br>" + passwordErrors.join('<br>'));
        return;
    }

    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }

    // 加密密码
    bcrypt.hash(password, salt, (err, hash) => {
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
});



app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        }
        res.redirect('/login');
    });
});
