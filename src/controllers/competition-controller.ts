import { Request, Response, NextFunction } from 'express';
import { ClientSession, ObjectId, PopulatedDoc, startSession } from 'mongoose';

import Competition from '../models/Competition';
import AppError from '../utils/AppError';
import User from '../models/User';
import Fish from '../models/Fish';

const createCompetition = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { name, endDate, measurementType } = req.body;
	let session: ClientSession | null = null;

	try {
		const user = await User.findById(req.user!._id);
		if (!user)
			throw new AppError(
				'Something went wrong while getting your data.',
				500
			);

		if (user.competition)
			throw new AppError(
				"You can't create a new competition because you've already joined one.",
				409
			);

		session = await startSession();
		session.startTransaction();

		const newCompetition = new Competition({
			name,
			creator: user.id,
			endDate,
			measurementType,
			users: [user.id],
		});

		await newCompetition.save({ session });

		user.competition = newCompetition.id;
		await user.save({ session, validateModifiedOnly: true });

		await session.commitTransaction();
		res.status(201).json({ competition: newCompetition });
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

const inviteUserToCompetition = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const userId = req.params.uid;
	try {
		if (req.user!._id === userId) {
			throw new AppError(
				'You cannot invite yourself to the competition.',
				403
			);
		}

		const user = await User.findById(req.user!._id);
		if (!user)
			throw new AppError(
				'Something went wrong while getting your data.',
				500
			);

		const competition = await Competition.findById(user.competition);
		if (!competition)
			throw new AppError(
				"You can't invite this user to a competition because you are not participating in any.",
				404
			);

		if (competition.creator.toString() !== user.id)
			throw new AppError(
				'You cannot invite this user, because you are not creator of this competition.',
				403
			);

		if (competition.status === 'started')
			throw new AppError(
				'You cannot add a user to the competition, because the competition has already started.',
				400
			);

		const userToInvite = await User.findById(userId);
		if (!userToInvite) throw new AppError('User to invite not found.', 404);

		if (userToInvite.competition)
			throw new AppError(
				'This user is already in some competition.',
				409
			);

		const isUserAleadyInvited = competition.invites.find(
			(id) => id.toString() === userToInvite.id
		);

		if (isUserAleadyInvited)
			throw new AppError('This user is already invited.', 400);

		competition.invites.push(userToInvite.id);
		await competition.save({ validateModifiedOnly: true });

		res.status(200).json({ msg: 'User invited successfully.' });
	} catch (err) {
		next(err);
	}
};

const acceptInvite = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const competitionId = req.params.cid;
	let session: ClientSession | null = null;
	try {
		const user = await User.findById(req.user!._id);
		if (!user)
			throw new AppError(
				'Something went wrong while getting your data.',
				500
			);
		if (user.competition)
			throw new AppError(
				'You cannot join this competition, because you are already participating in one.',
				409
			);

		const competition = await Competition.findById(competitionId);
		if (!competition)
			throw new AppError(
				'Competition with provided id does not exist.',
				404
			);

		if (competition.status === 'started')
			throw new AppError(
				'You cannot join this competition, because it has already started.',
				403
			);

		const inviteIndex = competition.invites.findIndex(
			(id) => id.toString() === req.user!._id
		);
		if (inviteIndex === -1)
			throw new AppError('You are not invited to this competition.', 403);

		session = await startSession();
		session.startTransaction();

		competition.users.push(user.id);
		competition.invites.splice(inviteIndex, 1);
		await competition.save({ session, validateModifiedOnly: true });

		user.competition = competition.id;
		await user.save({ session, validateModifiedOnly: true });

		await session.commitTransaction();
		res.status(200).json({
			msg: 'You have successfully joined the competition.',
		});
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

const getMyInvites = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const invites = await Competition.find({ invites: req.user!._id })
			.select('name measurementType users')
			.populate('users', 'nickname');

		res.status(200).json({ length: invites.length, invites });
	} catch (err) {
		next(err);
	}
};

const removeUserFromCompetition = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const userId = req.params.uid;
	let session: ClientSession | null = null;

	try {
		if (req.user!._id === userId)
			throw new AppError(
				'You cannot remove yourself through this endpoint.',
				403
			);

		const user = await User.findById(req.user!._id);
		if (!user)
			throw new AppError(
				'Something went wrong while getting your data.',
				500
			);

		const competition = await Competition.findById(user.competition);
		if (!competition)
			throw new AppError(
				"You can't remove this user from competition because you are not participating in any.",
				404
			);

		if (competition.creator.toString() !== user.id)
			throw new AppError(
				'You cannot remove this user from competition, because you are not creator of this competition.',
				403
			);

		if (new Date() >= competition.endDate)
			throw new AppError(
				"You can't delete the user because the competition time is over. Please save the result of the competition.",
				403
			);

		const userIndex = competition.users.findIndex(
			(id) => id.toString() === userId
		);
		if (userIndex === -1)
			throw new AppError(
				'User with provided id is not participating in this competition.',
				403
			);

		if (competition.status === 'started' && competition.users.length === 3)
			throw new AppError(
				"You can't remove this user, because you need at least 3 people to compete. If you want you can remove this competition.",
				400
			);

		session = await startSession();
		session.startTransaction();

		competition.users.splice(userIndex, 1);
		await competition.save({ session, validateModifiedOnly: true });

		await User.findByIdAndUpdate(
			userId,
			{ $unset: { competition: true } },
			{ session }
		);

		await session.commitTransaction();
		res.status(200).json({ msg: 'User removed successfully.' });
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

const quitCompetition = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	let session: ClientSession | null = null;

	try {
		const user = await User.findById(req.user!._id);
		if (!user)
			throw new AppError(
				'Something went wrong while getting your data.',
				500
			);

		if (!user.competition)
			throw new AppError(
				'You are not taking part in any competition.',
				403
			);

		const competition = await Competition.findById(user.competition);
		if (!competition)
			throw new AppError('Your competition could not be found.', 404);

		if (new Date() >= competition.endDate)
			throw new AppError(
				"You can't quit because the competition time is over. Please save the result of the competition.",
				403
			);

		if (competition.creator.toString() === user.id)
			throw new AppError(
				"You can't leave the competition because you set it up yourself. If you want to then remove this competition.",
				403
			);

		const userIndex = competition.users.findIndex(
			(id) => id.toString() === user.id
		);
		if (userIndex === -1)
			throw new AppError(
				'You do not participate in this competition.',
				403
			);

		session = await startSession();
		session.startTransaction();

		if (
			competition.status === 'started' &&
			competition.users.length === 3
		) {
			await User.updateMany(
				{ competition: competition.id },
				{ $unset: { competition: true } },
				{ session }
			);

			await competition.deleteOne({ session });

			await session.commitTransaction();
			res.status(200).json({
				msg: `Competition "${competition.name}" had to be removed because of your departure.`,
			});
			return;
		}

		competition.users.splice(userIndex, 1);
		await competition.save({ validateModifiedOnly: true, session });
		user.competition = undefined as unknown as ObjectId;
		await user.save({ validateModifiedOnly: true, session });

		await session.commitTransaction();
		res.status(200).json({ msg: 'You successfully quit the competition.' });
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

const startCompetition = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const competition = await Competition.findOne({
			creator: req.user!._id,
		});
		if (!competition)
			throw new AppError(
				'You are not the creator of any competition.',
				404
			);

		if (competition.status === 'started')
			throw new AppError('This competition has already begun.', 403);

		if (competition.users.length < 3)
			throw new AppError(
				'At least 3 users are needed to start the competition.',
				400
			);

		competition.status = 'started';
		competition.invites = [];

		const today = new Date();
		const todayWithoutTime = new Date(today.toISOString().split('T')[0]);
		competition.startDate = todayWithoutTime;

		await competition.save({ validateModifiedOnly: true });

		res.status(200).json({
			msg: 'You have successfully started the competition.',
		});
	} catch (err) {
		next(err);
	}
};

const deleteCompetition = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	let session: ClientSession | null = null;
	try {
		const competition = await Competition.findOne({
			creator: req.user!._id,
		});
		if (!competition)
			throw new AppError(
				'You are not the creator of any competition.',
				404
			);

		if (new Date() >= competition.endDate)
			throw new AppError(
				"You can't delete the competition because the time is over. Please save the result of the competition.",
				403
			);

		session = await startSession();
		session.startTransaction();

		await User.updateMany(
			{ competition: competition.id },
			{ $unset: { competition: true } },
			{ session }
		);
		await competition.deleteOne({ session });

		await session.commitTransaction();

		res.status(200).json({ msg: 'Competition successfully deleted.' });
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

const getCompetition = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const user = await User.findById(req.user!._id);
		if (!user)
			throw new AppError(
				'Something went wrong while getting your data.',
				500
			);

		const competition = await Competition.findById(
			user.competition
		).populate('users', 'nickname avatar country');

		if (!competition)
			throw new AppError('Your competition could not be found.', 404);

		if (competition.status === 'awaiting') {
			res.status(200).json({ competition });
			return;
		}

		const participantsIds: ObjectId[] | [] = competition.users.map(
			(p: any) => p._id
		);

		const fishStats = await Fish.aggregate([
			{
				$match: {
					user: { $in: participantsIds },
					$and: [
						{ whenCaught: { $gte: competition.startDate } },
						{ whenCaught: { $lte: competition.endDate } },
					],
					'measurement.type': competition.measurementType,
				},
			},

			{
				$group: {
					_id: '$user',
					fishQuantity: {
						$sum: 1,
					},
					measurementTotal: {
						$sum: '$measurement.value',
					},
					fishNames: {
						$push: '$name',
					},
				},
			},
		]);

		const participantsObject: Record<string, any> = {};
		fishStats.forEach(
			(p: any) => (participantsObject[p._id.toString()] = p)
		);

		const participantsFullData = competition.users.map((u: any) => ({
			...u.toObject(),
			...participantsObject[u.id],
		}));

		const responseData = {
			...competition.toObject(),
			users:
				participantsFullData.length === 0
					? competition.users
					: participantsFullData,
		};

		res.status(200).json({ competition: responseData });
	} catch (err) {
		next(err);
	}
};

const saveCompetitionResult = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	let session: ClientSession | null = null;
	try {
		const user = await User.findById(req.user!._id);
		if (!user)
			throw new AppError(
				'Something went wrong while getting your data.',
				500
			);

		const competition = await Competition.findById(user.competition);

		if (!competition)
			throw new AppError('Your competition could not be found.', 404);

		if (competition.status === 'awaiting')
			throw new AppError("Your competition hasn't even started.", 403);

		if (new Date() < competition.endDate)
			throw new AppError('The competition time is not over yet.', 403);

		const fishStats = await Fish.aggregate([
			{
				$match: {
					user: { $in: competition.users },
					$and: [
						{ whenCaught: { $gte: competition.startDate } },
						{ whenCaught: { $lte: competition.endDate } },
					],
					'measurement.type': competition.measurementType,
				},
			},

			{
				$group: {
					_id: '$user',
					fishQuantity: {
						$sum: 1,
					},
					measurementTotal: {
						$sum: '$measurement.value',
					},
					fishNames: {
						$push: '$name',
					},
				},
			},
			{
				$sort: {
					measurementTotal: -1,
				},
			},
		]);

		session = await startSession();
		session.startTransaction();

		if (fishStats && fishStats.length > 0) {
			const winnerId = fishStats[0]._id.toString();
			if (winnerId === user.id) {
				user.competitionWins += 1;
				await user.save({ validateModifiedOnly: true, session });
			} else {
				await User.findByIdAndUpdate(
					winnerId,
					{ $inc: { competitionWins: 1 } },
					{ session }
				);
			}
		}

		await User.updateMany(
			{ competition: competition.id },
			{ $unset: { competition: true } },
			{ session }
		);
		await competition.deleteOne({ session });

		await session.commitTransaction();
		res.status(200).json({
			msg: 'Successfully approved the outcome of the competition.',
		});
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
	createCompetition,
	inviteUserToCompetition,
	acceptInvite,
	getMyInvites,
	removeUserFromCompetition,
	quitCompetition,
	startCompetition,
	deleteCompetition,
	getCompetition,
	saveCompetitionResult,
};
