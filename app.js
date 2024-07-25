import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import {authRouter} from './Routes/authRouter.js';
import {dashboardRouter} from './Routes/dashboardRouter.js';
import { initSocket, connectSocket } from './Sockets/index.js';
import http from 'http';

const app = express();
const server = http.createServer(app);

initSocket(server);

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use('/users', authRouter);
app.use('/dashboard', dashboardRouter);

connectSocket();

app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    res.status(err.statusCode).json({
      message: err.message,
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});