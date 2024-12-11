import { Model, Query } from 'mongoose';

import serializeQuery from './serialize-query';

type UnknownOject = { [key: string]: any };

class CustomFind<T> {
	query: Query<any, T>;
	private queryObj: UnknownOject;
	serializedQuery: { [x: string]: any } = {};

	constructor(
		model: Model<any>,
		reqQuery: UnknownOject,
		allowedFields: string[],
		filter?: UnknownOject
	) {
		this.queryObj = { ...reqQuery };
		const serializedQuery = serializeQuery(reqQuery, allowedFields);
		this.query = model.find({ ...serializedQuery, ...filter });
		this.serializedQuery = serializedQuery;
	}

	projection() {
		if (this.queryObj.project) {
			const projectionString = this.queryObj.project.replace(/,/g, ' ');
			console.log(projectionString);
			this.query.projection(projectionString);
		}
		return this;
	}

	sort() {
		if (this.queryObj.sort) {
			const sortingString = this.queryObj.sort.replace(/,/g, ' ');
			this.query.sort(sortingString);
		}
		return this;
	}

	limit() {
		if (this.queryObj.limit) {
			this.query.limit(+this.queryObj.limit);
		}
		return this;
	}

	skip() {
		if (this.queryObj.skip) {
			this.query.skip(+this.queryObj.skip);
		}
		return this;
	}
}

export default CustomFind;
