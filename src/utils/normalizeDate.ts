const normalizeDate = (date: Date) => {
	const utcDate = new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
	);
	utcDate.setUTCHours(0, 0, 0, 0);
	return utcDate;
};

export default normalizeDate;
