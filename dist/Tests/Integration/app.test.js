"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../../app");
const index_1 = require("../../sockets/index");
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
        app_1.server.close();
    });
    beforeAll(() => {
        app_1.server.close();
    });
    /**
     * Test case for non-existent routes.
     * It verifies that a 404 response is returned for requests to non-existent routes.
     */
    it('should respond with 404 for non-existent routes', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app_1.app).get('/non-existent-route');
        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Not Found');
    }));
    /**
     * Test case for internal server errors.
     * It verifies that a 500 response is returned for requests that cause internal server errors.
     */
    it('should respond with 500 for internal server errors', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app_1.app).get('/users/error');
        expect(response.status).toBe(500);
        expect(response.body.message).toBe('Internal Server Error');
    }));
    /**
     * Test case for accessing the authRouter.
     * It verifies that the auth route responds correctly.
     */
    it('should access authRouter', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app_1.app).get('/users/test');
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Auth route accessed');
    }));
    /**
     * Test case for accessing the dashboardRouter.
     * It verifies that the dashboard route responds correctly.
     */
    it('should access dashboardRouter', () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app_1.app).get('/dashboard/test');
        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Dashboard route accessed');
    }));
    /**
     * Test case for verifying socket initialization on server start.
     * It ensures that the initSocket function is called with the server instance.
     */
    it('should call initSocket when the server starts', () => {
        expect(index_1.initSocket).toHaveBeenCalledWith(app_1.server);
    });
    /**
     * Test case for verifying socket connection on app initialization.
     * It ensures that the connectSocket function is called during app startup.
     */
    it('should call connectSocket when the app initializes', () => {
        expect(index_1.connectSocket).toHaveBeenCalled();
    });
});
