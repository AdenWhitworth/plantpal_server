import request from 'supertest';
import { app, server } from '../../app';
import { initSocket, connectSocket } from '../../sockets/index';

/**
 * Mocking the socket.
 */
jest.mock('../../sockets/index', () => ({
    initSocket: jest.fn(),
    connectSocket: jest.fn(),
}));

/**
 * Integration tests for the Express application.
 * Tests various endpoints and socket initialization behavior.
 */
describe('Integration Tests for Express App', () => {
    afterAll(() => {
        server.close();
    });

    beforeAll(() => {
        server.close();
    });

    /**
     * Test case for non-existent routes.
     * It verifies that a 404 response is returned for requests to non-existent routes.
     */
    it('should respond with 404 for non-existent routes', async () => {
        const response = await request(app).get('/non-existent-route');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Not Found');
    });

    /**
     * Test case for internal server errors.
     * It verifies that a 500 response is returned for requests that cause internal server errors.
     */
    it('should respond with 500 for internal server errors', async () => {
        const response = await request(app).get('/users/error');
        
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Internal Server Error');
    });

    /**
     * Test case for accessing the authRouter.
     * It verifies that the auth route responds correctly.
     */
    it('should access authRouter', async () => {
        const response = await request(app).get('/users/test');
        expect(response.status).toBe(200); 
        expect(response.body.message).toBe('Auth route accessed');
    });

    /**
     * Test case for accessing the dashboardRouter.
     * It verifies that the dashboard route responds correctly.
     */
    it('should access dashboardRouter', async () => {
        const response = await request(app).get('/dashboard/test');
        expect(response.status).toBe(200); 
        expect(response.body.message).toBe('Dashboard route accessed'); 
    });

    /**
     * Test case for verifying socket initialization on server start.
     * It ensures that the initSocket function is called with the server instance.
     */
    it('should call initSocket when the server starts', () => {
        expect(initSocket).toHaveBeenCalledWith(server);
    });

    /**
     * Test case for verifying socket connection on app initialization.
     * It ensures that the connectSocket function is called during app startup.
     */
    it('should call connectSocket when the app initializes', () => {
        expect(connectSocket).toHaveBeenCalled();
    });
});
