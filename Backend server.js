// Import required modules
const express = require('express'); // Importing the Express framework
const bodyParser = require('body-parser'); // Middleware for parsing request bodies
const sqlite3 = require('sqlite3').verbose(); // SQLite3 module with verbose logging enabled
const bcrypt = require('bcrypt');
const path = require('path'); // Library for hashing passwords
const fs = require('fs');

// Initialize an Express app
const app = express();

// Initialize a new SQLite3 database connection
const db = new sqlite3.Database('database.db');

// Script that fills the database with schema
const script = fs.readFileSync('database.sql', 'utf8');

// Define the port number
const PORT = 3000;

app.use(bodyParser.urlencoded({extended: true}));

// Execute the SQL script to create the database
db.serialize(() => {
    db.exec(script, function (err) {
        if (err) {
            console.error('Error executing SQL script:', err.message);
        } else {
            console.log('Database created successfully.');
        }
    });
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

// Route for handling login requests
app.post(['/login', 'login.html'], (req, res) => {
    const email = req.body.email;
    const password = req.body.password;

    console.log(email, password);

    db.get('SELECT password FROM user WHERE email = ?', [email], (error, row) => {
        if (error) {
            console.error("Database error:", error.message);
            res.status(500).send('Internal server error');
            return;
        }

        if (!row) {
            res.send('No user with that email');
            return;
        }

        const hash = row.password;

        bcrypt.compare(password, hash, (err, isMatch) => {
            if (err) throw err;

            if (isMatch) {
                res.send('Login successful');
            } else {
                res.send('Incorrect password');
            }
        });
    });
});

// Route for handling signup requests
app.post(['/signup', '/signup.html'], (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.tel;
    // Generate salt for password
    const salt = bcrypt.genSaltSync(10);
    // Hash the password using bcrypt
    const password = bcrypt.hashSync(req.body.password, salt);

    // Insert the new user's information into the database
    db.run("INSERT INTO user (name, email, phone, password) VALUES (?, ?, ?, ?)",
        [name, email, phone, password],
        function (err) {
            if (err) {
                res.status(500).json({error: err.message});
                return;
            }
            res.json({status: "success", message: "Registered successfully"});
        });
});


// Start the Express server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});
