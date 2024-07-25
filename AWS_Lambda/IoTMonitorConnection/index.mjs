//import AWS from 'aws-sdk';
import axios from 'axios';

//const iotData = new AWS.IotData({ endpoint: process.env.AWS_IOT_ENDPOINT });

const client = axios.create({
    baseURL: process.env.BASE_URL,
    
    headers: {
        "x-api-key": process.env.API_KEY
    }
    
});

export const handler = async (event) => {
    
    const thingName = event.thingName;
    const shadowConnection = event.connected;
    
    try {
        await client.post("/dashboard/shadowUpdate", { thingName: thingName, shadowConnection: shadowConnection});
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Shadow Update Posted',
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Error Posting Shadow Update',
                error: error.message
            })
        };
    }  

};

