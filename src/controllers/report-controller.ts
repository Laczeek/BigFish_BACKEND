import { NextFunction, Request, Response } from 'express';

import Report from '../models/Report';
import AppError from '../utils/AppError';

const reportUser = async (req: Request, res: Response, next: NextFunction) => {
	const reportedUserId = req.params.uid;
	try {
		const { description } = req.body;

		const reason = {
			reporter: req.user!._id,
			description,
		};

		const isAlreadyReported = await Report.findOne({
			reportedUser: reportedUserId,
			'reasons.reporter': req.user!._id,
		});

		if (isAlreadyReported)
			throw new AppError('You have already reported this user.', 409);

		await Report.updateOne(
			{ reportedUser: reportedUserId },
			{ $push: { reasons: reason } },
			{ runValidators: true, upsert: true }
		);

		res.status(200).json({ msg: 'User successfully reported.' });
	} catch (err) {
		next(err);
	}
};

const getReport = async (req: Request, res: Response, next: NextFunction) => {
	const reportId = req.params.rid;
	try {
		const report = await Report.findById(reportId).populate('reportedUser');

		if (!report)
			throw new AppError(
				'It was not possible to find a report of the given id.',
				404
			);

		res.status(200).json({ report });
	} catch (err) {
		next(err);
	}
};

export default {
	reportUser,
	getReport,
};
