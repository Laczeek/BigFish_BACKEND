import { NextFunction, Request, Response } from 'express';

import AppError from '../utils/AppError';

const notFoundMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const msg = `${req.method}${req.path} endpoint is not supported.`;
	throw new AppError(msg, 404);
};

export default notFoundMiddleware;
