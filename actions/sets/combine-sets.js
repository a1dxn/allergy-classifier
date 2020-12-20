const getDataset = require("./get-dataset");
const _          = require("lodash");
const log        = _log.get("combine-sets");
const deepFreeze = require("deep-freeze");
const keys       = CONSTANT("DATASET_ALLERGY_KEYS");

//todo: convert back but excluding stats

/**
 * @async
 * @name combineSets
 * Combine the train and test sets for an allergy.
 *
 * @param {string} allergyKey - Allergy set to get. See constants for allowed set.
 * @returns {Promise<{allergyKey: string, setType: string, data: Object[]}>}
 */
module.exports = async function(allergyKey) {
	allergyKey = Schema.string().required().uppercase()
					   .pattern(
						   new RegExp(`(${CONSTANT("DATASET_ALLERGY_KEYS").join("|")})`),
						   "Allergy Key")
					   .validate(allergyKey, {abortEarly: false});
	if(allergyKey.error) {
		log.error("Validation error on options argument. %O", allergyKey.error);
		throw allergyKey.error;
	} else allergyKey = allergyKey.value; //Values would be casted to correct data types

	log.info("Combining %s sets...", allergyKey);
	return Promise.all([
						   /*0 - Training Data*/
						   getDataset({
										  allergyKey: allergyKey,
										  setType   : CONSTANT("DATASET_FILE_KEYWORD_TRAIN")
									  }),
						   /*1 - Testing Data*/
						   getDataset({
										  allergyKey: allergyKey,
										  setType   : CONSTANT("DATASET_FILE_KEYWORD_TEST")
									  }),
					   ])
				  .then(datasets => {
					  const data = _.concat(datasets[0].data, datasets[1].data);
					  log.info("Successfully combined for %s", allergyKey);
					  return deepFreeze({
											allergyKey: datasets[0].allergyKey,
											setType   : "all",
											data,
										});
				  });
};

// let data   = keys.join(",");
// for(const d of trainData) {
// 	let orderedKeys = [];
// 	for(const a of keys) {
// 		orderedKeys.push(d[a]);
// 	}
// 	data += "\n"+orderedKeys.join(",");
// }
