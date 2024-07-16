const AWS = require('aws-sdk');
const iotData = new AWS.IotData({ endpoint: process.env.AWS_IOT_ENDPOINT });

const thingNames = ['PlantPal-thing'];

exports.handler = async (event) => {
  const results = [];

  for (const thingName of thingNames) {
    const params = {
      thingName: thingName,
      shadowName: 'connection'
    };

    try {
      const data = await iotData.getThingShadow(params).promise();
      const payload = JSON.parse(data.payload);
      const connected = payload.state.reported.connected;

      results.push({
        thingName: thingName,
        connected: connected
      });
    } catch (error) {
      results.push({
        thingName: thingName,
        connected: false,
        error: error.message
      });
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Connection status retrieved successfully',
      results: results
    }),
  };
};