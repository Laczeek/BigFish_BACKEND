import { NextFunction, Request, Response } from 'express';
import geoip from 'geoip-country';

import User from '../models/User';
import AppError from '../utils/AppError';
import CustomFind from '../utils/CustomFind';
import { signJWT, REFRESH_TOKEN_LIFESPAN } from '../utils/jwt-promisified';
import { IUser } from '../interfaces/user';
import getCookieConfigObject from '../utils/getCookieConfigObject';
import { cloudinaryUpload, cloudinaryDestroy } from '../utils/cloudinaryUpload';

const createAccount = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { nickname, email, password, passwordConfirm } = req.body;

	try {
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
				nickname: newUser.nickname,
				role: newUser.role,
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

const updateUser = async (req: Request, res: Response, next: NextFunction) => {
	const uid = req.user!._id;
	const allowedFields = ['nickname', 'favMethod', 'description'];
	const body = { ...req.body };

	Object.keys(body).forEach((key) => {
		if (!allowedFields.includes(key)) {
			delete body[key];
		}
	});

	try {
		const user = await User.findById(uid);
		if (!user) throw new AppError('It failed to update your data.', 500);

		if (req.file) {
			const cloudinaryResult = await cloudinaryUpload(
				'avatars',
				req.file.buffer
			);

			body.avatar = {
				url: cloudinaryResult!.url,
				public_id: cloudinaryResult!.public_id,
			};

			cloudinaryDestroy(user.avatar.public_id);
		}

		user.set(body);
		const updatedUser = await user.save({ validateModifiedOnly: true });

		res.status(200).json({ user: updatedUser });
	} catch (err) {
		next(err);
	}
};

const getSingleUser = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const uid = req.params.uid;

		const user = await User.findById(uid);
		if (!user) throw new AppError('User not found.', 404);

		res.status(200).json({ user });
	} catch (err) {
		next(err);
	}
};

const getUsers = async (req: Request, res: Response, next: NextFunction) => {
	const allowedQueryFields = [
		'country',
		'hooksAmount',
		'fishAmount',
		'nickname',
	];
	try {
		const customFind = new CustomFind<IUser>(
			User,
			req.query,
			allowedQueryFields
		)
			.projection()
			.sort()
			.limit()
			.skip();

		const users = await customFind.query;

		res.json({ length: users.length, users });
	} catch (err) {
		next(err);
	}
};

const getSearchUsers = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const nickname = req.params.nick;
	try {
		const users = await User.find({
			nickname: { $regex: nickname, $options: 'i' },
		})
			.select('nickname avatarURL competition')
			.limit(10);

		res.status(200).json({ users, length: users.length });
	} catch (err) {
		next(err);
	}
};

// CONTROLLERS FOR API/USERS/ME (GET & PUT)

export default {
	createAccount,
	getSingleUser,
	updateUser,
	getUsers,
	getSearchUsers,
};
