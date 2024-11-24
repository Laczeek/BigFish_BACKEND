import { Schema, model } from 'mongoose';

import { IBan } from '../interfaces/ban';

const banSchema = new Schema<IBan>({
	email: {
		type: String,
		required: [
			true,
			'Please enter the email address of the user you want to ban.',
		],
		unique: true,
		validate: {
			validator: (val) => {
				return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(val);
			},
			message: 'Provided email is not valid.',
		},
		lowercase: true,
	},
	reason: {
		type: String,
		required: [true, 'Please enter reason of the ban.'],
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

export default model<IBan>('ban', banSchema);
