import { Schema, model } from 'mongoose';
import { IFish } from '../interfaces/fish';

const fishSchema = new Schema<IFish>({
	name: {
		type: String,
		required: [true, 'Please enter the fish name.'],
		minlength: [3, 'Fish name must be at least 3 characters long.'],
		maxlength: [20, 'Fish name cannot be longer than 20 characters.'],
	},
	measurement: {
		type: {
			type: {
				type: String,
				enum: {
					values: ['weight', 'length'],
					message:
						'The {VALUE} is not the correct type of measurement.',
				},
				required: [true, 'Please enter the type of measurement.'],
			},
			unit: {
				type: String,
				enum: {
					values: ['kg', 'cm', 'lb', 'inch'],
					message:
						'The {VALUE} is not the correct unit of measurement.',
				},
				required: [true, 'Please enter the unit of measurement.'],
			},
			value: {
				type: Number,
				required: [true, 'Please enter the value of measurement.'],
			},
		},
		required: true,
	},
	description: {
		type: String,
		maxlength: [500, 'Description cannot be longer that 500 characters.'],
	},
	image: {
		type: {
			url: {
				type: String,
				required: [true, 'Image URL is required.'],
			},
			public_id: {
				type: String,
				required: [true, 'Image public_id is required.'],
			},
		},
		required: true,
		_id: false,
	},
	user: {
		type: Schema.Types.ObjectId,
		ref: 'User',
		required: [true, 'Please enter your _id.'],
	},
	whenCaught: {
		type: Date,
		required: [true, 'Please enter the date when the fish was caught.'],
	},
	location: {
		type: {
			type: {
				type: String,
				enum: ['Point'],
				required: [true, 'Location type is required.'],
			},
			coordinates: {
				type: [Number],
				validate: {
					validator: function (val) {
						return val.length === 2;
					},
					message:
						'Coordinates must be an array of two numbers [longitude, latitude].',
				},
				required: [true, 'Coordinates are required.'],
			},
		},
		required: true,
		_id: false,
	},
});

export default model('Fish', fishSchema);
