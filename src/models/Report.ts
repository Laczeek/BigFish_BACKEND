import { Schema, model } from 'mongoose';

import { IReason, IReport } from '../interfaces/report';

const reasonSchema = new Schema<IReason>({
	reporter: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Reason must contain reporter _id.'],
	},
	description: {
		type: String,
		minlength: [5, 'Description must be at least 5 characters long.'],
		maxlength: [500, 'Description cannot be longer than 500 characters.'],
		required: [
			true,
			'Please enter a description of the reason for the report.',
		],
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

const reportSchema = new Schema<IReport>({
	reportedUser: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Report must contain reported user _id.'],
	},
	reasons: [reasonSchema],
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

export default model<IReport>('report', reportSchema);
