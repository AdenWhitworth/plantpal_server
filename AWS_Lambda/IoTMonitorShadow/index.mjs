import axios from 'axios';

const client = axios.create({
  baseURL: process.env.BASE_URL,
  headers: {
    "x-api-key": process.env.API_KEY
  }
});

export const handler = async (event) => {
  const { state, thingName } = event;
  const { reported: currentReported, delta: previousReported } = state;

  const updates = [];

  if (previousReported && previousReported.pump !== undefined && currentReported.pump !== previousReported.pump) {
    updates.push(handleUpdate('shadowUpdatePumpWater', thingName, 'shadowPump', currentReported.pump));
  }

  if (previousReported && previousReported.auto !== undefined && currentReported.auto !== previousReported.auto) {
    updates.push(handleUpdate('shadowUpdateAuto', thingName, 'shadowAuto', currentReported.auto));
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

const handleUpdate = async (endpoint, thingName, key, value) => {
  try {
    await client.post(`/dashboard/${endpoint}`, { thingName, [key]: value });
  } catch (error) {
    throw new Error(`Error posting ${key} update: ${error.message}`);
  }
};


