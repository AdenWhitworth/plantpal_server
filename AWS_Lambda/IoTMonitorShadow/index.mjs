//AWS IoT Query Statement Trigger:
//SELECT topic(3) as thingName, state.reported.*, state.desired.*, * FROM '$aws/things/+/shadow/update/accepted'

import axios from 'axios';

const client = axios.create({
  baseURL: process.env.API_URL,
  headers: {
    "x-api-key": process.env.API_KEY
  }
});

/**
 * AWS Lambda handler for processing shadow updates from AWS IoT. 
 * Triggered by changes to the AWS IoT shadow's reported and desired states.
 * 
 * @param {Object} event - The AWS IoT event object.
 * @param {string} event.thingName - The name of the IoT device (Thing).
 * @param {Object} event.state - The shadow state containing `reported` and `desired` states.
 * @param {Object} event.state.reported - The reported state from the IoT shadow.
 * @param {Object} event.state.desired - The desired state from the IoT shadow.
 * 
 * @returns {Promise<Object>} The response object with a status code and message.
 */
export const handler = async (event) => {
  const { thingName, state } = event;
  const reported = state.reported;
  const desired = state.desired;
  
  const updates = [];
  
  if (reported?.pump !== undefined && desired?.pump !== undefined && reported.pump && desired.pump) {
    updates.push(handleUpdate('shadowUpdatePumpWater', thingName, 'shadowPump', reported.pump));
  }

  if (reported?.auto !== undefined && desired?.auto !== undefined && reported.auto === desired.auto) {
    updates.push(handleUpdate('shadowUpdateAuto', thingName, 'shadowAuto', reported.auto));
  }

  if (updates.length === 0) {
    return {
      statusCode: 204,
      body: JSON.stringify({
        message: 'No updates were necessary'
      })
    };
  }
  
  try {
    await Promise.all(updates);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Shadow Update(s) Posted'
      })
    };
  } catch (error) {
    console.error('Error Posting Shadow Update:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error Posting Shadow Update',
        error: error.message
      })
    };
  }
};

/**
 * Helper function to post updates to the dashboard API.
 * 
 * @param {string} endpoint - The API endpoint to post the update to.
 * @param {string} thingName - The name of the IoT device (Thing).
 * @param {string} key - The shadow key being updated (e.g., 'shadowPump', 'shadowAuto').
 * @param {any} value - The value of the shadow key being updated.
 * 
 * @returns {Promise<void>} A promise that resolves when the update is posted or throws an error if the update fails.
 * @throws {Error} Throws an error if the HTTP request fails.
 */
const handleUpdate = async (endpoint, thingName, key, value) => {
  try {
    await client.post(`/dashboard/${endpoint}`, { thingName, [key]: value });
  } catch (error) {
    throw new Error(`Error posting ${key} update: ${error.message}`);
  }
};


