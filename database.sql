-- Create database with this command:
-- sqlite3 database.db < database.sqlite

CREATE TABLE user (
       userid       VARCHAR PRIMARY KEY,
       email        TEXT,
       phone        TEXT,
       password     TEXT,
       salt         TEXT,
       -- SQLite does not have its own TIME datatype,
       -- but it does has functions for conversion
       -- See: https://www.sqlite.org/datatype3.html
       reservation  INTEGER,
       access_level TINYINT
);

CREATE TABLE restaurant (
       restaurantid VARCHAR PRIMARY KEY,
       openingday   TINYINT,
       closingday   TINYINT,
       sittings     VARCHAR
);

CREATE TABLE sitting (
       sittingid VARCHAR PRIMARY KEY,
       sittingname TEXT,
       restaurant VARCHAR,
       -- Time, see user table
       openingtime INTEGER,
       closingtime INTEGER,
       FOREIGN KEY(restaurant) REFERENCES restaurant(sittings)
);

CREATE TABLE review (
       reviewid   VARCHAR PRIMARY KEY,
       restaurant VARCHAR,
       review     TEXT,
       FOREIGN KEY(restaurant) REFERENCES restaurant(restaurantid)
);
