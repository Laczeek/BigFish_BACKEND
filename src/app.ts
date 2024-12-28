import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';

import userRouter from './routers/user-router';
import authRouter from './routers/auth-router';
import fishRouter from './routers/fish-router';
import reportRouter from './routers/report-router';
import competitionRouter from './routers/competition-router';

import notFoundMiddleware from './middlewares/notfound';
import errorMiddleware from './middlewares/error';

const PORT = process.env.PORT || 8080;
const MONGO_CONNECTION_URI = process.env.MONGO_CONNECTION_URI!;

const corsConfig = {
	origin: "https://bigfishes.org",
	credentials: true,
};

const app = express();
app.set('trust proxy', true);
app.use(cors(corsConfig));
app.use(helmet());
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(mongoSanitize());

app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/fish', fishRouter);
app.use('/api/reports', reportRouter);
app.use('/api/competitions', competitionRouter);

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
