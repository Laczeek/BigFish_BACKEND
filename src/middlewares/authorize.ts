import { NextFunction, Request, Response } from 'express';
import AppError from '../utils/AppError';

const authorize = (allowedRoles: ('admin' | 'moderator' | 'user')[]) => {
	return (req: Request, res: Response, next: NextFunction) => {
		if (!allowedRoles.includes(req.user!.role))
			throw new AppError('You cannot perform this operation.', 401);

		next();
	};
};

export default authorize;