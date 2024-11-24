// express.d.ts
import express from 'express';

declare module 'express' {
    export interface Request {
        user?: {
            _id: string;
            nickname: string;
            role: 'admin' | 'moderator'| 'user';
        };
    }
}