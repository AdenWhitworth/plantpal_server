/* User Authentication Table */
/*powershell Compress-Archive -Path * -DestinationPath ../nodejs-layer.zip*/

CREATE DATABASE plantpal_app;
USE plantpal_app;
CREATE TABLE users (
  user_id int(11) NOT NULL AUTO_INCREMENT,
  first_name varchar(50) NOT NULL,
  last_name varchar(50) NOT NULL,
  email varchar(50) NOT NULL,
  password varchar(200) NOT NULL,
  refresh_token varchar(255),
  reset_token_expiry DATETIME(0),
  reset_token varchar(255),
  last_login DATETIME(0),
  socket_id VARCHAR(255),
  PRIMARY KEY (user_id),
  UNIQUE KEY (email)
 ) ENGINE=InnoDB;
 
DELETE FROM users
WHERE user_id = 6;
 
 USE plantpal_app;
 SELECT * FROM users;
 
USE plantpal_app; 
ALTER TABLE users
ADD COLUMN socket_id VARCHAR(255);

 USE plantpal_app;
 DROP TABLE users;

/* Devices Table */

USE plantpal_app;
CREATE TABLE devices (
  device_id int(11) NOT NULL AUTO_INCREMENT,
  cat_num varchar(50) NOT NULL,
  user_id int(11) NOT NULL,
  wifi_ssid varchar(50) NOT NULL,
  wifi_password TEXT NOT NULL,
  init_vec varchar(255) NOT NULL,
  presence_connection BOOLEAN NOT NULL,
  location varchar(50) NOT NULL,
  thing_name varchar(255) NOT NULL,
  PRIMARY KEY (device_id),
  UNIQUE KEY (cat_num),
  UNIQUE KEY (thing_name),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (cat_num) REFERENCES factoryDevices(cat_num),
  FOREIGN KEY (thing_name) REFERENCES factoryDevices(thing_name)
 ) ENGINE=InnoDB;

INSERT INTO devices (cat_num, user_id, wifi_ssid, wifi_password, connection_status, automate, location)
VALUES("A1B2C3", 1, "testssid", "testpassword", false, false, "kitchen");

DELETE FROM devices
WHERE cat_num = "A4B5C6";

SET GLOBAL time_zone = '+00:00';
SET time_zone = '+00:00';

 USE plantpal_app;
 SELECT * FROM devices;
 
 USE plantpal_app;
 DROP TABLE devices;
 
USE plantpal_app; 
ALTER TABLE devices
ADD COLUMN thing_name varchar(255) NOT NULL;

USE plantpal_app;
UPDATE devices
SET thing_name = 'PlantPal-thing'
WHERE cat_num = 'A1B2C3';

/* Device Logs Table */

USE plantpal_app;
CREATE TABLE deviceLogs (
  log_id int(11) NOT NULL AUTO_INCREMENT,
  cat_num varchar(50) NOT NULL,
  soil_temp FLOAT NOT NULL,
  soil_cap int(11) NOT NULL,
  log_date TIMESTAMP,
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

SELECT * FROM deviceLogs;

 USE plantpal_app;
 DROP TABLE deviceLogs;

/* Factory Devices Table */

USE plantpal_app;
CREATE TABLE factoryDevices (
  factory_id int(11) NOT NULL AUTO_INCREMENT,
  cat_num varchar(50) NOT NULL,
  factory_date DATETIME(0),
  thing_name varchar(255) NOT NULL,
  UNIQUE KEY (cat_num),
  UNIQUE KEY (thing_name),
  PRIMARY KEY (factory_id)
 ) ENGINE=InnoDB;

INSERT INTO factoryDevices (cat_num, factory_date, thing_name)
VALUES("A1B2C3", now(), "PlantPal-thing");

INSERT INTO factoryDevices (cat_num, factory_date)
VALUES("A2B3C4", now());

INSERT INTO factoryDevices (cat_num, factory_date)
VALUES("A3B4C5", now());

INSERT INTO factoryDevices (cat_num, factory_date)
VALUES("A4B5C6", now());

USE plantpal_app;
DROP TABLE factoryDevices;

USE plantpal_app;
SELECT * FROM factoryDevices;
