import { ObjectId } from 'mongoose';

export interface IFish {
	name: string;
	measurement: {
		type: 'weight' | 'length';
		unit: 'kg' | 'cm' | 'lb' | 'inch';
		value: number;
	};
	description: string;
	image: {
        url: string;
        public_id: string;
    };
	user: ObjectId;
	whenCaught: Date;
	location: {
		type: 'Point';
        address: string;
		coordinates: [number, number]; // UNION TYPE
	};
}
