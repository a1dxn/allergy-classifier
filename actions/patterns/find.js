const log        = _log.get("find-patterns");
const getDataset = require("../sets/get-dataset");

/**
 * @async
 * @name findPatterns
 * Find the most common patterns given an allergy and a set of features.
 *
 * @param {Object} options
 * @param {string} options.allergyKey - Allergy to base dataset from. See constants for allowed set.
 * @param {string[]} options.features - Features to evaluate against, excluding options.allergyKey.
 * @returns {Promise<allergyKey, features, size, result[{path, size, support}]>}
 */
module.exports = async function findPatterns(options) {
	options = Schema.object({
								allergyKey: Schema.get("allergyKey")
												  .required(),
								features  : Schema.array()
												  .items(Schema.get("allergyKey")
															   .disallow(Schema.ref("allergyKey")))
												  .required(),
							})
					.validate(options, {abortEarly: false});
	if(options?.error) {
		log.error("Validation error on options argument. %O", options.error);
		throw options.error;
	} else options = options?.value; //Values would be casted to correct data types

	const dataset = await getDataset({
										 allergyKey: options.allergyKey,
										 setType   : CONSTANT("DATASET_FILE_KEYWORD_TRAIN")
									 });

	let sharedArray = [];

	let positiveCases = dataset?.data.filter((row) => row[options.allergyKey]===1);
	log.notice("Features: %O", options.features);

	while(options.features.length>0) {
		await goDeeper(options.features, sharedArray, positiveCases, positiveCases.length);
		options.features = _.tail(options.features);
	}

	let result    = _.clone(options);
	result.size   = positiveCases.length;
	result.result = sharedArray.sort((a, b) => a.support>b.support ? -1 : 1);
	return result;

};

async function goDeeper(orderedFeatures, sharedArray, data, originalSupport, idPath) {
	const me     = orderedFeatures[0];
	let features = _.tail(orderedFeatures);
	idPath       = (idPath ? idPath+"," : "")+me;

	//Get the data where current feature (me) is true
	let filteredData = data.filter((row) => {
		return (row[me]===1);
	});

	//Do all the work necessary here
	let result = {
		path   : idPath,
		size   : filteredData.length,
		support: filteredData.length/originalSupport,
	};
	sharedArray.push(result);

	log.debug("%s: %O", idPath, result);

	//Time to go deeper!
	while(features.length>0) {
		await goDeeper(features, sharedArray, filteredData, originalSupport, idPath);
		features = _.tail(features);
	}

	return sharedArray;
}
