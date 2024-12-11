import { rateLimit } from 'express-rate-limit';

export const generalRateLimiter = rateLimit({
	windowMs: 1000 * 60 * 60, // 1 HOUR
	limit: 500,
	message: {
		error: 'You have exceeded your rate limit. Please try again later.',
	},
});

export const uploadRateLimiter = rateLimit({
	windowMs: 1000 * 60 * 60, // 1 HOUR
	limit: 20,
	message: {
		error: 'You have exceeded the upload limit. Please try again later.',
	},
});

export const loginRateLimiter = rateLimit({
	windowMs: 1000 * 60 * 60, // 1 HOUR
	limit: 10,
	message: {
		error: 'You have exceeded the limit of login attempts. Please try again later.',
	},
});
