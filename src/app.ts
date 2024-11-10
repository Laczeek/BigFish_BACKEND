import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';

const PORT = process.env.PORT || 8080;
const MONGO_CONNECTION_URI = process.env.MONGO_CONNECTION_URI!;

const app = express();
app.use(morgan('dev'));

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
