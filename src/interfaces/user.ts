import { ObjectId } from 'mongoose';

type TFishingMethods =
	| 'not defined'
	| 'spinning'
	| 'bottom fishing'
	| 'casting'
	| 'jigging'
	| 'popping'
	| 'trolling'
	| 'fly fishing'
	| 'ice fishing';

export interface IUser {
	nickname: string;
	email: string;
	password: string;
	passwordConfirm: string;
	description: string;
	favMethod: TFishingMethods;
	avatarURL: string;
	country: string;
	role: 'admin' | 'moderator' | 'user';
	fishAmount: number;
	myHooks: [ObjectId];
    hooksAmount: number;
    competition: ObjectId;
    competitionWins: number;
    createdAt: Date;
}
