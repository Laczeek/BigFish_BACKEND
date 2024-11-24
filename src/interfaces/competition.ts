import { ObjectId } from 'mongoose';

export interface ICompetition {
	name: string;
    creator: ObjectId;
	startDate?: Date;
	endDate: Date;
	measurementType: 'weight' | 'length';
	users: ObjectId[];
	status: 'awaiting' | 'started';
    invites: ObjectId[]
}
