import { Request, Response } from 'express';
import geoip from 'geoip-country';

import User from '../models/User';
import AppError from '../utils/AppError';

const createAccount = async (req: Request, res: Response) => {
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
		
		res.status(401).json({ err });
	}
};

export default {
	createAccount,
};
