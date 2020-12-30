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
 * @returns {Promise<{allergyKey: string, setType: string, data: Object[]}>}
 */
module.exports = async function getDataset(options) {
	let _timer = Date.now();
	options    = Schema.object({
								   allergyKey: Schema.get("allergyKey").required(),
								   setType   : Schema.get("setType").required()
							   }).validate(options, {abortEarly: false});
	if(options?.error) throw options.error;
	else options = options?.value;

	const datasetName = options.allergyKey+(options.setType ? "_"+options.setType : "");

	if(datasetCache.has(datasetName)) {
		log.debug("Returning cached set %s in %dms", datasetName, Date.now()-_timer);
		return datasetCache.get(datasetName);
	}

	//Time to construct the dataset object!
	const fullFilePath = CONSTANT("DATASET_FILE_PATH")+datasetName+CONSTANT("DATASET_FILE_EXTENSION");

	const data = await csv({
							   noheader : false,
							   output   : "json",
							   trim     : true,
							   checkType: true,
						   }).fromFile(fullFilePath);

	//Remember to update schema-manager.js if this obj schema changes!
	const dataset = deepFreeze({
								   allergyKey: options.allergyKey,
								   setType   : options.setType,
								   data,
							   });

	try { //Checking that the retrieved data is still legible
		Schema.assert(dataset, Schema.object(Schema.get("dataset")));
	} catch(e) {
		log.error("Unable to assert dataset schema for %s!", datasetName);
		log.error(e);
		throw Error(`Dataset file ${datasetName} failed verification. Data is untrusted!`);
	}

	datasetCache.set(datasetName, dataset);
	log.info("Fetched new DataSet object for %s in %dms", datasetName, Date.now()-_timer);

	return dataset;
};
