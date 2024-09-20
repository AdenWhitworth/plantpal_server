<img width="80" src="https://github.com/AdenWhitworth/PlantPal_Front-End/raw/master/src/Images/PlantPal%20Logo.svg" alt="PlantPal Logo">

# PlantPal Server

Welcome to the **PlantPal Server**, the backend API for PlantPal, an application designed to help plant enthusiasts monitor and manage their plants. This repository contains the Node.js backend that powers PlantPal's user authentication, device data tracking, and plant care management features.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Backend](#running-the-backend)
- [API Endpoints](#api-endpoints)
- [AWS Lambda Functions](#aws-lambda-functions)
- [Testing](#testing)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Overview

PlantPal is an application that allows users to monitor their plants through IoT devices. This repository handles the server-side logic for user authentication, device management, and plant data processing. It is built with Node.js and follows REST API principles to ensure scalability and efficiency.

## Features

- **User Authentication**: Register, log in, and manage users with secure password hashing and JWT-based access & refresh authentication.
- **Device Integration**: Manage IoT devices that track plant conditions (e.g., soil moisture, temperature).
- **Plant Management**: Add and manage plants in the system, linking them with devices for real-time monitoring.
- **Data Analytics**: Fetch historical and real-time data from the PlantPal devices, and generate insights for plant care.

## Technologies Used

- **Node.js**: Backend runtime environment for executing JavaScript on the server.
- **Express.js**: Web framework for building the RESTful API.
- **TypeScript**: Strongly typed language that enhances code quality and development experience.
- **MySQL**: SQL database for storing user, plant, and device data.
- **JWT (JSON Web Tokens)**: Used for secure authentication.
- **Socket.IO**: Library for real-time communication between clients and the server.
- **Amazon Web Services (AWS)**: 
  - **RDS**: For cloud-hosted SQL database management.
  - **IoT Core**: For handling MQTT protocols.
  - **Lambda**: For processing event-driven changes in SQL and MQTT data.

## Getting Started

Follow the instructions below to get the server running on your local machine.

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v7 or higher)
- **MySQL** (local or cloud instance)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/AdenWhitworth/plantpal_server.git
   cd plantpal_server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
   
### Environment Variables
Create a `.env` file in the root directory and define the following variables:

  ```plain text
  # Server configuration
  PORT=4000  # The port on which the server will run
  
  # MySQL database configuration
  MYSQL_USER=your_mysql_user  # Your MySQL username
  MYSQL_PASSWORD=your_mysql_password  # Your MySQL password
  MYSQL_DATABASE=plantpal_app  # The name of the MySQL database
  RDS_ENDPOINT=your_aws_rds_endpoint  # Your AWS RDS endpoint for cloud hosted or ip for local development
  
  # Crypto and API keys
  cryptoSecretKey=your_crypto_key  # Secret key for cryptographic operations
  API_KEY=your_api_key  # Your API key for third-party services
  API_CLIENT_KEY=your_client_api_key  # Your client API key
  
  # Frontend URL
  BASE_URL=your_frontend_url  # The base URL for your frontend application
  
  # AWS configuration
  AWS_ACCESS_KEY_ID=your_aws_access_key  # AWS access key ID
  AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key  # AWS secret access key
  AWS_REGION=your_aws_region  # AWS region
  AWS_IOT_ENDPOINT=your_aws_iot_endpoint  # AWS IoT endpoint
  
  # Authentication configuration
  AUTH_REFRESH_TOKEN_SECRET=your_refresh_secret  # Secret for refreshing tokens
  AUTH_REFRESH_TOKEN_EXPIRY=your_refresh_expiry  # Expiry time for refresh tokens (in days) format (7d)
  AUTH_ACCESS_TOKEN_SECRET=your_access_secret  # Secret for access tokens
  AUTH_ACCESS_TOKEN_EXPIRY=your_access_expiry  # Expiry time for access tokens (in minutes) format (15m)
  RESET_PASSWORD_TOKEN_EXPIRY_MINS=your_reset_expiry  # Expiry time for reset password tokens (in minutes) format (15)
  
  # Email configuration
  AUTH_EMAIL_USERNAME=your_host_email_username  # Username for email service
  AUTH_EMAIL_PASSWORD=your_host_email_password  # Password for email service
  EMAIL_FROM=your_host_email_from  # Email address to send from
  AUTH_EMAIL_HOST=your_host_email  # Host for the email service
  
  # Environment configuration
  NODE_ENV=production #| development  # Set to 'production' or 'development'
  ```

### Running the Backend

Once the environment variables are configured and dependencies are installed, you can start the server with:
```bash
npm start
```
This will run the server on the port specified in the .env file (default: 4000).

To run the server in development mode (with hot-reloading using nodemon), use:
```bash
npm run dev
```

## API Endpoints

The backend provides a set of endpoints to interact with the system:

- **Auth Routes**
  - `POST /auth/register`: Register a new user.
  - `POST /auth/login`: Log in with user credentials.
  - `POST /auth/updateUser`: Update user cedentials.
  - `POST /auth/refreshAccessToken`: Refresh the access token with refresh token.
  - `POST /auth/forgotPassword`: Send user a forgot password email.
  - `POST /auth/resetPassword`: Reset a user password from the forgot password form.
  - `GET /auth/error`: Trigger a server error for testing.
  - `GET /auth/test`: Test the Auth Router.
- ***Dashboard Routes***
  - `GET /userDevices`: Get all devices linked to the user.
  - `GET /deviceLogs`: Get all sensor logs linked to the user's specific device.
  - `POST /addDevice`: Add a new PlantPal device to the user.
  - `POST /updateWifi`: Update a user devices wifi.
  - `POST /updateAuto`: Update aws iot shadow to reflect auto watering state.
  - `POST /shadowUpdateAuto`: Recieve aws iot shadow update to the auto watering state and notify user.
  - `POST /presenceUpdateConnection`: Notify user of device connection state change.
  - `POST /updatePumpWater`: Update aws iot shadow to reflect pump water state.
  - `POST /shadowUpdatePumpWater`: Recieve aws iot shadow update to the pump water state and notify user.
  - `GET /deviceShadow`: Get a specific device aws iot shadow states.
  - `GET /test`: Test the Dashboard Router.

## AWS Lambda Functions

This project includes AWS Lambda functions that enhance the functionality of the PlantPal application. These functions are designed to handle specific tasks in a serverless environment.

### Overview of Lambda Functions

- **IotMonitorPresence**: Triggered by changes to the presence of connected and disconnected states, indicating the PlantPal device's Wi-Fi connection status.
- **IotMonitorShadow**: Activated by updates to a PlantPal device's thing shadow state, used to track both automatic and manual pump watering commands.
- **IotSavePlantPalData**: Triggered by publishes to the log topic, which saves the PlantPal sensor information in the database.

### Setting Up AWS Lambda Functions

1. **Prerequisites**:
   - Ensure you have an AWS account.
   - Install the [AWS CLI](https://aws.amazon.com/cli/) and configure it with your credentials.

2. **Deploying the Functions**:
   - Navigate to the directory containing the Lambda function code within this repository:
     - `/AWS_Lambda/IotMonitorPresence`
     - `/AWS_Lambda/IotMonitorShadow`
     - `/AWS_Lambda/IotSavePlantPalData`
   - Use the following command to deploy each function:
     ```bash
     aws lambda create-function --function-name YourFunctionName \
     --runtime nodejs14.x --role YourIAMRoleARN \
     --handler index.handler --zip-file fileb://function.zip
     ```
   - Replace `YourFunctionName`, `YourIAMRoleARN`, and the file paths accordingly.
   - Add the triggers as indicated in the comments at the top of each `index.mjs` file.
   - Include the following layer for each function: `/AWS_ZIP/lambda-function-07-15-2024.zip`.

3. **Testing the Functions**:
   - You can test the deployed functions using the AWS Management Console or AWS CLI.

### Environment Variables for Lambda Functions

Each of the three Lambda functions requires the following environment variable:

```text
API_KEY=your_api_key  # Your API key for third-party services
```
Please refer to the [Environment Variables](#environment-variables) section for details on how to configure them.

### Additional Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html) for more information on AWS Lambda functions.

## Testing

The project uses `Jest` and `Supertest` for unit and integration testing.
Run the test suite with:
```bash
npm test
```

You can view test coverage reports with:
```bash
npm run coverage
```

## Documentation

This project uses [TypeDoc](https://typedoc.org/) to generate documentation from the TypeScript code comments. To generate and view the documentation, follow these steps:

1. Ensure TypeDoc is installed:
   ```bash
   npm install --save-dev typedoc
   ```
2. Generate the documentation:
   ```bash
   npm run type-docs
   ```
3. The generated documentation will be located in the `docs/` directory. You can open the `index.html` file in your browser to view it.

## Contributing

If you want to contribute to this project, feel free to open an issue or submit a pull request. Any contributions, from bug fixes to new features, are welcome!

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

