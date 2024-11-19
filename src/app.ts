import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import userRouter from './routers/user-router';
import authRouter from './routers/auth-router';
import fishRouter from './routers/fish-router';

import notFoundMiddleware from './middlewares/notfound';
import errorMiddleware from './middlewares/error';

const PORT = process.env.PORT || 8080;
const MONGO_CONNECTION_URI = process.env.MONGO_CONNECTION_URI!;

const app = express();

app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());

app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/fish', fishRouter);

app.all('*', notFoundMiddleware);

app.use(errorMiddleware);

mongoose.connect(MONGO_CONNECTION_URI).then(() => {
	console.log('The connection to the mongo server has been established.');
	app.listen(PORT, () => {
		console.log(`HTTP server listening on port: ${PORT}.`);
	});
});

process.on('uncaughtException', (err) => {
	console.error('Error occured! 💥');
	console.error(err);
	process.exit(1);
});
