const express = require('express');
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Configure middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// SQLite database setup
const db = new sqlite3.Database('./database.sqlite');

// Define a route to handle form submissions
app.post('/submit', (req, res) => {
    const { username, email } = req.body;

    // Insert data into the SQLite database
    const sql = 'INSERT INTO users (username, email) VALUES (?, ?)';
    db.run(sql, [username, email], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Error inserting data' });
        }

        res.status(200).json({ message: 'Data inserted successfully' });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
