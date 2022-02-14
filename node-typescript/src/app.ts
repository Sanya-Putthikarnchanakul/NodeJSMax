import express, { json } from 'express';

const app = express();

import todosRoute from './routes/todos';

app.use(json());
app.use(todosRoute);

app.listen(3000, () => {
    console.log(`App Start on ${new Date()}`);
});