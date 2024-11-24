import { Request, Response, NextFunction } from 'express';

import Competition from '../models/Competition';
import AppError from '../utils/AppError';

const createCompetition = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { name, endDate, measurementType } = req.body;
	try {
		const isUserAlreadyInCompetition = await Competition.findOne({
			users: req.user!._id,
		});
   
		if (isUserAlreadyInCompetition)
			throw new AppError(
				"You can't create a new competition because you've already joined one.",
				400
			);

		const newCompetition = new Competition({
			name,
			creator: req.user!._id,
			endDate,
			measurementType,
			users: [req.user!._id],
		});

		await newCompetition.save();

		res.status(201).json({ competition: newCompetition });
	} catch (err) {
		next(err);
	}
};

export default {
	createCompetition,
};
