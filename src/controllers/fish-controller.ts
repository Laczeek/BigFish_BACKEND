import { NextFunction, Request, Response } from 'express';
import { ClientSession, startSession } from 'mongoose';
import { UploadApiResponse } from 'cloudinary';
import xss from 'xss';

import Fish from '../models/Fish';
import User from '../models/User';
import AppError from '../utils/AppError';
import { cloudinaryDestroy, cloudinaryUpload } from '../utils/cloudinaryUpload';
import CustomFind from '../utils/CustomFind';
import { IFish } from '../interfaces/fish';

const addFish = async (req: Request, res: Response, next: NextFunction) => {
	const {
		name,
		description,
		whenCaught,
		measurementType,
		measurementUnit,
		measurementValue,
		address,
	} = req.body;

	let clouadinaryResult: undefined | null | UploadApiResponse = null;
	let session: ClientSession | null = null;

	try {
		if (!req.file)
			throw new AppError('Please provide an image.', 400, 'image');
		if (!address)
			throw new AppError(
				'Please provide the address where the fish was caught.',
				400,
				'address'
			);

		const inputDate = new Date(whenCaught).setHours(0, 0, 0, 0);
		const today = new Date().setHours(0, 0, 0, 0);

		if (inputDate > today)
			throw new AppError(
				'Please give the correct date when the fish was caught.',
				400,
				'whenCaught'
			);

		const measurement = {
			type: measurementType,
			unit: measurementUnit,
			value: measurementValue,
		};

		const geoResponse = await fetch(
			`https://api.geoapify.com/v1/geocode/search?text=${address}&format=json&apiKey=${process.env.GEOAPIFY_KEY}`
		);

		const resData = await geoResponse.json();
		const geoData = resData.results[0];
		if (!geoData)
			throw new AppError(
				'Something went wrong when finding the location.',
				500,
				'address'
			);

		const location = {
			type: 'Point',
			address: geoData.formatted,
			countryCode: geoData.country_code,
			coordinates: [geoData.lon, geoData.lat],
		};

		clouadinaryResult = await cloudinaryUpload('fish', req.file.buffer);

		const image = {
			url:
				process.env.NODE_ENV === 'DEVELOPMENT'
					? clouadinaryResult?.url
					: clouadinaryResult?.secure_url,
			public_id: clouadinaryResult?.public_id,
		};

		const sanitizedName = xss(name);
		const sanitizedDescription = xss(description);

		session = await startSession();
		session.startTransaction();

		const newFish = new Fish({
			name: sanitizedName,
			description: sanitizedDescription,
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
			throw new AppError('Fish for provided id does not exist.', 404);

		cloudinaryDestroy(deletedFish.image.public_id);

		await User.findByIdAndUpdate(
			req.user!._id,
			{ $inc: { fishAmount: -1 } },
			{ session }
		);

		await session.commitTransaction();

		res.status(200).json({ msg: 'Fish successfully removed.' });
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

const getFish = async (req: Request, res: Response, next: NextFunction) => {
	const allowedFields = [
		'name',
		'whenCaught',
		'measurement.type',
		'measurement.unit',
		'measurement.value',
		'location.countryCode',
	];
	try {
		let addressFilter = {};
		if (
			req.query['location.address'] &&
			typeof req.query['location.address'] === 'string'
		) {
			addressFilter = {
				'location.address': {
					$regex: req.query['location.address'],
					$options: 'i',
				},
			};
		}

		const customFind = new CustomFind<IFish>(
			Fish,
			req.query,
			allowedFields,
			addressFilter
		)
			.projection()
			.limit()
			.skip();

		const fish = await customFind.query;

		res.status(200).json({ length: fish.length, fish });
	} catch (err) {
		next(err);
	}
};

const getUsersFish = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const filter = {
			user: req.params.uid,
		};

		const customFind = new CustomFind(Fish, req.query, [], filter)
			.sort()
			.limit()
			.skip();

		const totalCount = await Fish.countDocuments(filter);
		const fish = await customFind.query;

		res.status(200).json({ totalCount, length: fish.length, fish });
	} catch (err) {
		next(err);
	}
};

const getLatestFishesOfObservedUsers = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const user = await User.findById(req.user!._id).select('myHooks');
		if (!user) throw new AppError('Something went wrong.', 500);

		const nowLocal = new Date();
		nowLocal.setHours(0, 0, 0, 0);

		const latestFishes = await Fish.find({
			user: { $in: user.myHooks },
			whenCaught: { $gte: nowLocal },
		})
			.limit(20)
			.populate('user', 'nickname avatar');

		res.status(200).json({
			length: latestFishes.length,
			fish: latestFishes,
		});
	} catch (err) {
		next(err);
	}
};

export default {
	addFish,
	getFish,
	removeFish,
	getUsersFish,
	getLatestFishesOfObservedUsers,
};
