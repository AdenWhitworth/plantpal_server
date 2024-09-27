import axios from 'axios';

const client = axios.create({
  baseURL: process.env.API_URL,
  headers: {
    "x-api-key": process.env.API_KEY
  }
});

export const handler = async (event) => {
    try {
      const { eventType, clientId } = event;
      
      if (!clientId) {
        throw new Error('Client ID is missing in the event.');
      }
  
      const isConnected = eventType === 'connected';
      console.log(`Device ${clientId} ${isConnected ? 'connected' : 'disconnected'}.`);
  
      await updatePresenceConnection(clientId, isConnected);
      
      return createResponse(200, 'Presence Update Posted');
    } catch (error) {
      console.error('Error Processing Event:', {
        message: error.message,
        stack: error.stack,
        event,
      });
      return createResponse(500, 'Error Posting Presence Update', error.message);
    }
  };
  
  const updatePresenceConnection = async (thingName, isConnected) => {
    try {
      await client.post('/dashboard/presenceUpdateConnection', { thingName, presenceConnection: isConnected });
    } catch (error) {
      throw new Error(`Error posting connection update: ${error.message}`);
    }
  };
  
  const createResponse = (statusCode, message, error = null) => {
    return {
      statusCode,
      body: JSON.stringify({
        message,
        ...(error && { error })
      })
    };
  };
