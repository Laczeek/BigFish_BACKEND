import { NextFunction, Request, Response } from 'express';

import AppError from '../utils/AppError';
import { verifyJWT } from '../utils/jwt-promisified';

const authenticate = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || authHeader.split(' ')[0] !== 'Bearer')
			throw new AppError(
				'Authorization header is missing. Please log in again to access this resource.',
				401
			);

		const token = authHeader.split(' ')[1];
		if (!token)
			throw new AppError(
				'Authorization token is missing. Please log in again to access this resource.',
				401
			);

		const decodedToken = await verifyJWT(token);

		// THIS ALWAYS SHOULD BE ACCESS TOKEN, SO THOSE FIELDS SHOULD BE PRESENT
		req.user = {
			_id: decodedToken._id,
			nickname: decodedToken.nickname!,
			role: decodedToken.role!,
		};

		next();
	} catch (err) {
		next(err);
	}
};

export default authenticate;
