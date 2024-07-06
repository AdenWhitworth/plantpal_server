import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import {authRouter} from './Routes/authRouter.js';
import {dashboardRouter} from './Routes/dashboardRouter.js';

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cors());
app.use('/users', authRouter);
app.use('/dashboard', dashboardRouter);

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

app.listen(8080,() => console.log('Server is running on port 8080'));