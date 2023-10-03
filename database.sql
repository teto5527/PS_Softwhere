-- Create database with this command:
-- sqlite3 database.db < database.sql

CREATE TABLE IF NOT EXISTS user
(
    id           INTEGER PRIMARY KEY NOT NULL,
    name         TEXT,
    email        TEXT,
    phone        TEXT,
    password     TEXT
);

CREATE TABLE IF NOT EXISTS customer
(
    id           INTEGER PRIMARY KEY NOT NULL,
    user_id      INTEGER,
    points       INTEGER,
    FOREIGN KEY (user_id) REFERENCES user (id)
);

CREATE TABLE IF NOT EXISTS staff
(
    id           INTEGER PRIMARY KEY NOT NULL,
    user_id      INTEGER,
    FOREIGN KEY (user_id) REFERENCES user (id)
);

CREATE TABLE IF NOT EXISTS restaurant
(
    id          INTEGER PRIMARY KEY NOT NULL,
    name        TEXT,
    opening_day TINYINT,
    closing_day TINYINT
);

CREATE TABLE IF NOT EXISTS sitting
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
CREATE TABLE IF NOT EXISTS reservation
(
    id            INTEGER PRIMARY KEY NOT NULL,
    user_id       INTEGER             NOT NULL,
    restaurant_id INTEGER             NOT NULL,
    partySize     INTEGER             NOT NULL,
    day           TEXT,
    time          TIME,
    name          TEXT,
    phone TEXT,
    email TEXT,
    FOREIGN KEY (user_id) REFERENCES user (id),
    FOREIGN KEY (restaurant_id) REFERENCES restaurant (id)
);

CREATE TABLE IF NOT EXISTS reviews
(
    id            INTEGER PRIMARY KEY NOT NULL,
    restaurant_id INTEGER             NOT NULL,
    user_id       INTEGER             NOT NULL,
    rating        TINYINT             NOT NULL,
    review        TEXT,
    FOREIGN KEY (restaurant_id) REFERENCES restaurant (id),
    FOREIGN KEY (user_id) REFERENCES user (id)
);
