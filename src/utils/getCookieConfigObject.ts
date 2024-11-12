const CURRENT_ENV = process.env.CURRENT_ENV || 'PRODUCTION';

const getCookieConfigObject = (tokenLifespan: number) => {
	const cookieConfigObject =
		CURRENT_ENV === 'DEVELOPMENT'
			? {
					httpOnly: false,
					path: '/',
					domain: 'localhost',
					secure: false,
					sameSite: 'lax' as const,
					maxAge: tokenLifespan,
			  }
			: {
					httpOnly: true,
					path: '/',
					secure: true,
					sameSite: 'none' as const,
					maxAge: tokenLifespan,
			  };
	return cookieConfigObject;
};

export default getCookieConfigObject;
