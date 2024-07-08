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
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (cat_num) REFERENCES factoryDevices(cat_num)
 ) ENGINE=InnoDB;

INSERT INTO devices (cat_num, user_id, wifi_ssid, wifi_password, connection_status, automate, location)
VALUES("A1B2C3", 1, "test", "password", false, false, "kitchen");

INSERT INTO devices (cat_num, user_id, wifi_ssid, wifi_password, connection_status, automate, location)
VALUES("A2B3C4", 1, "test", "password", false, false, "livingroom");

INSERT INTO devices (cat_num, user_id, wifi_ssid, wifi_password, connection_status, automate, location)
VALUES("A3B4C5", 1, "test", "password", false, false, "bedroom");

USE plantpal_app
CREATE TABLE deviceLogs (
  log_id int(11) NOT NULL AUTO_INCREMENT,
  cat_num varchar(50) NOT NULL,
  soil_temp FLOAT NOT NULL,
  soil_cap int(11) NOT NULL,
  log_date DATETIME(0),
  water BOOLEAN NOT NULL,
  PRIMARY KEY (log_id),
  FOREIGN KEY (cat_num) REFERENCES devices(cat_num)
 ) ENGINE=InnoDB;

INSERT INTO deviceLogs (cat_num, soil_temp, soil_cap, log_date, water)
VALUES("A1B2C3", 30.0, 1100, now(), false);

INSERT INTO deviceLogs (cat_num, soil_temp, soil_cap, log_date, water)
VALUES("A1B2C3", 30.0, 1900, "2024-07-07 08:00:00", true);

INSERT INTO deviceLogs (cat_num, soil_temp, soil_cap, log_date, water)
VALUES("A1B2C3", 30.0, 1900, "2024-07-07 15:00:00", true);

INSERT INTO deviceLogs (cat_num, soil_temp, soil_cap, log_date, water)
VALUES("A1B2C3", 30.0, 1900, "2024-07-06 08:00:00", true);

INSERT INTO deviceLogs (cat_num, soil_temp, soil_cap, log_date, water)
VALUES("A1B2C3", 30.0, 1900, "2024-07-05 08:00:00", true);

INSERT INTO deviceLogs (cat_num, soil_temp, soil_cap, log_date, water)
VALUES("A1B2C3", 30.0, 1900, "2024-07-04 08:00:00", true);

INSERT INTO deviceLogs (cat_num, soil_temp, soil_cap, log_date, water)
VALUES("A1B2C3", 30.0, 1900, "2024-07-03 08:00:00", true);

INSERT INTO deviceLogs (cat_num, soil_temp, soil_cap, log_date, water)
VALUES("A1B2C3", 30.0, 1900, "2024-07-02 08:00:00", true);

INSERT INTO deviceLogs (cat_num, soil_temp, soil_cap, log_date, water)
VALUES("A1B2C3", 30.0, 1900, "2024-07-01 08:00:00", true);

SELECT *
FROM   deviceLogs
WHERE  cat_num = "A1B2C3"
ORDER  BY log_date DESC
LIMIT  1;


USE plantpal_app
CREATE TABLE factoryDevices (
  factory_id int(11) NOT NULL AUTO_INCREMENT,
  cat_num varchar(50) NOT NULL,
  factory_date DATETIME(0),
  UNIQUE KEY (cat_num),
  PRIMARY KEY (factory_id)
 ) ENGINE=InnoDB;

INSERT INTO factoryDevices (cat_num, factory_date)
VALUES("A1B2C3", now());

INSERT INTO factoryDevices (cat_num, factory_date)
VALUES("A2B3C4", now());

INSERT INTO factoryDevices (cat_num, factory_date)
VALUES("A3B4C5", now());