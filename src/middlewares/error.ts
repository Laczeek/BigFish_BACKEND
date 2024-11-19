import { NextFunction, Request, Response } from 'express';
import { Error } from 'mongoose';
import { MongoServerError } from 'mongodb';
import { MulterError } from 'multer';

import AppError from '../utils/AppError';

const NODE_ENV = process.env.NODE_ENV || 'PRODUCTION';

const errorMiddleware = (
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	console.error('Error Occured!');
	console.error(err.message);

	// MONGOOSE VALIDATION ERRORS
	if (
		err instanceof Error.ValidationError &&
		err.name === 'ValidationError'
	) {
		const errClone = { ...err };
		const validationErrors = Object.keys(err.errors).map((key) => ({
			field: errClone.errors[key].path,
			msg: errClone.errors[key].message,
		}));

		res.status(400).json({ errors: validationErrors });
		return;
	}
	// UNIQUE INDEXES ERRORS
	if (err instanceof MongoServerError && err.code === 11000) {
		const fieldName = Object.keys(err.keyPattern)[0];
		let msg = `This ${fieldName} is already in use.`;

		// NOTE - IN FUTURE AT THERE IF STATEMENT FOR OTHER UNIQUE FIELDS

		res.status(400).json({
			errors: [{ field: fieldName, msg }],
		});
		return;
	}

	// INCORRECT OBJECT ID
	if (err instanceof Error.CastError && err.kind === 'ObjectId') {
		res.status(400).json({ error: 'Provided ObjectId is invalid.' });
		return;
	}

	// MULTER ERRORS
	if (err instanceof MulterError) {
		res.status(400).json({
			errors: [{ field: 'image', msg: err.field || err.message }],
		});
		return;
	}

	// OPERATIONAL ERRORS
	if (err instanceof AppError && err.field) {
		res.status(err.code).json({
			errors: [{ field: err.field, msg: err.message }],
		});
		return;
	}

	if (err instanceof AppError) {
		res.status(err.code).json({ error: err.message });
		return;
	}

	// NOT EXPECTED ERRORS
	if (NODE_ENV === 'DEVELOPMENT') {
		res.status(500).json({ error: err.message });
	} else {
		res.status(500).json({ error: 'Somethig went wrong on the server.' });
	}
};

export default errorMiddleware;
