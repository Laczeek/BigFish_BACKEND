const serializeQuery = (
	queryObj: { [key: string]: any },
	allowedFields: string[]
) => {
	let queryCopy = { ...queryObj };

	Object.keys(queryCopy).forEach((key) => {
		if (!allowedFields.includes(key)) {
			delete queryCopy[key];
		}
	});

	queryCopy = JSON.parse(
		JSON.stringify(queryCopy).replace(
			/\b(gt|gte|lt|lte|eq|neq|in)\b/g,
			(match) => `$${match}`
		)
	);

	return queryCopy;
};

export default serializeQuery;
