import jwt, { JwtPayload } from 'jsonwebtoken';

import AppError from './AppError';

interface ITokenPayload {
	_id: string;
	nickname?: string;
	role?: 'admin' | 'moderator' | 'user';
}

export type TDecodedToken = ITokenPayload & { iat: number; exp: number };

const SECRET_KEY = process.env.SECRET_KEY!;
export const REFRESH_TOKEN_LIFESPAN = 60 * 60 * 24 * 3;
export const ACCESS_TOKEN_LIFESPAN = 60 * 15;

export const signJWT = (
	payload: ITokenPayload,
	type: 'access' | 'refresh'
): Promise<string> => {
	return new Promise((resolve, reject) => {
		jwt.sign(
			payload,
			SECRET_KEY,
			{
				expiresIn:
					type === 'access'
						? ACCESS_TOKEN_LIFESPAN
						: REFRESH_TOKEN_LIFESPAN,
			},
			(err, token) => {
				if (err) {
					return reject(err);
				}
				if (!token)
					return reject(
						new AppError('The token has not been created.', 500)
					);
				resolve(token);
			}
		);
	});
};

export const verifyJWT = (
	token: string,
	type: 'access' | 'refresh'
): Promise<TDecodedToken> => {
	return new Promise((resolve, reject) => {
		jwt.verify(token, SECRET_KEY, (err, decoded) => {
			if (err) {
				let customError: AppError;

				if (err instanceof jwt.TokenExpiredError) {
					customError = new AppError(
						`Your ${type} token has expired.`,
						401
					);
				} else if (err instanceof jwt.JsonWebTokenError) {
					customError = new AppError(`Invalid ${type} token.`, 401);
				} else {
					customError = new AppError(
						`An error occurred while verifying your ${type} token.`,
						500
					);
				}

				return reject(customError);
			}

			resolve(decoded as TDecodedToken);
		});
	});
};
