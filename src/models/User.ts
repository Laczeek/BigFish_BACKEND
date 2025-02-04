import { Schema, model } from 'mongoose';
import bcrypt from 'bcrypt';

import { IUser } from '../interfaces/user';

const userSchema = new Schema<IUser>({
	nickname: {
		type: String,
		required: [true, 'Please enter your nickname.'],
		unique: true,
		minlength: [3, 'Nickname must be at least 3 characters long.'],
		maxlength: [20, 'Nickname cannot be longer than 20 characters.'],
		trim: true,
	},
	email: {
		type: String,
		required: [true, 'Please enter your email address.'],
		unique: true,
		validate: {
			validator: (val) => {
				return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(val);
			},
			message: 'Provided email is not valid.',
		},
		lowercase: true,
	},
	password: {
		type: String,
		select: false,
		required: [true, 'Please enter your password.'],
		trim: true,
		validate: {
			validator: function (this, val) {
				return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(
					val
				);
			},
			message:
				'Password must contain at least 8 characters, 1 letter, 1 number and 1 special character.',
		},
	},
	passwordConfirm: {
		type: String,

		required: [true, 'Please confirm the password.'],
		validate: {
			validator: function (this, val) {
				return this.password === val;
			},
			message: 'Passwords are not the same.',
		},
	},
	description: {
		type: String,
		minlength: [1, 'Description must be at least 1 character long.'],
		maxlength: [500, 'Description cannot be longer than 500 characters.'],
		default: 'Welcome to my profile.',
	},
	favMethod: {
		type: String,
		enum: {
			values: [
				'not defined',
				'spinning',
				'bottom fishing',
				'casting',
				'jigging',
				'popping',
				'trolling',
				'fly fishing',
				'ice fishing',
			],
			message: 'The `{VALUE}` is not the correct method of fishing.',
		},
		default: 'not defined',
	},
	avatar: {
		type: {
			url: String,
			public_id: String,
		},
		default: {
			url: 'https://res.cloudinary.com/dy4nafoiy/image/upload/v1734745143/avatars/xkesqylhn9sgaxx1kfbi.webp',
			public_id: 'avatars/xkesqylhn9sgaxx1kfbi',
		},
		_id: false,
	},
	country: {
		name: {
			type: String,
			required: [true, 'The country must have a name.'],
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
			required: [true, 'Coordinates of your country are required.'],
		},
	},

	role: {
		type: String,
		enum: {
			values: ['admin', 'moderator', 'user'],
			message: 'The `{VALUE}` is not the correct role.',
		},
		default: 'user',
	},
	fishAmount: {
		type: Number,
		default: 0,
	},
	myHooks: {
		type: [Schema.ObjectId],
	},
	hooksAmount: {
		type: Number,
		default: 0,
	},
	competition: {
		type: Schema.ObjectId,
	},
	competitionWins: {
		type: Number,
		default: 0,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

userSchema.pre('save', async function (next) {
	if (this.isNew) {
		const cryptPassword = await bcrypt.hash(this.password, 13);
		this.password = cryptPassword;
		this.set('passwordConfirm', undefined);
	}

	next();
});

export default model<IUser>('User', userSchema);
