import { NextFunction, Request, Response } from 'express';

import User from '../models/User';
import AppError from '../utils/AppError';
import CustomFind from '../utils/CustomFind';
import { IUser } from '../interfaces/user';
import { cloudinaryUpload, cloudinaryDestroy } from '../utils/cloudinaryUpload';

const updateMe = async (req: Request, res: Response, next: NextFunction) => {
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

const getMe = async (req: Request, res: Response, next: NextFunction) => {
	const uid = req.user!._id;
	try {
		const user = await User.findById(uid);
		if (!user)
			throw new AppError(
				'Something went wrong while getting your data.',
				500
			);
		res.status(200).json({ user });
	} catch (err) {
		next(err);
	}
};

const getUserById = async (req: Request, res: Response, next: NextFunction) => {
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

const searchUsersByNickname = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const nickname = req.params.nickname;
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
	getUserById,
	updateMe,
	getMe,
	getUsers,
	searchUsersByNickname,
};
