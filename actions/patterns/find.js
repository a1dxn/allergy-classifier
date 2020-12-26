const log        = _log.get("find-patterns");
const getDataset = require("../sets/get-dataset");
const Jsum       = require("Jsum");

const patternstore = require("../../services/cache-manager").store("patternstore", 0);

/**
 * @async
 * @name findPatterns
 * Find the most common patterns given an allergy and a set of features.
 *
 * @param {Object} options
 * @param {string} options.allergyKey - Allergy to base dataset from. See constants for allowed set.
 * @param {string[]} options.features - Features to evaluate against, excluding options.allergyKey.
 * @returns {Promise<{features : string[], size, rules : this, allergyKey : string}>}
 * @returns {Promise<{allergyKey:string, features:string[], size:number, rules:object[]}>} (Object Frozen)
 * Note: Rules object contain {path:string, size:number, support:number} see line 73
 */
module.exports = async function findPatterns(options) {
	options = Schema.object({
								allergyKey: Schema.get("allergyKey")
												  .required(),
								features  : Schema.array()
												  .items(Schema.get("allergyKey")
															   .disallow(Schema.ref("allergyKey")))
												  .required(),
								minSupport: Schema.number()
												  .min(0)
												  .max(1)
												  .required()
												  .failover(CONSTANT("PATTERNS_RULE_MIN_SUPPORT_DEFAULT"))
							})
					.validate(options, {abortEarly: false});
	if(options?.error) {
		log.error("Validation error on options argument. %O", options.error);
		throw options.error;
	} else options = options?.value; //Values would be casted to correct data types

	let checksum = Jsum.digest(options, "md5", "base64");
	if(patternstore.has(checksum)) return _.cloneDeep(patternstore.get(checksum));

	const dataset = await getDataset({
										 allergyKey: options.allergyKey,
										 setType   : CONSTANT("DATASET_FILE_KEYWORD_TRAIN")
									 });

	let sharedArray = [];

	let positiveCases = dataset?.data.filter((row) => row[options.allergyKey]===1);
	log.notice("Features: %O", options.features);

	while(options.features.length>0) {
		await goDeeper(options.features,
					   sharedArray,
					   positiveCases,
					   positiveCases.length,
					   options.minSupport);
		options.features = _.tail(options.features);
	}

	const obj = {
		allergyKey: options.allergyKey,
		features  : options.features,
		size      : positiveCases.length,
		rules     : sharedArray.sort((a, b) => a.support>b.support ? -1 : 1)
	};

	patternstore.set(checksum, obj);
	return _.cloneDeep(obj);

};

async function goDeeper(orderedFeatures, sharedArray, data, originalSupport, minSupport, idPath) {
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

	//If after evaluating the support, its below the min then we arent going to count it or go any further!
	if(result.support<minSupport) return sharedArray;

	sharedArray.push(result);

	log.debug("%s: %O", idPath, result);

	//Time to go deeper!
	while(features.length>0) {
		await goDeeper(features, sharedArray, filteredData, originalSupport, minSupport, idPath);
		features = _.tail(features);
	}

	return sharedArray;
}
