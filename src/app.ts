import express from 'express';
import morgan from 'morgan';

const PORT = process.env.PORT || 8080;

const app = express();
app.use(morgan('dev'))


app.listen(PORT, () => {
    console.log('HTTP server listening on port: ' + PORT);
})