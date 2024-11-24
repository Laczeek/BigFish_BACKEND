import { Request, Response, NextFunction } from 'express';
import { ClientSession, startSession } from 'mongoose';

import Competition from '../models/Competition';
import AppError from '../utils/AppError';
import User from '../models/User';

const createCompetition = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { name, endDate, measurementType } = req.body;
	let session: ClientSession | null = null;

	try {
		const isUserAlreadyInCompetition = await Competition.findOne({
			users: req.user!._id,
		});

		if (isUserAlreadyInCompetition)
			throw new AppError(
				"You can't create a new competition because you've already joined one.",
				409
			);

		session = await startSession();
		session.startTransaction();

		const newCompetition = new Competition({
			name,
			creator: req.user!._id,
			endDate,
			measurementType,
			users: [req.user!._id],
		});

		await newCompetition.save({ session });

		await User.findByIdAndUpdate(
			req.user!._id,
			{ competition: newCompetition.id },
			{ session }
		);

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
	const competitionId = req.params.cid;
	try {
		const competition = await Competition.findById(competitionId);
		if (!competition)
			throw new AppError(
				'Competition with provided id does not exist.',
				404
			);

		if (req.user!._id === userId) {
			throw new AppError(
				'You cannot invite yourself to the competition.',
				403
			);
		}

		if (competition.status === 'started')
			throw new AppError(
				'You cannot add a user to the competition, because the competition has already started.',
				400
			);

		if (competition.creator.toString() !== req.user!._id)
			throw new AppError(
				'You cannot invite this user, because you are not creator of this competition.',
				403
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

		await competition.updateOne({
			$addToSet: { invites: userToInvite.id },
		});

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
		const isInvited = competition.invites.find(
			(id) => id.toString() === req.user!._id
		);
		if (!isInvited)
			throw new AppError('You are not invited to this competition.', 403);

		session = await startSession();
		session.startTransaction();

		competition.users.push(user.id);
		await competition.save({ session });
		user.competition = competition.id;
		await user.save({ session, validateModifiedOnly: true });
		await Competition.updateMany(
			{ invites: user.id },
			{ $pull: { invites: user.id } },
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

const getMyInvites = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const invites = await Competition.find({ invites: req.user!._id })
			.populate('users', 'nickname')
			.select('name measurementType users');

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
	const competitionId = req.params.cid;
	const userId = req.params.uid;
	let session: ClientSession | null = null;

	try {
		const competition = await Competition.findById(competitionId);
		if (!competition)
			throw new AppError(
				'Competition with provided id does not exist.',
				404
			);

		if (req.user!._id === userId)
			throw new AppError(
				'You cannot remove yourself tru this endpoint.',
				403
			);

		if (competition.creator.toString() !== req.user!._id)
			throw new AppError(
				'You cannot remove this user from competition, because you are not creator of this competition.',
				403
			);
		const userIndex = competition.users.findIndex(
			(id) => id.toString() === userId
		);
		if (userIndex === -1)
			throw new AppError(
				'User with provided id is not participating in this competition.',
				404
			);

		competition.users.splice(userIndex, 1);

		session = await startSession();
		session.startTransaction();

		await competition.save({ session });

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

export default {
	createCompetition,
	inviteUserToCompetition,
	acceptInvite,
	getMyInvites,
	removeUserFromCompetition,
};
