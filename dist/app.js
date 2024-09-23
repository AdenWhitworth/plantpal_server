"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const authRouter_1 = require("./Routes/authRouter");
const dashboardRouter_1 = require("./Routes/dashboardRouter");
const index_1 = require("./sockets/index");
const http_1 = __importDefault(require("http"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
/**
 * Initializes the WebSocket server.
 * @param {http.Server} server - The HTTP server instance to attach the WebSocket server to.
 */
(0, index_1.initSocket)(server);
app.use((0, cors_1.default)({
    origin: process.env.BASE_URL,
    credentials: true,
}));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({
    extended: true
}));
app.use('/users', authRouter_1.authRouter);
app.use('/dashboard', dashboardRouter_1.dashboardRouter);
(0, index_1.connectSocket)();
/**
 * Error handler for 404 Not Found.
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * @param {NextFunction} next - The next middleware function.
 */
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.statusCode = 404;
    next(err);
});
/**
 * General error handler.
 * @param {ErrorWithStatus} err - The error object with optional status code.
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * @param {NextFunction} next - The next middleware function.
 */
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    res.status(err.statusCode).json({
        message: err.message,
    });
});
const PORT = process.env.PORT || "8080";
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
