import request from 'supertest';
import { app, server } from '../../app';
import { initSocket, connectSocket } from '../../sockets/index';

jest.mock('../../sockets/index', () => ({
    initSocket: jest.fn(),
    connectSocket: jest.fn(),
}));

describe('Integration Tests for Express App', () => {
    afterAll((done) => {
        server.close(done);
    });

    it('should respond with 404 for non-existent routes', async () => {
        const response = await request(app).get('/non-existent-route');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Not Found');
    });

    it('should respond with 500 for internal server errors', async () => {
        const response = await request(app).get('/users/error');
        
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Internal Server Error');
    });

    it('should access authRouter', async () => {
        const response = await request(app).get('/users/test');
        expect(response.status).toBe(200); 
        expect(response.body.message).toBe('Auth route accessed');
    });

    it('should access dashboardRouter', async () => {
        const response = await request(app).get('/dashboard/test');
        expect(response.status).toBe(200); 
        expect(response.body.message).toBe('Dashboard route accessed'); 
    });

    it('should call initSocket when the server starts', () => {
        expect(initSocket).toHaveBeenCalledWith(server);
    });

    it('should call connectSocket when the app initializes', () => {
        expect(connectSocket).toHaveBeenCalled();
    });
});
