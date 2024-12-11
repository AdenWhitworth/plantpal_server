<img width="80" src="https://github.com/AdenWhitworth/PlantPal_Front-End/raw/master/src/Images/PlantPal%20Logo.svg" alt="PlantPal Logo">

# PlantPal Server

Welcome to the **PlantPal Server**, the backend API for PlantPal, an application designed to help plant enthusiasts monitor and manage their plants. This repository contains the Node.js backend that powers PlantPal's user authentication, device data tracking, and plant care management features.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [PlantPal Live Demo](#plantpal-live-demo)
- [Technologies Used](#technologies-used)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Backend](#running-the-backend)
- [API Endpoints](#api-endpoints)
- [AWS Lambda Functions](#aws-lambda-functions)
- [Database Structure](#database-structure)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Documentation](#documentation)
- [Future Features](#future-features)
- [Contributing](#contributing)
- [License](#license)

## Overview

PlantPal is an application that allows users to monitor their plants through IoT devices. This repository handles the server-side logic for user authentication, device management, and plant data processing. It is built with Node.js and follows REST API principles to ensure scalability and efficiency.

## PlantPal Live Demo

The PlantPal application is live and can be accessed at [PlantPal Demo](https://www.plantpalhome.com/). This application integrates seamlessly with the PlantPal back-end, offering an intuitive experience for managing your plants remotely.

<img width="600" src="https://github.com/AdenWhitworth/aden_whitworth_portfolio/raw/master/src/Images/plantpal_demo.png" alt="PlantPal Demo">

### Test User Credentials

You can explore the full functionality of the PlantPal application using the following demo account:

- **Email:** support@plantpalhome.com
- **Password:** testpassword123

Please note that this test account is connected to an actual PlantPal device in my kitchen, so any interactions may affect its operation. Feel free to explore, but please be considerate of its usage!

## Features

- **User Authentication**: Register, log in, and manage users with secure password hashing and JWT-based access & refresh authentication.
- **Device Integration**: Manage IoT devices that track plant conditions (e.g., soil moisture, temperature).
- **Plant Management**: Add and manage plants in the system, linking them with devices for real-time monitoring.
- **Data Analytics**: Fetch historical and real-time data from the PlantPal devices, and generate insights for plant care.
- **Automated CI/CD Pipeline**: Ensures code quality with automated testing, builds, and deployments. Features seamless integration with GitHub Actions and DigitalOcean for backend deployment, providing a streamlined and reliable development workflow.

## Technologies Used

- **Node.js**: Backend runtime environment for executing JavaScript on the server.
- **Express.js**: Web framework for building the RESTful API.
- **TypeScript**: A strongly typed superset of JavaScript that enhances code quality and provides better tooling and type safety during development.
- **MySQL**: SQL database for storing user, plant, and device data.
- **JWT (JSON Web Tokens)**: Used for secure authentication.
- **Socket.IO**: A library that facilitates real-time, bidirectional communication between clients and servers, crucial for features like live updates and notifications.
- **Jest**: A delightful JavaScript testing framework that ensures the reliability of the application by allowing developers to write unit tests for their functions and components.
- **TypeDoc**: A documentation generator for TypeScript projects that creates consistent and user-friendly API documentation, making it easier for developers to understand and use the codebase.
- **Nodemailer**: A robust email-sending library for Node.js applications, enabling seamless integration with email services for confirming purchases and resetting passwords.
- **Amazon Web Services (AWS)**: 
  - **RDS**: For cloud-hosted SQL database management.
  - **IoT Core**: For handling MQTT protocols.
  - **Lambda**: For processing event-driven changes in SQL and MQTT data.
- **GitHub Actions**: A robust CI/CD platform that automates workflows such as testing, building, and deploying the application. GitHub Actions ensures consistent code quality and streamlines deployments to production environments.
- **DigitalOcean**: A scalable cloud hosting platform used for deploying and managing the backend. The project uses DigitalOcean's App Platform for hosting and integrates with the DigitalOcean API for automated deployments.

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
  BASE_URL_WWW=your_front-end_www_url  # The base www URL for your frontend application
  LAMBDA_URL_PRESCENCE=your_aws_prescence_lambda_url #The URL for your lambda presence function
  LAMBDA_URL_SHADOW=your_aws_shadow_lambda_url #The URL for your lambda shadow function
  API_URL=your_api_url #The API URL for your lambda functions to call your backend api with.

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
  AUTH_EMAIL_PORT=your_host_port  # Port for the email service
  
  # Environment configuration
  APP_ENV=production #| development  # Set to 'production' or 'development'
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
   - Add a function URL to the `IotMonitorPresence` and `IotMonitorShadow` lambda functions for use in the API enviroment variables

3. **Testing the Functions**:
   - You can test the deployed functions using the AWS Management Console or AWS CLI.

### Environment Variables for Lambda Functions

Each of the three Lambda functions requires the following environment variable:

```text
# API configuration
API_URL=your_api_url #The API URL for your lambda functions to call your backend api with.
API_KEY=your_api_key  # Your API key for third-party services

# MySQL database configuration
RDS_DATABASE=plantpal_app  # The name of the MySQL database
RDS_HOSTNAME=your_aws_rds_endpoint  # Your AWS RDS endpoint for cloud hosted or ip for local development
RDS_PASSWORD=your_mysql_password  # Your MySQL password
RDS_USERNAME=your_mysql_user  # Your MySQL username
```
Please refer to the [Environment Variables](#environment-variables) section for details on how to configure them.

### Additional Resources

- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html) for more information on AWS Lambda functions.

## Database Structure

The PlantPal application uses a MySQL database to store user and device information, as well as logs related to plant care. Below is an overview of the main tables in the database, including their fields and relationships.

### Users Table

| Field                     | Type          | Description                                       |
|---------------------------|---------------|---------------------------------------------------|
| `user_id`                 | `int(11)`    | Unique identifier for each user (Primary Key)    |
| `first_name`              | `varchar(50)` | User's first name                                |
| `last_name`               | `varchar(50)` | User's last name                                 |
| `email`                   | `varchar(50)` | User's email address (Unique)                    |
| `password`                | `varchar(200)`| Hashed password for authentication                |
| `refresh_token`           | `varchar(255)`| Token for refreshing user sessions                |
| `reset_token_expiry`      | `DATETIME`    | Expiry date for password reset tokens             |
| `reset_token`             | `varchar(255)`| Password reset token                              |
| `last_login`              | `DATETIME`    | Timestamp of the user's last login                |
| `socket_id`               | `varchar(255)`| ID for managing user socket connections           |

### Devices Table

| Field                     | Type          | Description                                       |
|---------------------------|---------------|---------------------------------------------------|
| `device_id`               | `int(11)`    | Unique identifier for each device (Primary Key)    |
| `cat_num`                 | `varchar(50)` | Foreign key linking to the `factoryDevices` table |
| `user_id`                 | `int(11)`    | Foreign key linking to the `users` table           |
| `wifi_ssid`               | `varchar(50)` | Wi-Fi SSID for the device                         |
| `wifi_password`           | `TEXT`        | Wi-Fi password for the device                     |
| `init_vec`                | `varchar(255)`| Initialization vector for encryption              |
| `presence_connection`     | `BOOLEAN`     | Indicates device connection presence              |
| `location`                | `varchar(50)` | Device location                                   |
| `thing_name`              | `varchar(255)`| Foreign key linking to the `factoryDevices` table |

### DeviceLogs Table

| Field                     | Type          | Description                                       |
|---------------------------|---------------|---------------------------------------------------|
| `log_id`                  | `int(11)`    | Unique identifier for each log (Primary Key)     |
| `cat_num`                 | `varchar(50)` | Foreign key linking to the `devices` table        |
| `soil_temp`               | `FLOAT`       | Soil temperature reading                           |
| `soil_cap`                | `int(11)`    | Soil moisture capacitance                             |
| `log_date`                | `TIMESTAMP`   | Timestamp of when the log was created             |
| `water`                   | `BOOLEAN`     | Indicates if the plant was watered                 |

### FactoryDevices Table

| Field                     | Type          | Description                                       |
|---------------------------|---------------|---------------------------------------------------|
| `factory_id`              | `int(11)`    | Unique identifier for each factory device (Primary Key) |
| `cat_num`                 | `varchar(50)` | Catalog number for factory devices (Unique)        |
| `factory_date`            | `DATETIME`    | Date the factory device was created               |
| `thing_name`              | `varchar(255)`| Unique name for the factory device (Unique)       |

### Relationships

- The **users** table is linked to the **devices** table via `user_id`, allowing each user to have multiple devices.
- The **devices** table connects to the **deviceLogs** table through the `cat_num`, enabling logging of multiple entries for each device.
- The **devices** table also references the **factoryDevices** table, establishing a link between user devices and factory settings.

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

## CI/CD Pipeline

The project uses **GitHub Actions** to automate testing, building, and deployment to **DigitalOcean**.

### DigitalOcean Setup

1. **DigitalOcean App Platform**:  
   - Ensure your backend is set up on DigitalOcean's App Platform.  
   - Note the `APP_ID` from your DigitalOcean App Platform dashboard. This ID is required for triggering deployments via the API.

2. **Environment Variables**: Configure the same environment variables in DigitalOcean's App Settings as defined locally in the `.env` file. These include:
  - `PORT`
  - `MYSQL_USER`
  - `MYSQL_PASSWORD`
  - `MYSQL_DATABASE`
  - `RDS_ENDPOINT`
  - `cryptoSecretKey`
  - `API_KEY`
  - `API_CLIENT_KEY`
  - `BASE_URL`
  - `BASE_URL_WWW`
  - `LAMBDA_URL_PRESCENCE`
  - `LAMBDA_URL_SHADOW`
  - `API_URL`
  - `AWS_ACCESS_KEY_ID`
  - `AWS_SECRET_ACCESS_KEY`
  - `AWS_REGION`
  - `AWS_IOT_ENDPOINT`
  - `AUTH_REFRESH_TOKEN_SECRET`
  - `AUTH_REFRESH_TOKEN_EXPIRY`
  - `AUTH_ACCESS_TOKEN_SECRET`
  - `AUTH_ACCESS_TOKEN_EXPIRY`
  - `RESET_PASSWORD_TOKEN_EXPIRY_MINS`
  - `AUTH_EMAIL_USERNAME`
  - `AUTH_EMAIL_PASSWORD`
  - `EMAIL_FROM`
  - `AUTH_EMAIL_HOST`
  - `AUTH_EMAIL_PORT`
  - `APP_ENV`

3. **DigitalOcean API Token**:  
   - Generate an API token in the DigitalOcean dashboard under **API > Tokens/Keys**.  
   - Add this token to your GitHub repository's secrets as `DIGITALOCEAN_API_TOKEN` along with the app ID as `DIGITALOCEAN_APP_ID`.

### GitHub Actions Deployment

#### Setup

Ensure that the following `env` variables are added to the GitHub repository's secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_REGION`
- `AWS_IOT_ENDPOINT`
- `DIGITALOCEAN_API_TOKEN`
- `DIGITALOCEAN_APP_ID`

#### Pipeline

The deployment process is triggered through the CI/CD pipeline, which performs the following steps:

1. **Code Checkout**: Fetches the latest changes from the repository.
2. **Dependency Installation**: Installs all required dependencies using `npm install`.
3. **Testing**: Runs the test suite with `Jest` to validate code quality and functionality.
4. **Build Process**: Compiles the TypeScript files into JavaScript using `npm run build`.
5. **Authentication with DigitalOcean**: Sets up the DigitalOcean CLI (`doctl`) and authenticates using the API token.
6. **Deployment**: Triggers a deployment in DigitalOcean's App Platform by calling the API.

The CI/CD pipeline is defined in `.github/workflows/deploy.yml`.

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

## Future Features

We're excited about the upcoming features that will enhance the PlantPal experience:

1. **Stripe Checkout**: Streamline the purchasing process for PlantPal devices, making PlantPal commercially available to help people care for their plants.
2. **Notification System**: Implement text or push notifications to keep users updated on their plants' status, ensuring they never miss important alerts.
3. **Battery Management**: Introduce a battery indicator and management feature for PlantPal devices, helping users monitor power levels and extend device longevity.

## Contributing

If you want to contribute to this project, feel free to open an issue or submit a pull request. Any contributions, from bug fixes to new features, are welcome!

## License

This project is licensed under the MIT License. See the LICENSE file for more details.

