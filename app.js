import createError from 'http-errors';
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import {router as indexRouter} from './router.js';

const app = express();

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cors());
app.use('/users', indexRouter);

app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Server Error";
    res.status(err.statusCode).json({
      message: err.message,
    });
});

app.listen(3000,() => console.log('Server is running on port 3000'));

/* Test App with notes database
import express from 'express';

import { getNotes, getNote, createNote } from './database.js';

const app = express();

app.use(express.json);

app.get("/notes", async (req, res) =>{
    const notes = await getNotes();
    res.send(notes);
});

app.get("/notes/:id", async (req, res) =>{
    const id = req.params.id;
    const note = await getNote(id);
    res.send(note);
});

app.post("/notes", async (req, res) => {
    const {title, contents} = req.body;
    const note = await createNote(title,contents);
    res.status(201).send(note);
});

app.use((err, req, res, next) =>{
    console.error(err.stack);
    res.status(500).send('Something Broke!');
});

app.listen(8080, () => {
    console.log('Server is runnning on port 8080');
});

*/