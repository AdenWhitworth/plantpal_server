/* Test Database */

CREATE DATABASE notes_app;
USE notes_app

CREATE TABLE notes (
    id integer PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    contents TEXT NOT NULL,
    created TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO notes (title, contents)
VALUES
('My First Note','A note about something'),
('My Second Note', 'A note about something else');

/* User Authentication Database */

CREATE DATABASE plantpal_app;
USE plantpal_app
CREATE TABLE users (
  user_id int(11) NOT NULL AUTO_INCREMENT,
  first_name varchar(50) NOT NULL,
  last_name varchar(50) NOT NULL,
  email varchar(50) NOT NULL,
  password varchar(200) NOT NULL,
  last_login DATETIME(0), 
  PRIMARY KEY (user_id),
  UNIQUE KEY (email)
 ) ENGINE=InnoDB;

USE plantpal_app
CREATE TABLE devices (
  device_id int(11) NOT NULL AUTO_INCREMENT,
  cat_num varchar(50) NOT NULL,
  user_id int(11) NOT NULL,
  wifi_ssid varchar(50) NOT NULL,
  wifi_password varchar(200) NOT NULL,
  connection_status BOOLEAN NOT NULL,
  automate BOOLEAN NOT NULL,
  location varchar(50) NOT NULL,
  PRIMARY KEY (device_id),
  UNIQUE KEY (cat_num),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
 ) ENGINE=InnoDB;

USE plantpal_app
CREATE TABLE deviceLogs (
  log_id int(11) NOT NULL AUTO_INCREMENT,
  cat_num varchar(50) NOT NULL,
  soil_temp FLOAT NOT NULL,
  soil_cap int(11) NOT NULL,
  log_date DATETIME(0),
  PRIMARY KEY (log_id),
  FOREIGN KEY (cat_num) REFERENCES devices(cat_num)
 ) ENGINE=InnoDB;
