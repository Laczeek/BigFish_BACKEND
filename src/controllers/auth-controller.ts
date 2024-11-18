import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';

import User from '../models/User';
import AppError from '../utils/AppError';
import {
	signJWT,
	REFRESH_TOKEN_LIFESPAN,
	verifyJWT,
} from '../utils/jwt-promisified';
import getCookieConfigObject from '../utils/getCookieConfigObject';
import BlacklistedToken from '../models/BlacklistedToken';

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

const refreshToken = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const cookieRefreshToken = req.cookies.refreshToken;
	try {
		if (!cookieRefreshToken)
			throw new AppError(
				'Refresh token is missing. Please log in again.',
				401
			);

		//TODO - CHECK IF TOKEN EXISTS IN BLACK LIST OF REFRESH TOKENS

		const decodedToken = await verifyJWT(cookieRefreshToken, 'refresh');

		const user = await User.findById(decodedToken._id);
		if (!user)
			throw new AppError(
				'User associated with this token no longer exists. Please log in again.',
				401
			);

		const accessToken = await signJWT(
			{ _id: user.id, nickname: user.nickname, role: user.role },
			'access'
		);

		res.status(200).json({ accessToken });
	} catch (err) {
		next(err);
	}
};

const logout = async (req: Request, res: Response, next: NextFunction) => {
	const cookieRefreshToken = req.cookies.refreshToken;
	try {
		if (!cookieRefreshToken)
			throw new AppError('Refresh token is missing.', 400);

		await BlacklistedToken.create({ token: cookieRefreshToken });

		res.clearCookie('refreshToken', getCookieConfigObject(undefined, true));

		res.status(200).send();
	} catch (err) {
		next(err);
	}
};

export default {
	login,
	refreshToken,
	logout
};
