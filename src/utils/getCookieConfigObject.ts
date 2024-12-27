const NODE_ENV = process.env.NODE_ENV || 'PRODUCTION';

const getCookieConfigObject = (
	tokenLifespan?: number,
	isClearing?: boolean
) => {
	const cookieConfigObject =
		NODE_ENV === 'DEVELOPMENT'
			? {
					httpOnly: false,
					path: '/',
					domain: 'localhost',
					secure: false,
					sameSite: 'lax' as const,
					...(isClearing ? {} : { maxAge: tokenLifespan }),
			  }
			: {
					httpOnly: true,
					path: '/',
					secure: true,
					sameSite: 'none' as const,
					maxAge: tokenLifespan,
					...(isClearing ? {} : { maxAge: tokenLifespan }),
			  };
	return cookieConfigObject;
};

export default getCookieConfigObject;
