module.exports = async function(steps, traversal) {
	Schema.assert(steps, Schema.array().label("steps").items(Schema.get("rowFeatureValue").required().label("step")));
	Schema.assert(traversal, Schema.number().greater(0).optional().label("traversal value"));

	let options = {
		maxLeft : 0,
		maxRight: 0,
		traverse: traversal ?? 1,
	};

	return traverse(steps, options, 0);
};

async function traverse(steps, options, base) {
	let step = steps[0]; //0 for L, 1 for R traversal

	let leftBase  = base-options.traverse;
	let rightBase = base+options.traverse;

	if(leftBase<options.maxLeft) options.maxLeft = leftBase;
	if(rightBase>options.maxRight) options.maxRight = rightBase;

	if(steps.length>1) {
		return traverse(_.tail(steps), options, step===0 ? leftBase : rightBase);
	} else {
		return options;
	}
}

