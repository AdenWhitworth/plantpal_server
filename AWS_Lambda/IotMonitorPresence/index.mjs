//AWS IoT Query Statement Trigger:
//SELECT * FROM '$aws/events/presence/connected/#'
//SELECT * FROM '$aws/events/presence/disconnected/#'

import axios from 'axios';

const client = axios.create({
  baseURL: process.env.API_URL,
  headers: {
    "x-api-key": process.env.API_KEY
  }
});

/**
 * AWS Lambda handler for processing device presence events triggered by connection 
 * or disconnection events from AWS IoT.
 * 
 * @param {Object} event - The AWS IoT presence event.
 * @param {string} event.eventType - The type of event ('connected' or 'disconnected').
 * @param {string} event.clientId - The ID of the device (client) that is connecting or disconnecting.
 * 
 * @returns {Promise<Object>} The response object with a status code and message.
 */
export const handler = async (event) => {
  try {
    const { eventType, clientId } = event;
    
    if (!clientId) {
      throw new Error('Client ID is missing in the event.');
    }

    const isConnected = eventType === 'connected';

    await updateShadowConnection(clientId, isConnected);
    
    return createResponse(200, 'Shadow Update(s) Posted');
  } catch (error) {
    console.error('Error Processing Event:', {
      message: error.message,
      stack: error.stack,
      event,
    });
    return createResponse(500, 'Error Posting Shadow Update', error.message);
  }
};

/**
 * Updates the AWS IoT shadow with the current connection status of the device.
 * 
 * @param {string} thingName - The name of the IoT device (Thing).
 * @param {boolean} isConnected - The current connection status of the device (true if connected, false if disconnected).
 * 
 * @returns {Promise<void>} A promise that resolves when the shadow update is posted or throws an error if the update fails.
 * @throws {Error} Throws an error if the HTTP request to update the shadow connection fails.
 */
const updateShadowConnection = async (thingName, isConnected) => {
  try {
    await client.post('/dashboard/presenceUpdateConnection', { thingName, presenceConnection: isConnected });
  } catch (error) {
    throw new Error(`Error posting shadowConnection update: ${error.message}`);
  }
};

/**
 * Creates a response object for the Lambda function.
 * 
 * @param {number} statusCode - The HTTP status code for the response.
 * @param {string} message - The message to include in the response body.
 * @param {string} [error=null] - An optional error message to include in the response body.
 * 
 * @returns {Object} The response object containing the status code and body.
 */
const createResponse = (statusCode, message, error = null) => {
  return {
    statusCode,
    body: JSON.stringify({
      message,
      ...(error && { error })
    })
  };
};
