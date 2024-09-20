/**
 * @module SuccessManagerTests
 */
import { Response } from 'express';
import { successHandler } from '../../Helper/successManager';

/**
 * Test suite for the successHandler function.
 */
describe('successHandler', () => {
    let mockResponse: Partial<Response>;
    let statusMock: jest.Mock;
    let jsonMock: jest.Mock;

    beforeEach(() => {
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        mockResponse = {
            status: statusMock
        };
    });

    /**
     * Test case for handling success without a provided status code.
     * It verifies that a 200 response is returned with a success message.
     */
    it('should return a 200 response with a success message when no statusCode is provided', () => {
        successHandler('Success message', 0, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({ 
            message: 'Success message',
            accessToken: undefined,
            devices: undefined,
            deviceLogs: undefined,
            lastLog: undefined,
            device: undefined,
            user: undefined,
            deviceShadow: undefined,
        });
    });
    
    /**
     * Test case for handling success with a provided status code.
     * It verifies that the correct status code and message are returned.
     */
    it('should return the provided statusCode and message', () => {
        successHandler('Custom success', 201, mockResponse as Response);

        expect(statusMock).toHaveBeenCalledWith(201);
        expect(jsonMock).toHaveBeenCalledWith({ 
            message: 'Custom success',
            accessToken: undefined,
            devices: undefined,
            deviceLogs: undefined,
            lastLog: undefined,
            device: undefined,
            user: undefined,
            deviceShadow: undefined,
        });
    });

    /**
     * Test case for including an optional access token in the response.
     * It verifies that the access token is included when provided.
     */
    it('should include optional accessToken in the response', () => {
        successHandler('Token success', 200, mockResponse as Response, 'mock_access_token');

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({ 
            message: 'Token success',
            accessToken: 'mock_access_token',
            devices: undefined,
            deviceLogs: undefined,
            lastLog: undefined,
            device: undefined,
            user: undefined,
            deviceShadow: undefined,
        });
    });

    /**
     * Test case for including additional data in the response.
     * It verifies that devices, deviceLogs, lastLog, device, user, and deviceShadow
     * are included in the response when provided.
     */
    it('should include devices, deviceLogs, lastLog, device, user, and deviceShadow if provided', () => {
        const mockDevice = { device_id: 1, cat_num: 'ABC123', user_id: 1, wifi_ssid: 'testSSID', wifi_password: 'testPass', init_vec: 'testIV', presence_connection: true, location: 'Test Location', thing_name: 'ThingName' };
        const mockDeviceLog = { log_id: 1, cat_num: 'ABC123', soil_temp: 25, soil_cap: 70, log_date: '2024-09-18', water: false };
        const mockUser = { user_id: 1, first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', password: 'hashed_password', last_login: null };
        const mockDeviceShadow = {
            state: {
                reported: { welcome: 'Hello', connected: true, auto: true, pump: false },
                desired: { welcome: 'Hello', connected: true, auto: true, pump: false },
            }
        };

        successHandler(
            'Complete success', 
            200, 
            mockResponse as Response, 
            'mock_access_token', 
            [mockDevice], 
            [mockDeviceLog], 
            mockDeviceLog, 
            mockDevice, 
            mockUser, 
            mockDeviceShadow
        );

        expect(statusMock).toHaveBeenCalledWith(200);
        expect(jsonMock).toHaveBeenCalledWith({
            message: 'Complete success',
            accessToken: 'mock_access_token',
            devices: [mockDevice],
            deviceLogs: [mockDeviceLog],
            lastLog: mockDeviceLog,
            device: mockDevice,
            user: mockUser,
            deviceShadow: mockDeviceShadow
        });
    });
});
