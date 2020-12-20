const Schema = require("joi");
const log    = _log.get("calculate-accuracy");

/**
 * @async
 * @name calculateAccuracy
 * Calculate the accuracy of given predictions against known actuals.
 *
 * @param {Object} options
 * @param {number[]} options.predictions - Array of predictions. Accepts 0 and 1 ONLY.
 * @param {number[]} options.actuals - Array of actuals. Accepts 0 and 1 ONLY.
 * @returns Promise<{TP, TN, FP, FN, accuracy, sensitivity, specificity, recall, precision}>
 */
module.exports = async function calculateAccuracy(options) {
	options = Schema.object({
								predictions: Schema.array().items(Schema.number().min(0).max(1)).required()
												   .custom((value, helpers) => {
													   if(value.length!==options.actuals.length)
														   return helpers.message(
															   "Predictions and Actuals must be of same length.");
													   return value;
												   }),
								actuals    : Schema.array().items(Schema.number().min(0).max(1))
												   .required(),
							}).validate(options, {abortEarly: false});
	if(options.error) {
		log.error("Validation error on options argument. %O", options.error);
		throw options.error;
	} else options = options.value; //Values would be casted to correct data types

	let results = {
		TP: 0, TN: 0, FP: 0, FN: 0
	};

	for(let i in options.predictions) {
		const p = options.predictions[i],
			  a = options.actuals[i];

		if(p===1 && a===1) results.TP++;
		else if(p===0 && a===0) results.TN++;
		else if(p===0 && a===1) results.FP++;
		else if(p===1 && a===0) results.FN++;
	}

	results.accuracy    = (results.TP+results.TN)/(results.TP+results.TN+results.FP+results.FN);
	results.sensitivity = results.TP/(results.TP+results.FN);
	results.specificity = results.TN/(results.TN+results.FP);
	results.recall      = results.sensitivity;
	results.precision   = results.TP/(results.TP+results.FP);

	log.debug('Accuracy: %O', results);

	return results;
};
