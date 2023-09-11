// Import required modules
const express = require('express'); 
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require("path");

// Initialize an Express app
const app = express();

// Initialize a new SQLite3 database connection
const db = new sqlite3.Database('E:/学习资料/软件/Mysql/新建文件夹/database.db');

// Define the port number
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, './Public/HomePage.html'));
});

app.get('/login', function(req, res) {
    res.sendFile(path.join(__dirname, './Public/login.html'));
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
    const email = req.body.email;
    const password = req.body.password;

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
                // Instead of sending a message, redirect the user to the restaurants page
                res.redirect('/restaurants');
            } else {
                res.send('Incorrect password');
            }
        });
    });
});

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Set views directory
app.set('views', path.join(__dirname, 'views'));

app.get('/restaurants', (req, res) => {
    // This is a mock data. In real scenarios, fetch this from your database.
    const restaurants = [
        { id: 1, name: 'bamboo-leaf' },
        { id: 2, name: 'Mexikana' },
        { id: 3, name: 'le-oeste' }
    ];
    
    res.render('restaurants', { restaurants: restaurants });
});

app.get('/restaurant/:id', (req, res) => {
    // Fetch the restaurant details from the database using the id from req.params.id
    const restaurantId = req.params.id;
    // This is a mock data. Fetch the real data from your database.
    const restaurant = {
        id: restaurantId,
        name: 'bamboo-leaf',
        description: 'Modern Asian Fusion in the heart of Adelaide.'
        // Add more details as required
    };

    res.render('restaurantDetail', { restaurant: restaurant });
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});





// Route for handling login requests
// app.post('/login', (req, res) => {
//     const email = req.body.email;
//     const password = req.body.password;
//
//     // Query the database for a user with the given email
//     db.get("SELECT * FROM user WHERE email = ?", [email], (err, row) => {
//         if (err) {
//             res.status(500).json({error: err.message});
//             return;
//         }
//
//         // Check if user exists and password matches
//         if (row && bcrypt.compareSync(password, row.password)) {
//             res.json({status: "success", message: "Logged in successfully"});
//         } else {
//             res.status(400).json({status: "failure", message: "Invalid credentials"});
//         }
//     });
// });
//
// // Route for handling signup requests
// app.post('/signup', (req, res) => {
//     const name = req.body.name;
//     const email = req.body.email;
//     // Hash the password using bcrypt
//     const password = bcrypt.hashSync(req.body.password, 10);
//
//     // Insert the new user's email and hashed password into the database
//     db.run("INSERT INTO user (email, password) VALUES (?, ?)", [email, password], function(err) {
//         if (err) {
//             res.status(500).json({error: err.message});
//             return;
//         }
//         res.json({status: "success", message: "Registered successfully"});
//     });
// });
