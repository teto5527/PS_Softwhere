-- Create database with this command:
-- sqlite3 database.db < database.sql

CREATE TABLE user
(
    id           INTEGER PRIMARY KEY NOT NULL,
    email        TEXT,
    phone        TEXT,
    password     TEXT,
    salt         TEXT,
    access_level TINYINT
);

CREATE TABLE restaurant
(
    id          INTEGER PRIMARY KEY NOT NULL,
    name        TEXT,
    opening_day TINYINT,
    closing_day TINYINT
);

CREATE TABLE sitting
(
    id            INTEGER PRIMARY KEY NOT NULL,
    sitting_name  TEXT,
    restaurant_id INTEGER,
    -- Time, see user table
    opening_time  TIME,
    closing_time  TIME,
    FOREIGN KEY (restaurant_id) REFERENCES restaurant (id)
);

-- See link for how to handle dates/times:
-- https://www.sqlite.org/datatype3.html
CREATE TABLE reservation
(
    id            INTEGER PRIMARY KEY NOT NULL,
    user_id       INTEGER             NOT NULL,
    restaurant_id INTEGER             NOT NULL,
    day           TINYINT,
    time          TIME,
    FOREIGN KEY (user_id) REFERENCES user (id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurant (id)
);

CREATE TABLE review
(
    id            INTEGER PRIMARY KEY NOT NULL,
    restaurant_id INTEGER             NOT NULL,
    review        TEXT,
    FOREIGN KEY (restaurant_id) REFERENCES restaurant (id)
);
