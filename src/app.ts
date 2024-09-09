import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import {authRouter} from './Routes/authRouter';
import {dashboardRouter} from './Routes/dashboardRouter';
import { initSocket, connectSocket } from './sockets/index';
import http from 'http';
import cookieParser from 'cookie-parser';

const app = express();
const server = http.createServer(app);

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

interface ErrorWithStatus extends Error {
  statusCode?: number;
}

app.use((req: Request, res: Response, next: NextFunction) => {
    const err: ErrorWithStatus = new Error('Not Found');
    err.statusCode = 404;
    next(err);
  });

app.use((err: ErrorWithStatus, req: Request, res: Response, next: NextFunction) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    res.status(err.statusCode).json({
      message: err.message,
    });
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});