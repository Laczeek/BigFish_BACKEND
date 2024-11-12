import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';

import User from '../models/User';
import AppError from '../utils/AppError';
import { signJWT, REFRESH_TOKEN_LIFESPAN } from '../utils/jwt-promisified';
import getCookieConfigObject from '../utils/getCookieConfigObject';

const login = async (req: Request, res: Response, next: NextFunction) => {
	const { email, password } = req.body;
	try {
		if (!email || !password)
			throw new AppError('Invalid credentials.', 400); 

		const user = await User.findOne({ email }).select('+password');
		if (!user) throw new AppError('Invalid credentials', 401);

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) throw new AppError('Invalid credentials', 401);

		const accessToken = await signJWT(
			{ _id: user.id, nickname: user.nickname, role: user.role },
			'access'
		);
		const refreshToken = await signJWT({ _id: user.id }, 'refresh');

		res.cookie(
			'refreshToken',
			refreshToken,
			getCookieConfigObject(1000 * REFRESH_TOKEN_LIFESPAN)
		);

		user.set('password', undefined);
		res.status(200).json({ user, accessToken });
	} catch (err) {
		next(err);
	}
};

export default {
	login,
};
