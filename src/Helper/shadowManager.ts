import { State, DesiredState, ReportedState } from '../Types/types';
import AWS from 'aws-sdk';

/**
 * AWS SDK configuration for accessing IoT services.
 */
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    region: process.env.AWS_REGION as string
});
  
const iotData = new AWS.IotData({ endpoint: process.env.AWS_IOT_ENDPOINT as string });
  
/**
 * Updates the device shadow in AWS IoT.
 * 
 * @param {string} thingName - The name of the thing in AWS IoT.
 * @param {DesiredState} desiredState - The desired state to be set.
 * @param {ReportedState} [reportedState] - The reported state (optional).
 * @returns {Promise<any>} The response from AWS IoT.
 * @throws {Error} If the update fails.
 */
export const updateDeviceShadow = async (thingName: string, desiredState: DesiredState, reportedState?: ReportedState): Promise<any> => {
    const state: State = {
        desired: desiredState
    };

    if (reportedState !== undefined) {
        state.reported = reportedState;
    }

    
    const params = {
        thingName: thingName,
        payload: JSON.stringify({
            state: state
        })
    };

    try {
        const response = await iotData.updateThingShadow(params).promise();
        const data = JSON.parse(response.payload as string); 
        return data;
    } catch (error) {
        throw new Error('Failed to update device shadow.');
    }
};

/**
 * Retrieves the device shadow from AWS IoT.
 * 
 * @param {string} thingName - The name of the thing in AWS IoT.
 * @returns {Promise<any>} The device shadow data.
 * @throws {Error} If the retrieval fails.
 */
export const getDeviceShadow = async (thingName: string): Promise<any> => {
    const params = {
        thingName: thingName
    };

    try {
        const response = await iotData.getThingShadow(params).promise();
        const data = JSON.parse(response.payload as string); 
        return data;
    } catch(error){
        throw new Error('Failed to get device shadow.');
    }
}