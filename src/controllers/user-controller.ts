import { NextFunction, Request, Response } from 'express';
import { ClientSession, ObjectId, startSession } from 'mongoose';
import { UploadApiResponse } from 'cloudinary';

import User from '../models/User';
import AppError from '../utils/AppError';
import CustomFind from '../utils/CustomFind';
import { IUser } from '../interfaces/user';
import { cloudinaryUpload, cloudinaryDestroy } from '../utils/cloudinaryUpload';

const updateMe = async (req: Request, res: Response, next: NextFunction) => {
	const uid = req.user!._id;
	const allowedFields = ['nickname', 'favMethod', 'description'];
	const body = { ...req.body };
	let cloudinaryResult: null | UploadApiResponse | undefined = null;
	let previousImagePublicId: null | string = null;

	Object.keys(body).forEach((key) => {
		if (!allowedFields.includes(key)) {
			delete body[key];
		}
	});

	try {
		const user = await User.findById(uid);
		if (!user) throw new AppError('It failed to update your data.', 500);

		if (req.file) {
			cloudinaryResult = await cloudinaryUpload(
				'avatars',
				req.file.buffer
			);

			previousImagePublicId = user.avatar.public_id;

			body.avatar = {
				url: cloudinaryResult!.url,
				public_id: cloudinaryResult!.public_id,
			};
		}

		user.set(body);
		const updatedUser = await user.save({ validateModifiedOnly: true });

		if (req.file && cloudinaryResult && previousImagePublicId) {
			cloudinaryDestroy(previousImagePublicId);
		}

		res.status(200).json({ user: updatedUser });
	} catch (err) {
		if (req.file && cloudinaryResult) {
			cloudinaryDestroy(cloudinaryResult.public_id);
		}

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

const observeUser = async (req: Request, res: Response, next: NextFunction) => {
	const uid = req.params.uid;
	let session: ClientSession | null = null;
	try {
		if (uid === req.user!._id)
			throw new AppError('You cannot observe your self.', 400);

		let authenticatedUser = await User.findById(req.user!._id);
		if (!authenticatedUser)
			throw new AppError(
				'Something went wrong. Please log in again.',
				500
			);

		session = await startSession();
		session.startTransaction();

		const observedUserIndex = authenticatedUser.myHooks.findIndex(
			(oid) => oid.toString() === uid
		);

		if (observedUserIndex !== -1) {
			await User.findByIdAndUpdate(
				uid,
				{ $inc: { hooksAmount: -1 } },
				{ session }
			);
			authenticatedUser.myHooks.splice(observedUserIndex, 1);
		} else {
			await User.findByIdAndUpdate(
				uid,
				{ $inc: { hooksAmount: 1 } },
				{ session }
			);
			authenticatedUser.myHooks.push(uid as unknown as ObjectId);
		}

		await authenticatedUser.save({ validateModifiedOnly: true, session });

		await session.commitTransaction();

		res.status(200).json({ myHooks: authenticatedUser.myHooks });
	} catch (err) {
		if (session) {
			await session.abortTransaction();
		}
		next(err);
	} finally {
		if (session) {
			await session.endSession();
		}
	}
};

export default {
	getUserById,
	updateMe,
	getMe,
	getUsers,
	searchUsersByNickname,
	observeUser,
};
