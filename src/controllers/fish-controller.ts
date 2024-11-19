import { NextFunction, Request, Response } from 'express';
import { ClientSession, startSession } from 'mongoose';
import { UploadApiResponse } from 'cloudinary';

import Fish from '../models/Fish';
import { cloudinaryDestroy, cloudinaryUpload } from '../utils/cloudinaryUpload';
import AppError from '../utils/AppError';
import User from '../models/User';

const addFish = async (req: Request, res: Response, next: NextFunction) => {
	const {
		name,
		description,
		whenCaught,
		measurementType,
		measurementUnit,
		measurementValue,
	} = req.body;

	let clouadinaryResult: undefined | null | UploadApiResponse = null;
	let session: ClientSession | null = null;

	try {
		if (!req.file) throw new AppError('Please provide an image.', 400);

		const measurement = {
			type: measurementType,
			unit: measurementUnit,
			value: measurementValue,
		};

		const location = {
			type: 'Point',
			coordinates: [1, 2],
		};

		clouadinaryResult = await cloudinaryUpload('fish', req.file.buffer);

		const image = {
			url: clouadinaryResult?.url,
			public_id: clouadinaryResult?.public_id,
		};

		session = await startSession();
		session.startTransaction();

		const newFish = new Fish({
			name,
			description,
			whenCaught,
			measurement,
			location,
			user: req.user!._id,
			image,
		});

		await newFish.save({ session });

		await User.findByIdAndUpdate(
			req.user!._id,
			{ $inc: { fishAmount: 1 } },
			{ session }
		);

		await session.commitTransaction();

		res.status(201).json({ fish: newFish });
	} catch (err) {
		if (req.file && clouadinaryResult) {
			cloudinaryDestroy(clouadinaryResult.public_id);
		}

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

const removeFish = async (req: Request, res: Response, next: NextFunction) => {
	const fid = req.params.fid;
	let session: ClientSession | null = null;
	try {
		session = await startSession();
		session.startTransaction();

		const deletedFish = await Fish.findByIdAndDelete(fid, { session });
		if (!deletedFish)
			throw new AppError('Fish for provided id does not exist.', 400);

		cloudinaryDestroy(deletedFish.image.public_id);

		await User.findByIdAndUpdate(
			req.user!._id,
			{ $inc: { fishAmount: -1 } },
			{ session }
		);

		await session.commitTransaction();

		res.status(204).send();
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
	addFish,
	removeFish,
};
