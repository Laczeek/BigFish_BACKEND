import { NextFunction, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import geoip from 'geoip-country';
import User from '../models/User';
import BlacklistedToken from '../models/BlacklistedToken';
import AppError from '../utils/AppError';
import {
	signJWT,
	REFRESH_TOKEN_LIFESPAN,
	verifyJWT,
} from '../utils/jwt-promisified';
import getCookieConfigObject from '../utils/getCookieConfigObject';
import Ban from '../models/Ban';

const signup = async (req: Request, res: Response, next: NextFunction) => {
	const { nickname, email, password, passwordConfirm } = req.body;

	try {
		const bannedUser = await Ban.findOne({ email });
		if (bannedUser)
			throw new AppError(
				`You have been banned. The reason is: ${bannedUser.reason}`,
				401
			);

		const uip = '103.203.87.255'; //TODO - CHANGE THIS IN FUTURE TO REQ.IP
		const userCountry = geoip.lookup(uip)?.country;
		if (!userCountry)
			throw new AppError(
				'Failed to get your country. Report the problem to the administration.',
				500
			);

		const newUser = new User({
			nickname,
			email,
			password,
			passwordConfirm,
			country: userCountry,
		});

		await newUser.save({ j: true, w: 2 });

		newUser.set('password', undefined);

		const accessToken = await signJWT(
			{
				_id: newUser.id,
				nickname: newUser.nickname,
				role: newUser.role,
			},
			'access'
		); // 15 MINS

		const refreshToken = await signJWT(
			{
				_id: newUser.id,
			},
			'refresh'
		); // 3 DAYS

		res.cookie(
			'refreshToken',
			refreshToken,
			getCookieConfigObject(1000 * REFRESH_TOKEN_LIFESPAN) // 1000 x BCS TIME MUST BE PRESENTS AS MS
		);

		res.status(201).json({ user: newUser, accessToken });
	} catch (err) {
		next(err);
	}
};

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

		const isTokenInBlacklist = await BlacklistedToken.findOne({
			token: cookieRefreshToken,
		});
		if (isTokenInBlacklist)
			throw new AppError("You can't get a new access token.", 401);

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
	signup,
	login,
	refreshToken,
	logout,
};
