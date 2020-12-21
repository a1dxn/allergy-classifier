const log        = _log.get("get-dataset");
const csv        = require("csvtojson");
const deepFreeze = require("deep-freeze");

const datasetCache = require("../../services/cache-manager").store("datasetstore", 60*60 /*1hr*/);

/**
 * @async
 * @name getDataset
 * Get a specific dataset.
 *
 * @param {Object} options
 * @param {string} options.allergyKey - Allergy set to get. See constants for allowed set.
 * @param {string} options.setType - Accepts 'TRAIN' or 'TEST'. Case insensitive.
 * @returns {Promise<{allergyKey: string, setType: string, data: Object[], stats: Object}>} - For stats see code
 */
module.exports = async function getDataset(options) {
	options = Schema.object({
								allergyKey: Schema.string().required().uppercase()
												  .pattern(
													  new RegExp(`(${CONSTANT("DATASET_ALLERGY_KEYS").join("|")})`),
													  "Allergy Key"),
								setType   : Schema.string().uppercase().valid(
									CONSTANT("DATASET_FILE_KEYWORD_TRAIN"),
									CONSTANT("DATASET_FILE_KEYWORD_TEST")).required() /*for now... setType is required*/
							}).validate(options, {abortEarly: false});
	if(options.error) {
		log.error("Validation error on options argument. %O", options.error);
		throw options.error;
	} else options = options.value; //Values would be casted to correct data types

	const datasetName = options.allergyKey+(options.setType ? "_"+options.setType : "");

	if(datasetCache.has(datasetName)) {
		log.debug("Returning cached set %s", datasetName);
		return datasetCache.get(datasetName);
	} else {
		//Time to construct the dataset object!
		const fullFilePath = CONSTANT("DATASET_FILE_PATH")+datasetName+CONSTANT("DATASET_FILE_EXTENSION");

		const stats = {
			positiveCases           : 0,
			positiveIntersectionWith: {},
			confidences             : {
				precedence: [],
			},
			negativeCases           : 0,
			totalCases              : 0,
		};
		for(let alg of CONSTANT("DATASET_ALLERGY_KEYS"))
			stats.positiveIntersectionWith[alg] = 0;

		const data = await csv({
								   noheader : false,
								   output   : "json",
								   trim     : true,
								   checkType: true,
							   }).fromFile(fullFilePath)
								 .subscribe((jsonObject, i) => {
									 stats.totalCases++;
									 if(jsonObject[options.allergyKey]===1) {
										 stats.positiveCases++;
										 for(let alg in jsonObject) {
											 stats.positiveIntersectionWith[alg] += jsonObject[alg];
										 }
									 } else {
										 stats.negativeCases++;
									 }
								 });

		//Delete the intersection of allergyKey-U-allergyKey as it would be confusing! (just use positiveCases)
		delete stats.positiveIntersectionWith[options.allergyKey];
		//Calculate confidences for all intersections
		for(let alg in stats.positiveIntersectionWith) {
			stats.confidences[alg] = stats.positiveIntersectionWith[alg]/stats.positiveCases;
			stats.confidences[alg] = Math.round((stats.confidences[alg]+Number.EPSILON)*100)/100;
			stats.confidences.precedence.push(alg);
		}
		stats.confidences.precedence.sort((a, b) => stats.confidences[b]>stats.confidences[a] ? 1 : -1);

		let dataset = deepFreeze({
									 allergyKey: options.allergyKey,
									 setType   : options.setType,
									 data,
									 stats
								 });

		datasetCache.set(datasetName, dataset);
		log.info("Fetched new DataSet object for %s", datasetName);

		return dataset;
	}

};
