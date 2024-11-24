import { ObjectId } from "mongoose";

export interface IReason {
reporter: ObjectId;
description: string;
createdAt: Date;
}

export interface IReport {
    reportedUser: ObjectId;
    reasons: IReason[];
    createdAt: Date;
}