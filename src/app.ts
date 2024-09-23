import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import {authRouter} from './Routes/authRouter';
import {dashboardRouter} from './Routes/dashboardRouter';
import { initSocket, connectSocket } from './sockets/index';
import http from 'http';
import cookieParser from 'cookie-parser';
import { ErrorWithStatus } from './Types/types';

const app = express();
const server = http.createServer(app);

/**
 * Initializes the WebSocket server.
 * @param {http.Server} server - The HTTP server instance to attach the WebSocket server to.
 */
initSocket(server);

app.use(cors({
  origin: process.env.BASE_URL as string,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use('/users', authRouter);
app.use('/dashboard', dashboardRouter);

connectSocket();


/**
 * Error handler for 404 Not Found.
 * @param {Request} req - The HTTP request object.
 * @param {Response} res - The HTTP response object.
 * @param {NextFunction} next - The next middleware function.
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  const err: ErrorWithStatus = new Error('Not Found');
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
app.use((err: ErrorWithStatus, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    res.status(err.statusCode).json({
      message: err.message,
    });
});

const PORT = process.env.PORT as string || "8080";
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { app, server };