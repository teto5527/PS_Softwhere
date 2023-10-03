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

app.use(express.static('PS'));

app.get('/get-current-user', ensureAuthenticated, (req, res) => {
    const userId = req.session.user.id;
    
    db.get('SELECT name, email, phone FROM user WHERE id = ?', [userId], (err, row) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).send('Server error');
        }
        res.json(row);
    });
});

function ensureAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    res.redirect('/login');
}

function getUserIdByEmail(email, callback) {
    db.get('SELECT id FROM user WHERE email = ?', [email], (err, userRow) => {
        if (err) {
            // Handle any errors that occurred during the query
            callback(err, null);
        } else {
            // If no errors, call the callback with the user's ID (or null if not found)
            callback(null, userRow ? userRow.id : null);
        }
    });
}

app.post('/create-reservation', ensureAuthenticated, (req, res) => {
    const { name, email, phone, date, time, 'party-size': partySize, restaurant } = req.body;

    if (!name || !email || !phone || !date || !time || !partySize || !restaurant) {
        return res.status(400).send('All fields are required.');
    }

    // 确保会话中存在有效的用户ID
    if (!req.session.user || !req.session.user.id) {
        return res.status(401).send('User not authenticated');
    }
    const userId = req.session.user.id;

    /*
     * 25 September 2023
     *
     * Reservation does not need email, name, phone, etc.
     * That Should already be stored in the user table.
     * We just need to reference the customer with the userId
     * If we need the data, just LEFT JOIN everything ON the user_id/customer_id
     * */
    db.run('INSERT INTO reservation (user_id, restaurant_id, day, time, partySize, name, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, restaurant, date, time, partySize, name, email, phone],
        (error) => {
            if (error) {
                console.error("Database error:", error.message);
                return res.status(500).send('Internal server error');
            }
            res.redirect('/reservation-confirmed');
            // Increase points
            db.run(`UPDATE customer SET points = points + 10 WHERE user_id = ${userId}`);

            // Achievements
            let weekdays = [1, 2, 3, 4, 5, 6, 7];
            if(weekdays.includes(date)){
                db.run(`UPDATE customer SET points = points + 20 WHERE user_id = ${userId}`);
            }
        });
});

app.get('/reservation-confirmed', (req, res) => {
    res.send(`
        <html>
        <head>
            <style>
                 body { margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
                    background-image: url('https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA1L2stcGYtcG9tLTEyNDIuanBn.jpg?s=lNc1AhDSYLC9MxAeVuLOi64Lzfe0zQNJAujoFLl_Mtg');
                    background-repeat: no-repeat;
                    background-size: cover;
                    font-family: Arial, sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100vh;
                }
                button {
                    margin-top: 20px;
                    padding: 10px 15px;
                    font-size: 16px;
                }
            </style>
        </head>
        <body>
            <h1>Your reservation has been confirmed!</h1>
            <button onclick="location.href='HomePage.html'">Return to Home Page</button>
        </body>
        </html>
    `);
});

app.get('/BambooLeaf.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'BambooLeaf.html'));
});

app.get('/La_Oeste.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'La_Oeste.html'));
});

app.get('/Mexikana.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'Mexikana.html'));
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

app.get(['/reservation', '/reservation.html'], function (req, res) {
    res.sendFile(path.join(__dirname, './reservation.html'));
});

app.get(['/feedback', '/feedback.html'], function (req, res) {
    res.sendFile(path.join(__dirname, './feedback.html'));
});

app.get(['/about', '/about.html'], function (req, res) {
    res.sendFile(path.join(__dirname, './about.html'));
});

//app.get(['/my-account', '/my-account.html'], function (req, res) {
//    res.sendFile(path.join(__dirname, './my-account.html'));
//});


app.post(['/signup', '/signup.html'], (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
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
        db.run('INSERT INTO user (name, email, phone, password) VALUES (?, ?, ?, ?)', [name, email, phone, hash], function(error) {
            if (error) {
                console.error("Database error:", error.message);
                return res.status(500).send('Internal server error');
            }
        });

        getUserIdByEmail(email, (err, userId) => {
            if (err) {
                console.error('Error:', err);
                return res.status(500).send('Internal server error');
            }

            if (userId !== null) {
                // Link customer table to user and set points to 0
                db.run('INSERT INTO customer (user_id, points) VALUES (?, ?)', [userId, 0], function(error) {
                    if (error) {
                        console.error("Database error:", error.message);
                        return res.status(500).send('Internal server error');
                    }
                    res.send(`
                    <html>
                    <head>
                        <style>
                            body { margin: 0;
                                padding: 0;
                                font-family: Arial, sans-serif;
                                background-image: url('https://images.rawpixel.com/image_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA1L2stcGYtcG9tLTEyNDIuanBn.jpg?s=lNc1AhDSYLC9MxAeVuLOi64Lzfe0zQNJAujoFLl_Mtg');
                                background-repeat: no-repeat;
                                background-size: cover;
                                font-family: Arial, sans-serif;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                height: 100vh;
                            }
                            button {
                                margin-top: 20px;
                                padding: 10px 15px;
                                font-size: 16px;
                            }
                        </style>
                    </head>
                    <body>
                        <h1>Registration Successful</h1>
                        <button onclick="location.href='HomePage.html'">Return to Home Page</button>
                    </body>
                    </html>
                    `);
                });
                db.all('SELECT * FROM user LEFT JOIN customer ON user.id = customer.user_id', [], (err, rows) => {
                    if (err) {
                        throw err;
                    }

                    // Print the results
                    rows.forEach(row => {
                        console.log(row);
                    });
                console.log("");

                // Close the database connection
                // Closing the database causes an error
                //db.close();
                });
            } else {
                console.log('User not found.');
            }
        });
    });
});

app.post(['/login', 'login.html'], (req, res) => {
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
                res.redirect('/HomePage');
            } else {
                res.send('Invalid email or password');
            }
        });
    });
});

app.get(['/my-account', '/my-account.html'], ensureAuthenticated, function (req, res) {
    res.sendFile(path.join(__dirname, './my-account.html'));
});

app.get('/get-user-info', ensureAuthenticated, (req, res) => {
    const userId = req.session.user.id;
    const query = "SELECT user.name as userName, user.email as userEmail, user.phone as userPhone, reservation.id as reservationId, reservation.day, reservation.time, reservation.partySize, reservation.name as reservationName, reservation.phone as reservationPhone, reservation.email as reservationEmail, reservation.restaurant_id as restaurantName, customer.points as userPoints FROM user JOIN customer ON user.id = customer.user_id LEFT JOIN reservation ON user.id = reservation.user_id WHERE user.id = ?;";
    db.all(query, userId, (error, data) => {
        if (error) {
            res.status(500).send('Internal server error');
            return;
        }
        res.json(data);
    });
});

app.delete('/cancel-reservation/:id', ensureAuthenticated, (req, res) => {
    const reservationId = req.params.id;
    const userId = req.session.user.id;

    // 你可以加入额外的逻辑来确认这个预定确实属于当前登录的用户，以增加安全性。

    db.run('DELETE FROM reservation WHERE id = ? AND user_id = ?', [reservationId, userId], (error) => {
        if (error) {
            console.error("Database error:", error.message);
            return res.status(500).send('Internal server error');
        }

        if (this.changes === 0) {
            return res.status(404).send('Reservation not found or not belonging to the current user');
        }

        res.status(200).send('Reservation cancelled successfully');
        // Decrease points
        db.run(`UPDATE customer SET points = points - 1 WHERE user_id = ${userId}`);
    });
});

app.use(bodyParser.json());
app.post('/submit-feedback', ensureAuthenticated, (req, res) => {
    console.log('Received body:', req.body); 
    const rating = req.body.rating;
    const review = req.body.review; 
    const restaurant_id = parseInt(req.body.restaurant_id); 

    if (!rating || !restaurant_id) {
        return res.status(400).json({ success: false, message: 'Rating and restaurant are required.', requestBody: req.body });
    }

    // 从会话中获取当前登录用户的ID
    const user_id = req.session.user.id;

    db.run('INSERT INTO reviews(restaurant_id, rating, review, user_id) VALUES (?, ?, ?, ?)', [restaurant_id, rating, review, user_id], function (err) {
        if (err) {
            console.error('Failed to insert feedback into database:', err);
            return res.status(500).json({ success: false, message: 'Server error' });
        }
        res.json({ success: true, message: 'Feedback submitted successfully.' });
    });
});


  // ... (省略其他代码) ...

  app.get('/all-reviews', (req, res) => {
    //db.all('SELECT reviews.rating, reviews.review, user.name, restaurant.name AS restaurant_name FROM reviews JOIN user ON reviews.user_id = user.id JOIN restaurant ON reviews.restaurant_id = restaurant.id', [], (err, rows) => {
    db.all('SELECT reviews.rating, reviews.review, user.name, restaurant.name AS restaurant_name FROM reviews JOIN user ON reviews.user_id = user.id JOIN restaurant ON reviews.restaurant_id = restaurant.id', [], (err, rows) => {
        if (err) {
            console.error("Database error:", err.message);
            return res.status(500).send('Server error');
        }

        console.log(`Found ${rows.length} reviews.`);

        function generateStars(rating) {
            return "⭐".repeat(rating);
        }

        let content = '<h1>All Reviews</h1>';
        rows.forEach(row => {
            let stars = generateStars(row.rating); // 使用函数生成星星

            content += `
                <div>
                    <h3>Rating: ${stars}</h3>
                    <p>${row.review}</p>
                    <small>By ${row.name} at ${row.restaurant_name}</small>
                </div>
                <hr>
            `;
        });

        res.send(content);
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
