import { NextFunction, Request, Response } from 'express';
import geoip from 'geoip-country';

import User from '../models/User';
import AppError from '../utils/AppError';
import CustomFind from '../utils/CustomFind';
import { IUser } from '../interfaces/user';

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

		res.status(201).json({ user: newUser });
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

		res.json({ users });
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
		const allowedQueryFields = [
			'country',
			'hooksAmount',
			'fishAmount',
			'nickname',
		];

		const filter = {
			nickname: { $regex: nickname, $options: 'i' },
		};

		const customFind = new CustomFind<IUser>(
			User,
			req.query,
			allowedQueryFields,
			filter
		)
			.projection()
			.sort()
			.limit()
			.skip();

		const users = await customFind.query;

		res.status(200).json({ users, length: users.length });
	} catch (err) {
		next(err);
	}
};

// CONTROLLERS FOR API/USERS/ME (GET & PUT)

export default {
	createAccount,
	getSingleUser,
	getUsers,
	getSearchUsers,
};
