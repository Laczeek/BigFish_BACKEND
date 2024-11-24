import { Schema, model } from 'mongoose';

import { ICompetition } from '../interfaces/competition';

const competitionSchema = new Schema<ICompetition>({
    name: {
        type: String,
        required: [true, 'Please enter the name of the competition.'],
        minlength: [3, 'Competition name must be at leasth 3 characters long.'],
        maxlength: [50, 'Competition name cannot be longer than 50 characters.']
    },
    creator: {
        type: Schema.Types.ObjectId,
        required: [true, 'Competition must have a creator.']
    },
	startDate: {
		type: Date,
	},
	endDate: {
		type: Date,
		required: [true, 'End date of the competition is required.'],
	},
	measurementType: {
		type: String,
		enum: {
			values: ['weight', 'length'],
			message: 'The {VALUE} is not the correct type of measurement.',
		},
		required: [true, 'Please enter the type of measurement.'],
	},
    status: {
        type: String,
        enum: {
            values: ['awaiting', 'started'],
            message: 'The {VALUE} is not correct status.'
        },
        default: 'awaiting'
    },
    users: {
        type: [Schema.Types.ObjectId],
        ref: 'User'
    },
    invites: {
        type: [Schema.Types.ObjectId],
        ref: 'User'
    }
});


export default model<ICompetition>('competition', competitionSchema);