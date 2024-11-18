import { Schema, model } from 'mongoose';

import { REFRESH_TOKEN_LIFESPAN } from '../utils/jwt-promisified';
import { IBlacklistedToken } from '../interfaces/blacklistedToken';

const blacklistedTokenSchema = new Schema<IBlacklistedToken>({
	token: {
		type: String,
		required: [true, 'Please provide a token.'],
		unique: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: REFRESH_TOKEN_LIFESPAN,
	},
});

export default model<IBlacklistedToken>(
	'BlacklistedToken',
	blacklistedTokenSchema
);
